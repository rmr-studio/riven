package riven.core.models.response.entity

import riven.core.models.entity.EntityType
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipImpactAnalysis

data class UpdateEntityTypeResponse(
    val success: Boolean,
    val error: String? = null,
    // Return the updated entity type(s) after the update operation
    val updatedEntityTypes: Map<String, EntityType>? = null,
    val impact: EntityTypeRelationshipImpactAnalysis? = null
)