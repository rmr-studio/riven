package riven.core.models.workflow.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.WorkflowTriggerNode
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
}