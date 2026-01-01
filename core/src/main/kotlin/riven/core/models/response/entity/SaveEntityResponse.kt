package riven.core.models.response.entity

import riven.core.models.entity.Entity
import java.util.*

data class SaveEntityResponse(
    val entity: Entity? = null,
    val errors: List<String>? = null,
    // If the save operation impacted other entities (eg. due to relationship changes), return them here grouped by EntityType ID
    val impactedEntities: Map<UUID, List<Entity>>? = null
)