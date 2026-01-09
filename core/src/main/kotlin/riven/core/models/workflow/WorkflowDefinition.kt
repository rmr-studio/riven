package riven.core.models.workflow

import riven.core.entity.util.AuditableModel
import riven.core.enums.workflow.WorkflowDefinitionStatus
import riven.core.models.common.Icon
import java.time.ZonedDateTime
import java.util.*

data class WorkflowDefinition(
    val id: UUID,
    val workspaceId: UUID,

    val name: String,
    val description: String? = null,
    val status: WorkflowDefinitionStatus,
    val icon: Icon,
    val tags: List<String>,

    // Link to the current active version that defines the workflow
    val definition: WorkflowDefinitionVersion,

    override var createdAt: ZonedDateTime? = null,
    override var updatedAt: ZonedDateTime? = null,
    override var createdBy: UUID? = null,
    override var updatedBy: UUID?

) : AuditableModel