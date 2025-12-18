package riven.core.models.entity.configuration

import riven.core.enums.entity.EntityRelationshipCardinality

/**
 * Defines a relationship requirement for a RELATIONSHIP entity type.
 *
 * @property name Human-readable label for the relationship (e.g., "Candidate", "Job Posting", "Target Entity")
 * @property key Unique key identifier for the relationship (e.g., "posted", "applied_for")
 * @property required True if this relationship must exist and have defined values
 * @property entityTypeKeys List of allowed entity type keys (e.g., ["candidate", "job"]) or null for polymorphic
 * @property allowPolymorphic True if this relationship can link to any entity type (polymorphic slot)
 * @property bidirectional True if the relationship is bidirectional
 *
 * Relationships allow for:
 *  1. Singular Entity Relationships
 *    - Normal relationships => Restricted to one specific entity type
 *  2. Polymorphic Entity Relationships
 *    - Relationship open to any entity type
 *  3. Strict Multi-Entity Type Relationships
 *    - Restricted to specific entity types
 *    - Example: Task.assignee → [Person, Team] (not polymorphic, just 2 specific types)
 *
 */
data class EntityRelationshipDefinition(
    val name: String,
    val key: String,
    val required: Boolean,
    val cardinality: EntityRelationshipCardinality,
    val entityTypeKeys: List<String>? = null,
    val allowPolymorphic: Boolean = false,
    val bidirectional: Boolean = false,
    // For polymorphic/multi-entity relationships, we should be able to filter WHICH entity types have a bidirectional/inverse relationship
    val bidirectionalEntityTypeKeys: List<String>? = null,
    // For bidirectional relationships, the name of the inverse relationship
    val inverseName: String? = null
)