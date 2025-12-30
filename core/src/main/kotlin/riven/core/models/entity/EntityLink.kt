package riven.core.models.entity

import riven.core.models.common.Icon
import java.util.*

/**
 * EntityLink represents an entity that is being referenced by another entity,
 * This should provide enough information to display the referenced entity in a UI context,
 * and to navigate to that entity upon user interaction.
 */
data class EntityLink(
    val id: UUID,
    val organisationId: UUID,
    val icon: Icon,
    // This should be the value taken from the field marked as the `identifier` of that entity type
    val label: String
)