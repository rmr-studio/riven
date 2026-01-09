package riven.core.models.workflow

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.deserializer.WorkflowNodeDeserializer
import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

@JsonDeserialize(using = WorkflowNodeDeserializer::class)
sealed interface WorkflowNode {
    val id: UUID
    val type: WorkflowNodeType
    val version: Int
}