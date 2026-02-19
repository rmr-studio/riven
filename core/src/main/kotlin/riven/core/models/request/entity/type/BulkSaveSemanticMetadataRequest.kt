package riven.core.models.request.entity.type

import riven.core.enums.entity.semantics.SemanticAttributeClassification
import java.util.UUID

/**
 * A single entry in a bulk attribute-metadata upsert request.
 *
 * Each entry targets a specific attribute UUID within the entity type.
 * PUT semantics apply per entry: all fields are fully replaced.
 */
data class BulkSaveSemanticMetadataRequest(
    val targetId: UUID,
    val definition: String? = null,
    val classification: SemanticAttributeClassification? = null,
    val tags: List<String> = emptyList(),
)
