package riven.core.models.workflow.trigger

import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.WorkflowTriggerNode
import java.util.*

data class WorkflowScheduleTriggerNode(
    override val id: UUID,
    val cronExpression: String,
    val timeZone: TimeZone
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.SCHEDULE
}