package riven.core.models.response.entity

import riven.core.entity.entity.EntityTypeEntity
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipImpactAnalysis

data class UpdateEntityTypeResponse(
    val success: Boolean,
    val error: String? = null,
    val entityType: EntityTypeEntity? = null,
    val impact: EntityTypeRelationshipImpactAnalysis? = null
)