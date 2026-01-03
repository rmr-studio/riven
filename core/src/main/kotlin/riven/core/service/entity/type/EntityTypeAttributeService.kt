package riven.core.service.entity.type

import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.entity.entity.EntityUniqueValueEntity
import riven.core.enums.core.DataType
import riven.core.exceptions.SchemaValidationException
import riven.core.exceptions.UniqueConstraintViolationException
import riven.core.models.common.json.JsonValue
import riven.core.models.entity.EntityTypeSchema
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.payload.EntityAttributeRequest
import riven.core.models.request.entity.type.SaveAttributeDefinitionRequest
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityUniqueValuesRepository
import riven.core.service.entity.EntityValidationService
import java.util.*

@Service
class EntityTypeAttributeService(
    private val entityValidationService: EntityValidationService,
    private val entityRepository: EntityRepository,
    private val uniqueEntityValueRepository: EntityUniqueValuesRepository
) {

    fun saveAttributeDefinition(
        organisationId: UUID,
        type: EntityTypeEntity,
        request: SaveAttributeDefinitionRequest
    ) {
        val typeId = requireNotNull(type.id) { "Entity type ID must not be null when saving attribute definition" }
        val (_, id: UUID, attribute: EntityTypeSchema) = request

        // Validate some basic constraints on the attribute definition itself
        if (attribute.unique) {
            // Assert that the data type itself supports uniqueness (ie. STRING, NUMBER)
            if (attribute.type != DataType.STRING && attribute.type != DataType.NUMBER) {
                throw SchemaValidationException(
                    listOf("Attribute with 'unique' constraint must be of type STRING or NUMBER")
                )
            }
        }

        val updatedSchema = type.schema.copy(
            properties = type.schema.properties?.toMutableMap()?.also {
                // Upsert new attribute definition
                it[id] = attribute
            }
        )

        // Validate updated schema to determine if breaking changes could arise
        val breakingChanges = entityValidationService.detectSchemaBreakingChanges(
            type.schema,
            updatedSchema
        )

        if (breakingChanges.any { it.breaking }) {
            val existingEntities = entityRepository.findByTypeId(typeId)
            val validationSummary = entityValidationService.validateExistingEntitiesAgainstNewSchema(
                existingEntities,
                updatedSchema,
            )

            if (validationSummary.invalidCount > 0) {
                throw SchemaValidationException(
                    listOf(
                        "Cannot apply breaking schema changes: ${validationSummary.invalidCount} entities would become invalid. " +
                                "Sample errors: ${
                                    validationSummary.sampleErrors.take(3).map { it.errors.joinToString() }
                                }"
                    )
                )
            }
        }

        type.apply {
            schema = updatedSchema
        }
    }

    fun removeAttributeDefinition(
        type: EntityTypeEntity,
        attributeId: UUID
    ) {
        val updatedSchema = type.schema.copy(
            properties = type.schema.properties?.toMutableMap()?.also {
                // Remove attribute definition
                it.remove(attributeId)
            }
        )

        type.apply {
            schema = updatedSchema
        }
    }

    fun extractUniqueAttributes(
        type: EntityTypeEntity,
        payload: Map<UUID, EntityAttributeRequest>
    ): Map<UUID, EntityAttributePrimitivePayload?> {
        val uniqueProperties = type.schema.properties.let {
            if (it == null) return emptyMap<UUID, EntityAttributePrimitivePayload?>()
            it.filter { (_, schema) -> schema.unique }.keys
        }

        return payload.filter { (key, _) -> uniqueProperties.contains(key) }
            .mapValues { (_, value) ->
                when (value.payload) {
                    is EntityAttributePrimitivePayload -> value.payload
                    else -> null
                }
            }
    }

    /**
     * Check if a unique constraint would be violated.
     * Excludes the current entity from the check to allow updates.
     */
    fun checkAttributeUniqueness(
        typeId: UUID,
        fieldId: UUID,
        value: JsonValue,
        excludeEntityId: UUID? = null
    ) {
        val hasConflict = uniqueEntityValueRepository.existsConflict(
            typeId = typeId,
            fieldId = fieldId,
            fieldValue = value.toString(),
            excludeEntityId = excludeEntityId
        )
        if (hasConflict) {
            throw UniqueConstraintViolationException(
                "Unique constraint violation for attribute '$fieldId' with value '$value' on entity type '$typeId'"
            )
        }
    }

    /**
     * Save unique values for an entity.
     * Deletes existing values first, then inserts new ones.
     * Uses native SQL for both operations to completely bypass Hibernate entity tracking.
     */
    fun saveUniqueValues(
        entityId: UUID,
        typeId: UUID,
        uniqueValues: Map<UUID, String>
    ) {
        // Delete existing values using native SQL
        uniqueEntityValueRepository.deleteAllByEntityId(entityId)

        // Insert new values using native SQL
        uniqueValues.forEach { (fieldId, fieldValue) ->
            uniqueEntityValueRepository.insertUniqueValue(
                id = UUID.randomUUID(),
                typeId = typeId,
                entityId = entityId,
                fieldId = fieldId,
                fieldValue = fieldValue
            )
        }
    }

    fun archiveEntity(id: UUID): Int {
        return uniqueEntityValueRepository.archiveEntity(id)
    }

    fun archiveType(id: UUID): Int {
        return uniqueEntityValueRepository.archiveType(id)
    }
}