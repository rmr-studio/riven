package riven.core.models.workflow.node.config

import riven.core.enums.workflow.OutputFieldType
import java.util.UUID

data class WorkflowNodeOutputField(
    val key: String,
    val label: String,
    val type: OutputFieldType,
    val description: String? = null,
    val nullable: Boolean = false,
    val exampleValue: Any? = null,
    val entityTypeId: UUID? = null
)
