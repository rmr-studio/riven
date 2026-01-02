package riven.core.service.entity

import org.springframework.security.access.prepost.PostAuthorize
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
import riven.core.models.entity.EntityLink
import riven.core.models.entity.payload.EntityAttributePayload
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.payload.EntityAttributeRelationPayloadReference
import riven.core.models.entity.payload.EntityAttributeRequest
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.response.entity.EntityImpactResponse
import riven.core.models.response.entity.SaveEntityResponse
import riven.core.repository.entity.EntityRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityTypeAttributeService
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
    private val entityRelationshipService: EntityRelationshipService,
    private val entityValidationService: EntityValidationService,
    private val entityAttributeService: EntityTypeAttributeService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {

    /**
     * Converts EntityAttributePayload to a JSON-compatible map structure.
     */
    private fun toJsonPayload(payload: EntityAttributePayload): Map<String, Any?> {
        return when (payload) {
            is EntityAttributePrimitivePayload -> mapOf(
                "type" to payload.type.name,
                "value" to payload.value,
                "schemaType" to payload.schemaType.name
            )

            is EntityAttributeRelationPayloadReference -> mapOf(
                "type" to payload.type.name,
                "relations" to payload.relations
            )

            else -> mapOf(
                "type" to payload.type.name
            )
        }
    }

    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getEntity(id: UUID): Entity {
        val entity = findOrThrow { entityRepository.findById(id) }
        val relationships = entityRelationshipService.findRelatedEntities(
            entityId = id
        )

        return entity.toModel(relationships = relationships)

    }

    fun getEntitiesByIds(ids: Set<UUID>): List<EntityEntity> {
        return findManyResults { entityRepository.findAllById(ids) }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getEntitiesByTypeId(
        organisationId: UUID,
        typeId: UUID
    ): List<Entity> {
        val entities = findManyResults {
            entityRepository.findByTypeId(typeId)
        }

        require(entities.all { it.organisationId == organisationId }) { "One or more entities do not belong to the specified organisation" }
        val relationships = entityRelationshipService.findRelatedEntities(
            entityIds = entities.mapNotNull { it.id }.toSet()
        )

        return entities.map {
            val id = requireNotNull(it.id)
            it.toModel(relationships = relationships[id] ?: emptyMap())
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getEntitiesByTypeIds(
        organisationId: UUID,
        typeIds: List<UUID>
    ): Map<UUID, List<Entity>> {
        val entities = findManyResults {
            entityRepository.findByTypeIdIn(
                typeIds = typeIds
            )
        }

        require(entities.all { it.organisationId == organisationId }) { "One or more entities do not belong to the specified organisation" }

        val relationships = entityRelationshipService.findRelatedEntities(
            entityIds = entities.mapNotNull { it.id }.toSet()
        )

        return entities.map {
            val id = requireNotNull(it.id)
            it.toModel(relationships = relationships[id] ?: emptyMap())
        }.groupBy { it.typeId }

    }

    /**
     * Create or update an entity with validation.
     * If request.id is provided, updates the existing entity; otherwise creates a new one.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun saveEntity(
        organisationId: UUID,
        entityTypeId: UUID,
        request: SaveEntityRequest,
    ): SaveEntityResponse {
        try {
            val (id: UUID?, payload: Map<UUID, EntityAttributeRequest>, icon: Icon?) = request
            val userId = authTokenService.getUserId()
            val type: EntityTypeEntity = entityTypeService.getById(entityTypeId)
            val typeId = requireNotNull(type.id) { "Entity type ID cannot be null" }

            // Check if this is an update (existing entity) or create (new entity)
            val prev: EntityEntity? = id?.let { findOrThrow { entityRepository.findById(it) } }


            val attributePayload: Map<String, EntityAttributePrimitivePayload> = payload.mapNotNull { (key, value) ->
                key.toString() to value.payload.let {
                    when (it) {
                        is EntityAttributePrimitivePayload -> it
                        else -> return@mapNotNull null
                    }
                }
            }.toMap()

            val relationshipPayload: Map<UUID, List<UUID>> = payload.mapNotNull { (key, value) ->
                when (val pl = value.payload) {
                    is EntityAttributeRelationPayloadReference -> {
                        key to pl.relations
                    }

                    else -> return@mapNotNull null
                }
            }.toMap()

            prev?.run {
                require(this.organisationId == organisationId) { "Entity does not belong to the specified organisation" }
                require(this.typeId == entityTypeId) { "Entity type cannot be changed" }
            }

            // Build the payload map
            payload.map { it.key.toString() to toJsonPayload(it.value.payload) }.toMap()

            // Either update the existing entity or create a new one
            val entity = prev.let {
                if (it != null) {
                    return@let it.copy(
                        iconType = icon?.icon ?: it.iconType,
                        iconColour = icon?.colour ?: it.iconColour,
                        payload = attributePayload,
                    )
                }

                EntityEntity(
                    organisationId = organisationId,
                    typeId = entityTypeId,
                    iconType = icon?.icon ?: type.iconType,
                    iconColour = icon?.colour ?: type.iconColour,
                    identifierKey = type.identifierKey,
                    payload = attributePayload,
                )
            }


            // Validate payload against schema
            entityValidationService.validateEntity(entity, type).run {
                if (isNotEmpty()) {
                    throw SchemaValidationException(this)
                }
            }

            return entityRepository.save(entity).run {
                val entityId = requireNotNull(this.id) { "Saved entity ID cannot be null" }

                // Handle Unique Constraints
                val uniqueAttributes = entityAttributeService.extractUniqueAttributes(type, payload)

                // Check uniqueness constraints. Should any fail, an exception is thrown and the transaction rolled back.
                // When updating, exclude the current entity from the conflict check.
                val uniqueValuesToSave = uniqueAttributes
                    .filterValues { it != null }
                    .mapNotNull { (fieldId, value) ->
                        if (value == null) return@mapNotNull null
                        entityAttributeService.checkAttributeUniqueness(
                            typeId = typeId,
                            fieldId = fieldId,
                            value = value.value,
                            excludeEntityId = entityId
                        )
                        fieldId to value.value.toString()
                    }
                    .toMap()

                // Use native SQL operations to avoid Hibernate session conflicts
                entityAttributeService.saveUniqueValues(entityId, typeId, uniqueValuesToSave)

                // Handle Management of Relationships. Previous payload snapshot is required for diffing (in the event where relationships have been updated)
                val relationships: Map<UUID, EntityLink> = entityRelationshipService.saveRelationships(
                    id = entityId,
                    organisationId = organisationId,
                    type = type,
                    curr = relationshipPayload
                ).flatMap { it.value }.associateBy { it.id }

                activityService.logActivity(
                    activity = Activity.ENTITY,
                    operation = if (prev != null) OperationType.UPDATE else OperationType.CREATE,
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
                    entity = entity.toModel(relationships = relationships)
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
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun deleteEntity(organisationId: UUID, id: UUID): EntityImpactResponse {
        val userId = authTokenService.getUserId()

        val existing = findOrThrow { entityRepository.findById(id) }.apply {
            archived = true
            deletedAt = ZonedDateTime.now()
        }.run {
            require(this.organisationId == organisationId) { "Entity does not belong to the specified organisation" }
            entityAttributeService.archiveEntity(id)
            entityRelationshipService.archiveEntity(id)
            entityRepository.save(this)
        }

        activityService.logActivity(
            activity = Activity.ENTITY,
            operation = OperationType.DELETE,
            userId = userId,
            organisationId = organisationId,
            entityId = id,
            entityType = ApplicationEntityType.ENTITY,
            details = mapOf(
                "typeId" to existing.typeId.toString()
            )
        )

        TODO()
    }


    /**
     * Get all entities for an organization.
     */
    fun getOrganisationEntities(organisationId: UUID): List<Entity> {
        return findManyResults {
            entityRepository.findByOrganisationId(organisationId)
        }.map { it.toModel(relationships = emptyMap()) }
    }


}
