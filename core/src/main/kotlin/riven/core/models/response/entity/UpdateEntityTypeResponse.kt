package riven.core.models.response.entity

import riven.core.entity.entity.EntityTypeEntity

data class UpdateEntityTypeResponse(
    val success: Boolean,
    val error: String? = null,
    val entityType: EntityTypeEntity? = null
)