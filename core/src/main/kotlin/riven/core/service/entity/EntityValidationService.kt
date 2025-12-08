package riven.core.service.entity

import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.block.structure.BlockValidationScope
import riven.core.enums.core.DataType
import riven.core.models.block.metadata.BlockContentMetadata
import riven.core.models.block.validation.BlockSchema
import riven.core.models.entity.RelationshipDefinition
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.service.schema.SchemaService

/**
 * Service for validating entities and detecting breaking schema changes.
 */
@Service
class EntityValidationService(
    private val schemaService: SchemaService,
    private val entityRelationshipRepository: EntityRelationshipRepository
) {

    /**
     * Validate entity payload against its type schema.
     */
    fun validateEntity(
        entity: EntityEntity,
        entityType: EntityTypeEntity
    ): List<String> {
        // Convert Map<String, Any> payload to BlockContentMetadata format
        val metadata = BlockContentMetadata(
            data = entity.payload,
            meta = BlockContentMetadata.Meta()
        )

        return schemaService.validate(
            schema = entityType.schema,
            payload = metadata,
            scope = entityType.strictness
        )
    }

    /**
     * Validate relationship entity constraints.
     * Ensures RELATIONSHIP entities have all required relationships with correct types.
     */
    fun validateRelationshipEntity(
        entityId: java.util.UUID,
        relationshipConfig: riven.core.models.entity.EntityRelationshipConfig
    ): List<String> {
        val errors = mutableListOf<String>()
        val relationships = entityRelationshipRepository.findByRelationshipEntityId(entityId)

        // Validate each defined relationship
        relationshipConfig.relationships.forEach { definition ->
            val matchingRels = relationships.filter { rel ->
                rel.relationshipType == definition.role
            }

            // Check required relationships are present
            if (definition.required && matchingRels.isEmpty()) {
                errors.add(
                    "Relationship entity missing required '${definition.role}' relationship"
                )
            }

            // Validate entity type matches requirement (for both required and optional)
            matchingRels.forEach { rel ->
                if (!definition.allowPolymorphic && definition.entityTypeKeys != null) {
                    val targetType = rel.targetEntity.type.key
                    if (targetType !in definition.entityTypeKeys) {
                        errors.add(
                            "Relationship '${definition.role}' requires entity type to be one of " +
                                    "${definition.entityTypeKeys}, but found '$targetType'"
                        )
                    }
                }
            }
        }

        return errors
    }

    /**
     * Detect breaking changes between two schemas.
     * Returns a list of changes with breaking flag.
     */
    fun detectSchemaBreakingChanges(
        oldSchema: BlockSchema,
        newSchema: BlockSchema
    ): List<SchemaChange> {
        val changes = mutableListOf<SchemaChange>()

        // Detect removed fields (breaking if required)
        oldSchema.properties?.forEach { (key, oldField) ->
            if (newSchema.properties?.get(key) == null) {
                changes.add(
                    SchemaChange(
                        type = ChangeType.FIELD_REMOVED,
                        path = key,
                        description = "Field '$key' removed",
                        breaking = oldField.required
                    )
                )
            }
        }

        // Detect added required fields (breaking - no default value)
        newSchema.properties?.forEach { (key, newField) ->
            if (oldSchema.properties?.get(key) == null && newField.required) {
                changes.add(
                    SchemaChange(
                        type = ChangeType.FIELD_REQUIRED_ADDED,
                        path = key,
                        description = "Required field '$key' added",
                        breaking = true
                    )
                )
            }
        }

        // Detect type changes (breaking)
        oldSchema.properties?.forEach { (key, oldField) ->
            newSchema.properties?.get(key)?.let { newField ->
                if (oldField.type != newField.type) {
                    changes.add(
                        SchemaChange(
                            type = ChangeType.FIELD_TYPE_CHANGED,
                            path = key,
                            description = "Field '$key' type changed from ${oldField.type} to ${newField.type}",
                            breaking = true
                        )
                    )
                }

                // Detect required flag changes
                if (!oldField.required && newField.required) {
                    changes.add(
                        SchemaChange(
                            type = ChangeType.FIELD_REQUIRED_ADDED,
                            path = key,
                            description = "Field '$key' changed from optional to required",
                            breaking = true
                        )
                    )
                }
            }
        }

        return changes
    }

    /**
     * Validate all existing entities against a new schema.
     * Returns count of entities that would become invalid.
     */
    fun validateExistingEntitiesAgainstNewSchema(
        entities: List<EntityEntity>,
        newSchema: BlockSchema,
        strictness: BlockValidationScope
    ): ValidationSummary {
        var validCount = 0
        var invalidCount = 0
        val sampleErrors = mutableListOf<EntityValidationError>()

        entities.forEach { entity ->
            val metadata = BlockContentMetadata(
                data = entity.payload,
                meta = BlockContentMetadata.Meta()
            )

            val errors = schemaService.validate(
                schema = newSchema,
                payload = metadata,
                scope = strictness
            )

            if (errors.isEmpty()) {
                validCount++
            } else {
                invalidCount++
                // Keep first 10 sample errors
                if (sampleErrors.size < 10) {
                    sampleErrors.add(
                        EntityValidationError(
                            entityId = entity.id!!,
                            entityName = entity.name,
                            errors = errors
                        )
                    )
                }
            }
        }

        return ValidationSummary(
            totalEntities = entities.size,
            validCount = validCount,
            invalidCount = invalidCount,
            sampleErrors = sampleErrors
        )
    }
}

/**
 * Represents a schema change between two versions.
 */
data class SchemaChange(
    val type: ChangeType,
    val path: String,
    val description: String,
    val breaking: Boolean
)

/**
 * Types of schema changes.
 */
enum class ChangeType {
    FIELD_ADDED,
    FIELD_REMOVED,
    FIELD_TYPE_CHANGED,
    FIELD_REQUIRED_ADDED,
    FIELD_OPTIONAL_REMOVED
}

/**
 * Summary of validation results for existing entities.
 */
data class ValidationSummary(
    val totalEntities: Int,
    val validCount: Int,
    val invalidCount: Int,
    val sampleErrors: List<EntityValidationError>
)

/**
 * Validation error for a specific entity.
 */
data class EntityValidationError(
    val entityId: java.util.UUID,
    val entityName: String?,
    val errors: List<String>
)
