package riven.core.service.entity

import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.entity.EntityCategory
import riven.core.enums.util.OperationType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.entity.Entity
import riven.core.repository.entity.EntityRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.util.ServiceUtil.findManyResults
import riven.core.util.ServiceUtil.findOrThrow
import java.util.*

/**
 * Service for managing entity instances.
 */
@Service
class EntityService(
    private val entityRepository: EntityRepository,
    private val entityTypeService: EntityTypeService,
    private val entityValidationService: EntityValidationService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {

    fun getEntity(id: UUID): EntityEntity {
        return findOrThrow { entityRepository.findById(id) }
    }

    fun getEntitiesByIds(ids: Set<UUID>): List<EntityEntity> {
        return findManyResults { entityRepository.findAllById(ids) }
    }

    /**
     * Create a new entity with validation.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun createEntity(
        organisationId: UUID,
        typeKey: String,
        name: String?,
        payload: Map<String, Any>
    ): Entity {
        val userId = authTokenService.getUserId()
        val entityType = entityTypeService.getByKey(typeKey, organisationId)

        val entity = EntityEntity(
            organisationId = organisationId,
            type = entityType,
            typeVersion = entityType.version,
            name = name,
            payload = payload
        )

        // Validate payload against schema
        entityValidationService.validateEntity(entity, entityType).run {
            if (isNotEmpty()) {
                throw SchemaValidationException(this)
            }
        }

        return entityRepository.save(entity).run {
            activityService.logActivity(
                activity = Activity.ENTITY,
                operation = OperationType.CREATE,
                userId = userId,
                organisationId = organisationId,
                entityId = this.id,
                entityType = ApplicationEntityType.ENTITY,
                details = mapOf(
                    "type" to entityType.key,
                    "name" to (name ?: ""),
                    "category" to entityType.type.name
                )
            )
            this.toModel()
        }
    }

    /**
     * Update an existing entity.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#id)")
    fun updateEntity(
        id: UUID,
        name: String?,
        payload: Map<String, Any>
    ): Entity {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { entityRepository.findById(id) }

        existing.apply {
            this.name = name
            this.payload = payload
        }

        // Validate against current schema
        entityValidationService.validateEntity(existing, existing.type).run {
            if (isNotEmpty()) {
                throw SchemaValidationException(this)
            }
        }


        return entityRepository.save(existing).run {
            activityService.logActivity(
                activity = Activity.ENTITY,
                operation = OperationType.UPDATE,
                userId = userId,
                organisationId = existing.organisationId,
                entityId = this.id,
                entityType = ApplicationEntityType.ENTITY,
                details = mapOf(
                    "type" to existing.type.key,
                    "name" to (name ?: "")
                )
            )
            this.toModel()
        }
    }

    /**
     * Delete an entity.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#id)")
    fun deleteEntity(id: UUID) {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { entityRepository.findById(id) }

        entityRepository.deleteById(id)

        activityService.logActivity(
            activity = Activity.ENTITY,
            operation = OperationType.DELETE,
            userId = userId,
            organisationId = existing.organisationId,
            entityId = id,
            entityType = ApplicationEntityType.ENTITY,
            details = mapOf(
                "type" to existing.type.key,
                "name" to (existing.name ?: "")
            )
        )
    }

    /**
     * Archive or restore an entity.
     * An archival operation will move the entity to a separate archival table, and a restoration will bring it back.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#id)")
    fun archiveEntity(id: UUID, archive: Boolean): Entity {
        TODO()
    }

    /**
     * Get entity by ID.
     */
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getEntityById(id: UUID, audit: Boolean = false): Entity {
        return findOrThrow { entityRepository.findById(id) }.toModel(audit)
    }

    /**
     * Get all entities of a specific type.
     */
    fun getEntitiesByType(
        organisationId: UUID,
        typeKey: String
    ): List<Entity> {
        return findManyResults {
            entityRepository.findByOrganisationIdAndTypeKey(organisationId, typeKey)
        }.map { it.toModel() }
    }

    /**
     * Get all entities for an organization.
     */
    fun getOrganisationEntities(organisationId: UUID): List<Entity> {
        return findManyResults {
            entityRepository.findByOrganisationId(organisationId)
        }.map { it.toModel() }
    }

    /**
     * Validate relationship entity constraints.
     * Ensures RELATIONSHIP entities have all required relationships.
     */
    @Transactional
    fun validateRelationshipEntityConstraints(entityId: UUID) {
        val entity = findOrThrow { entityRepository.findById(entityId) }

        if (entity.type.type == EntityCategory.RELATIONSHIP) {
            entity.type.relationships.run {
                requireNotNull(this)
                // Relationship Entities should always have at-least 2 relationships
                assert(this.size >= 2)
                entityValidationService.validateRelationshipEntity(entityId, this).also { errors ->
                    if (errors.isNotEmpty()) {
                        throw IllegalStateException(errors.joinToString("; "))
                    }
                }
            }
        }
    }
}
