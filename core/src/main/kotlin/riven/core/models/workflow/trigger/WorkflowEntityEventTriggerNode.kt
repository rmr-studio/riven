package riven.core.models.workflow.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.util.OperationType
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.WorkflowTriggerNode
import riven.core.models.workflow.environment.WorkflowExecutionContext
import java.util.*

@JsonTypeName("entity_event_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowEntityEventTriggerNode(
    override val id: UUID,
    override val version: Int = 1,
    val key: String,
    val operation: OperationType,
    val field: List<String> = emptyList(),
    val expressions: Any
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.ENTITY_EVENT

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Triggers are entry points, not executed during workflow
        throw UnsupportedOperationException("TRIGGER nodes don't execute during workflow")
    }
}