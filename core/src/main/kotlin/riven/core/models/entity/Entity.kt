package riven.core.models.entity

import riven.core.entity.util.AuditableModel
import riven.core.enums.common.IconColour
import riven.core.enums.common.IconType
import riven.core.models.common.Icon
import riven.core.models.entity.payload.EntityAttribute
import java.time.ZonedDateTime
import java.util.*

/**
 * Domain model for an entity instance.
 */
data class Entity(
    val id: UUID,
    val workspaceId: UUID,
    val typeId: UUID,

    val payload: Map<UUID, EntityAttribute>,
    val icon: Icon = Icon(
        icon = IconType.FILE,
        colour = IconColour.NEUTRAL
    ),
    val validationErrors: List<String>? = null,
    // A unique identifier key for the entity within its type, taken and synced from EntityType for easier lookup
    val identifierKey: UUID,
    override var createdAt: ZonedDateTime? = null,
    override var updatedAt: ZonedDateTime? = null,
    override var createdBy: UUID? = null,
    override var updatedBy: UUID? = null
) : AuditableModel() {
    val identifier: String
        get() = this.payload[identifierKey].toString()
}