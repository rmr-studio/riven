package riven.core.models.entity

import riven.core.models.common.structure.FormStructure

/**
 * Display configuration for entity types.
 * Simplified compared to BlockDisplay - only form and summary info (no full render system).
 */
data class EntityDisplayConfig(
    val form: FormStructure,
    val summary: EntitySummaryConfig
)


/**
 * Summary configuration defining how entities appear in lists and summaries.
 *
 * @property titleField Which payload field to use as the entity title
 * @property descriptionField Which field to use as description
 * @property iconField Which field holds an icon/avatar URL
 */
data class EntitySummaryConfig(
    val titleField: String?,
    val descriptionField: String?,
    val iconField: String?
)
