package riven.core.models.entity

import java.util.UUID

/**
 * Bundles all semantic metadata for a single entity type into one object.
 *
 * Used by the `?include=semantics` feature and by the GET-all-metadata endpoint.
 * Keys in the attribute and relationship maps are the target_id (attribute UUID or relationship UUID).
 */
data class SemanticMetadataBundle(
    val entityType: EntityTypeSemanticMetadata?,
    val attributes: Map<UUID, EntityTypeSemanticMetadata>,
    val relationships: Map<UUID, EntityTypeSemanticMetadata>,
)
