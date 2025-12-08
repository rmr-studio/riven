package riven.core.models.entity

import riven.core.entity.util.AuditableModel
import riven.core.enums.entity.EntityCategory
import riven.core.models.common.validation.Schema
import java.time.ZonedDateTime
import java.util.*

/**
 * Domain model for an entity type - defines the schema and behavior for a class of entities.
 *
 * Unlike BlockTypes (which are immutable/versioned), EntityTypes are mutable and updated in-place.
 * All entities reference the same entity type, regardless of when they were created.
 */
data class EntityType(
    val id: UUID,
    val key: String,
    val version: Int,
    val name: String,
    val description: String?,
    val organisationId: UUID?,
    val system: Boolean,
    val entityCategory: EntityCategory,
    val schema: Schema,
    val displayConfig: EntityDisplayConfig,
    val relationships: List<EntityRelationshipDefinition>,
    val archived: Boolean,
    override val createdAt: ZonedDateTime?,
    override val updatedAt: ZonedDateTime?,
    override val createdBy: UUID?,
    override val updatedBy: UUID?
) : AuditableModel()