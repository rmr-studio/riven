package riven.core.service.block

import org.springframework.stereotype.Service
import riven.core.enums.block.node.BlockReferenceWarning
import riven.core.enums.core.EntityType
import riven.core.models.block.Reference
import riven.core.models.block.request.EntityReferenceRequest
import riven.core.models.block.response.internal.BlockHydrationResult
import riven.core.service.block.resolvers.ReferenceResolver
import java.util.*

/**
 * Service for fetching all external data that is displayed by any given block.
 *
 * A block can reference external entities in two ways:
 *  - A reference to another entity (Client, Project, Task, or Block from another workspace)
 *  - A reference to another block tree created in another environment
 *  - A reference to an external data source/integrated application (e.g. CRM, Calendar, etc.) - Not yet implemented
 */
@Service
class BlockReferenceHydrationService(
    resolvers: List<ReferenceResolver>
) {
    private val resolverByType = resolvers.associateBy { it.type }

    /**
     * Hydrates (resolves entity references for) multiple blocks in a single batched operation.
     *
     * This method is optimized for performance by:
     * 1. Grouping entity references by type for batch fetching
     * 2. Using resolvers to fetch all entities of each type in parallel
     *
     * @param references The map of block IDs to their list of reference items to hydrate.
     * @param organisationId The organisation context for authorization and filtering.
     * @return A map from block ID to its hydration result. Blocks that aren't entity reference blocks are skipped.
     */
    fun hydrateBlockReferences(
        references: Map<UUID, List<EntityReferenceRequest>>,
        organisationId: UUID
    ): Map<UUID, BlockHydrationResult> {

        // Separate each entity type into groups for batch fetching capabilities
        val referencesByType = mutableMapOf<EntityType, MutableSet<UUID>>()
        references.forEach { (_, references) ->
            references.forEach { item ->
                referencesByType
                    .getOrPut(item.type) { mutableSetOf() }
                    .add(item.id)
            }
        }

        // Batch fetch all entities by type using resolvers
        val resolvedEntities = referencesByType.mapValues { (entityType, ids) ->
            resolverByType[entityType]?.fetch(ids, organisationId) ?: emptyMap()
        }

        // 4. Build hydration results for each block
        return references.mapValues { (blockId, references) ->
            try {
                val entityReference = references.map { reference ->
                    val entity = resolvedEntities[reference.type]?.get(reference.id)
                    Reference(
                        id = null, // Not using persisted reference rows for hydration
                        entityType = reference.type,
                        entityId = reference.id,
                        entity = entity,
                        orderIndex = reference.index,
                        warning = if (entity == null) BlockReferenceWarning.MISSING else null
                    )
                }

                BlockHydrationResult(
                    blockId = blockId,
                    references = entityReference,
                    error = null
                )
            } catch (e: Exception) {
                BlockHydrationResult(
                    blockId = blockId,
                    references = emptyList(),
                    error = "Failed to hydrate block: ${e.message}"
                )
            }
        }
    }
}
