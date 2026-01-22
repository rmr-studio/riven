package riven.core.service.workflow.engine

import io.temporal.activity.ActivityOptions
import io.temporal.common.RetryOptions
import io.temporal.workflow.Workflow
import riven.core.enums.workflow.WorkflowStatus
import riven.core.models.workflow.engine.NodeExecutionResult
import riven.core.models.workflow.engine.WorkflowExecutionInput
import riven.core.models.workflow.engine.WorkflowExecutionResult
import riven.core.models.workflow.engine.coordinator.WorkflowExecutionPhase
import riven.core.service.workflow.engine.coordinator.WorkflowCoordination
import java.time.Duration

/**
 * Implementation of WorkflowExecutionWorkflow for deterministic workflow orchestration.
 *
 * This workflow:
 * 1. Receives workflow execution input
 * 2. Delegates to WorkflowCoordination activity for DAG execution
 * 3. Returns aggregated execution results
 *
 * DETERMINISM RULES ENFORCED:
 * - Uses Workflow.getLogger() instead of standard logging
 * - Uses Workflow.randomUUID() if random IDs needed (not used here)
 * - Uses Workflow.currentTimeMillis() if timestamps needed
 * - NO direct database calls - all DB operations via activities
 * - NO HTTP requests - all external calls via activities
 * - NO Spring bean injection - workflow must be stateless and deterministic
 *
 * Activity options configured with:
 * - StartToCloseTimeout: 5 minutes (MANDATORY)
 * - RetryOptions: Max 3 attempts with exponential backoff
 *
 * NOTE: This class is NOT a Spring bean. It is registered with Temporal's worker
 * via Spring Boot's auto-discovery mechanism (spring.temporal.workers-auto-discovery).
 */
class WorkflowOrchestrationServiceImpl : WorkflowOrchestration {

    /**
     * Activity stub for executing workflow nodes.
     *
     * Created once as class field (best practice - avoid creating per invocation).
     * Activities handle all non-deterministic operations (DB, HTTP, randomness).
     */
    private val nodeExecutionCoordinator: WorkflowCoordination = Workflow.newActivityStub(
        WorkflowCoordination::class.java,
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

    private val logger = Workflow.getLogger(WorkflowOrchestrationServiceImpl::class.java)

    override fun execute(input: WorkflowExecutionInput): WorkflowExecutionResult {
        logger.info("Starting workflow execution for definition: ${input.workflowDefinitionId}, nodes: ${input.nodeIds.size}")

        // Delegate to activity for all database operations and node execution
        // Activity will fetch nodes, edges, and execute the workflow DAG
        val result = nodeExecutionCoordinator.executeWorkflowWithCoordinator(
            workflowDefinitionId = input.workflowDefinitionId,
            nodeIds = input.nodeIds,
            workspaceId = input.workspaceId
        )

        return WorkflowExecutionResult(
            executionId = input.workflowDefinitionId,
            status = if (result.phase == WorkflowExecutionPhase.COMPLETED) WorkflowStatus.COMPLETED else WorkflowStatus.FAILED,
            nodeResults = result.completedNodes.map { nodeId ->
                NodeExecutionResult(
                    nodeId = nodeId,
                    status = WorkflowStatus.COMPLETED,
                    output = result.getNodeOutput(nodeId)
                )
            }
        )
    }
}