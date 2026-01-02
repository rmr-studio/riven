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
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.service.entity.type.EntityTypeService
import java.util.*

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
     * @param curr
     * @return Map of field IDs to EntityLinks for hydrating the response
     */
    @Transactional
    fun saveRelationships(
        id: UUID,
        organisationId: UUID,
        type: EntityTypeEntity,
        curr: Map<UUID, List<UUID>>,
    ): Map<UUID, List<EntityLink>> {


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

                // Remove inverse relationships if bidirectional
                if (definition.bidirectional) {
                    removeInverseRelationships(
                        definition = definition,
                        sourceEntityId = id,
                        targetEntityIds = toRemove,
                        targetEntities = targetEntities,
                        targetEntityTypes = targetEntityTypes
                    )
                }
            }

            // Create new relationships
            if (toAdd.isNotEmpty()) {
                val newRelationships = toAdd.mapNotNull { targetId ->
                    // Validate target entity exists
                    if (!targetEntities.containsKey(targetId)) return@mapNotNull null

                    EntityRelationshipEntity(
                        organisationId = organisationId,
                        sourceId = id,
                        targetId = targetId,
                        fieldId = fieldId
                    )
                }

                entityRelationshipRepository.saveAll(newRelationships)

                // Create inverse relationships if bidirectional
                if (definition.bidirectional) {
                    createInverseRelationships(
                        definition = definition,
                        sourceEntityId = id,
                        targetEntityIds = toAdd,
                        targetEntities = targetEntities,
                        targetEntityTypes = targetEntityTypes,
                        organisationId = organisationId
                    )
                }
            }

            // Build EntityLinks for the response
            resultLinks[fieldId] = targetIds.mapNotNull { targetId ->
                val targetEntity = targetEntities[targetId] ?: return@mapNotNull null
                EntityLink(
                    id = targetId,
                    sourceEntityId = id,
                    fieldId = fieldId,
                    organisationId = targetEntity.organisationId,
                    icon = Icon(
                        icon = targetEntity.iconType,
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
                removeInverseRelationships(
                    definition = definition,
                    sourceEntityId = id,
                    targetEntityIds = prevTargetIds,
                    targetEntities = targetEntities,
                    targetEntityTypes = targetEntityTypes
                )
            }
        }

        return resultLinks
    }

    /**
     * Creates inverse relationships for bidirectional relationship definitions.
     * For each target entity, finds the corresponding REFERENCE relationship definition
     * and creates an EntityRelationshipEntity pointing back to the source.
     */
    private fun createInverseRelationships(
        definition: EntityRelationshipDefinition,
        sourceEntityId: UUID,
        targetEntityIds: Set<UUID>,
        targetEntities: Map<UUID?, EntityEntity>,
        targetEntityTypes: Map<UUID?, EntityTypeEntity>,
        organisationId: UUID
    ) {
        // Group target entities by their type
        val targetsByType = targetEntityIds.mapNotNull { targetId ->
            val entity = targetEntities[targetId] ?: return@mapNotNull null
            entity.typeId to targetId
        }.groupBy({ it.first }, { it.second })

        // For each target type, find the inverse relationship definition
        for ((targetTypeId, entityIds) in targetsByType) {
            val targetType = targetEntityTypes[targetTypeId] ?: continue

            // Find the REFERENCE relationship that points back to this ORIGIN
            val inverseDefinition = targetType.relationships?.find { rel ->
                rel.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                        rel.originRelationshipId == definition.id
            } ?: continue

            // Create inverse relationships
            val inverseRelationships = entityIds.map { targetEntityId ->
                EntityRelationshipEntity(
                    organisationId = organisationId,
                    sourceId = targetEntityId,
                    targetId = sourceEntityId,
                    fieldId = inverseDefinition.id
                )
            }

            entityRelationshipRepository.saveAll(inverseRelationships)
        }
    }

    /**
     * Removes inverse relationships when a bidirectional relationship is removed.
     */
    private fun removeInverseRelationships(
        definition: EntityRelationshipDefinition,
        sourceEntityId: UUID,
        targetEntityIds: Set<UUID>,
        targetEntities: Map<UUID?, EntityEntity>,
        targetEntityTypes: Map<UUID?, EntityTypeEntity>
    ) {
        // Group target entities by their type
        val targetsByType = targetEntityIds.mapNotNull { targetId ->
            val entity = targetEntities[targetId] ?: return@mapNotNull null
            entity.typeId to targetId
        }.groupBy({ it.first }, { it.second })

        // For each target type, find the inverse relationship definition and remove
        for ((targetTypeId, entityIds) in targetsByType) {
            val targetType = targetEntityTypes[targetTypeId] ?: continue

            // Find the REFERENCE relationship that points back to this ORIGIN
            val inverseDefinition = targetType.relationships?.find { rel ->
                rel.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                        rel.originRelationshipId == definition.id
            } ?: continue

            // Delete inverse relationships for each target entity
            for (targetEntityId in entityIds) {
                entityRelationshipRepository.deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                    sourceId = targetEntityId,
                    fieldId = inverseDefinition.id,
                    targetIds = setOf(sourceEntityId)
                )
            }
        }
    }

    /**
     * Extracts the identifier label from an entity using its identifier key.
     */
    private fun extractIdentifierLabel(entity: EntityEntity): String {
        val identifierKey = entity.identifierKey.toString()
        val payload = entity.payload[identifierKey]
        return payload?.value?.toString() ?: entity.id.toString()
    }

    fun findRelatedEntities(entityId: UUID): Map<UUID, List<EntityLink>> {
        return entityRelationshipRepository.findEntityLinksBySourceId(entityId)
            .groupBy { it.getFieldId() }
            .mapValues { (_, projections) ->
                projections.map { it.toEntityLink() }
            }
    }

    fun findRelatedEntities(entityIds: Set<UUID>): Map<UUID, Map<UUID, List<EntityLink>>> {
        return entityRelationshipRepository.findEntityLinksBySourceIdIn(entityIds)
            .groupBy { it.getSourceEntityId() }
            .mapValues { (_, projections) ->
                projections.groupBy { it.getFieldId() }
                    .mapValues { (_, fieldProjections) ->
                        fieldProjections.map { it.toEntityLink() }
                    }
            }
    }

    fun archiveEntity(id: UUID): Int {
        return entityRelationshipRepository.archiveEntity(id)
    }
}