package riven.core.service.block

import org.springframework.stereotype.Service
import riven.core.enums.block.node.BlockReferenceWarning
import riven.core.enums.block.node.ReferenceType
import riven.core.models.block.tree.*
import riven.core.models.request.block.EntityReferenceRequest
import riven.core.models.response.block.internal.BlockHydrationResult
import riven.core.service.entity.EntityService
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
    private val entityService: EntityService,
    private val blockService: BlockService
) {


    /**
     * Hydrates (resolves references for) multiple blocks in a single batched operation.
     *
     * This method is optimized for performance by:
     * 1. Grouping references by type (BLOCK vs ENTITY) for batch fetching
     * 2. Fetching all entities and blocks in batched operations
     *
     * @param references The map of block IDs to their list of reference items to hydrate.
     * @param organisationId The organisation context for authorization and filtering.
     * @return A map from block ID to its hydration result.
     */
    fun hydrateBlockReferences(
        references: Map<UUID, List<EntityReferenceRequest>>,
        organisationId: UUID
    ): Map<UUID, BlockHydrationResult> {

        // Collect all unique IDs by reference type for batch fetching
        val entityIds = mutableSetOf<UUID>()
        val blockIds = mutableSetOf<UUID>()

        references.values.forEach { refList ->
            refList.forEach { ref ->
                when (ref.type) {
                    ReferenceType.ENTITY -> entityIds.add(ref.id)
                    ReferenceType.BLOCK -> blockIds.add(ref.id)
                }
            }
        }

        // Batch fetch all entities and blocks
        val entitiesById = if (entityIds.isNotEmpty()) {
            entityService.getEntitiesByIds(entityIds)
                .associateBy { it.id }
                .mapValues { it.value.toModel() }
        } else {
            emptyMap()
        }

        val blocksById = if (blockIds.isNotEmpty()) {
            blockService.getBlocks(blockIds)
                .mapValues { it.value.toModel() }
        } else {
            emptyMap()
        }

        // Build hydration results for each block
        return references.mapValues { (blockId, refList) ->
            try {
                // Separate references by type
                val entityRefs = refList.filter { it.type == ReferenceType.ENTITY }
                val blockRefs = refList.filter { it.type == ReferenceType.BLOCK }

                // Build the appropriate ReferencePayload
                val payload: ReferencePayload = when {
                    entityRefs.isNotEmpty() && blockRefs.isEmpty() -> {
                        // Entity references only
                        val items = entityRefs.map { ref ->
                            val entity = entitiesById[ref.id]
                            ReferenceItem(
                                id = ref.id,
                                path = null,
                                orderIndex = ref.index,
                                entity = entity,
                                warning = if (entity == null) BlockReferenceWarning.MISSING else null
                            )
                        }
                        EntityReference(reference = items)
                    }
                    blockRefs.isNotEmpty() && entityRefs.isEmpty() -> {
                        // Block references only (should only have one)
                        val ref = blockRefs.first()
                        val blockTree = if (ref.id in blocksById) {
                            blockService.getBlockTree(ref.id)
                        } else null

                        BlockTreeReference(
                            reference = ReferenceItem(
                                id = ref.id,
                                path = null,
                                orderIndex = ref.index,
                                entity = blockTree,
                                warning = if (blockTree == null) BlockReferenceWarning.MISSING else null
                            )
                        )
                    }
                    else -> {
                        // Mixed or empty - shouldn't happen, default to empty EntityReference
                        EntityReference(reference = emptyList())
                    }
                }

                BlockHydrationResult(
                    blockId = blockId,
                    references = listOf(payload),
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
