package riven.core.entity.entity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.enums.entity.EntityCategory
import riven.core.models.common.validation.Schema
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityConfig
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import java.util.*

/**
 * JPA entity for entity types.
 *
 * Key difference from BlockTypeEntity: EntityTypes are MUTABLE.
 * Updates modify the existing row rather than creating new versions.
 */
@Entity
@Table(
    name = "entity_types",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["organisation_id", "key"])
    ],
)
data class EntityTypeEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "key", nullable = false, updatable = false)
    val key: String,

    @Column(name = "display_name", nullable = false)
    var displayName: String,

    @Column(name = "identifier_key", nullable = false)
    val identifierKey: String = "name",

    @Column(name = "description", nullable = true)
    var description: String? = null,

    @Column(name = "organisation_id", columnDefinition = "uuid")
    val organisationId: UUID? = null,

    @Column(name = "protected", nullable = false)
    val protected: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    val type: EntityCategory,

    @Column(name = "version", nullable = false, columnDefinition = "integer default 1")
    var version: Int = 1,

    @Type(JsonBinaryType::class)
    @Column(name = "schema", columnDefinition = "jsonb", nullable = false)
    var schema: Schema,

    @Type(JsonBinaryType::class)
    @Column(name = "display_structure", columnDefinition = "jsonb", nullable = false)
    var display: EntityConfig,

    @Type(JsonBinaryType::class)
    @Column(name = "relationships", columnDefinition = "jsonb", nullable = true)
    var relationships: List<EntityRelationshipDefinition>? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "column_order", columnDefinition = "jsonb", nullable = true)
    var order: List<String>? = null,

    @Column(name = "archived", nullable = false, columnDefinition = "boolean default false")
    var archived: Boolean = false
) : AuditableEntity() {

    /**
     * Convert this entity to a domain model.
     */
    fun toModel(): EntityType {
        val id = requireNotNull(this.id) { "EntityTypeEntity ID cannot be null" }
        return EntityType(
            id = id,
            key = this.key,
            version = this.version,
            name = this.displayName,
            identifierKey = this.identifierKey,
            description = this.description,
            organisationId = this.organisationId,
            protected = this.protected,
            type = this.type,
            schema = this.schema,
            displayConfig = this.display,
            relationships = this.relationships,
            order = this.order,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
            createdBy = this.createdBy,
            updatedBy = this.updatedBy
        )
    }
}
