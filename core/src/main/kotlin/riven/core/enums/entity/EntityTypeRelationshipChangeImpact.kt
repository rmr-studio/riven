package riven.core.enums.entity

data class EntityTypeRelationshipChangeImpactRelationshipChangeImpact(
    val affectedEntityTypes: Set<String>,
    val dataLossWarnings: List<EntityRelationshipDataLossWarning>,
//    val referenceCreations: List<ReferenceCreation>,
//    val referenceDeletions: List<ReferenceDeletion>,
//    val referenceUpdates: List<ReferenceUpdate>
)