package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KotlinLogging
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
import riven.core.models.common.json.JsonObject
import riven.core.models.request.workflow.StartWorkflowExecutionRequest
import riven.core.models.workflow.temporal.WorkflowExecutionInput
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.repository.workflow.WorkflowDefinitionVersionRepository
import riven.core.repository.workflow.WorkflowExecutionRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.workflow.temporal.workflows.WorkflowExecutionWorkflow
import java.time.ZonedDateTime
import java.util.UUID

private val log = KotlinLogging.logger {}

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
 * @property workflowDefinitionRepository Access to workflow definitions
 * @property workflowDefinitionVersionRepository Access to workflow versions (DAG structure)
 * @property workflowExecutionRepository Persistence for execution records
 * @property activityService Audit logging
 * @property authTokenService JWT extraction for user context
 */
@Service
class WorkflowExecutionService(
    private val workflowClient: WorkflowClient,
    private val workflowDefinitionRepository: WorkflowDefinitionRepository,
    private val workflowDefinitionVersionRepository: WorkflowDefinitionVersionRepository,
    private val workflowExecutionRepository: WorkflowExecutionRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService
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
    fun startExecution(request: StartWorkflowExecutionRequest): Map<String, Any> {
        val userId = authTokenService.getUserId()

        log.info { "Starting workflow execution for definition ${request.workflowDefinitionId} in workspace ${request.workspaceId}" }

        // Fetch workflow definition
        val workflowDefinition = workflowDefinitionRepository.findById(request.workflowDefinitionId)
            .orElseThrow { NotFoundException("Workflow definition not found: ${request.workflowDefinitionId}") }

        // Verify workspace access
        if (workflowDefinition.workspaceId != request.workspaceId) {
            throw SecurityException("Workflow definition ${request.workflowDefinitionId} does not belong to workspace ${request.workspaceId}")
        }

        // Fetch workflow version (contains DAG structure)
        val workflowVersion = workflowDefinitionVersionRepository
            .findByWorkflowDefinitionIdAndVersionNumber(
                request.workflowDefinitionId,
                workflowDefinition.versionNumber
            ) ?: throw NotFoundException("Workflow version ${workflowDefinition.versionNumber} not found for definition ${request.workflowDefinitionId}")

        // Extract node IDs from workflow (v1: simple extraction, future: topological sort)
        val nodeIds = extractNodeIds(workflowVersion.workflow)

        log.info { "Workflow has ${nodeIds.size} nodes to execute" }

        // Create execution record (RUNNING status)
        val executionId = UUID.randomUUID()
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

        log.info { "Created execution record: $savedExecutionId" }

        // Start Temporal workflow asynchronously
        try {
            val workflowStub = workflowClient.newWorkflowStub(
                WorkflowExecutionWorkflow::class.java,
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

            log.info { "Temporal workflow started: execution-$savedExecutionId" }

        } catch (e: Exception) {
            log.error(e) { "Failed to start Temporal workflow for execution $savedExecutionId" }

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

        // Log activity (using ENTITY as closest match for workflow execution)
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

        // Return execution response
        return mapOf(
            "executionId" to savedExecutionId,
            "workflowId" to "execution-$savedExecutionId",
            "status" to "STARTED",
            "nodeCount" to nodeIds.size
        )
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
                        val idValue = node["id"]
                        when (idValue) {
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
        log.warn { "Could not extract node IDs from workflow, returning empty list" }
        return emptyList()
    }
}
