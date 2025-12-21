package riven.core.models.entity

import riven.core.entity.util.AuditableModel
import riven.core.enums.entity.EntityCategory
import riven.core.models.common.display.DisplayName
import riven.core.models.common.validation.Schema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeOrderingKey
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
    val name: DisplayName,
    /**
     * Each organisation will have a handful of system-generated default entity types to handle
     * core/common use cases, which cannot be deleted.
     * They should allow for modification of schema and other properties, but not deletion.
     * */
    val protected: Boolean,

    /**
     * A unique identifier key for the entity type. This will be taken from one
     * of the attributes within the schema (default to ID).
     * The attribute used as the identifier key must be set to unique within the schema.
     */
    val identifierKey: UUID,
    val description: String?,
    val organisationId: UUID?,
    val type: EntityCategory,
    // Schema will always be created with a unique, non-nullable 'name' attribute
    // Each attribute in the schema will be uniquely identified with a UUID key
    val schema: EntityTypeSchema,
    val relationships: List<EntityRelationshipDefinition>? = null,
    // The order in which the attributes should be displayed in the UI
    val order: List<EntityTypeOrderingKey>,
    val entitiesCount: Long = 0L,
    override val createdAt: ZonedDateTime?,
    override val updatedAt: ZonedDateTime?,
    override val createdBy: UUID?,
    override val updatedBy: UUID?
) : AuditableModel() {
    val attributes: Pair<Int, Int>
        get() = Pair(schema.properties?.size ?: 0, relationships?.size ?: 0)
}

typealias EntityTypeSchema = Schema<UUID>