package riven.core.models.workflow.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.WorkflowTriggerNode
import riven.core.models.workflow.environment.WorkflowExecutionContext
import java.util.*

@JsonTypeName("function_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowFunctionTriggerNode(
    override val id: UUID,
    override val version: Int = 1,
    val schema: Schema<String>
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.FUNCTION

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Triggers are entry points, not executed during workflow
        throw UnsupportedOperationException("TRIGGER nodes don't execute during workflow")
    }
}