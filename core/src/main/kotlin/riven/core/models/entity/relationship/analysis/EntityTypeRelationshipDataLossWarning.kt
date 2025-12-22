package riven.core.models.entity.relationship.analysis

import riven.core.enums.entity.EntityTypeRelationshipDataLossReason
import riven.core.models.entity.configuration.EntityRelationshipDefinition

data class EntityTypeRelationshipDataLossWarning(
    val entityTypeKey: String,
    val relationship: EntityRelationshipDefinition,
    val reason: EntityTypeRelationshipDataLossReason,
)