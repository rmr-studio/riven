package riven.core.models.response.entity.type

import riven.core.models.entity.EntityType
import riven.core.models.entity.RelationshipDefinition

/**
 * Response wrapper for an entity type with its relationship definitions and optional semantic metadata.
 *
 * Relationship definitions are always included since they are a core part of the entity type schema.
 * Pass `?include=semantics` to also attach semantic metadata bundles.
 */
data class EntityTypeWithSemanticsResponse(
    val entityType: EntityType,
    val relationships: List<RelationshipDefinition> = emptyList(),
    val semantics: SemanticMetadataBundle? = null,
)
