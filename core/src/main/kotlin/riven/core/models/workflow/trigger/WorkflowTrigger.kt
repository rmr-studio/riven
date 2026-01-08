package riven.core.models.workflow.trigger

import riven.core.enums.workflow.WorkflowTriggerType

sealed interface WorkflowTrigger {
    val type: WorkflowTriggerType
}
