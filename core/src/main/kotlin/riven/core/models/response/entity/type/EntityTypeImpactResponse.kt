package riven.core.models.response.entity.type

import riven.core.models.entity.EntityType
import java.util.*

/**
 * Result of an impact check when deleting a relationship definition with existing instance data.
 */
data class DeleteDefinitionImpact(
    val definitionId: UUID,
    val definitionName: String,
    val impactedLinkCount: Long,
)

data class EntityTypeImpactResponse(
    // Return the updated entity type(s) after the update operation
    val error: String? = null,
    val updatedEntityTypes: Map<String, EntityType>? = null,
    val impact: DeleteDefinitionImpact? = null
)
