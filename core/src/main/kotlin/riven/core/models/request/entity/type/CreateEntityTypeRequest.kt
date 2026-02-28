package riven.core.models.request.entity.type

import riven.core.models.common.Icon
import riven.core.models.common.display.DisplayName

data class CreateEntityTypeRequest(
    val name: DisplayName,
    val key: String,
    val description: String?,
    val icon: Icon,
    val semantics: SaveSemanticMetadataRequest? = null,
)
