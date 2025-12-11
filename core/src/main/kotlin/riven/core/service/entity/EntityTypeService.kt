package riven.core.service.entity

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.common.ValidationScope
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.models.entity.EntityType
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
    @PreAuthorize("@organisationSecurity.hasOrg(#entityType.organisationId)")
    fun publishEntityType(entityType: EntityTypeEntity): EntityType {
        val userId = authTokenService.getUserId()

        return entityTypeRepository.save(entityType).run {
            activityService.logActivity(
                activity = Activity.ENTITY_TYPE,
                operation = OperationType.CREATE,
                userId = userId,
                organisationId = requireNotNull(this.organisationId) { "Cannot create system entity type" },
                entityId = this.id,
                entityType = ApplicationEntityType.ENTITY_TYPE,
                details = mapOf(
                    "type" to this.key,
                    "version" to this.version,
                    "category" to this.entityCategory.name
                )
            )
            this.toModel()
        }
    }

    /**
     * Update an existing entity type (MUTABLE - updates in place).
     *
     * Unlike BlockTypeService which creates new versions, this updates the existing row.
     * Breaking changes are detected and validated against existing entities.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#id)")
    fun updateEntityType(
        id: UUID,
        updates: EntityTypeUpdateRequest
    ): EntityType {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { entityTypeRepository.findById(id) }

        // Ensure this is not a system type
        val orgId = requireNotNull(existing.organisationId) { "Cannot update system entity type" }

        // Detect breaking changes
        val breakingChanges = entityValidationService.detectSchemaBreakingChanges(
            existing.schema,
            updates.schema
        )

        if (breakingChanges.any { it.breaking } && existing.strictness == ValidationScope.STRICT) {
            val existingEntities = entityRepository.findByOrganisationIdAndTypeId(orgId, id)
            val validationSummary = entityValidationService.validateExistingEntitiesAgainstNewSchema(
                existingEntities,
                updates.schema,
                updates.strictness
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
            displayName = updates.name
            description = updates.description
            schema = updates.schema
            displayConfig = updates.displayConfig
            relationshipConfig = updates.relationships
            strictness = updates.strictness
            version = existing.version + 1  // Increment for change tracking
        }.let {
            entityTypeRepository.save(it).run {
                activityService.logActivity(
                    activity = Activity.ENTITY_TYPE,
                    operation = OperationType.UPDATE,
                    userId = userId,
                    organisationId = orgId,
                    entityId = this.id,
                    entityType = EntityTypeEnum.DYNAMIC_ENTITY_TYPE,
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
            entityType = EntityTypeEnum.DYNAMIC_ENTITY_TYPE,
            details = mapOf(
                "type" to existing.key,
                "archiveStatus" to status
            )
        )
    }

    /**
     * Get all entity types for an organization (including system types).
     */
    fun getEntityTypes(organisationId: UUID, includeSystem: Boolean = true): List<EntityType> {
        return findManyResults {
            if (includeSystem) {
                entityTypeRepository.findByOrganisationIdOrSystem(organisationId)
            } else {
                entityTypeRepository.findByOrganisationIdAndKey(
                    organisationId,
                    ""
                )  // This won't work - need to add method
                // For now, filter manually
                entityTypeRepository.findByOrganisationIdOrSystem(organisationId)
                    .filter { !it.system }
            }
        }.map { it.toModel() }
    }

    /**
     * Get entity type by key (organization-scoped or system).
     */
    fun getByKey(key: String, organisationId: UUID?): EntityTypeEntity {
        // Try organization-scoped first
        if (organisationId != null) {
            entityTypeRepository.findByOrganisationIdAndKey(organisationId, key)
                .let {
                    if (it.isPresent) {
                        return it.get()
                    }
                }
        }

        // Fall back to system type
        return findOrThrow {
            entityTypeRepository.findBySystemTrueAndKey(key)
        }
    }

    /**
     * Get entity type by ID.
     */
    fun getById(id: UUID): EntityTypeEntity {
        return findOrThrow { entityTypeRepository.findById(id) }
    }
}

