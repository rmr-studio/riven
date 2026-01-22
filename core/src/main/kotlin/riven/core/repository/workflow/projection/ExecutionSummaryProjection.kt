package riven.core.repository.workflow.projection

import riven.core.entity.workflow.WorkflowNodeEntity
import riven.core.entity.workflow.execution.WorkflowExecutionEntity
import riven.core.entity.workflow.execution.WorkflowExecutionNodeEntity

/**
 * Projection for workflow execution summary containing the execution,
 * node executions, and their associated workflow nodes.
 *
 * This is constructed from a JOIN query that fetches all related data
 * in a single database call.
 */
data class ExecutionSummaryProjection(
    val execution: WorkflowExecutionEntity,
    val executionNode: WorkflowExecutionNodeEntity,
    val node: WorkflowNodeEntity?
)
