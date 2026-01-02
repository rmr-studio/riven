package riven.core.entity.entity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.enums.common.IconColour
import riven.core.enums.common.IconType
import riven.core.enums.common.SchemaType
import riven.core.enums.entity.EntityPropertyType
import riven.core.models.common.Icon
import riven.core.models.entity.Entity
import riven.core.models.entity.EntityLink
import riven.core.models.entity.payload.*
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
        Index(name = "idx_entities_organisation_id", columnList = "organisation_id"),
    ]
)
data class EntityEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @Column(name = "type_id", nullable = false)
    val typeId: UUID,
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
     * Converts the persisted JSON payload back to EntityAttributePayload objects.
     */
    private fun fromJsonPayload(jsonPayload: Map<String, Any?>): EntityAttributePayload {
        val type = (jsonPayload["type"] as? String)?.let { EntityPropertyType.valueOf(it) }
            ?: throw IllegalArgumentException("Missing or invalid 'type' in payload")

        return when (type) {
            EntityPropertyType.ATTRIBUTE -> {
                val value = jsonPayload["value"]
                val schemaType = (jsonPayload["schemaType"] as? String)?.let { SchemaType.valueOf(it) }
                    ?: throw IllegalArgumentException("Missing or invalid 'schemaType' in primitive payload")
                EntityAttributePrimitivePayload(value = value, schemaType = schemaType)
            }

            EntityPropertyType.RELATIONSHIP -> {
                @Suppress("UNCHECKED_CAST")
                val relations = (jsonPayload["relations"] as? List<String>)?.map { UUID.fromString(it) }
                    ?: emptyList()
                EntityAttributeRelationPayloadReference(relations = relations)
            }
        }
    }

    /**
     * Convert this entity to a domain model.
     */
    fun toModel(audit: Boolean = false, relationships: Map<UUID, EntityLink>): Entity {
        val id = requireNotNull(this.id) { "EntityEntity ID cannot be null" }

        // Convert the persisted JSON payload back to EntityAttributePayload structure
        val convertedPayload: Map<UUID, EntityAttribute> = this.payload.mapNotNull { (key, value) ->
            try {
                @Suppress("UNCHECKED_CAST")
                val jsonMap = value as? Map<String, Any?> ?: return@mapNotNull null
                val payload: EntityAttribute = fromJsonPayload(jsonMap).let {
                    when (it.type) {
                        EntityPropertyType.ATTRIBUTE -> EntityAttribute(
                            payload = it
                        )

                        EntityPropertyType.RELATIONSHIP -> EntityAttribute(
                            payload = EntityAttributeRelationPayload(
                                relations = (it as EntityAttributeRelationPayloadReference).relations.mapNotNull { relId ->
                                    relationships[relId]
                                }
                            )
                        )
                    }
                }

                UUID.fromString(key) to payload


            } catch (e: Exception) {
                // Log or handle conversion errors gracefully
                null
            }
        }.toMap()

        return Entity(
            id = id,
            organisationId = this.organisationId,
            typeId = this.typeId,
            payload = convertedPayload,
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
