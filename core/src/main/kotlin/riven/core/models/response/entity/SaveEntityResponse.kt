package riven.core.models.response.entity

import riven.core.models.entity.Entity

data class SaveEntityResponse(
    val entity: Entity? = null,
    val errors: List<String>? = null,
)