package riven.core.models.response.entity.type

import riven.core.models.entity.EntityType
import riven.core.service.entity.type.DeleteDefinitionImpact

data class EntityTypeImpactResponse(
    // Return the updated entity type(s) after the update operation
    val error: String? = null,
    val updatedEntityTypes: Map<String, EntityType>? = null,
    val impact: DeleteDefinitionImpact? = null
)
