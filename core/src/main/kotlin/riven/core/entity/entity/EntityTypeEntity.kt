package riven.core.entity.entity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.enums.block.structure.BlockValidationScope
import riven.core.enums.entity.EntityCategory
import riven.core.models.block.validation.BlockSchema
import riven.core.models.entity.EntityDisplayConfig
import riven.core.models.entity.EntityRelationshipConfig
import riven.core.models.entity.EntityType
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
    indexes = [
        Index(name = "idx_entity_types_organisation_id", columnList = "organisation_id"),
        Index(name = "idx_entity_types_key", columnList = "key"),
        Index(name = "idx_entity_types_category", columnList = "entity_category")
    ]
)
data class EntityTypeEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "key", nullable = false)
    val key: String,

    @Column(name = "display_name", nullable = false)
    var displayName: String,

    @Column(name = "description", nullable = true)
    var description: String? = null,

    @Column(name = "organisation_id", columnDefinition = "uuid")
    val organisationId: UUID? = null,

    @Column(name = "system", nullable = false)
    val system: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_category", nullable = false)
    val entityCategory: EntityCategory,

    @Column(name = "version", nullable = false, columnDefinition = "integer default 1")
    var version: Int = 1,

    @Enumerated(EnumType.STRING)
    @Column(name = "strictness", nullable = false, columnDefinition = "text default 'SOFT'")
    var strictness: BlockValidationScope = BlockValidationScope.SOFT,

    @Type(JsonBinaryType::class)
    @Column(name = "schema", columnDefinition = "jsonb", nullable = false)
    var schema: BlockSchema,

    @Type(JsonBinaryType::class)
    @Column(name = "display_config", columnDefinition = "jsonb", nullable = false)
    var displayConfig: EntityDisplayConfig,

    @Type(JsonBinaryType::class)
    @Column(name = "relationship_config", columnDefinition = "jsonb", nullable = true)
    var relationshipConfig: EntityRelationshipConfig? = null,

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
            description = this.description,
            organisationId = this.organisationId,
            system = this.system,
            entityCategory = this.entityCategory,
            schema = this.schema,
            strictness = this.strictness,
            displayConfig = this.displayConfig,
            relationshipConfig = this.relationshipConfig,
            archived = this.archived,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
            createdBy = this.createdBy,
            updatedBy = this.updatedBy
        )
    }
}
