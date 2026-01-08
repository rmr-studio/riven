package riven.core.models.workflow.trigger

import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.WorkflowTriggerNode
import java.util.*

data class WorkflowFunctionTriggerNode(
    override val id: UUID,
    val schema: Schema<String>
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.FUNCTION
}