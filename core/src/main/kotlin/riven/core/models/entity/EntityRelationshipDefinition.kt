package riven.core.models.entity

/**
 * Defines a relationship requirement for a RELATIONSHIP entity type.
 *
 * @property name Human-readable label for the relationship (e.g., "Candidate", "Job Posting", "Target Entity")
 * @property key Unique key identifier for the relationship (e.g., "posted", "applied_for")
 * @property minOccurs Minimum number of times this relationship must occur (e.g., 0 for optional, 1 for required)
 * @property maxOccurs Maximum number of times this relationship can occur (e.g., 1 for single, -1 for unlimited)
 * @property required True if this relationship must be present, false if optional
 * @property entityTypeKeys List of allowed entity type keys (e.g., ["candidate", "job"]) or null for polymorphic
 * @property allowPolymorphic True if this relationship can link to any entity type (polymorphic slot)
 * @property bidirectional True if the relationship is bidirectional
 */
data class EntityRelationshipDefinition(
    val name: String,
    val key: String,
    val required: Boolean,
    val minOccurs: Int? = null,
    val maxOccurs: Int? = null,
    val entityTypeKeys: List<String>?,
    val allowPolymorphic: Boolean = false,
    val bidirectional: Boolean = false
)
