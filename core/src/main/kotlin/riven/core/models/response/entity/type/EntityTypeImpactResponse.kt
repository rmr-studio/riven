package riven.core.models.response.entity.type

import riven.core.models.entity.EntityType
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipImpactAnalysis

data class UpdateEntityTypeResponse(
    // Return the updated entity type(s) after the update operation
    val error: String? = null,
    val updatedEntityTypes: Map<String, EntityType>? = null,
    val impact: EntityTypeRelationshipImpactAnalysis? = null
)