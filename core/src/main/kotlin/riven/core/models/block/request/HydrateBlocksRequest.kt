package riven.core.models.block.request

import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import riven.core.enums.core.EntityType
import java.util.*

/**
 * Request to hydrate (resolve entity references for) one or more blocks.
 *
 * This is used to progressively load entity data for reference blocks
 * without fetching everything upfront during initial environment load.
 *
 * @param references A map where each key is a block ID and the value is a list of entity references associated to that block
 * @param organisationId The organisation context for authorization and filtering.
 */
data class HydrateBlocksRequest(
    @field:NotEmpty(message = "block references must not be empty")
    val references: Map<UUID, List<EntityReferenceRequest>>,
    @field:NotNull(message = "organisationId is required")
    var organisationId: UUID
)

data class EntityReferenceRequest(
    val type: EntityType,
    val id: UUID,
    val index: Int? = null
)


