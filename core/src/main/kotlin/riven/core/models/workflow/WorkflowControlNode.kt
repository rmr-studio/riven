package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowControlType
import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

interface WorkflowControlNode : WorkflowNode {
    override val id: UUID
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.CONTROL_FLOW
    val subType: WorkflowControlType
}