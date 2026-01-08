package riven.core.models.workflow.trigger

import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.WorkflowTriggerNode
import java.time.Duration
import java.util.*

data class WorkflowScheduleTriggerNode(
    override val id: UUID,
    // Either a cron expression or an interval must be provided.
    val cronExpression: String? = null,
    val interval: Duration? = null,
    val timeZone: TimeZone
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.SCHEDULE
}