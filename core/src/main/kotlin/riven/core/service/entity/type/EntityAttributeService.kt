package riven.core.service.entity.type

import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.exceptions.SchemaValidationException
import riven.core.models.entity.EntityTypeSchema
import riven.core.models.request.entity.type.SaveAttributeDefinitionRequest
import riven.core.repository.entity.EntityRepository
import riven.core.service.entity.EntityValidationService
import java.util.*

@Service
class EntityAttributeService(
    private val entityValidationService: EntityValidationService,
    private val entityRepository: EntityRepository,
) {

    fun saveAttributeDefinition(
        organisationId: UUID,
        type: EntityTypeEntity,
        request: SaveAttributeDefinitionRequest
    ) {
        val typeId = requireNotNull(type.id) { "Entity type ID must not be null when saving attribute definition" }
        val (_, _, id: UUID, attribute: EntityTypeSchema) = request

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
            val existingEntities = entityRepository.findByOrganisationIdAndTypeId(organisationId, typeId)
            val validationSummary = entityValidationService.validateExistingEntitiesAgainstNewSchema(
                existingEntities,
                type.schema,
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

}