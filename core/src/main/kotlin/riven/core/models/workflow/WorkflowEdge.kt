package riven.core.models.workflow

import java.util.*

data class WorkflowEdge(
    val id: UUID,
    val label: String? = null,
    val source: WorkflowNode,
    val target: WorkflowNode
)