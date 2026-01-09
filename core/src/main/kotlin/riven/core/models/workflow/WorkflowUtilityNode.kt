package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowNodeType
import riven.core.enums.workflow.WorkflowUtilityActionType

interface WorkflowUtilityNode : WorkflowNode {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.UTILITY
    val subType: WorkflowUtilityActionType
}