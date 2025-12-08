package riven.core.models.entity

/**
 * Defines a relationship requirement for a RELATIONSHIP entity type.
 *
 * @property role The role identifier (e.g., "candidate", "job", "company", "target")
 * @property label Human-readable label (e.g., "Candidate", "Job Posting", "Target Entity")
 * @property required True if this relationship must be present, false if optional
 * @property entityTypeKeys List of allowed entity type keys (e.g., ["candidate", "job"]) or null for polymorphic
 * @property allowPolymorphic True if this relationship can link to any entity type (polymorphic slot)
 * @property bidirectional True if the relationship is bidirectional
 */
data class EntityRelationshipDefinition(
    val role: String,
    val label: String,
    val required: Boolean,
    val entityTypeKeys: List<String>?,
    val allowPolymorphic: Boolean = false,
    val bidirectional: Boolean = false
)
