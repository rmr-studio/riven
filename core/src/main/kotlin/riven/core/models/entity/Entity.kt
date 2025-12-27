package riven.core.models.entity

import riven.core.entity.util.AuditableModel
import riven.core.enums.common.IconColour
import riven.core.enums.common.IconType
import riven.core.models.common.Icon
import riven.core.models.entity.payload.EntityAttributePayload
import java.time.ZonedDateTime
import java.util.*

/**
 * Domain model for an entity instance.
 */
data class Entity(
    val id: UUID,
    val organisationId: UUID,
    val typeId: UUID,
    val payload: Map<UUID, EntityAttributePayload>,
    val icon: Icon = Icon(
        icon = IconType.FILE,
        colour = IconColour.NEUTRAL
    ),
    val validationErrors: List<String>? = null,
    // A unique identifier key for the entity within its type, taken and synced from EntityType for easier lookup
    val identifierKey: UUID,
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null
) : AuditableModel() {
    val link: EntityLink
        get() = EntityLink(
            id = this.id,
            organisationId = this.organisationId,
            icon = this.icon,
            label = this.identifier
        )

    val identifier: String
        get() = this.payload[identifierKey].toString()
}