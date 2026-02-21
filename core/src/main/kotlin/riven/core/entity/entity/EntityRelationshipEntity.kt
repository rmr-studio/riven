package riven.core.entity.entity

import jakarta.persistence.*
import riven.core.entity.util.AuditableSoftDeletableEntity
import riven.core.models.entity.EntityRelationship
import java.util.*

/**
 * JPA entity for relationships between entities.
 */
@Entity
@Table(
    name = "entity_relationships",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["source_entity_id", "relationship_definition_id", "target_entity_id"])
    ],
    indexes = [
        Index(name = "idx_entity_relationships_source", columnList = "workspace_id, source_entity_id"),
        Index(name = "idx_entity_relationships_target", columnList = "workspace_id, target_entity_id"),
    ]
)
data class EntityRelationshipEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "source_entity_id", nullable = false, columnDefinition = "uuid")
    val sourceId: UUID,

    @Column(name = "target_entity_id", nullable = false, columnDefinition = "uuid")
    val targetId: UUID,

    @Column(name = "relationship_definition_id", nullable = false, columnDefinition = "uuid")
    val definitionId: UUID,

) : AuditableSoftDeletableEntity() {

    /**
     * Convert this entity to a domain model.
     */
    fun toModel(audit: Boolean = false): EntityRelationship {
        val id = requireNotNull(this.id) { "EntityRelationshipEntity ID cannot be null" }
        return EntityRelationship(
            id = id,
            workspaceId = this.workspaceId,
            definitionId = this.definitionId,
            sourceEntityId = this.sourceId,
            targetEntityId = this.targetId,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null
        )
    }
}
