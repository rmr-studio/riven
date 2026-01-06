package riven.core.models.entity

import riven.core.entity.util.AuditableModel
import java.time.ZonedDateTime
import java.util.*

/**
 * Domain model for a relationship between entities.
 */
data class EntityRelationship(
    val id: UUID,
    val fieldId: UUID,
    val workspaceId: UUID,
    val sourceEntityId: UUID,
    val sourceEntity: Entity? = null, // Can be hydrated if needed
    val targetEntityId: UUID,
    val targetEntity: Entity? = null,
    override var createdAt: ZonedDateTime? = null,
    override var updatedAt: ZonedDateTime? = null,
    override var createdBy: UUID? = null,
    override var updatedBy: UUID? = null
) : AuditableModel
