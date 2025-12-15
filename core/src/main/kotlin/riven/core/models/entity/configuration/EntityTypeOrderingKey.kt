package riven.core.models.entity.configuration

import riven.core.enums.entity.EntityCategory

data class EntityTypeOrderingKey(
    val key: String,
    val category: EntityCategory
)