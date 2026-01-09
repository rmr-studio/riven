package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType

interface WorkflowActionNode : WorkflowNode {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION
    val subType: WorkflowActionType
}