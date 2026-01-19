package riven.core.models.workflow

import riven.core.models.workflow.node.WorkflowNode
import java.util.*

data class WorkflowEdge(
    val id: UUID,
    val label: String? = null,
    val source: WorkflowNode,
    val target: WorkflowNode
)