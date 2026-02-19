package riven.core.models.response.entity.type

import riven.core.models.entity.EntityType

/**
 * Response wrapper for an entity type with optional semantic metadata attached.
 *
 * Used when `?include=semantics` is specified on entity type list or detail endpoints.
 * When semantics are not requested, the `semantics` field is null for backward compatibility.
 */
data class EntityTypeWithSemanticsResponse(
    val entityType: EntityType,
    val semantics: SemanticMetadataBundle? = null,
)
