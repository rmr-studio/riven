package riven.core.service.entity

import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.entity.Entity
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.repository.entity.EntityRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityTypeService
import riven.core.util.ServiceUtil.findManyResults
import riven.core.util.ServiceUtil.findOrThrow
import java.time.ZonedDateTime
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

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getEntitiesByTypeId(
        organisationId: UUID,
        typeId: UUID
    ): List<Entity> {
        return findManyResults {
            entityRepository.findByTypeId(typeId)
        }.map { it.toModel() }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getEntitiesByTypeIds(
        organisationId: UUID,
        typeIds: List<UUID>
    ): Map<UUID, List<Entity>> {
        return findManyResults {
            entityRepository.findByTypeIdIn(
                typeIds = typeIds
            )
        }.map { it.toModel() }.groupBy { it.typeId }

    }

    /**
     * Create a new entity with validation.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun saveEntity(
        organisationId: UUID,
        request: SaveEntityRequest
    ): Entity {
        val userId = authTokenService.getUserId()
        val (type, payload, icon) = request
        val entityType = entityTypeService.getByKey(type, organisationId)
        val typeId = requireNotNull(entityType.id) { "Entity type ID cannot be null" }

        val entity = EntityEntity(
            organisationId = organisationId,
            typeId = typeId,
            identifierKey = entityType.identifierKey,
            payload = payload,
        )

        icon?.let {
            entity.apply {
                this.iconType = it.icon
                this.iconColour = it.colour
            }
        }

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
                    "category" to entityType.type.name
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

        val existing = findOrThrow { entityRepository.findById(id) }.apply {
            archived = true
            deletedAt = ZonedDateTime.now()
        }.run {
            entityRepository.save(this)
        }

        activityService.logActivity(
            activity = Activity.ENTITY,
            operation = OperationType.DELETE,
            userId = userId,
            organisationId = existing.organisationId,
            entityId = id,
            entityType = ApplicationEntityType.ENTITY,
            details = mapOf(
                "typeId" to existing.typeId.toString()
            )
        )
    }


    /**
     * Get all entities for an organization.
     */
    fun getOrganisationEntities(organisationId: UUID): List<Entity> {
        return findManyResults {
            entityRepository.findByOrganisationId(organisationId)
        }.map { it.toModel() }
    }


}
