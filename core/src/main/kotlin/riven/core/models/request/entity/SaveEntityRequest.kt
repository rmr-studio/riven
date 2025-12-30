package riven.core.models.request.entity

import riven.core.models.common.Icon
import riven.core.models.entity.payload.EntityAttributeRequest
import java.util.*

data class SaveEntityRequest(
    val id: UUID? = null,
    val payload: Map<UUID, EntityAttributeRequest>,
    val icon: Icon? = null,
)