package riven.core.entity.entity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.models.entity.Entity
import java.util.*
import jakarta.persistence.Entity as JPAEntity

/**
 * JPA entity for entity instances.
 */
@JPAEntity
@Table(
    name = "entities",
    indexes = [
        Index(name = "idx_entities_organisation_id", columnList = "organisation_id"),
        Index(name = "idx_entities_type_id", columnList = "type_id"),
        Index(name = "idx_entities_archived", columnList = "archived")
    ]
)
data class EntityEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    val type: EntityTypeEntity,

    @Column(name = "type_version", nullable = false)
    var typeVersion: Int,

    @Column(name = "name", nullable = true)
    var name: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "payload", columnDefinition = "jsonb", nullable = false)
    var payload: Map<String, Any>,

    @Column(name = "archived", columnDefinition = "boolean default false")
    var archived: Boolean = false
) : AuditableEntity() {

    /**
     * Convert this entity to a domain model.
     */
    fun toModel(audit: Boolean = false): Entity {
        val id = requireNotNull(this.id) { "EntityEntity ID cannot be null" }
        return Entity(
            id = id,
            organisationId = this.organisationId,
            entityType = this.type.toModel(),
            typeVersion = this.typeVersion,
            name = this.name,
            payload = this.payload,
            archived = this.archived,
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null
        )
    }
}
