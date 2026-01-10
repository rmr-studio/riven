package riven.core.service.workflow.temporal.workflows

import io.temporal.activity.ActivityOptions
import io.temporal.common.RetryOptions
import io.temporal.workflow.Workflow
import riven.core.models.workflow.temporal.NodeExecutionResult
import riven.core.models.workflow.temporal.WorkflowExecutionInput
import riven.core.models.workflow.temporal.WorkflowExecutionResult
import riven.core.service.workflow.temporal.activities.WorkflowNodeActivities
import java.time.Duration

/**
 * Implementation of WorkflowExecutionWorkflow for deterministic workflow orchestration.
 *
 * This workflow:
 * 1. Receives workflow execution input
 * 2. Iterates through nodes in topological order (simple sequential for v1)
 * 3. Delegates node execution to WorkflowNodeActivities
 * 4. Collects results and returns aggregated outcome
 *
 * DETERMINISM RULES ENFORCED:
 * - Uses Workflow.getLogger() instead of standard logging
 * - Uses Workflow.randomUUID() if random IDs needed (not used here)
 * - Uses Workflow.currentTimeMillis() if timestamps needed
 * - NO direct database calls - all DB operations via activities
 * - NO HTTP requests - all external calls via activities
 *
 * Activity options configured with:
 * - StartToCloseTimeout: 5 minutes (MANDATORY)
 * - RetryOptions: Max 3 attempts with exponential backoff
 */
class WorkflowExecutionWorkflowImpl : WorkflowExecutionWorkflow {

    /**
     * Activity stub for executing workflow nodes.
     *
     * Created once as class field (best practice - avoid creating per invocation).
     * Activities handle all non-deterministic operations (DB, HTTP, randomness).
     */
    private val activities: WorkflowNodeActivities = Workflow.newActivityStub(
        WorkflowNodeActivities::class.java,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(5))  // MANDATORY timeout
            .setRetryOptions(
                RetryOptions.newBuilder()
                    .setMaximumAttempts(3)
                    .setInitialInterval(Duration.ofSeconds(1))
                    .setBackoffCoefficient(2.0)
                    .setMaximumInterval(Duration.ofMinutes(1))
                    .build()
            )
            .build()
    )

    private val logger = Workflow.getLogger(WorkflowExecutionWorkflowImpl::class.java)

    override fun execute(input: WorkflowExecutionInput): WorkflowExecutionResult {
        logger.info("Starting workflow execution for definition: ${input.workflowDefinitionId}, nodes: ${input.nodeIds.size}")

        val nodeResults = mutableListOf<NodeExecutionResult>()

        // Simple sequential execution for v1
        // Future enhancement: parallel execution based on DAG dependencies
        for (nodeId in input.nodeIds) {
            try {
                logger.info("Executing node: $nodeId")

                // Delegate to activity (handles all side effects)
                val result = activities.executeNode(nodeId, input.workspaceId)
                nodeResults.add(result)

                logger.info("Node $nodeId completed with status: ${result.status}")

                // If node failed and was not skipped, abort workflow
                if (result.status == "FAILED") {
                    logger.warn("Node $nodeId failed, aborting workflow")
                    return WorkflowExecutionResult(
                        executionId = input.workflowDefinitionId, // Will be updated by service
                        status = "FAILED",
                        nodeResults = nodeResults
                    )
                }
            } catch (e: Exception) {
                logger.error("Exception executing node $nodeId: ${e.message}")
                nodeResults.add(
                    NodeExecutionResult(
                        nodeId = nodeId,
                        status = "FAILED",
                        error = e.message
                    )
                )
                // Abort on exception
                return WorkflowExecutionResult(
                    executionId = input.workflowDefinitionId,
                    status = "FAILED",
                    nodeResults = nodeResults
                )
            }
        }

        logger.info("Workflow execution completed successfully, ${nodeResults.size} nodes executed")

        return WorkflowExecutionResult(
            executionId = input.workflowDefinitionId,
            status = "COMPLETED",
            nodeResults = nodeResults
        )
    }
}
