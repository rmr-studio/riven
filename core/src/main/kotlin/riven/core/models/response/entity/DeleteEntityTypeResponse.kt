package riven.core.models.response.entity

import riven.core.models.entity.EntityType
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipImpactAnalysis

data class DeleteEntityTypeResponse(
    val success: Boolean,
    val impact: EntityTypeRelationshipImpactAnalysis? = null,
    // Return the entity types that were affected by the deletion of the original entity type (Ie. modified/removed relationships due to cascading effects)
    val updatedEntityTypes: Map<String, EntityType>? = null,
    val error: String? = null
)