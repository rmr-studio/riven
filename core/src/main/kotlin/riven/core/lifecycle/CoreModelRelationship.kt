package riven.core.lifecycle

import riven.core.enums.entity.EntityRelationshipCardinality

/**
 * Relationship definition on a core model. Source is the declaring model,
 * target is another CoreModelDefinition referenced by compile-time object reference.
 */
data class CoreModelRelationship(
    val key: String,
    val name: String,
    val sourceModelKey: String,
    val targetModelKey: String,
    val cardinality: EntityRelationshipCardinality = EntityRelationshipCardinality.ONE_TO_MANY,
    val inverseName: String = "",
    val semantics: RelationshipSemantics? = null,
)

data class RelationshipSemantics(
    val definition: String,
    val tags: List<String> = emptyList(),
)
