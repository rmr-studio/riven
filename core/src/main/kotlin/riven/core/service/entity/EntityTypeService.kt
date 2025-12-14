package riven.core.service.entity

import jakarta.transaction.Transactional
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.entity.EntityType
import riven.core.models.request.entity.CreateEntityTypeRequest
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.util.ServiceUtil.findManyResults
import riven.core.util.ServiceUtil.findOrThrow
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
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {

    /**
     * Create and publish a new entity type.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    fun publishEntityType(request: CreateEntityTypeRequest): EntityType {
        authTokenService.getUserId().let { userId ->
            EntityTypeEntity(
                displayName = request.name,
                key = request.key,
                organisationId = request.organisationId,
                identifierKey = request.identifier,
                description = request.description,
                // Protected Entity Types cannot be modified or deleted by users. This will usually occur during an automatic setup process.
                protected = false,
                type = request.type,
                schema = request.schema,
                relationships = request.relationships,
                order = request.order ?: listOf(
                    *(request.schema.properties?.keys ?: listOf()).toTypedArray(),
                    *(request.relationships ?: listOf()).map { it.key }.toTypedArray()
                ),
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
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#type.organisationId)")
    fun updateEntityType(
        type: EntityType
    ): EntityType {
        val userId = authTokenService.getUserId()
        val existing: EntityTypeEntity = findOrThrow { entityTypeRepository.findById(type.id) }

        // Ensure this is not a system type
        val orgId = requireNotNull(existing.organisationId) { "Cannot update system entity type" }

        // Detect breaking changes
        val breakingChanges = entityValidationService.detectSchemaBreakingChanges(
            existing.schema,
            type.schema
        )

        if (breakingChanges.any { it.breaking }) {
            val existingEntities = entityRepository.findByOrganisationIdAndTypeId(orgId, type.id)
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

        // Update in place (NOT create new row)
        existing.apply {
            displayName.apply {
                singular = type.name.singular
                plural = type.name.plural
            }
            description = type.description
            schema = type.schema
            relationships = type.relationships
            version = existing.version + 1  // Increment for change tracking
        }.let {
            entityTypeRepository.save(it).run {
                activityService.logActivity(
                    activity = Activity.ENTITY_TYPE,
                    operation = OperationType.UPDATE,
                    userId = userId,
                    organisationId = orgId,
                    entityId = this.id,
                    entityType = ApplicationEntityType.ENTITY_TYPE,
                    details = mapOf(
                        "type" to this.key,
                        "version" to this.version,
                        "breakingChanges" to breakingChanges.filter { it.breaking }.size
                    )
                )
                return this.toModel()
            }
        }
    }

    /**
     * Archive or restore an entity type.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#id)")
    fun archiveEntityType(id: UUID, status: Boolean) {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { entityTypeRepository.findById(id) }
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
        return findManyResults {
            entityTypeRepository.findByOrganisationId(organisationId)
        }.map { it.toModel() }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getByKey(key: String, organisationId: UUID): EntityTypeEntity {
        return findOrThrow { entityTypeRepository.findByOrganisationIdAndKey(organisationId, key) }
    }

    /**
     * Get entity type by ID.
     */
    fun getById(id: UUID): EntityTypeEntity {
        return findOrThrow { entityTypeRepository.findById(id) }
    }
}

