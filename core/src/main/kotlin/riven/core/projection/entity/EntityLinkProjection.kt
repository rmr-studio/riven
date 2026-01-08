package riven.core.projection.entity

import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.models.common.Icon
import riven.core.models.entity.EntityLink
import java.util.*

/**
 * Projection interface for EntityLink native query results.
 * Spring Data JPA will automatically map the query columns to these methods.
 *
 * Note: This interface must only contain simple property accessors (getters).
 * Use the toEntityLink() extension function to convert to the domain model.
 */
interface EntityLinkProjection {
    fun getId(): UUID
    fun getworkspaceId(): UUID
    fun getTypeKey(): String
    fun getFieldId(): UUID
    fun getSourceEntityId(): UUID
    fun getIconType(): String
    fun getIconColour(): String
    fun getLabel(): String
}

/**
 * Convert this projection to an EntityLink domain model.
 */
fun EntityLinkProjection.toEntityLink(): EntityLink = EntityLink(
    id = getId(),
    workspaceId = getworkspaceId(),
    fieldId = getFieldId(),
    sourceEntityId = getSourceEntityId(),
    icon = Icon(
        icon = IconType.valueOf(getIconType()),
        colour = IconColour.valueOf(getIconColour())
    ),
    key = getTypeKey(),
    label = getLabel()
)