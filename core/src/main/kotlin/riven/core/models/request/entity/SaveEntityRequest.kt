package riven.core.models.request.entity

import riven.core.models.common.Icon
import riven.core.models.entity.payload.EntityAttributePayload
import java.util.*

data class SaveEntityRequest(
    val key: String,
    val payload: Map<UUID, EntityAttributePayload>,
    val icon: Icon? = null,
)