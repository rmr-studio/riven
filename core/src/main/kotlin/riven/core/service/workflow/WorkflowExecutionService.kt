package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KLogger
import io.temporal.client.WorkflowClient
import io.temporal.client.WorkflowOptions
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.workflow.execution.WorkflowExecutionEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.enums.workflow.WorkflowStatus
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.exceptions.NotFoundException
import riven.core.models.request.workflow.StartWorkflowExecutionRequest
import riven.core.models.response.workflow.execution.WorkflowExecutionSummaryResponse
import riven.core.models.workflow.engine.WorkflowExecutionInput
import riven.core.models.workflow.engine.execution.WorkflowExecutionRecord
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.repository.workflow.WorkflowExecutionRepository
import riven.core.repository.workflow.projection.ExecutionSummaryProjection
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.workflow.engine.WorkflowOrchestration
import java.time.ZonedDateTime
import java.util.*

/**
 * Service for managing workflow executions.
 *
 * Handles workflow lifecycle:
 * - Starting workflow executions via Temporal
 * - Persisting execution records to PostgreSQL
 * - Querying execution status and history
 * - Activity logging for audit trail
 *
 * @property workflowClient Temporal client for starting workflows
 * @property workflowDefinitionRepository Access to workflow definitions (with version JOIN)
 * @property workflowExecutionRepository Persistence for execution records
 * @property activityService Audit logging
 * @property authTokenService JWT extraction for user context
 */
@Service
class WorkflowExecutionService(
    private val workflowClient: WorkflowClient,
    private val workflowDefinitionRepository: WorkflowDefinitionRepository,
    private val workflowExecutionRepository: WorkflowExecutionRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService,
    private val logger: KLogger
) {

    companion object {
        /**
         * Task queue name for workflow execution.
         *
         * MUST match the queue name in TemporalWorkerConfiguration.
         */
        private const val WORKFLOW_EXECUTION_TASK_QUEUE = "workflow-execution-queue"
    }

    /**
     * Start a workflow execution.
     *
     * This method:
     * 1. Validates workspace access (workflow definition belongs to workspace)
     * 2. Fetches workflow definition and version (with DAG nodes/edges)
     * 3. Creates execution record in PostgreSQL (status = RUNNING)
     * 4. Starts Temporal workflow asynchronously
     * 5. Logs activity for audit trail
     * 6. Returns execution response with workflow ID and execution ID
     *
     * @param request Start workflow request with definition ID and workspace ID
     * @return Execution response with workflow ID and execution ID
     * @throws NotFoundException if workflow definition not found
     * @throws SecurityException if workflow doesn't belong to workspace
     */
    @Transactional
    fun startExecution(request: StartWorkflowExecutionRequest): WorkflowExecutionRecord {
        val userId = authTokenService.getUserId()

        logger.info { "Starting workflow execution for definition ${request.workflowDefinitionId} in workspace ${request.workspaceId}" }

        // Fetch workflow definition with published version in a single JOIN query
        val (workflowDefinition, workflowVersion) = workflowDefinitionRepository
            .findDefinitionWithPublishedVersion(request.workflowDefinitionId)
            ?: throw NotFoundException("Workflow definition not found: ${request.workflowDefinitionId}")

        // Verify workspace access
        if (workflowDefinition.workspaceId != request.workspaceId) {
            throw SecurityException("Workflow definition ${request.workflowDefinitionId} does not belong to workspace ${request.workspaceId}")
        }

        // Extract node IDs from workflow (v1: simple extraction, future: topological sort)
        val nodeIds = extractNodeIds(workflowVersion.workflow)

        logger.info { "Workflow has ${nodeIds.size} nodes to execute" }

        // Create execution record (RUNNING status)
        UUID.randomUUID()
        val engineWorkflowId = UUID.randomUUID()
        val engineRunId = UUID.randomUUID()

        val executionEntity = WorkflowExecutionEntity(
            workspaceId = request.workspaceId,
            workflowDefinitionId = request.workflowDefinitionId,
            workflowVersionId = workflowVersion.id!!,
            engineWorkflowId = engineWorkflowId,
            engineRunId = engineRunId,
            status = WorkflowStatus.RUNNING,
            triggerType = WorkflowTriggerType.FUNCTION, // v1: treat manual triggers as FUNCTION
            startedAt = ZonedDateTime.now(),
            completedAt = null,
            durationMs = 0,
            error = emptyMap<String, Any>(),
            input = mapOf(
                "workflowDefinitionId" to request.workflowDefinitionId,
                "workspaceId" to request.workspaceId,
                "nodeCount" to nodeIds.size
            ),
            output = null
        )

        val savedExecution = workflowExecutionRepository.save(executionEntity)
        val savedExecutionId = savedExecution.id!!

        logger.info { "Created execution record: $savedExecutionId" }

        // Start Temporal workflow asynchronously
        try {
            val workflowStub = workflowClient.newWorkflowStub(
                WorkflowOrchestration::class.java,
                WorkflowOptions.newBuilder()
                    .setWorkflowId("execution-$savedExecutionId")
                    .setTaskQueue(WORKFLOW_EXECUTION_TASK_QUEUE)
                    .build()
            )

            val workflowInput = WorkflowExecutionInput(
                workflowDefinitionId = request.workflowDefinitionId,
                nodeIds = nodeIds,
                workspaceId = request.workspaceId
            )

            // Start asynchronously (returns immediately)
            WorkflowClient.start { workflowStub.execute(workflowInput) }

            logger.info { "Temporal workflow started: execution-$savedExecutionId" }

        } catch (e: Exception) {
            logger.error(e) { "Failed to start Temporal workflow for execution $savedExecutionId" }

            // Update execution status to FAILED
            val failedExecution = savedExecution.copy(
                status = WorkflowStatus.FAILED,
                completedAt = ZonedDateTime.now(),
                durationMs = 0,
                error = mapOf("message" to (e.message ?: "Unknown error starting workflow"))
            )
            workflowExecutionRepository.save(failedExecution)

            throw e
        }

        // logger activity (using ENTITY as closest match for workflow execution)
        activityService.logActivity(
            activity = Activity.ENTITY,
            operation = OperationType.CREATE,
            userId = userId,
            workspaceId = request.workspaceId,
            entityType = ApplicationEntityType.ENTITY,
            entityId = savedExecutionId,
            details = mapOf(
                "type" to "workflow_execution",
                "executionId" to savedExecutionId.toString(),
                "workflowDefinitionId" to request.workflowDefinitionId.toString(),
                "nodeCount" to nodeIds.size
            )
        )

        return savedExecution.toModel()
    }

    /**
     * Extract node IDs from workflow definition.
     *
     * V1: Simple extraction assuming workflow structure has "nodes" array.
     * Future: Implement topological sort based on edges for proper execution order.
     *
     * @param workflow Workflow definition JSONB data
     * @return List of node UUIDs in execution order
     */
    @Suppress("UNCHECKED_CAST")
    private fun extractNodeIds(workflow: Any): List<UUID> {
        // V1: Assume workflow is Map with "nodes" array
        // Future: Parse actual structure, perform topological sort

        if (workflow is Map<*, *>) {
            val nodes = workflow["nodes"] as? List<*>
            if (nodes != null) {
                return nodes.mapNotNull { node ->
                    if (node is Map<*, *>) {
                        when (val idValue = node["id"]) {
                            is String -> try {
                                UUID.fromString(idValue)
                            } catch (e: IllegalArgumentException) {
                                null
                            }

                            is UUID -> idValue
                            else -> null
                        }
                    } else {
                        null
                    }
                }
            }
        }

        // Fallback: return empty list
        logger.warn { "Could not extract node IDs from workflow, returning empty list" }
        return emptyList()
    }

    // ============================================================================
    // Query Methods
    // ============================================================================

    /**
     * Get workflow execution by ID.
     *
     * Fetches a single execution with all details including input/output.
     * Verifies workspace access before returning.
     *
     * @param id Execution ID
     * @param workspaceId Workspace context for access verification
     * @return Execution details as a map
     * @throws NotFoundException if execution not found
     * @throws SecurityException if execution doesn't belong to workspace
     */
    @Transactional(readOnly = true)
    fun getExecutionById(id: UUID, workspaceId: UUID): WorkflowExecutionRecord {
        logger.info { "Getting execution by ID: $id for workspace: $workspaceId" }

        val execution = workflowExecutionRepository.findById(id)
            .orElseThrow { NotFoundException("Workflow execution not found: $id") }

        // Verify workspace access
        if (execution.workspaceId != workspaceId) {
            throw SecurityException("Workflow execution $id does not belong to workspace $workspaceId")
        }

        return execution.toModel()
    }

    /**
     * List all executions for a workflow definition.
     *
     * Returns execution summaries ordered by most recent first.
     * Verifies that all executions belong to the specified workspace.
     *
     * @param workflowDefinitionId Workflow definition ID
     * @param workspaceId Workspace context for access verification
     * @return List of execution summaries
     */
    @Transactional(readOnly = true)
    fun listExecutionsForWorkflow(workflowDefinitionId: UUID, workspaceId: UUID): List<WorkflowExecutionRecord> {
        logger.info { "Listing executions for workflow: $workflowDefinitionId in workspace: $workspaceId" }

        return workflowExecutionRepository
            .findByWorkflowDefinitionIdAndWorkspaceIdOrderByStartedAtDesc(workflowDefinitionId, workspaceId)
            .map { it.toModel() }
    }

    /**
     * List all executions for a workspace.
     *
     * Returns execution summaries across all workflows, ordered by most recent first.
     * Includes workflowDefinitionId for context.
     *
     * @param workspaceId Workspace context
     * @return List of execution summaries
     */
    @Transactional(readOnly = true)
    fun getWorkspaceExecutionRecords(workspaceId: UUID): List<WorkflowExecutionRecord> {
        logger.info { "Listing all executions for workspace: $workspaceId" }
        return workflowExecutionRepository.findByWorkspaceIdOrderByStartedAtDesc(workspaceId).map { it.toModel() }
    }

    /**
     * Get execution summary including the execution record and all node executions
     * with their associated workflow node definitions.
     *
     * Uses a single JOIN query to fetch all related data efficiently.
     *
     * @param executionId Workflow execution ID
     * @param workspaceId Workspace context for access verification
     * @return Execution summary response with execution and node details
     */
    @Throws(NotFoundException::class, SecurityException::class)
    @Transactional(readOnly = true)
    fun getExecutionSummary(
        executionId: UUID,
        workspaceId: UUID
    ): WorkflowExecutionSummaryResponse {
        logger.info { "Getting execution summary for: $executionId in workspace: $workspaceId" }

        // Fetch execution with all node executions and nodes in a single JOIN query
        val executionRecords: List<ExecutionSummaryProjection> =
            workflowExecutionRepository.findExecutionWithNodesByExecutionId(executionId)

        if (executionRecords.isEmpty()) {
            throw NotFoundException("Workflow execution not found: $executionId")
        }

        if (executionRecords.any {
                (it.execution.workspaceId != workspaceId) ||
                (it.executionNode.workspaceId != workspaceId) ||
                (it.node != null && it.node.workspaceId != workspaceId)
            }) {
            throw SecurityException("Workflow execution $executionId does not belong to workspace $workspaceId")
        }

        return WorkflowExecutionSummaryResponse(
            execution = executionRecords.first().execution.toModel(),
            nodes = executionRecords.map { projection ->
                val (_, record, node) = projection
                if (node == null) {
                    logger.warn { "Workflow node entity is null for execution node ${record.id} in execution $executionId" }
                }

                record.toModel(node)
            }
        )
    }
}
