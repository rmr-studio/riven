package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

sealed interface WorkflowAction : WorkflowNode {
    override val id: UUID
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION
    val actionType: WorkflowActionType

}