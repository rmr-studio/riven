package riven.core.entity.entity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.enums.common.IconColour
import riven.core.enums.common.IconType
import riven.core.models.common.Icon
import riven.core.models.entity.Entity
import riven.core.models.entity.EntityLink
import riven.core.models.entity.payload.EntityAttribute
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.payload.EntityAttributeRelationPayload
import java.time.ZonedDateTime
import java.util.*
import jakarta.persistence.Entity as JPAEntity

/**
 * JPA entity for entity instances.
 */
@JPAEntity
@Table(
    name = "entities",
    indexes = [
        Index(name = "idx_entities_type_id", columnList = "type_id"),
        Index(name = "idx_entities_workspace_id", columnList = "workspace_id"),
    ]
)
data class EntityEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false)
    val workspaceId: UUID,

    @Column(name = "type_id", nullable = false)
    val typeId: UUID,

    @Column(name = "type_key", nullable = false)
    val typeKey: String,

    @Column("identifier_key", nullable = false, columnDefinition = "uuid")
    val identifierKey: UUID,

    @Type(JsonBinaryType::class)
    @Column(name = "payload", columnDefinition = "jsonb", nullable = false)
    var payload: Map<String, EntityAttributePrimitivePayload>,

    @Enumerated(EnumType.STRING)
    @Column(name = "icon_colour", nullable = false)
    var iconColour: IconColour = IconColour.NEUTRAL,

    @Enumerated(EnumType.STRING)
    @Column(name = "icon_type", nullable = false)
    var iconType: IconType = IconType.FILE,


    @Column("archived", nullable = false)
    var archived: Boolean = false,

    @Column("deleted_at", nullable = true)
    var deletedAt: ZonedDateTime? = null,
) : AuditableEntity() {


    /**
     * Convert this entity to a domain model.
     */
    fun toModel(audit: Boolean = false, relationships: Map<UUID, List<EntityLink>>): Entity {
        val id = requireNotNull(this.id) { "EntityEntity ID cannot be null" }


        val payload: Map<UUID, EntityAttribute> =
            this.payload.map { (key, value) -> UUID.fromString(key) to EntityAttribute(payload = value) }
                .toMap() + relationships.mapValues { entry ->
                EntityAttribute(
                    payload =
                        EntityAttributeRelationPayload(
                            relations = entry.value
                        )
                )
            }


        return Entity(
            id = id,
            workspaceId = this.workspaceId,
            typeId = this.typeId,
            payload = payload,
            identifierKey = this.identifierKey,
            icon = Icon(
                icon = this.iconType,
                colour = this.iconColour
            ),
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null
        )
    }
}
