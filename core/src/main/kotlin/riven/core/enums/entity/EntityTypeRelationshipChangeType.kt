package riven.core.enums.entity

enum class EntityTypeRelationshipChangeType {
    NAME_CHANGED,
    CARDINALITY_CHANGED,
    TARGET_TYPES_ADDED,
    TARGET_TYPES_REMOVED,
    BIDIRECTIONAL_ENABLED,
    BIDIRECTIONAL_DISABLED,
    BIDIRECTIONAL_TARGETS_CHANGED,
    INVERSE_NAME_CHANGED,
}

fun EntityTypeRelationshipChangeType.canCauseImpact(): Boolean {
    return when (this) {
        EntityTypeRelationshipChangeType.NAME_CHANGED -> false
        // Changing cardinality may require data migrations or adjustments in how data is stored and accessed (ie MANY_TO_MANY -> ONE_TO_MANY would require culling data to fit the new cardinality)
        EntityTypeRelationshipChangeType.CARDINALITY_CHANGED -> true
        EntityTypeRelationshipChangeType.TARGET_TYPES_ADDED -> false
        // Removal of target types would result in the removal of columns in those entity types, and all data linked to those specific types.
        EntityTypeRelationshipChangeType.TARGET_TYPES_REMOVED -> true
        EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED -> false
        // Disabling bidirectional relationships would result in the removal of inverse columns in linked entity types.
        EntityTypeRelationshipChangeType.BIDIRECTIONAL_DISABLED -> true
        // Removal of bi-directional types would result in the removal of inverse columns in those entity types.
        EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED -> true
        // Changing the inverse name would require updates to columns that still use the default inverse name
        EntityTypeRelationshipChangeType.INVERSE_NAME_CHANGED -> true
    }
}