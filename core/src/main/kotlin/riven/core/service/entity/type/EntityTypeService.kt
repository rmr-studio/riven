package riven.core.service.entity.type

import jakarta.transaction.Transactional
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.util.OperationType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityTypeOrderingKey
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDiff
import riven.core.models.request.entity.CreateEntityTypeRequest
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
            EntityTypeEntity(
                displayNameSingular = request.name.singular,
                displayNamePlural = request.name.plural,
                key = request.key,
                organisationId = organisationId,
                identifierKey = request.identifier,
                description = request.description,
                // Protected Entity Types cannot be modified or deleted by users. This will usually occur during an automatic setup process.
                protected = false,
                type = request.type,
                schema = request.schema,
                relationships = request.relationships,
                order = request.order ?: listOf(
                    *(request.schema.properties?.keys ?: listOf()).map { key ->
                        EntityTypeOrderingKey(
                            key,
                            EntityPropertyType.ATTRIBUTE
                        )
                    }.toTypedArray(),
                    *(request.relationships ?: listOf()).map {
                        EntityTypeOrderingKey(
                            it.id,
                            EntityPropertyType.RELATIONSHIP
                        )
                    }.toTypedArray()
                ),
            ).run {
                entityTypeRepository.save(this)
            }.also {
                requireNotNull(it.id)
                request.relationships?.run {
                    entityRelationshipService.createRelationships(this, organisationId)
                }

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
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    suspend fun updateEntityType(
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
        type.relationships?.run {

            val diff: EntityTypeRelationshipDiff = relationshipDiffService.calculate(
                previous = existing.relationships ?: emptyList(),
                updated = type.relationships
            )

            // User has not confirmed/been notified of impact analysis yet
            if (!impactConfirmed) {
                // Analyze the impact of these changes
                val impact = impactAnalysisService.analyze(
                    sourceEntityType = existing,
                    diff = diff
                )

                // If impact analysis is enabled (impactConfirmed=false) and there are notable impacts, return them
                if (hasNotableImpacts(impact)) {
                    return UpdateEntityTypeResponse(
                        success = false,
                        error = null,
                        entityType = null,
                        impact = impact
                    )
                }
            }

            entityRelationshipService.updateRelationships(organisationId, diff)
        }


        // TODO: Proceed with actual update operations
        // This will be implemented in a follow-up task
        // For now, return a placeholder response indicating the update would proceed
        return UpdateEntityTypeResponse(
            success = true,
            error = null,
            entityType = existing,
            impact = null // No impacts or impacts were confirmed
        )
    }

    /**
     * Determines if the impact analysis contains notable impacts that require user confirmation.
     */
    private fun hasNotableImpacts(impact: riven.core.models.entity.relationship.analysis.EntityTypeRelationshipImpactAnalysis): Boolean {
        return impact.affectedEntityTypes.isNotEmpty() ||
                impact.dataLossWarnings.isNotEmpty()
    }

    /**
     * Archive or restore an entity type.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#id)")
    fun archiveEntityType(id: UUID, status: Boolean) {
        val userId = authTokenService.getUserId()
        val existing = ServiceUtil.findOrThrow { entityTypeRepository.findById(id) }
        val orgId = requireNotNull(existing.organisationId) { "Cannot archive system entity type" }

        if (existing.archived == status) return

        existing.archived = status
        entityTypeRepository.save(existing)

        activityService.logActivity(
            activity = Activity.ENTITY_TYPE,
            operation = if (status) OperationType.ARCHIVE else OperationType.RESTORE,
            userId = userId,
            organisationId = orgId,
            entityId = existing.id,
            entityType = ApplicationEntityType.ENTITY_TYPE,
            details = mapOf(
                "type" to existing.key,
                "archiveStatus" to status
            )
        )
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