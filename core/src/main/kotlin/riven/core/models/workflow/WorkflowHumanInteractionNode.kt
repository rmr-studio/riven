package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowHumanInteractionType
import riven.core.enums.workflow.WorkflowNodeType

interface WorkflowHumanInteractionNode : WorkflowNode {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.HUMAN_INTERACTION
    val subType: WorkflowHumanInteractionType
}