package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

/**
 * A function itself defines a closed set of operations that can be executed.
 * A workflow is composed of multiple functions that are orchestrated together to achieve a specific goal.
 */
data class WorkflowFunction(
    override val id: UUID,
) : WorkflowNode {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.FUNCTION
}