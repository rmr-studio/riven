package riven.core.service.workflow.temporal.activities

import io.github.oshai.kotlinlogging.KotlinLogging
import io.temporal.activity.Activity
import org.springframework.stereotype.Component
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.enums.workflow.WorkflowStatus
import riven.core.entity.workflow.execution.WorkflowExecutionNodeEntity
import riven.core.models.workflow.temporal.NodeExecutionResult
import riven.core.repository.workflow.WorkflowExecutionNodeRepository
import riven.core.repository.workflow.WorkflowNodeRepository
import riven.core.service.entity.EntityService
import riven.core.service.workflow.EntityContextService
import riven.core.service.workflow.ExpressionEvaluatorService
import java.time.ZonedDateTime
import java.util.UUID

private val log = KotlinLogging.logger {}

/**
 * Implementation of WorkflowNodeActivities as a Spring bean.
 *
 * This activity implementation:
 * - Uses constructor injection for all dependencies (Spring beans)
 * - Is stateless (singleton instance handles concurrent executions)
 * - Routes node execution based on type (ACTION, CONTROL, TRIGGER)
 * - Persists execution state to PostgreSQL
 * - Handles errors and retries automatically (via Temporal RetryOptions)
 *
 * Node type handling (v1 - focus on ACTION):
 * - ACTION: Creates/updates entities via EntityService
 * - CONTROL: Evaluates expressions via ExpressionEvaluatorService (stubbed for v1)
 * - TRIGGER: Stub (not implemented in v1)
 *
 * @property workflowNodeRepository Fetches node configuration from database
 * @property workflowExecutionNodeRepository Persists node execution state
 * @property entityService Handles entity CRUD operations for ACTION nodes
 * @property expressionEvaluatorService Evaluates expressions for CONTROL nodes
 * @property entityContextService Resolves entity context for expression evaluation
 */
@Component
class WorkflowNodeActivitiesImpl(
    private val workflowNodeRepository: WorkflowNodeRepository,
    private val workflowExecutionNodeRepository: WorkflowExecutionNodeRepository,
    private val entityService: EntityService,
    private val expressionEvaluatorService: ExpressionEvaluatorService,
    private val entityContextService: EntityContextService
) : WorkflowNodeActivities {

    override fun executeNode(nodeId: UUID, workspaceId: UUID): NodeExecutionResult {
        val startTime = ZonedDateTime.now()

        log.info { "Executing workflow node: $nodeId in workspace: $workspaceId" }

        try {
            // Fetch node configuration
            val node = workflowNodeRepository.findById(nodeId).orElseThrow {
                IllegalArgumentException("Workflow node not found: $nodeId")
            }

            // Verify workspace access
            if (node.workspaceId != workspaceId) {
                throw SecurityException("Node $nodeId does not belong to workspace $workspaceId")
            }

            // Get execution context from Temporal
            val activityInfo = Activity.getExecutionContext().info
            val workflowExecutionId = UUID.fromString(
                activityInfo.workflowId.substringAfter("execution-")
            )

            // Create execution record (RUNNING status)
            val executionNode = createExecutionNode(
                workflowExecutionId = workflowExecutionId,
                nodeId = nodeId,
                workspaceId = workspaceId,
                startTime = startTime
            )

            // Route based on node type
            val result = when (node.type) {
                WorkflowNodeType.ACTION -> {
                    log.info { "Executing ACTION node: ${node.name}" }
                    executeActionNode(node.config, workspaceId)
                }
                WorkflowNodeType.CONTROL_FLOW -> {
                    log.info { "Executing CONTROL_FLOW node: ${node.name}" }
                    executeControlNode(node.config, workspaceId)
                }
                WorkflowNodeType.TRIGGER -> {
                    log.info { "Skipping TRIGGER node: ${node.name} (triggers don't execute during workflow)" }
                    NodeExecutionResult(
                        nodeId = nodeId,
                        status = "SKIPPED",
                        output = mapOf("reason" to "Triggers are entry points, not executed during workflow")
                    )
                }
                WorkflowNodeType.FUNCTION,
                WorkflowNodeType.HUMAN_INTERACTION,
                WorkflowNodeType.UTILITY -> {
                    log.info { "Skipping ${node.type} node: ${node.name} (not implemented in v1)" }
                    NodeExecutionResult(
                        nodeId = nodeId,
                        status = "SKIPPED",
                        output = mapOf("reason" to "${node.type} nodes not implemented in v1")
                    )
                }
            }

            // Update execution record (COMPLETED/FAILED status)
            updateExecutionNode(
                executionNode = executionNode,
                status = if (result.status == "COMPLETED") WorkflowStatus.COMPLETED else WorkflowStatus.FAILED,
                output = result.output,
                error = result.error,
                completedTime = ZonedDateTime.now(),
                startTime = startTime
            )

            log.info { "Node $nodeId completed with status: ${result.status}" }
            return result

        } catch (e: Exception) {
            log.error(e) { "Error executing node $nodeId: ${e.message}" }

            // Try to persist error state (best effort)
            try {
                val activityInfo = Activity.getExecutionContext().info
                val workflowExecutionId = UUID.fromString(
                    activityInfo.workflowId.substringAfter("execution-")
                )

                val executionNode = createExecutionNode(
                    workflowExecutionId = workflowExecutionId,
                    nodeId = nodeId,
                    workspaceId = workspaceId,
                    startTime = startTime
                )

                updateExecutionNode(
                    executionNode = executionNode,
                    status = WorkflowStatus.FAILED,
                    output = null,
                    error = e.message,
                    completedTime = ZonedDateTime.now(),
                    startTime = startTime
                )
            } catch (persistError: Exception) {
                log.error(persistError) { "Failed to persist error state for node $nodeId" }
            }

            return NodeExecutionResult(
                nodeId = nodeId,
                status = "FAILED",
                error = e.message ?: "Unknown error"
            )
        }
    }

    /**
     * Execute an ACTION node that creates or updates entities.
     *
     * V1: Stub implementation - returns success without actually creating entities.
     * Future: Parse node config, call EntityService.createEntity() or updateEntity()
     */
    private fun executeActionNode(config: Any, workspaceId: UUID): NodeExecutionResult {
        log.info { "ACTION node execution (v1 stub)" }

        // V1: Return stub success
        // Future implementation will:
        // 1. Parse config to extract entity type, payload
        // 2. Call entityService.createEntity(workspaceId, entityType, payload)
        // 3. Return entity ID as output

        return NodeExecutionResult(
            nodeId = UUID.randomUUID(), // Will be overridden
            status = "COMPLETED",
            output = mapOf(
                "message" to "ACTION node executed (v1 stub - entity creation not implemented)",
                "entityId" to UUID.randomUUID()
            )
        )
    }

    /**
     * Execute a CONTROL_FLOW node that evaluates conditional expressions.
     *
     * V1: Stub implementation - returns success without actual expression evaluation.
     * Future: Parse node config, evaluate expression, return boolean result
     */
    private fun executeControlNode(config: Any, workspaceId: UUID): NodeExecutionResult {
        log.info { "CONTROL node execution (v1 stub)" }

        // V1: Return stub success
        // Future implementation will:
        // 1. Parse config to extract expression
        // 2. Resolve entity context via entityContextService
        // 3. Call expressionEvaluatorService.evaluate(expression, context)
        // 4. Return boolean result as output

        return NodeExecutionResult(
            nodeId = UUID.randomUUID(), // Will be overridden
            status = "COMPLETED",
            output = mapOf(
                "message" to "CONTROL_FLOW node executed (v1 stub - expression evaluation not implemented)",
                "result" to true
            )
        )
    }

    /**
     * Create a WorkflowExecutionNodeEntity record with RUNNING status.
     */
    private fun createExecutionNode(
        workflowExecutionId: UUID,
        nodeId: UUID,
        workspaceId: UUID,
        startTime: ZonedDateTime
    ): WorkflowExecutionNodeEntity {
        val executionNode = WorkflowExecutionNodeEntity(
            workspaceId = workspaceId,
            workflowExecutionId = workflowExecutionId,
            nodeId = nodeId,
            sequenceIndex = 0, // TODO: Track actual sequence during workflow execution
            status = WorkflowStatus.RUNNING,
            startedAt = startTime,
            completedAt = null,
            durationMs = 0,
            attempt = 1, // Temporal handles retries, this is attempt within activity
            error = emptyMap<String, Any>(),
            input = null,
            output = null
        )

        return workflowExecutionNodeRepository.save(executionNode)
    }

    /**
     * Update WorkflowExecutionNodeEntity with completion status and results.
     */
    private fun updateExecutionNode(
        executionNode: WorkflowExecutionNodeEntity,
        status: WorkflowStatus,
        output: Any?,
        error: String?,
        completedTime: ZonedDateTime,
        startTime: ZonedDateTime
    ) {
        val durationMs = java.time.Duration.between(startTime, completedTime).toMillis()

        val updated = executionNode.copy(
            status = status,
            completedAt = completedTime,
            durationMs = durationMs,
            output = output,
            error = error?.let { mapOf("message" to it) } ?: emptyMap<String, Any>()
        )

        workflowExecutionNodeRepository.save(updated)
    }
}
