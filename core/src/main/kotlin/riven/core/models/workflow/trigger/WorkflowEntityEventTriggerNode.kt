package riven.core.models.workflow.trigger

import riven.core.enums.util.OperationType
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.WorkflowTriggerNode
import java.util.*

data class WorkflowEntityEventTriggerNode(
    override val id: UUID,
    val key: String,
    val operation: OperationType,
    val field: List<String> = emptyList(),
    val expressions: Any
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.ENTITY_EVENT
}