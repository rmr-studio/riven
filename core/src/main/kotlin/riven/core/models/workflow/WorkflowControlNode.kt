package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowControlType
import riven.core.enums.workflow.WorkflowNodeType

interface WorkflowControlNode : WorkflowNode {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.CONTROL_FLOW
    val subType: WorkflowControlType
}