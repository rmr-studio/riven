package riven.core.models.workflow.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.WorkflowTriggerNode
import riven.core.models.workflow.environment.WorkflowExecutionContext
import java.time.Duration
import java.util.*

@JsonTypeName("schedule_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowScheduleTriggerNode(
    override val id: UUID,
    override val version: Int = 1,
    // Either a cron expression or an interval must be provided.
    val cronExpression: String? = null,
    val interval: Duration? = null,
    val timeZone: TimeZone
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.SCHEDULE

    init {
        require(cronExpression != null || interval != null) {
            "Either cronExpression or interval must be provided for schedule trigger"
        }
    }

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Triggers are entry points, not executed during workflow
        throw UnsupportedOperationException("TRIGGER nodes don't execute during workflow")
    }
}
