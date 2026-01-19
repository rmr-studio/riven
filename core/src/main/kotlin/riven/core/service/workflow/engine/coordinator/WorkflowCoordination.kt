package riven.core.service.workflow.engine.coordinator

import io.temporal.activity.ActivityInterface
import io.temporal.activity.ActivityMethod
import riven.core.entity.workflow.WorkflowEdgeEntity
import riven.core.models.workflow.engine.coordinator.WorkflowState
import riven.core.models.workflow.node.WorkflowNode
import java.util.*

/**
 * Temporal activity interface for executing workflow nodes.
 *
 * Activities handle all non-deterministic operations:
 * - Database queries and writes
 * - External API calls
 * - Random number generation
 * - System time access
 *
 * Activities are stateless (singleton instances handle concurrent executions).
 * All data must be passed via method parameters, not stored in instance fields.
 *
 * @see WorkflowCoordinationService
 */
@ActivityInterface
interface WorkflowCoordination {

    /**
     * Execute workflow with DAG coordination for parallel node scheduling.
     *
     * This activity delegates to DagExecutionCoordinator for orchestration:
     * 1. Validates DAG structure
     * 2. Initializes state machine and active node queue
     * 3. Executes nodes in topological order with maximum parallelism
     * 4. Returns final WorkflowState with all outputs
     *
     * Note: Node execution happens synchronously within this activity (not via Temporal Async).
     * The coordinator's parallel execution is simulated via sequential processing in v1.
     * Future enhancement: Use Temporal child workflows for true parallel execution.
     *
     * @param nodes All workflow nodes
     * @param edges All dependency edges
     * @param workspaceId Workspace context
     * @return Final workflow state with completion status and outputs
     */
    @ActivityMethod
    fun executeWorkflowWithCoordinator(
        nodes: List<WorkflowNode>,
        edges: List<WorkflowEdgeEntity>,
        workspaceId: UUID
    ): WorkflowState
}
