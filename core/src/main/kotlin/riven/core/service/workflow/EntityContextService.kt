package riven.core.service.workflow

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.models.entity.Entity
import riven.core.models.entity.EntityType
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.payload.EntityAttributeRelationPayload
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.entity.EntityRelationshipService
import java.util.*

/**
 * Service for converting entity data to expression-compatible context maps.
 *
 * Transforms UUID-keyed entity payloads into String-keyed maps using entity type schema labels,
 * enabling human-readable expressions like `status = 'active'` instead of UUID-based keys.
 */
@Service
class EntityContextService(
    private val entityRepository: EntityRepository,
    private val entityTypeRepository: EntityTypeRepository,
    private val entityRelationshipService: EntityRelationshipService
) {
    companion object {
        private val logger = LoggerFactory.getLogger(EntityContextService::class.java)
    }

    /**
     * Builds expression context from entity data without relationship traversal.
     *
     * Converts entity payload (UUID-keyed) to Map<String, Any?> (String-keyed) using schema labels.
     * Primitive values are extracted; relationship fields return null.
     *
     * @param entityId ID of entity to convert
     * @param workspaceId Workspace ID for authorization
     * @return Expression-compatible context map with string keys (field labels) and primitive values
     * @throws IllegalArgumentException if entity not found, entity type not found, or schema label missing
     */
    fun buildContext(entityId: UUID, workspaceId: UUID): Map<String, Any?> {
        return buildContextWithRelationships(entityId, workspaceId, maxDepth = 0)
    }

    /**
     * Builds expression context from entity data with recursive relationship traversal.
     *
     * Converts entity payload to Map<String, Any?> with schema labels, and recursively resolves
     * relationships up to maxDepth. Prevents infinite cycles through depth limiting.
     *
     * @param entityId ID of entity to convert
     * @param workspaceId Workspace ID for authorization
     * @param maxDepth Maximum recursion depth for relationship traversal (default 3)
     * @return Expression-compatible context map with nested relationship objects/lists
     * @throws IllegalArgumentException if entity not found, entity type not found, or schema label missing
     */
    fun buildContextWithRelationships(
        entityId: UUID,
        workspaceId: UUID,
        maxDepth: Int = 3
    ): Map<String, Any?> {
        return buildContextInternal(entityId, workspaceId, currentDepth = 0, maxDepth = maxDepth)
    }

    /**
     * Internal recursive implementation of context building with depth tracking.
     *
     * @param entityId ID of entity to convert
     * @param workspaceId Workspace ID for authorization
     * @param currentDepth Current recursion depth
     * @param maxDepth Maximum allowed recursion depth
     * @return Context map with primitive and relationship values
     */
    private fun buildContextInternal(
        entityId: UUID,
        workspaceId: UUID,
        currentDepth: Int,
        maxDepth: Int
    ): Map<String, Any?> {
        // Fetch entity
        val entityEntity = entityRepository.findById(entityId)
            .orElseThrow { IllegalArgumentException("Entity not found: $entityId") }

        // Fetch entity type
        val entityTypeEntity = entityTypeRepository.findById(entityEntity.typeId)
            .orElseThrow { IllegalArgumentException("Entity type not found: ${entityEntity.typeId}") }

        // Fetch relationships
        val relationships = if (currentDepth < maxDepth) {
            entityRelationshipService.findRelatedEntities(entityId, workspaceId)
        } else {
            emptyMap()
        }

        // Convert to domain models
        val entity = entityEntity.toModel(audit = false, relationships = relationships)
        val entityType = entityTypeEntity.toModel()

        // Build context from payload
        return buildContextFromEntity(entity, entityType, workspaceId, currentDepth, maxDepth)
    }

    /**
     * Builds context map from entity and entity type with relationship traversal.
     *
     * Iterates entity payload, looks up schema labels for UUID keys, and extracts values.
     * For relationships, recursively builds nested contexts based on cardinality.
     *
     * @param entity Entity domain model with relationships
     * @param entityType EntityType domain model with schema and relationship definitions
     * @param workspaceId Workspace ID for authorization
     * @param currentDepth Current recursion depth
     * @param maxDepth Maximum allowed recursion depth
     * @return Context map with string keys (labels) and values
     */
    private fun buildContextFromEntity(
        entity: Entity,
        entityType: EntityType,
        workspaceId: UUID,
        currentDepth: Int,
        maxDepth: Int
    ): Map<String, Any?> {
        val context = mutableMapOf<String, Any?>()

        // Iterate entity payload (Map<UUID, EntityAttribute>)
        entity.payload.forEach { (uuid, attribute) ->
            // Lookup schema field for this UUID
            val schemaField = entityType.schema.properties?.get(uuid)
                ?: throw IllegalArgumentException("Schema field not found for UUID: $uuid in entity type ${entityType.key}")

            // Get human-readable label
            val label = schemaField.label
                ?: throw IllegalArgumentException("Schema label missing for UUID: $uuid in entity type ${entityType.key}")

            // Extract value based on payload type
            val value = extractValue(
                payload = attribute.payload,
                fieldUuid = uuid,
                entityType = entityType,
                workspaceId = workspaceId,
                currentDepth = currentDepth,
                maxDepth = maxDepth
            )

            // Add to context
            context[label] = value
        }

        return context
    }

    /**
     * Extracts value from entity attribute payload with relationship traversal.
     *
     * For primitive payloads, returns the JsonValue (Any?).
     * For relationship payloads, recursively builds contexts for related entities.
     *
     * @param payload EntityAttributePayload (primitive or relationship)
     * @param fieldUuid UUID key of this field in entity payload
     * @param entityType EntityType containing relationship definitions
     * @param workspaceId Workspace ID for authorization
     * @param currentDepth Current recursion depth
     * @param maxDepth Maximum allowed recursion depth
     * @return Extracted value (primitive, nested map, or list of maps)
     */
    private fun extractValue(
        payload: riven.core.models.entity.payload.EntityAttributePayload,
        fieldUuid: UUID,
        entityType: EntityType,
        workspaceId: UUID,
        currentDepth: Int,
        maxDepth: Int
    ): Any? {
        return when (payload) {
            is EntityAttributePrimitivePayload -> payload.value

            is EntityAttributeRelationPayload -> {
                // Check if depth exceeded
                if (currentDepth >= maxDepth) {
                    // Return entity IDs as strings for debugging
                    return payload.relations.map { "entity:${it.id}" }
                }

                // Find relationship definition for this field
                val relationshipDefinition = entityType.relationships?.find { it.id == fieldUuid }

                if (relationshipDefinition == null) {
                    logger.warn("Relationship definition not found for field $fieldUuid in entity type ${entityType.key}")
                    return null
                }

                // Build nested contexts for related entities
                val nestedContexts = payload.relations.mapNotNull { entityLink ->
                    try {
                        buildContextInternal(
                            entityId = entityLink.id,
                            workspaceId = workspaceId,
                            currentDepth = currentDepth + 1,
                            maxDepth = maxDepth
                        )
                    } catch (e: IllegalArgumentException) {
                        // Related entity not found (stale relationship)
                        logger.warn("Related entity not found: ${entityLink.id} for field $fieldUuid - ${e.message}")
                        null
                    }
                }

                // Return based on cardinality
                when (relationshipDefinition.cardinality) {
                    EntityRelationshipCardinality.ONE_TO_ONE,
                    EntityRelationshipCardinality.MANY_TO_ONE -> {
                        // Return single nested map (or null if empty)
                        nestedContexts.firstOrNull()
                    }

                    EntityRelationshipCardinality.ONE_TO_MANY,
                    EntityRelationshipCardinality.MANY_TO_MANY -> {
                        // Return list of nested maps
                        nestedContexts
                    }
                }
            }

            // EntityAttributeRelationPayloadReference should not appear in domain models
            // but handle it gracefully by returning null
            else -> null
        }
    }
}
