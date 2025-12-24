package riven.core.models.entity.relationship.analysis

import riven.core.models.common.display.DisplayName
import riven.core.models.entity.configuration.EntityRelationshipDefinition

/**
 * This represents a relationship definition that is considered a candidate for another entity type to merge into.
 * These should be displayed as candidates when creating a new entity type, as the user may want to create a
 * bi-directional relationship from the new entity type to this one.
 */
data class EntityTypeRelationshipCandidate(
    val entityTypeKey: String,
    val entityTypeName: DisplayName,
    val relationship: EntityRelationshipDefinition
)