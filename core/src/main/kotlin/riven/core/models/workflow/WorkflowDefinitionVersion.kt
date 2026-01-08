package riven.core.models.workflow

import riven.core.entity.util.AuditableModel
import riven.core.models.common.SoftDeletable
import java.time.ZonedDateTime
import java.util.*

data class WorkflowDefinitionVersion(
    val id: UUID,
    val version: Int,
    // Workflow traversal graph
    val workflow: Any,
    // Visual representation of the workflow for UI
    val canvas: Any,

    override var createdAt: ZonedDateTime? = null,
    override var updatedAt: ZonedDateTime? = null,
    override var createdBy: UUID? = null,
    override var updatedBy: UUID? = null,

    override var deleted: Boolean = false,
    override var deletedAt: ZonedDateTime? = null
) : AuditableModel, SoftDeletable