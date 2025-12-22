package riven.core.models.entity.relationship.analysis

/**
 * This is a data model that represents the impact an update to an Entity Type relationship will have on the system.
 * A relationship change could come in the form of:
 *  - Cardinality changes.
 *  - Deletion of a bi-directional/supporting entity type link
 *  - Removal of bi-directionality all together
 *
 *  All of these changes would have cascading impacts on existing data, how that data is structured,
 *  and how existing data would need to be removed or altered to fit the new relationship definition.
 */
data class EntityTypeRelationshipImpactAnalysis(
    val affectedEntityTypes: List<String>,
    val dataLossWarnings: List<EntityTypeRelationshipDataLossWarning>,
    val columnsRemoved: List<EntityImpactSummary>,
    val columnsModified: List<EntityImpactSummary>,
)