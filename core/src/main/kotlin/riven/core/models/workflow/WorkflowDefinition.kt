package riven.core.models.workflow

import riven.core.enums.workflow.WorkflowStatus
import riven.core.models.common.Icon
import java.util.*

data class WorkflowDefinition(
    val id: UUID,
    val name: String,
    val description: String? = null,
    val icon: Icon,
    val status: WorkflowStatus,
    val tags: List<String>,

    )