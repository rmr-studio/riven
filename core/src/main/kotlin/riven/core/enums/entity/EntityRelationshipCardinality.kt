package riven.core.enums.entity

/**
 * Defines the cardinality of relationships between entities.
 */
enum class EntityRelationshipCardinality {
    ONE_TO_ONE,
    ONE_TO_MANY,
    MANY_TO_ONE,
    MANY_TO_MANY
}

fun EntityRelationshipCardinality.invert(): EntityRelationshipCardinality {
    return when (this) {
        EntityRelationshipCardinality.ONE_TO_ONE -> EntityRelationshipCardinality.ONE_TO_ONE
        EntityRelationshipCardinality.ONE_TO_MANY -> EntityRelationshipCardinality.MANY_TO_ONE
        EntityRelationshipCardinality.MANY_TO_ONE -> EntityRelationshipCardinality.ONE_TO_MANY
        EntityRelationshipCardinality.MANY_TO_MANY -> EntityRelationshipCardinality.MANY_TO_MANY
    }
}