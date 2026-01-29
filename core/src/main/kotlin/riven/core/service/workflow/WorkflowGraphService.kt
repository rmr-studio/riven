package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.transaction.Transactional
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.workflow.WorkflowEdgeEntity
import riven.core.entity.workflow.WorkflowNodeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.exceptions.NotFoundException
import riven.core.models.request.workflow.CreateWorkflowEdgeRequest
import riven.core.models.request.workflow.CreateWorkflowNodeRequest
import riven.core.models.request.workflow.SaveWorkflowNodeRequest
import riven.core.models.request.workflow.UpdateWorkflowNodeRequest
import riven.core.models.response.workflow.SaveWorkflowNodeResponse
import riven.core.models.workflow.WorkflowEdge
import riven.core.models.workflow.WorkflowGraph
import riven.core.models.workflow.node.WorkflowNode
import riven.core.models.workflow.node.config.WorkflowNodeConfig
import riven.core.models.workflow.node.config.actions.*
import riven.core.models.workflow.node.config.controls.WorkflowConditionControlConfig
import riven.core.models.workflow.node.config.trigger.WorkflowEntityEventTriggerConfig
import riven.core.models.workflow.node.config.trigger.WorkflowFunctionTriggerConfig
import riven.core.models.workflow.node.config.trigger.WorkflowScheduleTriggerConfig
import riven.core.models.workflow.node.config.trigger.WorkflowWebhookTriggerConfig
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.repository.workflow.WorkflowDefinitionVersionRepository
import riven.core.repository.workflow.WorkflowEdgeRepository
import riven.core.repository.workflow.WorkflowNodeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.util.ServiceUtil
import java.time.ZonedDateTime
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Service for managing workflow graph structure (nodes and edges).
 *
 * Provides CRUD operations for workflow nodes and edges including:
 * - Creating and updating workflow nodes with immutable versioning
 * - Creating and deleting workflow edges
 * - Retrieving complete workflow graphs
 * - Cascade deletion of edges when nodes are deleted
 *
 * Note: This service manages the graph structure. Workflow definition
 * metadata is managed by WorkflowDefinitionService.
 */
@Service
class WorkflowGraphService(
    private val workflowNodeRepository: WorkflowNodeRepository,
    private val workflowEdgeRepository: WorkflowEdgeRepository,
    private val workflowDefinitionRepository: WorkflowDefinitionRepository,
    private val workflowDefinitionVersionRepository: WorkflowDefinitionVersionRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService,
    private val configValidationService: ConfigValidationService,
    private val expressionParserService: ExpressionParserService
) {

    // ------------------------------------------------------------------
    // Config Validation
    // ------------------------------------------------------------------

    /**
     * Validates a workflow node configuration.
     *
     * @param config The config to validate
     * @return Validation result with any errors
     * @throws IllegalArgumentException if config is invalid
     */
    private fun validateConfig(config: WorkflowNodeConfig): ConfigValidationResult {
        return when (config) {
            // Action configs
            is WorkflowCreateEntityActionConfig -> config.validate(configValidationService)
            is WorkflowUpdateEntityActionConfig -> config.validate(configValidationService)
            is WorkflowDeleteEntityActionConfig -> config.validate(configValidationService)
            is WorkflowQueryEntityActionConfig -> config.validate(configValidationService)
            is WorkflowHttpRequestActionConfig -> config.validate(configValidationService)
            // Control configs
            is WorkflowConditionControlConfig -> config.validate(configValidationService, expressionParserService)
            // Trigger configs
            is WorkflowEntityEventTriggerConfig -> config.validate(configValidationService)
            is WorkflowScheduleTriggerConfig -> config.validate(configValidationService)
            is WorkflowFunctionTriggerConfig -> config.validate(configValidationService)
            is WorkflowWebhookTriggerConfig -> config.validate(configValidationService)
            // Other configs without validation yet
            else -> ConfigValidationResult.valid()
        }
    }

    // ------------------------------------------------------------------
    // Node Operations
    // ------------------------------------------------------------------

    /**
     * Creates a new workflow node.
     *
     * @param workspaceId The workspace to create the node in
     * @param request The creation request containing key, name, description, and config
     * @return The created workflow node
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun createNode(workspaceId: UUID, request: CreateWorkflowNodeRequest): WorkflowNode {
        val userId = authTokenService.getUserId()
        log.info { "Creating workflow node '${request.name}' (key: ${request.key}) in workspace $workspaceId" }

        // Validate config before saving
        val validationResult = validateConfig(request.config)
        if (!validationResult.isValid) {
            val errorMessages = validationResult.errors.joinToString("; ") { "${it.field}: ${it.message}" }
            throw IllegalArgumentException("Invalid node configuration: $errorMessages")
        }

        // Create node entity from config
        val nodeEntity = WorkflowNodeEntity.fromConfig(
            workspaceId = workspaceId,
            key = request.key,
            name = request.name,
            description = request.description,
            config = request.config,
            system = false
        )

        val savedNode = workflowNodeRepository.save(nodeEntity)
        val nodeId = requireNotNull(savedNode.id) { "Saved node must have an ID" }

        // Log activity
        activityService.logActivity(
            activity = Activity.WORKFLOW_NODE,
            operation = OperationType.CREATE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.WORKFLOW_NODE,
            entityId = nodeId,
            details = mapOf(
                "key" to request.key,
                "name" to request.name,
                "type" to request.config.type.name,
                "version" to 1
            )
        )

        log.info { "Created workflow node $nodeId (key: ${request.key})" }
        return savedNode.toModel()
    }

    /**
     * Saves a workflow node (create or update).
     *
     * If [SaveWorkflowNodeRequest.id] is null, creates a new node.
     * If [SaveWorkflowNodeRequest.id] is provided, updates the existing node.
     *
     * For updates:
     * - Metadata updates (name, description) are applied in place
     * - Config updates trigger creation of a new version (immutable pattern)
     *
     * @param workspaceId The workspace to save the node in
     * @param request The save request containing node data
     * @return Response containing the saved node and created flag
     * @throws NotFoundException if updating and the node is not found
     * @throws AccessDeniedException if updating and the node belongs to a different workspace
     * @throws IllegalArgumentException if creating and key is not provided
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun saveNode(workspaceId: UUID, request: SaveWorkflowNodeRequest): SaveWorkflowNodeResponse {
        return if (request.id == null) {
            // Create new node
            val key = requireNotNull(request.key) { "Key is required when creating a new workflow node" }

            val createRequest = CreateWorkflowNodeRequest(
                key = key,
                name = request.name,
                description = request.description,
                config = request.config
            )
            val node = createNode(workspaceId, createRequest)
            SaveWorkflowNodeResponse(node = node, created = true)
        } else {
            // Update existing node
            val updateRequest = UpdateWorkflowNodeRequest(
                name = request.name,
                description = request.description,
                config = request.config
            )
            val node = updateNode(request.id, workspaceId, updateRequest)
            SaveWorkflowNodeResponse(node = node, created = false)
        }
    }

    /**
     * Updates an existing workflow node.
     *
     * Metadata updates (name, description) are applied in place.
     * Config updates trigger creation of a new version (immutable pattern).
     *
     * @param id The node ID to update
     * @param workspaceId The workspace ID for access verification
     * @param request The update request with optional fields
     * @return The updated workflow node
     * @throws NotFoundException if the node is not found
     * @throws AccessDeniedException if the node belongs to a different workspace
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun updateNode(id: UUID, workspaceId: UUID, request: UpdateWorkflowNodeRequest): WorkflowNode {
        val userId = authTokenService.getUserId()
        log.info { "Updating workflow node $id in workspace $workspaceId" }

        val existingNode = workflowNodeRepository.findByWorkspaceIdAndId(workspaceId, id)
            ?: throw NotFoundException("Workflow node not found")

        // Verify workspace access (should match due to query, but double-check)
        if (existingNode.workspaceId != workspaceId) {
            log.warn { "Workspace mismatch: node $id belongs to ${existingNode.workspaceId}, not $workspaceId" }
            throw AccessDeniedException("Workflow node does not belong to the specified workspace")
        }

        val savedNode: WorkflowNodeEntity
        val isNewVersion: Boolean

        if (request.config != null) {
            // Config change - create new version (immutable pattern)
            log.debug { "Config change detected for node $id, creating new version" }

            // Validate new config before saving
            val validationResult = validateConfig(request.config)
            if (!validationResult.isValid) {
                val errorMessages = validationResult.errors.joinToString("; ") { "${it.field}: ${it.message}" }
                throw IllegalArgumentException("Invalid node configuration: $errorMessages")
            }

            // Soft delete the old version
            val deletedOldNode = existingNode.copy(
                deleted = true,
                deletedAt = ZonedDateTime.now()
            )
            workflowNodeRepository.save(deletedOldNode)

            // Create new version with updated config and metadata
            val newVersionNode = WorkflowNodeEntity.createNewVersion(
                original = existingNode,
                updatedConfig = request.config
            ).copy(
                name = request.name ?: existingNode.name,
                description = request.description ?: existingNode.description
            )

            savedNode = workflowNodeRepository.save(newVersionNode)
            isNewVersion = true

            // Cascade update edges to reference the new node version
            val oldNodeId = existingNode.id!!
            val newNodeId = savedNode.id!!
            val sourceUpdates = workflowEdgeRepository.updateSourceNodeId(oldNodeId, newNodeId)
            val targetUpdates = workflowEdgeRepository.updateTargetNodeId(oldNodeId, newNodeId)

            if (sourceUpdates > 0 || targetUpdates > 0) {
                log.info { "Migrated ${sourceUpdates + targetUpdates} edges to new node version $newNodeId (source: $sourceUpdates, target: $targetUpdates)" }
            }
        } else {
            // Metadata only update - apply in place
            val updatedNode = existingNode.copy(
                name = request.name ?: existingNode.name,
                description = request.description ?: existingNode.description
            )
            savedNode = workflowNodeRepository.save(updatedNode)
            isNewVersion = false
        }

        val nodeId = requireNotNull(savedNode.id) { "Saved node must have an ID" }

        // Log activity
        activityService.logActivity(
            activity = Activity.WORKFLOW_NODE,
            operation = OperationType.UPDATE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.WORKFLOW_NODE,
            entityId = nodeId,
            details = mapOf(
                "key" to savedNode.key,
                "name" to savedNode.name,
                "newVersion" to isNewVersion,
                "version" to savedNode.version,
                "updatedFields" to listOfNotNull(
                    if (request.name != null) "name" else null,
                    if (request.description != null) "description" else null,
                    if (request.config != null) "config" else null
                )
            )
        )

        log.info { "Updated workflow node $nodeId (version: ${savedNode.version}, newVersion: $isNewVersion)" }
        return savedNode.toModel()
    }

    /**
     * Deletes a workflow node and all connected edges (cascade deletion).
     *
     * This maintains graph consistency by ensuring no orphaned edges exist.
     *
     * @param id The node ID to delete
     * @param workspaceId The workspace ID for access verification
     * @throws NotFoundException if the node is not found
     * @throws AccessDeniedException if the node belongs to a different workspace
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun deleteNode(id: UUID, workspaceId: UUID) {
        val userId = authTokenService.getUserId()
        log.info { "Deleting workflow node $id in workspace $workspaceId (with cascade)" }

        val existingNode = workflowNodeRepository.findByWorkspaceIdAndId(workspaceId, id)
            ?: throw NotFoundException("Workflow node not found")

        // Verify workspace access
        if (existingNode.workspaceId != workspaceId) {
            log.warn { "Workspace mismatch: node $id belongs to ${existingNode.workspaceId}, not $workspaceId" }
            throw AccessDeniedException("Workflow node does not belong to the specified workspace")
        }

        // CASCADE: Find and delete all connected edges
        val connectedEdges = workflowEdgeRepository.findByWorkspaceIdAndNodeId(workspaceId, id)
        log.debug { "Found ${connectedEdges.size} connected edges to delete for node $id" }

        val deletedEdgeIds = mutableListOf<UUID>()
        connectedEdges.forEach { edge ->
            val deletedEdge = edge.copy(
                deleted = true,
                deletedAt = ZonedDateTime.now()
            )
            workflowEdgeRepository.save(deletedEdge)

            val edgeId = requireNotNull(edge.id) { "Edge must have an ID" }
            deletedEdgeIds.add(edgeId)

            // Log activity for each deleted edge
            activityService.logActivity(
                activity = Activity.WORKFLOW_EDGE,
                operation = OperationType.DELETE,
                userId = userId,
                workspaceId = workspaceId,
                entityType = ApplicationEntityType.WORKFLOW_EDGE,
                entityId = edgeId,
                details = mapOf(
                    "sourceNodeId" to edge.sourceNodeId.toString(),
                    "targetNodeId" to edge.targetNodeId.toString(),
                    "reason" to "CASCADE_NODE_DELETE",
                    "deletedNodeId" to id.toString()
                )
            )
        }

        // Soft delete the node
        val deletedNode = existingNode.copy(
            deleted = true,
            deletedAt = ZonedDateTime.now()
        )
        workflowNodeRepository.save(deletedNode)

        // Log activity for node deletion
        activityService.logActivity(
            activity = Activity.WORKFLOW_NODE,
            operation = OperationType.DELETE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.WORKFLOW_NODE,
            entityId = id,
            details = mapOf(
                "key" to existingNode.key,
                "name" to existingNode.name,
                "cascadeDeletedEdges" to deletedEdgeIds.size
            )
        )

        log.info { "Deleted workflow node $id and ${deletedEdgeIds.size} connected edges" }
    }

    // ------------------------------------------------------------------
    // Edge Operations
    // ------------------------------------------------------------------

    /**
     * Creates a new workflow edge connecting two nodes.
     *
     * @param workspaceId The workspace to create the edge in
     * @param request The creation request containing source/target node IDs and optional label
     * @return The created workflow edge
     * @throws NotFoundException if source or target node is not found
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun createEdge(workspaceId: UUID, request: CreateWorkflowEdgeRequest): WorkflowEdge {
        val userId = authTokenService.getUserId()
        log.info { "Creating workflow edge from ${request.sourceNodeId} to ${request.targetNodeId} in workspace $workspaceId" }

        // Validate source node exists
        val sourceNode = workflowNodeRepository.findByWorkspaceIdAndId(workspaceId, request.sourceNodeId)
            ?: throw NotFoundException("Source workflow node not found")

        // Validate target node exists
        val targetNode = workflowNodeRepository.findByWorkspaceIdAndId(workspaceId, request.targetNodeId)
            ?: throw NotFoundException("Target workflow node not found")

        // Create edge entity
        val edgeEntity = WorkflowEdgeEntity(
            workspaceId = workspaceId,
            sourceNodeId = request.sourceNodeId,
            targetNodeId = request.targetNodeId,
            label = request.label,
            deleted = false,
            deletedAt = null
        )

        val savedEdge = workflowEdgeRepository.save(edgeEntity)
        val edgeId = requireNotNull(savedEdge.id) { "Saved edge must have an ID" }

        // Log activity
        activityService.logActivity(
            activity = Activity.WORKFLOW_EDGE,
            operation = OperationType.CREATE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.WORKFLOW_EDGE,
            entityId = edgeId,
            details = mapOf(
                "sourceNodeId" to request.sourceNodeId.toString(),
                "targetNodeId" to request.targetNodeId.toString(),
                "sourceNodeName" to sourceNode.name,
                "targetNodeName" to targetNode.name,
                "label" to (request.label ?: "")
            )
        )

        log.info { "Created workflow edge $edgeId" }
        return savedEdge.toModel(sourceNode.toModel(), targetNode.toModel())
    }

    /**
     * Deletes a workflow edge.
     *
     * @param id The edge ID to delete
     * @param workspaceId The workspace ID for access verification
     * @throws NotFoundException if the edge is not found
     * @throws AccessDeniedException if the edge belongs to a different workspace
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun deleteEdge(id: UUID, workspaceId: UUID) {
        val userId = authTokenService.getUserId()
        log.info { "Deleting workflow edge $id in workspace $workspaceId" }

        val existingEdge = ServiceUtil.findOrThrow {
            workflowEdgeRepository.findById(id)
        }

        // Verify workspace access
        if (existingEdge.workspaceId != workspaceId) {
            log.warn { "Workspace mismatch: edge $id belongs to ${existingEdge.workspaceId}, not $workspaceId" }
            throw AccessDeniedException("Workflow edge does not belong to the specified workspace")
        }

        // Check if already deleted
        if (existingEdge.deleted) {
            throw NotFoundException("Workflow edge not found")
        }

        // Soft delete the edge
        val deletedEdge = existingEdge.copy(
            deleted = true,
            deletedAt = ZonedDateTime.now()
        )
        workflowEdgeRepository.save(deletedEdge)

        // Log activity
        activityService.logActivity(
            activity = Activity.WORKFLOW_EDGE,
            operation = OperationType.DELETE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.WORKFLOW_EDGE,
            entityId = id,
            details = mapOf(
                "sourceNodeId" to existingEdge.sourceNodeId.toString(),
                "targetNodeId" to existingEdge.targetNodeId.toString()
            )
        )

        log.info { "Deleted workflow edge $id" }
    }

    // ------------------------------------------------------------------
    // Graph Query Operations
    // ------------------------------------------------------------------

    /**
     * Retrieves the complete workflow graph (nodes and edges) for a workflow definition.
     *
     * @param workflowDefinitionId The workflow definition ID
     * @param workspaceId The workspace ID for access verification
     * @return The complete workflow graph
     * @throws NotFoundException if the workflow definition is not found
     * @throws AccessDeniedException if the workflow belongs to a different workspace
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getWorkflowGraph(workflowDefinitionId: UUID, workspaceId: UUID): WorkflowGraph {
        log.info { "Fetching workflow graph for definition $workflowDefinitionId in workspace $workspaceId" }

        // Fetch workflow definition
        val definition = ServiceUtil.findOrThrow {
            workflowDefinitionRepository.findById(workflowDefinitionId)
        }

        // Verify workspace access
        if (definition.workspaceId != workspaceId) {
            log.warn { "Workspace mismatch: workflow $workflowDefinitionId belongs to ${definition.workspaceId}, not $workspaceId" }
            throw AccessDeniedException("Workflow definition does not belong to the specified workspace")
        }

        // Check if soft-deleted
        if (definition.deleted) {
            throw NotFoundException("Workflow definition not found")
        }

        // Fetch the current version to get node IDs from workflow structure
        val version = workflowDefinitionVersionRepository.findByWorkflowDefinitionIdAndVersionNumber(
            workflowDefinitionId,
            definition.versionNumber
        ) ?: throw NotFoundException("Workflow version not found")

        // Extract node IDs from workflow structure
        val nodeIds = version.workflow.nodeIds

        if (nodeIds.isEmpty()) {
            log.debug { "No nodes found in workflow $workflowDefinitionId" }
            return WorkflowGraph(
                workflowDefinitionId = workflowDefinitionId,
                nodes = emptyList(),
                edges = emptyList()
            )
        }

        // Fetch all nodes
        val nodeEntities = workflowNodeRepository.findByWorkspaceIdAndIdIn(workspaceId, nodeIds)
        val nodes = nodeEntities.map { it.toModel() }
        val nodeMap = nodeEntities.associateBy { it.id!! }

        // Fetch all edges for these nodes
        val edgeEntities = workflowEdgeRepository.findByWorkspaceIdAndNodeIds(
            workspaceId,
            nodeIds.toTypedArray()
        )

        // Convert edges to models (filtering out any with missing nodes)
        val edges = edgeEntities.mapNotNull { edge ->
            val sourceEntity = nodeMap[edge.sourceNodeId]
            val targetEntity = nodeMap[edge.targetNodeId]

            if (sourceEntity != null && targetEntity != null) {
                edge.toModel(sourceEntity.toModel(), targetEntity.toModel())
            } else {
                log.warn { "Skipping edge ${edge.id} - missing source or target node" }
                null
            }
        }

        log.debug { "Retrieved workflow graph with ${nodes.size} nodes and ${edges.size} edges" }
        return WorkflowGraph(
            workflowDefinitionId = workflowDefinitionId,
            nodes = nodes,
            edges = edges
        )
    }


}
