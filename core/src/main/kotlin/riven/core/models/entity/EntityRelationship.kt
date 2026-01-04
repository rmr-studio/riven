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
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null
) : AuditableModel()
