package riven.core.service.workflow.temporal.activities

import io.temporal.activity.ActivityInterface
import io.temporal.activity.ActivityMethod
import riven.core.models.workflow.temporal.NodeExecutionResult
import java.util.UUID

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
 * @see WorkflowNodeActivitiesImpl
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
}
