package riven.core.service.block

import jakarta.transaction.Transactional
import riven.core.entity.block.BlockEntity
import riven.core.entity.block.BlockReferenceEntity
import riven.core.enums.block.node.BlockReferenceWarning
import riven.core.enums.block.structure.BlockReferenceFetchPolicy
import riven.core.enums.core.EntityType
import riven.core.models.block.Reference
import riven.core.models.block.metadata.BlockReferenceMetadata
import riven.core.models.block.metadata.EntityReferenceMetadata
import riven.core.models.block.metadata.ReferenceItem
import riven.core.models.block.request.EntityReferenceRequest
import riven.core.models.block.request.HydrateBlocksRequest
import riven.core.models.block.response.internal.BlockHydrationResult
import riven.core.repository.block.BlockReferenceRepository
import riven.core.service.block.resolvers.ReferenceResolver
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service for managing block links.
 *
 * A link can be either:
 *  - A reference to a direct child block as a nested layout (OWNED)
 *  - A reference to another entity (Client, Project, Task, or Block from another workspace) (LINKED)
 */
@Service
class BlockReferenceService(
    private val blockReferenceRepository: BlockReferenceRepository,
    resolvers: List<ReferenceResolver>
) {
    private val resolverByType = resolvers.associateBy { it.type }

    // -------- LIST OF ENTITIES --------
    @Transactional
    fun upsertLinksFor(block: BlockEntity, meta: EntityReferenceMetadata) {
        val blockId = requireNotNull(block.id)
        if (!meta.allowDuplicates) {
            val dups = meta.items.groupBy { it.type to it.id }.filterValues { it.size > 1 }
            require(dups.isEmpty()) { "Duplicate references are not allowed: ${dups.keys}" }
        }
        require(meta.items.none { it.type == EntityType.BLOCK_TREE }) {
            "ReferenceListMetadata cannot include BLOCK references (use BlockLinkMetadata)."
        }

        val existing = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        val existingByKey = existing.associateBy { Triple(it.entityType, it.entityId, it.path) }

        val desired: Map<Triple<EntityType, UUID, String>, Int> =
            meta.items.mapIndexed { idx, ref ->
                Triple(ref.type, ref.id, "${meta.path}[$idx]") to idx
            }.toMap()

        val toDelete = existing.filter { Triple(it.entityType, it.entityId, it.path) !in desired.keys }
        if (toDelete.isNotEmpty()) blockReferenceRepository.deleteAllInBatch(toDelete)

        val toSave = mutableListOf<BlockReferenceEntity>()
        desired.forEach { (triple, idx) ->
            val (etype, eid, path) = triple
            val row = existingByKey[triple]
            if (row == null) {
                toSave += BlockReferenceEntity(
                    id = null,
                    parentId = blockId,
                    entityType = etype,
                    entityId = eid,
                    path = path,
                    orderIndex = idx
                )
            } else if (row.orderIndex != idx) {
                toSave += row.copy(orderIndex = idx)
            }
        }
        if (toSave.isNotEmpty()) blockReferenceRepository.saveAll(toSave)
    }

    fun findListReferences(blockId: UUID, meta: EntityReferenceMetadata, organisationId: UUID): List<Reference> {
        val rows = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        val byPath = rows.associateBy { it.path }
        val base = meta.items.mapIndexed { idx, item ->
            val path = "${meta.path}[$idx]"
            val row = byPath[path]
            if (row == null) Reference(
                id = null, entityType = item.type, entityId = item.id,
                entity = null, orderIndex = idx, warning = BlockReferenceWarning.MISSING
            ) else Reference(
                id = row.id, entityType = row.entityType, entityId = row.entityId,
                entity = null, orderIndex = row.orderIndex ?: idx, warning = BlockReferenceWarning.REQUIRES_LOADING
            )
        }

        if (meta.fetchPolicy == BlockReferenceFetchPolicy.LAZY) return base

        val byType = base.filter { it.id != null }.groupBy { it.entityType }
        val resolvedByType = byType.mapNotNull { (t, refs) ->
            val resolver = resolverByType[t] ?: return@mapNotNull null
            t to resolver.fetch(refs.map { it.entityId }.toSet(), organisationId)
        }.toMap()

        return base.map { r ->
            if (r.id == null) r
            else {
                val bucket =
                    resolvedByType[r.entityType] ?: return@map r.copy(warning = BlockReferenceWarning.UNSUPPORTED)
                val ent = bucket[r.entityId] ?: return@map r.copy(warning = BlockReferenceWarning.MISSING)
                Reference(
                    id = r.id,
                    entityType = r.entityType,
                    entityId = r.entityId,
                    entity = ent,
                    orderIndex = r.orderIndex,
                    warning = null
                )
            }
        }
    }

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
        references.forEach { (blockId, references) ->
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

    // -------- SINGLE BLOCK LINK --------
    @Transactional
    fun upsertBlockLinkFor(block: BlockEntity, meta: BlockReferenceMetadata) {
        val blockId = requireNotNull(block.id)
        require(meta.item.type == EntityType.BLOCK_TREE) { "BlockLinkMetadata.target must be type BLOCK_TREE" }

        val existing = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        require(existing.size <= 1) {
            "Multiple rows found at single-link path '${meta.path}'. Data needs normalization."
        }

        val row = existing.firstOrNull()
        if (row == null) {
            blockReferenceRepository.save(
                BlockReferenceEntity(
                    id = null,
                    parentId = blockId,
                    entityType = EntityType.BLOCK_TREE,
                    entityId = meta.item.id,
                    path = meta.path,          // e.g. "$.block"
                    orderIndex = null
                )
            )
        } else if (row.entityId != meta.item.id) {
            blockReferenceRepository.save(row.copy(entityId = meta.item.id))
        }
    }

    /**
     * Returns the reference to a block tree.
     * Will always return a reference skeleton, and the associated row. But wont build the tree
     */
    fun findBlockLink(blockId: UUID, meta: BlockReferenceMetadata): Pair<Reference, BlockReferenceEntity?> {
        val rows = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, meta.path)
        rows.firstOrNull().run {
            if (this == null) {
                return Reference(
                    id = null,
                    entityType = EntityType.BLOCK_TREE,
                    entityId = meta.item.id,
                    entity = null,
                    warning = BlockReferenceWarning.MISSING
                ) to this
            }

            return Reference(
                id = this.id,
                entityType = this.entityType,
                entityId = this.entityId,
                entity = null,
                warning = BlockReferenceWarning.REQUIRES_LOADING,
            ) to this
        }
    }
}
