package riven.core.service.entity.type

import jakarta.transaction.Transactional
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.common.SchemaType
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.util.OperationType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.common.validation.Schema
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityTypeOrderingKey
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDiff
import riven.core.models.request.entity.CreateEntityTypeRequest
import riven.core.models.response.entity.DeleteEntityTypeResponse
import riven.core.models.response.entity.UpdateEntityTypeResponse
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.EntityValidationService
import riven.core.util.ServiceUtil
import java.util.*

/**
 * Service for managing entity types.
 *
 * Key difference from BlockTypeService: EntityTypes are MUTABLE.
 * Updates modify the existing row rather than creating new versions.
 */
@Service
class EntityTypeService(
    private val entityTypeRepository: EntityTypeRepository,
    private val entityRepository: EntityRepository,
    private val entityValidationService: EntityValidationService,
    private val entityRelationshipService: EntityRelationshipService,
    private val relationshipDiffService: EntityTypeRelationshipDiffService,
    private val impactAnalysisService: EntityTypeRelationshipImpactAnalysisService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {

    /**
     * Create and publish a new entity type.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun publishEntityType(organisationId: UUID, request: CreateEntityTypeRequest): EntityType {
        authTokenService.getUserId().let { userId ->
            val primaryId: UUID = UUID.randomUUID()

            EntityTypeEntity(
                displayNameSingular = request.name.singular,
                displayNamePlural = request.name.plural,
                key = request.key,
                organisationId = organisationId,
                identifierKey = primaryId,
                description = request.description,
                iconType = request.icon.icon,
                iconColour = request.icon.colour,
                // Protected Entity Types cannot be modified or deleted by users. This will usually occur during an automatic setup process.
                protected = false,
                type = request.type,
                schema = Schema(
                    type = DataType.OBJECT,
                    key = SchemaType.OBJECT,
                    protected = true,
                    required = true,
                    properties = mapOf(
                        primaryId to Schema(
                            type = DataType.STRING,
                            key = SchemaType.TEXT,
                            label = "Name",
                            unique = true,
                            protected = true,
                            required = true,
                        ),
                    )
                ),
                relationships = listOf(),
                order = listOf(
                    EntityTypeOrderingKey(
                        key = primaryId,
                        type = EntityPropertyType.ATTRIBUTE
                    )
                )
            ).run {
                entityTypeRepository.save(this)
            }.also {
                requireNotNull(it.id)
                activityService.logActivity(
                    activity = Activity.ENTITY_TYPE,
                    operation = OperationType.CREATE,
                    userId = userId,
                    organisationId = requireNotNull(it.organisationId) { "Cannot create system entity type" },
                    entityId = it.id,
                    entityType = ApplicationEntityType.ENTITY_TYPE,
                    details = mapOf(
                        "type" to it.key,
                        "version" to 1,
                        "category" to it.type.name
                    )
                )
            }.let {
                return it.toModel()
            }
        }
    }

    /**
     * Update an existing entity type (MUTABLE - updates in place).
     *
     * Unlike BlockTypeService which creates new versions, this updates the existing row.
     * Breaking changes are detected and validated against existing entities.
     *
     * When impactConfirmed=false: Performs impact analysis and returns impacts if any exist
     * When impactConfirmed=true: Proceeds with the update after user confirmation
     */

    // Todo. Relationship reference deletions should also be able to specify just removal of Bidirectional Link, or entire relationship linkage
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun updateEntityType(
        organisationId: UUID,
        type: EntityType,
        impactConfirmed: Boolean = false
    ): UpdateEntityTypeResponse {
        authTokenService.getUserId()
        val existing: EntityTypeEntity = ServiceUtil.findOrThrow { entityTypeRepository.findById(type.id) }

        requireNotNull(type.organisationId) { "Cannot update system entity type" }

        // Detect breaking changes in schema
        val breakingChanges = entityValidationService.detectSchemaBreakingChanges(
            existing.schema,
            type.schema
        )

        if (breakingChanges.any { it.breaking }) {
            val existingEntities = entityRepository.findByOrganisationIdAndTypeId(organisationId, type.id)
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

        // Calculate relationship changes and analyze impact
        val updatedEntityTypes: MutableMap<String, EntityTypeEntity>? = type.relationships?.let {

            val diff: EntityTypeRelationshipDiff = relationshipDiffService.calculate(
                previous = existing.relationships ?: emptyList(),
                updated = type.relationships
            )

            // User has not confirmed/been notified of impact analysis yet
            if (!impactConfirmed) {
                // Analyze the impact of these changes
                val impact = impactAnalysisService.analyze(
                    organisationId,
                    sourceEntityType = existing,
                    diff = diff
                )

                // If impact analysis is enabled (impactConfirmed=false) and there are notable impacts, return them
                if (impactAnalysisService.hasNotableImpacts(impact)) {
                    return UpdateEntityTypeResponse(
                        error = null,
                        updatedEntityTypes = null,
                        impact = impact
                    )
                }
            }

            // Proceed with updating relationships and modifying linked entities
            entityRelationshipService.updateRelationships(organisationId, diff).toMutableMap()
        }

        existing.apply {
            displayNameSingular = type.name.singular
            displayNamePlural = type.name.plural
            description = type.description
            schema = type.schema
            relationships = type.relationships
            iconType = type.icon.icon
            iconColour = type.icon.colour
            order = type.order
            version += 1
        }.let {
            entityTypeRepository.save(it)
        }.also {
            val entityTypes: Map<String, EntityType> = updatedEntityTypes.let {
                if (it == null) {
                    return@let mapOf(
                        existing.key to existing.toModel()
                    )
                }

                it[existing.key] = existing
                it.mapValues { entry -> entry.value.toModel() }
            }

            return UpdateEntityTypeResponse(
                error = null,
                updatedEntityTypes = entityTypes,
                impact = null // No impacts or impacts were confirmed
            )
        }
    }


    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun deleteEntityType(
        organisationId: UUID,
        key: String,
        impactConfirmed: Boolean = false
    ): DeleteEntityTypeResponse {
        val userId = authTokenService.getUserId()
        val existing = ServiceUtil.findOrThrow { entityTypeRepository.findByOrganisationIdAndKey(organisationId, key) }
        requireNotNull(existing.organisationId) { "Cannot delete system entity type" }

        if (!impactConfirmed) {
            val impact = impactAnalysisService.analyze(
                organisationId,
                existing,
                diff = EntityTypeRelationshipDiff(
                    added = emptyList(),
                    modified = emptyList(),
                    removed = existing.relationships ?: emptyList()
                )
            )

            if (impactAnalysisService.hasNotableImpacts(impact)) {
                return DeleteEntityTypeResponse(
                    impact = impact,
                    updatedEntityTypes = null,
                    error = null
                )
            }
        }

        val affectedEntityTypes: Map<String, EntityType>? = existing.relationships?.let {
            entityRelationshipService.removeRelationships(organisationId, it)
                .mapValues { entry -> entry.value.toModel() }
        }

        entityTypeRepository.delete(existing).also {
            activityService.logActivity(
                activity = Activity.ENTITY_TYPE,
                operation = OperationType.DELETE,
                userId = userId,
                organisationId = organisationId,
                entityId = existing.id,
                entityType = ApplicationEntityType.ENTITY_TYPE,
                details = mapOf(
                    "type" to existing.key
                )
            )

            return DeleteEntityTypeResponse(
                impact = null,
                updatedEntityTypes = affectedEntityTypes,
                error = null
            )
        }
    }


    /**
     * Get all entity types for an organization (including system types).
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationEntityTypes(organisationId: UUID): List<EntityType> {
        return ServiceUtil.findManyResults {
            entityTypeRepository.findByOrganisationId(organisationId)
        }.map { it.toModel() }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getByKey(key: String, organisationId: UUID): EntityTypeEntity {
        return ServiceUtil.findOrThrow { entityTypeRepository.findByOrganisationIdAndKey(organisationId, key) }
    }

    /**
     * Get entity type by ID.
     */
    fun getById(id: UUID): EntityTypeEntity {
        return ServiceUtil.findOrThrow { entityTypeRepository.findById(id) }
    }
}