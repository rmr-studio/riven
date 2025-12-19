package riven.core.enums.entity

data class EntityRelationshipDataLossWarning(
    val entityTypeKey: String,
    val relationshipName: String,
    val reason: EntityRelationshipDataLossReason,
    val estimatedAffectedEntities: Long?  // Count of entities with data in this relationship
)