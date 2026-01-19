package riven.core.service.workflow.engine

import io.temporal.activity.ActivityInterface
import io.temporal.activity.ActivityOptions
import io.temporal.common.RetryOptions
import io.temporal.workflow.Workflow
import org.springframework.stereotype.Service
import riven.core.entity.workflow.WorkflowEdgeEntity
import riven.core.enums.workflow.WorkflowStatus
import riven.core.models.workflow.engine.NodeExecutionResult
import riven.core.models.workflow.engine.WorkflowExecutionInput
import riven.core.models.workflow.engine.WorkflowExecutionResult
import riven.core.models.workflow.engine.coordinator.WorkflowExecutionPhase
import riven.core.models.workflow.engine.coordinator.WorkflowState
import riven.core.models.workflow.node.WorkflowNode
import riven.core.repository.workflow.WorkflowEdgeRepository
import riven.core.repository.workflow.WorkflowNodeRepository
import riven.core.service.workflow.engine.coordinator.WorkflowCoordination
import java.time.Duration
import java.util.*

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
@ActivityInterface
@Service
class WorkflowOrchestrationService(
    private val workflowNodeRepository: WorkflowNodeRepository,
    private val workflowEdgeRepository: WorkflowEdgeRepository
) : WorkflowOrchestration {

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

    private val logger = Workflow.getLogger(WorkflowOrchestrationService::class.java)

    override fun execute(input: WorkflowExecutionInput): WorkflowExecutionResult {
        logger.info("Starting workflow execution for definition: ${input.workflowDefinitionId}, nodes: ${input.nodeIds.size}")

        mutableListOf<NodeExecutionResult>()

        val (_: UUID, nodeIds: List<UUID>, workspaceId: UUID) = input

        val nodes: List<WorkflowNode> =
            workflowNodeRepository.findByWorkspaceIdAndIdIn(workspaceId, nodeIds).map { it.toModel() }
        val edges: List<WorkflowEdgeEntity> =
            workflowEdgeRepository.findByWorkspaceIdAndNodeIds(workspaceId, nodeIds.toTypedArray())

        val result: WorkflowState = nodeExecutionCoordinator.executeWorkflowWithCoordinator(
            nodes = nodes,
            edges = edges,
            workspaceId = workspaceId
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