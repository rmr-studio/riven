package riven.core.models.request.entity

import riven.core.enums.entity.EntityCategory
import riven.core.models.common.Icon
import riven.core.models.common.display.DisplayName

data class CreateEntityTypeRequest(
    val name: DisplayName,
    val key: String,
    val description: String?,
    val type: EntityCategory,
    val icon: Icon
)