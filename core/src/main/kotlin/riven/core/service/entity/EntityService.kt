package riven.core.service.entity

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.common.Icon
import riven.core.models.entity.Entity
import riven.core.models.entity.payload.EntityAttributeRequest
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.response.entity.SaveEntityResponse
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
        entityTypeId: UUID,
        request: SaveEntityRequest,
        impactConfirmed: Boolean = false
    ): SaveEntityResponse {
        try {
            val (id: UUID?, payload: Map<UUID, EntityAttributeRequest>, icon: Icon?) = request
            val userId = authTokenService.getUserId()
            val type: EntityTypeEntity = entityTypeService.getById(entityTypeId).also {
                requireNotNull(it.id)
            }

            val prev: EntityEntity? = id?.let { findOrThrow { entityRepository.findById(it) } }
            prev?.run {
                if (!impactConfirmed) {
                    // Determine if changes to Entity payload can cause breaking changes
                    TODO()
                }
            }

            val entity = EntityEntity(
                organisationId = organisationId,
                typeId = entityTypeId,
                iconType = icon?.icon ?: type.iconType,
                iconColour = icon?.colour ?: type.iconColour,
                identifierKey = type.identifierKey,
                payload = payload.map { it.key to it.value.payload }.toMap(),
            )

            icon?.let {
                entity.apply {
                    this.iconType = it.icon
                    this.iconColour = it.colour
                }
            }

            // Validate payload against schema
            entityValidationService.validateEntity(entity, type).run {
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
                        "type" to type.key,
                        "category" to type.displayNameSingular
                    )
                )

                SaveEntityResponse(
                    entity = entity.toModel()
                )
            }
        } catch (e: SchemaValidationException) {
            return SaveEntityResponse(
                errors = e.reasons
            )
        } catch (e: Exception) {
            throw e
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
