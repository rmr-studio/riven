package riven.core.models.request.entity.type

import riven.core.models.entity.EntityType

data class UpdateEntityTypeConfigurationRequest(
    val entityType: EntityType,
    val semantics: SaveSemanticMetadataRequest? = null,
)
