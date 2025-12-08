package riven.core.models.entity

import riven.core.entity.util.AuditableModel
import java.time.ZonedDateTime
import java.util.*

/**
 * Domain model for a relationship between entities.
 */
data class EntityRelationship(
    val id: UUID,
    val organisationId: UUID,
    val sourceEntity: Entity,
    val targetEntity: Entity,
    val relationshipEntity: Entity? = null,
    val relationshipType: String,
    val relationshipLabel: String?,
    val metadata: Map<String, Any>,
    val bidirectional: Boolean,
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null
) : AuditableModel()
