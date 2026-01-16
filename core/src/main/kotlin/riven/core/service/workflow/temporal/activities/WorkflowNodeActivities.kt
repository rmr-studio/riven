package riven.core.service.workflow.temporal.activities

import io.temporal.activity.ActivityInterface
import io.temporal.activity.ActivityMethod
import riven.core.models.workflow.temporal.NodeExecutionResult
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
 * @see WorkflowNodeActivitiesService
 */
@ActivityInterface
interface WorkflowNodeActivities {

    /**
     * Execute a single workflow node.
     *
     * This activity:
     * 1. Fetches the node configuration from database
     * 2. Routes to appropriate handler based on node type (ACTION, CONTROL, TRIGGER)
     * 3. Persists execution state to WorkflowExecutionNodeEntity
     * 4. Returns result for workflow orchestration
     *
     * @param nodeId UUID of the workflow node to execute
     * @param workspaceId UUID of the workspace context
     * @return Execution result with status and output data
     */
    @ActivityMethod
    fun executeNode(nodeId: UUID, workspaceId: UUID): NodeExecutionResult

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
        nodes: List<riven.core.models.workflow.WorkflowNode>,
        edges: List<riven.core.models.workflow.WorkflowEdge>,
        workspaceId: UUID
    ): riven.core.models.workflow.coordinator.WorkflowState
}
