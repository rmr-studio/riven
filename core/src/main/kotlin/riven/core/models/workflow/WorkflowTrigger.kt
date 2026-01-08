package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowNodeType
import riven.core.enums.workflow.WorkflowTriggerType
import java.util.*

sealed interface WorkflowTrigger : WorkflowNode {
    override val id: UUID
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.TRIGGER
    val triggerType: WorkflowTriggerType
}