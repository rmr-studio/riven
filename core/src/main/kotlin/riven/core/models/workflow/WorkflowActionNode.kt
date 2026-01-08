package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

interface WorkflowActionNode : WorkflowNode {
    override val id: UUID
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION
    val subType: WorkflowActionType

}