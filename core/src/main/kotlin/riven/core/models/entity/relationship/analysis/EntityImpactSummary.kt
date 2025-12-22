package riven.core.models.entity.relationship.analysis

import java.util.*

data class EntityImpactSummary(
    val entityTypeKey: String,
    val relationshipId: UUID,
    val relationshipName: String,
    val impact: String,
)

