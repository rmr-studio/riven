package riven.core.service.workflow.engine

import io.temporal.activity.ActivityOptions
import io.temporal.common.RetryOptions
import io.temporal.workflow.Workflow
import riven.core.configuration.workflow.RetryConfig
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
 * - NO Spring bean injection - configuration injected via Temporal's workflow factory
 *
 * Activity options configured with:
 * - StartToCloseTimeout: 5 minutes (MANDATORY)
 * - RetryOptions: Configured via WorkflowRetryConfigurationProperties from application.yml
 *
 * NOTE: This class is NOT a Spring bean. It is instantiated by Temporal's worker
 * via registerWorkflowImplementationFactory in TemporalWorkerConfiguration.
 *
 * @param retryConfig Retry configuration injected via workflow factory from application.yml
 */
class WorkflowOrchestrationService(

    private val retryConfig: RetryConfig // Locally injected via [TemporalWorkerConfiguration.kt]
) : WorkflowOrchestration {

    /**
     * Activity stub for executing workflow nodes.
     *
     * Created once as class field (best practice - avoid creating per invocation).
     * Activities handle all non-deterministic operations (DB, HTTP, randomness).
     *
     * Retry configuration is injected via Temporal's workflow factory pattern,
     * sourcing values from application.yml (riven.workflow.retry.default.*).
     */
    private val nodeExecutionCoordinator: WorkflowCoordination = Workflow.newActivityStub(
        WorkflowCoordination::class.java,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(5))  // MANDATORY timeout
            .setRetryOptions(
                RetryOptions.newBuilder()
                    .setMaximumAttempts(retryConfig.maxAttempts)
                    .setInitialInterval(Duration.ofSeconds(retryConfig.initialIntervalSeconds))
                    .setBackoffCoefficient(retryConfig.backoffCoefficient)
                    .setMaximumInterval(Duration.ofSeconds(retryConfig.maxIntervalSeconds))
                    .setDoNotRetry(
                        // Non-retryable error types (matches WorkflowErrorType enum names)
                        "HTTP_CLIENT_ERROR",      // 4xx HTTP errors - client data won't change
                        "VALIDATION_ERROR",       // Schema/input validation - deterministic failure
                        "CONTROL_FLOW_ERROR",     // CONDITION node deterministic failure
                        "SECURITY_ERROR"          // Auth/authz errors - credentials won't change
                    )
                    .build()
            )
            .build()
    )

    private val logger = Workflow.getLogger(WorkflowOrchestrationService::class.java)

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