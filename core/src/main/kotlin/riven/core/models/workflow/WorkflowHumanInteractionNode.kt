package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowHumanInteractionType
import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

interface WorkflowHumanInteractionNode : WorkflowNode {
    override val id: UUID
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.HUMAN_INTERACTION
    val subType: WorkflowHumanInteractionType
}