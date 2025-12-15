package riven.core.models.entity.configuration

import riven.core.enums.entity.EntityPropertyType

data class EntityTypeOrderingKey(
    val key: String,
    val type: EntityPropertyType
)