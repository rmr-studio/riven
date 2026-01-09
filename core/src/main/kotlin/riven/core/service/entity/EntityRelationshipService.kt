package riven.core.service.entity

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.models.common.Icon
import riven.core.models.entity.EntityLink
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.projection.entity.toEntityLink
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.service.entity.type.EntityTypeService
import java.util.*

/**
 * Result of saving relationships, containing both the relationship links
 * and any entities that were impacted by inverse relationship changes.
 */
data class SaveRelationshipsResult(
    val links: Map<UUID, List<EntityLink>>,
    val impactedEntityIds: Set<UUID>
)

@Service
class EntityRelationshipService(
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val entityRepository: EntityRepository,
    private val entityTypeService: EntityTypeService
) {


    /**
     * Saves relationships between entities based on the provided payload.
     * Handles both creating new relationships and updating existing ones.
     * Also manages bidirectional relationships by creating inverse records.
     *
     * @param type The entity type containing relationship definitions
     * @param curr The current relationship payload (field ID -> list of target entity IDs)
     * @return SaveRelationshipsResult containing links and impacted entity IDs
     */
    @Transactional
    fun saveRelationships(
        id: UUID,
        workspaceId: UUID,
        type: EntityTypeEntity,
        curr: Map<UUID, List<UUID>>,
    ): SaveRelationshipsResult {
        // Track all entities impacted by inverse relationship changes
        val impactedEntityIds = mutableSetOf<UUID>()
        val sourceTypeId = requireNotNull(type.id) { "Entity type ID cannot be null when saving relationships" }


        // Extract current relationships from payload
        val prev: Map<UUID, List<UUID>> = entityRelationshipRepository.findBySourceId(id).groupBy { it.fieldId }
            .mapValues { it.value.map { rel -> rel.targetId } }

        // Get relationship definitions from the entity type
        val relationshipDefinitions = type.relationships?.associateBy { it.id } ?: emptyMap()

        // Collect all target entity IDs for batch fetching (from BOTH current AND previous for deletions)
        val currentTargetIds = curr.values.flatten().toSet()
        val previousTargetIds = prev.values.flatten().toSet()
        val allTargetIds = currentTargetIds + previousTargetIds

        // Batch fetch all target entities (need both for additions AND deletions)
        val targetEntities = if (allTargetIds.isNotEmpty()) {
            entityRepository.findAllById(allTargetIds).associateBy { it.id }
        } else {
            emptyMap()
        }

        // Batch fetch all target entity types for bidirectional handling
        val targetTypeIds = targetEntities.values.mapNotNull { it.typeId }.toSet()
        val targetEntityTypes = if (targetTypeIds.isNotEmpty()) {
            entityTypeService.getByIds(targetTypeIds).associateBy { it.id }
        } else {
            emptyMap()
        }

        // Process each relationship field
        val resultLinks = mutableMapOf<UUID, List<EntityLink>>()

        for ((fieldId, targetIds) in curr) {
            val definition = relationshipDefinitions[fieldId] ?: continue
            val prevTargetIds = prev[fieldId]?.toSet() ?: emptySet()
            val currTargetIds = targetIds.toSet()

            // Calculate additions and removals
            val toAdd = currTargetIds - prevTargetIds
            val toRemove = prevTargetIds - currTargetIds

            // Remove old relationships
            if (toRemove.isNotEmpty()) {
                entityRelationshipRepository.deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                    sourceId = id,
                    fieldId = fieldId,
                    targetIds = toRemove
                )

                // Remove inverse relationships if bidirectional, or if REFERENCE type
                if (definition.bidirectional || definition.relationshipType == EntityTypeRelationshipType.REFERENCE) {
                    val removedImpacted = removeInverseRelationships(
                        definition = definition,
                        sourceEntityId = id,
                        targetEntityIds = toRemove,
                        targetEntities = targetEntities,
                        targetEntityTypes = targetEntityTypes
                    )
                    impactedEntityIds.addAll(removedImpacted)
                }
            }

            // Create new relationships
            if (toAdd.isNotEmpty()) {
                val newRelationships = toAdd.mapNotNull { targetId ->
                    // Validate target entity exists
                    if (!targetEntities.containsKey(targetId)) return@mapNotNull null

                    EntityRelationshipEntity(
                        workspaceId = workspaceId,
                        sourceId = id,
                        targetId = targetId,
                        fieldId = fieldId,
                        sourceTypeId = sourceTypeId,
                        targetTypeId = requireNotNull(targetEntities[targetId]?.typeId) { "Target entity type ID cannot be null" }
                    )
                }

                entityRelationshipRepository.saveAll(newRelationships)

                // Create inverse relationships if bidirectional, or if REFERENCE type (ie. The byproduct of a bidirectional relationship)
                if (definition.bidirectional || definition.relationshipType == EntityTypeRelationshipType.REFERENCE) {
                    val createdImpacted = createInverseRelationships(
                        definition = definition,
                        sourceEntityId = id,
                        sourceEntityTypeId = sourceTypeId,
                        targetEntityIds = toAdd,
                        targetEntities = targetEntities,
                        targetEntityTypes = targetEntityTypes,
                        workspaceId = workspaceId
                    )
                    impactedEntityIds.addAll(createdImpacted)
                }
            }

            // Build EntityLinks for the response
            resultLinks[fieldId] = targetIds.mapNotNull { targetId ->
                val targetEntity = targetEntities[targetId] ?: return@mapNotNull null
                EntityLink(
                    id = targetId,
                    sourceEntityId = id,
                    fieldId = fieldId,
                    workspaceId = targetEntity.workspaceId,
                    key = targetEntity.typeKey,
                    icon = Icon(
                        type = targetEntity.iconType,
                        colour = targetEntity.iconColour
                    ),
                    label = extractIdentifierLabel(targetEntity)
                )
            }
        }

        // Handle removed relationship fields entirely (fields that existed before but not now)
        val removedFields = prev.keys - curr.keys
        for (fieldId in removedFields) {
            val definition = relationshipDefinitions[fieldId] ?: continue
            val prevTargetIds = prev[fieldId]?.toSet() ?: continue

            entityRelationshipRepository.deleteAllBySourceIdAndFieldId(id, fieldId)

            if (definition.bidirectional && prevTargetIds.isNotEmpty()) {
                val removedImpacted = removeInverseRelationships(
                    definition = definition,
                    sourceEntityId = id,
                    targetEntityIds = prevTargetIds,
                    targetEntities = targetEntities,
                    targetEntityTypes = targetEntityTypes
                )
                impactedEntityIds.addAll(removedImpacted)
            }
        }

        return SaveRelationshipsResult(
            links = resultLinks,
            impactedEntityIds = impactedEntityIds
        )
    }

    /**
     * Creates inverse relationships for bidirectional relationship definitions.
     * For each target entity, finds the corresponding REFERENCE relationship definition
     * and creates an EntityRelationshipEntity pointing back to the source.
     *
     * @return Set of entity IDs that had inverse relationships created (impacted entities)
     */
    private fun createInverseRelationships(
        definition: EntityRelationshipDefinition,
        sourceEntityId: UUID,
        sourceEntityTypeId: UUID,
        targetEntityIds: Set<UUID>,
        targetEntities: Map<UUID?, EntityEntity>,
        targetEntityTypes: Map<UUID?, EntityTypeEntity>,
        workspaceId: UUID
    ): Set<UUID> {
        val impactedEntityIds = mutableSetOf<UUID>()

        // Group target entities by their type
        val targetsByType = targetEntityIds.mapNotNull { targetId ->
            val entity = targetEntities[targetId] ?: return@mapNotNull null
            entity.typeId to targetId
        }.groupBy({ it.first }, { it.second })

        val inverseRelationshipEntities = mutableListOf<EntityRelationshipEntity>()

        // For each target type, find the inverse relationship definition
        for ((targetTypeId, entityIds) in targetsByType) {
            val targetType = targetEntityTypes[targetTypeId] ?: continue
            val targetTypeId =
                requireNotNull(targetType.id) { "Relationship definition ID cannot be null when creating inverse relationships" }

            // Find the inverse relationship definition
            val inverseDefinition = definition.relationshipType.let {
                if (it == EntityTypeRelationshipType.REFERENCE) {
                    return@let targetType.relationships?.find { rel ->
                        rel.relationshipType == EntityTypeRelationshipType.ORIGIN &&
                                rel.id == definition.originRelationshipId
                    }
                }
                targetType.relationships?.find { rel ->
                    rel.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                            rel.originRelationshipId == definition.id
                }
            } ?: continue


            inverseRelationshipEntities.addAll(entityIds.map { targetEntityId ->
                // Track this entity as impacted
                impactedEntityIds.add(targetEntityId)

                EntityRelationshipEntity(
                    workspaceId = workspaceId,
                    sourceId = targetEntityId,
                    targetId = sourceEntityId,
                    fieldId = inverseDefinition.id,
                    sourceTypeId = targetTypeId,
                    targetTypeId = sourceEntityTypeId
                )
            })

        }

        entityRelationshipRepository.saveAll(inverseRelationshipEntities)

        return impactedEntityIds
    }

    /**
     * Removes inverse relationships when a bidirectional relationship is removed.
     *
     * @return Set of entity IDs that had inverse relationships removed (impacted entities)
     */
    private fun removeInverseRelationships(
        definition: EntityRelationshipDefinition,
        sourceEntityId: UUID,
        targetEntityIds: Set<UUID>,
        targetEntities: Map<UUID?, EntityEntity>,
        targetEntityTypes: Map<UUID?, EntityTypeEntity>
    ): Set<UUID> {
        val impactedEntityIds = mutableSetOf<UUID>()

        // Group target entities by their type
        val targetsByType = targetEntityIds.mapNotNull { targetId ->
            val entity = targetEntities[targetId] ?: return@mapNotNull null
            entity.typeId to targetId
        }.groupBy({ it.first }, { it.second })

        // For each target type, find the inverse relationship definition and remove
        for ((targetTypeId, entityIds) in targetsByType) {
            val targetType = targetEntityTypes[targetTypeId] ?: continue

            // Find the inverse relationship definition
            // If this is a REFERENCE, find the ORIGIN on the target
            // If this is an ORIGIN (bidirectional), find the REFERENCE on the target
            val inverseDefinition = definition.relationshipType.let {
                if (it == EntityTypeRelationshipType.REFERENCE) {
                    return@let targetType.relationships?.find { rel ->
                        rel.relationshipType == EntityTypeRelationshipType.ORIGIN &&
                                rel.id == definition.originRelationshipId
                    }
                }
                targetType.relationships?.find { rel ->
                    rel.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                            rel.originRelationshipId == definition.id
                }
            } ?: continue

            // Delete inverse relationships for each target entity
            for (targetEntityId in entityIds) {
                // Track this entity as impacted
                impactedEntityIds.add(targetEntityId)

                entityRelationshipRepository.deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                    sourceId = targetEntityId,
                    fieldId = inverseDefinition.id,
                    targetIds = setOf(sourceEntityId)
                )
            }
        }

        return impactedEntityIds
    }

    /**
     * Extracts the identifier label from an entity using its identifier key.
     */
    private fun extractIdentifierLabel(entity: EntityEntity): String {
        val identifierKey = entity.identifierKey.toString()
        val payload = entity.payload[identifierKey]
        return payload?.value?.toString() ?: entity.id.toString()
    }

    fun findRelatedEntities(entityId: UUID, workspaceId: UUID): Map<UUID, List<EntityLink>> {
        return entityRelationshipRepository.findEntityLinksBySourceId(entityId, workspaceId)
            .groupBy { it.getFieldId() }
            .mapValues { (_, projections) ->
                projections.map { it.toEntityLink() }
            }
    }

    fun findRelatedEntities(entityIds: Set<UUID>, workspaceId: UUID): Map<UUID, Map<UUID, List<EntityLink>>> {
        return entityRelationshipRepository.findEntityLinksBySourceIdIn(entityIds.toTypedArray(), workspaceId)
            .groupBy { it.getSourceEntityId() }
            .mapValues { (_, projections) ->
                projections.groupBy { it.getFieldId() }
                    .mapValues { (_, fieldProjections) ->
                        fieldProjections.map { it.toEntityLink() }
                    }
            }
    }

    /**
     * Find all relationships where the given entity is the target.
     * Used to identify entities that will be impacted when a target entity is deleted.
     */
    fun findByTargetIdIn(ids: List<UUID>): Map<UUID, List<EntityRelationshipEntity>> {
        return entityRelationshipRepository.findByTargetIdIn(ids).groupBy { it.targetId }
    }

    fun archiveEntities(ids: Collection<UUID>, workspaceId: UUID): List<EntityRelationshipEntity> {
        return entityRelationshipRepository.deleteEntities(ids.toTypedArray(), workspaceId)
    }
}