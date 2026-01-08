package riven.core.models.workflow

import riven.core.entity.util.AuditableModel
import riven.core.enums.workflow.WorkflowDefinitionStatus
import riven.core.models.common.Icon
import riven.core.models.common.SoftDeletable
import java.time.ZonedDateTime
import java.util.*

data class WorkflowDefinition(
    val id: UUID,
    val name: String,
    val description: String? = null,
    val status: WorkflowDefinitionStatus,
    val icon: Icon,
    val tags: List<String>,

    // Link to the current active version that defines the workflow
    val definition: WorkflowDefinitionVersion,

    override var deleted: Boolean = false,
    override var deletedAt: ZonedDateTime? = null,
    override var createdAt: ZonedDateTime? = null,
    override var updatedAt: ZonedDateTime? = null,
    override var createdBy: UUID? = null,
    override var updatedBy: UUID?

) : AuditableModel, SoftDeletable