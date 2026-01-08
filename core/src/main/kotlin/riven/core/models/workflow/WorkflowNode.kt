package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

interface WorkflowNode {
    val id: UUID
    val type: WorkflowNodeType
}