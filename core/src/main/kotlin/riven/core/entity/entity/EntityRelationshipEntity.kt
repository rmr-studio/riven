package riven.core.entity.entity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.models.entity.EntityRelationship
import java.util.*

/**
 * JPA entity for relationships between entities.
 */
@Entity
@Table(
    name = "entity_relationships",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["source_entity_id", "target_entity_id", "relationship_type"])
    ],
    indexes = [
        Index(name = "idx_entity_relationships_source", columnList = "source_entity_id"),
        Index(name = "idx_entity_relationships_target", columnList = "target_entity_id"),
        Index(name = "idx_entity_relationships_relationship_entity", columnList = "relationship_entity_id"),
        Index(name = "idx_entity_relationships_organisation", columnList = "organisation_id")
    ]
)
data class EntityRelationshipEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_entity_id", nullable = false)
    val sourceEntity: EntityEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_entity_id", nullable = false)
    val targetEntity: EntityEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relationship_entity_id", nullable = true)
    val relationshipEntity: EntityEntity? = null,

    @Column(name = "relationship_type", nullable = false)
    val relationshipType: String,

    @Column(name = "relationship_label", nullable = true)
    val relationshipLabel: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "metadata", columnDefinition = "jsonb", nullable = false)
    val metadata: Map<String, Any> = emptyMap(),

    @Column(name = "bidirectional", nullable = false)
    val bidirectional: Boolean = false
) : AuditableEntity() {

    /**
     * Convert this entity to a domain model.
     */
    fun toModel(audit: Boolean = false): EntityRelationship {
        val id = requireNotNull(this.id) { "EntityRelationshipEntity ID cannot be null" }
        return EntityRelationship(
            id = id,
            organisationId = this.organisationId,
            sourceEntity = this.sourceEntity.toModel(audit),
            targetEntity = this.targetEntity.toModel(audit),
            relationshipEntity = this.relationshipEntity?.toModel(audit),
            relationshipType = this.relationshipType,
            relationshipLabel = this.relationshipLabel,
            metadata = this.metadata,
            bidirectional = this.bidirectional,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null
        )
    }
}
