package riven.core.service.workflow

import org.springframework.stereotype.Service
import riven.core.models.entity.Entity
import riven.core.models.entity.EntityType
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
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
    private val entityTypeRepository: EntityTypeRepository
) {

    /**
     * Builds expression context from entity data.
     *
     * Converts entity payload (UUID-keyed) to Map<String, Any?> (String-keyed) using schema labels.
     * Primitive values are extracted; relationship fields return null (handled by buildContextWithRelationships).
     *
     * @param entityId ID of entity to convert
     * @param workspaceId Workspace ID for authorization
     * @return Expression-compatible context map with string keys (field labels) and primitive values
     * @throws IllegalArgumentException if entity not found, entity type not found, or schema label missing
     */
    fun buildContext(entityId: UUID, workspaceId: UUID): Map<String, Any?> {
        // Fetch entity
        val entityEntity = entityRepository.findById(entityId)
            .orElseThrow { IllegalArgumentException("Entity not found: $entityId") }

        // Fetch entity type
        val entityTypeEntity = entityTypeRepository.findById(entityEntity.typeId)
            .orElseThrow { IllegalArgumentException("Entity type not found: ${entityEntity.typeId}") }

        // Convert to domain models
        val entity = entityEntity.toModel(audit = false, relationships = emptyMap())
        val entityType = entityTypeEntity.toModel()

        // Build context from payload
        return buildContextFromEntity(entity, entityType)
    }

    /**
     * Builds context map from entity and entity type.
     *
     * Iterates entity payload, looks up schema labels for UUID keys, and extracts primitive values.
     *
     * @param entity Entity domain model
     * @param entityType EntityType domain model with schema
     * @return Context map with string keys (labels) and values
     */
    private fun buildContextFromEntity(entity: Entity, entityType: EntityType): Map<String, Any?> {
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
            val value = extractValue(attribute.payload)

            // Add to context
            context[label] = value
        }

        return context
    }

    /**
     * Extracts value from entity attribute payload.
     *
     * For primitive payloads, returns the JsonValue (Any?).
     * For relationship payloads, returns null (relationships handled in Task 2).
     *
     * @param payload EntityAttributePayload (primitive or relationship)
     * @return Extracted primitive value or null for relationships
     */
    private fun extractValue(payload: riven.core.models.entity.payload.EntityAttributePayload): Any? {
        return when (payload) {
            is EntityAttributePrimitivePayload -> payload.value
            else -> null // Relationship payloads return null for now (Task 2 adds traversal)
        }
    }
}
