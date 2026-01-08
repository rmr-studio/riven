package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

sealed interface WorkflowNode {
    val id: UUID
    val type: WorkflowNodeType
}