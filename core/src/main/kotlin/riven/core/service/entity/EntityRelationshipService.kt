package riven.core.service.entity

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.entity.EntityPropertyType
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
     * Extracts relationship field IDs and their target entity IDs from an entity's payload.
     */
    private fun extractRelationshipsFromPayload(payload: Map<String, Any>): Map<UUID, List<UUID>> {
        return payload.mapNotNull { (key, value) ->
            @Suppress("UNCHECKED_CAST")
            val payloadMap = value as? Map<String, Any?> ?: return@mapNotNull null
            val type = (payloadMap["type"] as? String)?.let {
                runCatching { EntityPropertyType.valueOf(it) }.getOrNull()
            } ?: return@mapNotNull null

            if (type != EntityPropertyType.RELATIONSHIP) return@mapNotNull null

            val fieldId = runCatching { UUID.fromString(key) }.getOrNull() ?: return@mapNotNull null

            @Suppress("UNCHECKED_CAST")
            val relations = (payloadMap["relations"] as? List<String>)?.mapNotNull { rel ->
                runCatching { UUID.fromString(rel) }.getOrNull()
            } ?: emptyList()

            fieldId to relations
        }.toMap()
    }

    /**
     * Saves relationships between entities based on the provided payload.
     * Handles both creating new relationships and updating existing ones.
     * Also manages bidirectional relationships by creating inverse records.
     *
     * @param type The entity type containing relationship definitions
     * @param prev The previous entity state (null for new entities)
     * @param curr The current/new entity state
     * @return Map of field IDs to EntityLinks for hydrating the response
     */
    @Transactional
    fun saveRelationships(
        type: EntityTypeEntity,
        prev: EntityEntity?,
        curr: EntityEntity
    ): Map<UUID, List<EntityLink>> {
        val entityId = requireNotNull(curr.id) { "Entity ID cannot be null" }
        val organisationId = curr.organisationId

        // Extract current relationships from payload
        val currentRelationships = extractRelationshipsFromPayload(curr.payload)
        if (currentRelationships.isEmpty() && prev == null) {
            return emptyMap()
        }

        // Extract previous relationships for diffing
        val previousRelationships = prev?.let { extractRelationshipsFromPayload(it.payload) } ?: emptyMap()

        // Get relationship definitions from the entity type
        val relationshipDefinitions = type.relationships?.associateBy { it.id } ?: emptyMap()

        // Collect all target entity IDs for batch fetching (from BOTH current AND previous for deletions)
        val currentTargetIds = currentRelationships.values.flatten().toSet()
        val previousTargetIds = previousRelationships.values.flatten().toSet()
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

        for ((fieldId, targetIds) in currentRelationships) {
            val definition = relationshipDefinitions[fieldId] ?: continue
            val prevTargetIds = previousRelationships[fieldId]?.toSet() ?: emptySet()
            val currTargetIds = targetIds.toSet()

            // Calculate additions and removals
            val toAdd = currTargetIds - prevTargetIds
            val toRemove = prevTargetIds - currTargetIds

            // Remove old relationships
            if (toRemove.isNotEmpty()) {
                entityRelationshipRepository.deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                    sourceId = entityId,
                    fieldId = fieldId,
                    targetIds = toRemove
                )

                // Remove inverse relationships if bidirectional
                if (definition.bidirectional) {
                    removeInverseRelationships(
                        definition = definition,
                        sourceEntityId = entityId,
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
                        sourceId = entityId,
                        targetId = targetId,
                        fieldId = fieldId
                    )
                }

                entityRelationshipRepository.saveAll(newRelationships)

                // Create inverse relationships if bidirectional
                if (definition.bidirectional) {
                    createInverseRelationships(
                        definition = definition,
                        sourceEntity = curr,
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
        val removedFields = previousRelationships.keys - currentRelationships.keys
        for (fieldId in removedFields) {
            val definition = relationshipDefinitions[fieldId] ?: continue
            val prevTargetIds = previousRelationships[fieldId]?.toSet() ?: continue

            entityRelationshipRepository.deleteAllBySourceIdAndFieldId(entityId, fieldId)

            if (definition.bidirectional && prevTargetIds.isNotEmpty()) {
                removeInverseRelationships(
                    definition = definition,
                    sourceEntityId = entityId,
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
        sourceEntity: EntityEntity,
        targetEntityIds: Set<UUID>,
        targetEntities: Map<UUID?, EntityEntity>,
        targetEntityTypes: Map<UUID?, EntityTypeEntity>,
        organisationId: UUID
    ) {
        val sourceEntityId = requireNotNull(sourceEntity.id) { "Source entity ID cannot be null" }

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
        val payload = entity.payload[identifierKey] as? Map<*, *>
        return payload?.get("value")?.toString() ?: entity.id.toString()
    }

    fun findRelatedEntities(entityId: UUID): Map<UUID, EntityLink> {
        return entityRelationshipRepository.findBySourceId(entityId).run {
            val targetIds = this.map { it.targetId }.toSet()
            entityRepository.findByIdIn(targetIds).associate { targetEntity ->
                val id = requireNotNull(targetEntity.id) { "Entity ID cannot be null" }
                id to EntityLink(
                    id = id,
                    organisationId = targetEntity.organisationId,
                    icon = Icon(
                        icon = targetEntity.iconType,
                        colour = targetEntity.iconColour
                    ),
                    label = extractIdentifierLabel(targetEntity)
                )
            }
        }
    }

    fun findRelatedEntities(entityIds: Set<UUID>): Map<UUID, Map<UUID, EntityLink>> {
        val relationships = entityRelationshipRepository.findBySourceIdIn(entityIds)
        val allTargetIds = relationships.map { it.targetId }.toSet()
        val targetEntities = entityRepository.findByIdIn(allTargetIds).associateBy { it.id }

        return relationships.groupBy { it.sourceId }.mapValues { (_, rels) ->
            rels.mapNotNull { rel ->
                val targetEntity = targetEntities[rel.targetId] ?: return@mapNotNull null
                val id = requireNotNull(targetEntity.id) { "Entity ID cannot be null" }
                id to EntityLink(
                    id = id,
                    organisationId = targetEntity.organisationId,
                    icon = Icon(
                        icon = targetEntity.iconType,
                        colour = targetEntity.iconColour
                    ),
                    label = extractIdentifierLabel(targetEntity)
                )
            }.toMap()
        }
    }
}