package riven.core.models.request.entity.type

import riven.core.enums.entity.semantics.SemanticAttributeClassification

/**
 * Request body for saving (upserting) semantic metadata on a single target.
 *
 * PUT semantics: all fields are fully replaced on every call. Omitting a field clears it.
 *
 * Classification is nullable — users may set definition/tags first and classify later.
 * Unknown classification values are rejected by Jackson deserialization (400 Bad Request),
 * since ACCEPT_CASE_INSENSITIVE_ENUMS is not enabled.
 */
data class SaveSemanticMetadataRequest(
    val definition: String? = null,
    val classification: SemanticAttributeClassification? = null,
    val tags: List<String> = emptyList(),
)
