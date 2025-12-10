package riven.core.entity.entity

import jakarta.persistence.*
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
        UniqueConstraint(columnNames = ["source_entity_id", "target_entity_id", "key"])
    ],
    indexes = [
        Index(name = "idx_entity_relationships_source", columnList = "source_entity_id"),
        Index(name = "idx_entity_relationships_target", columnList = "target_entity_id"),
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

    @Column(name = "source_entity_id", nullable = false)
    val sourceId: UUID,

    @Column(name = "target_entity_id", nullable = false)
    val targetId: UUID,

    @Column(name = "key", nullable = false)
    val key: String,
    
    // Human representation of the Relationship ( "<x> is friend of <y>" -> "is friend of" )
    @Column(name = "label", nullable = true)
    val label: String? = null,

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
            key = this.key,
            label = this.label,
            sourceEntityId = this.sourceId,
            targetEntityId = this.targetId,
            bidirectional = this.bidirectional,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null
        )
    }
}
