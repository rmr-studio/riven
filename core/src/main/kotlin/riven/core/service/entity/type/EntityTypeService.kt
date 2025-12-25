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
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.util.OperationType
import riven.core.models.common.validation.Schema
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityTypeOrderingKey
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDeleteRequest
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDiff
import riven.core.models.request.entity.type.*
import riven.core.models.response.entity.type.EntityTypeImpactResponse
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
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
    private val entityRelationshipService: EntityRelationshipService,
    private val entityAttributeService: EntityAttributeService,
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


    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun updateEntityTypeConfiguration(
        organisationId: UUID,
        type: EntityType
    ): EntityType {
        authTokenService.getUserId()
        requireNotNull(type.organisationId) { "Cannot update system entity type" }
        val existing: EntityTypeEntity = ServiceUtil.findOrThrow { entityTypeRepository.findById(type.id) }

        return existing.apply {
            displayNameSingular = type.name.singular
            displayNamePlural = type.name.plural
            description = type.description
            iconType = type.icon.icon
            iconColour = type.icon.colour
        }.let {
            entityTypeRepository.save(it).toModel()
        }
    }

    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun saveEntityTypeDefinition(
        organisationId: UUID,
        request: SaveTypeDefinitionRequest,
        impactConfirmed: Boolean = false
    ): EntityTypeImpactResponse {
        val (index: Int?, definition) = request
        val existing =
            ServiceUtil.findOrThrow { entityTypeRepository.findByOrganisationIdAndKey(organisationId, definition.key) }

        val impactedEntityTypes = mutableMapOf<String, EntityType>()

        when (definition) {
            is SaveAttributeDefinitionRequest -> {
                entityAttributeService.saveAttributeDefinition(organisationId, existing, definition).also {
                    impactedEntityTypes[existing.key] = existing.toModel()
                }
            }

            is SaveRelationshipDefinitionRequest -> {
                val (_, _, id, relationship) = definition

                // Find prev, if exists
                existing.relationships?.firstOrNull { it.id == id }.run {
                    // If new, just add new relationships
                    if (this == null) {
                        entityRelationshipService.updateRelationships(
                            organisationId,
                            diff = EntityTypeRelationshipDiff(
                                added = listOf(relationship),
                                modified = emptyList(),
                                removed = emptyList()
                            )
                        ).forEach { (key, type) -> impactedEntityTypes[key] = type.toModel() }

                        return@run
                    }

                    val diff = relationshipDiffService.calculateModification(
                        previous = this,
                        updated = relationship
                    )

                    if (!impactConfirmed) {


                        // Calculate potential impact of relationship change
                        impactAnalysisService.analyze(
                            organisationId,
                            existing,
                            diff = EntityTypeRelationshipDiff(
                                added = emptyList(),
                                modified = listOf(diff),
                                removed = emptyList()
                            )
                        ).run {
                            if (impactAnalysisService.hasNotableImpacts(this)) {
                                return EntityTypeImpactResponse(
                                    error = null,
                                    updatedEntityTypes = null,
                                    impact = this
                                )
                            }
                        }

                    }

                    // Proceed with updating relationships and modifying linked entities
                    entityRelationshipService.updateRelationships(
                        organisationId,
                        diff = EntityTypeRelationshipDiff(
                            added = emptyList(),
                            modified = listOf(diff),
                            removed = emptyList()
                        )
                    ).forEach { (key, type) ->
                        impactedEntityTypes[key] = type.toModel()
                    }
                }
            }

            else -> throw IllegalArgumentException("Unsupported definition type: ${definition::class.java}")
        }


        // Handle new order
        val currentIndex = existing.order.indexOfFirst { it.key == definition.id }
        // New attribute/relationship being added
        if (currentIndex == -1) {
            val updatedOrdering = reorderEntityTypeColumns(
                order = existing.order,
                key = EntityTypeOrderingKey(
                    key = definition.id,
                    type = when (definition) {
                        is SaveAttributeDefinitionRequest -> EntityPropertyType.ATTRIBUTE
                        is SaveRelationshipDefinitionRequest -> EntityPropertyType.RELATIONSHIP
                        else -> throw IllegalArgumentException("Unsupported definition type: ${definition::class.java}")
                    }
                ),
                prev = null,
                new = request.index ?: existing.order.size
            )

            existing.apply {
                order = updatedOrdering
            }
        } else {
            request.index?.run {
                if (this == index) return@run
                // Existing attribute/relationship being reordered
                val updatedOrdering = reorderEntityTypeColumns(
                    order = existing.order,
                    key = EntityTypeOrderingKey(
                        key = definition.id,
                        type = when (definition) {
                            is SaveAttributeDefinitionRequest -> EntityPropertyType.ATTRIBUTE
                            is SaveRelationshipDefinitionRequest -> EntityPropertyType.RELATIONSHIP
                            else -> throw IllegalArgumentException("Unsupported definition type: ${definition::class.java}")
                        }
                    ),
                    prev = index,
                    new = this
                )

                existing.apply {
                    order = updatedOrdering
                }
            }
        }

        entityTypeRepository.save(existing).also {
            // Log Activity
            impactedEntityTypes[existing.key] = it.toModel()
            return EntityTypeImpactResponse(
                impact = null,
                updatedEntityTypes = impactedEntityTypes,
                error = null
            )
        }
    }

    fun removeEntityTypeDefinition(
        organisationId: UUID,
        request: DeleteTypeDefinitionRequest,
        impactConfirmed: Boolean = false
    ): EntityTypeImpactResponse {
        val (definition) = request
        val existing =
            ServiceUtil.findOrThrow { entityTypeRepository.findByOrganisationIdAndKey(organisationId, definition.key) }

        val impactedEntityTypes = mutableMapOf<String, EntityType>()

        when (definition) {
            is DeleteAttributeDefinitionRequest -> {
                entityAttributeService.removeAttributeDefinition(existing, definition.id)
            }

            is DeleteRelationshipDefinitionRequest -> {
                existing.relationships?.firstOrNull { it.id == definition.id }?.run {

                    if (!impactConfirmed) {
                        // Calculate potential impact of relationship removal
                        impactAnalysisService.analyze(
                            organisationId,
                            existing,
                            diff = EntityTypeRelationshipDiff(
                                added = emptyList(),
                                modified = emptyList(),
                                removed = listOf(
                                    EntityTypeRelationshipDeleteRequest(
                                        relationship = this,
                                        action = definition.deleteAction,
                                        type = existing
                                    )
                                )
                            )
                        ).run {
                            if (impactAnalysisService.hasNotableImpacts(this)) {
                                return EntityTypeImpactResponse(
                                    error = null,
                                    updatedEntityTypes = null,
                                    impact = this
                                )
                            }
                        }
                    }

                    // Proceed with removing relationships and modifying linked entities
                    entityRelationshipService.removeRelationships(
                        organisationId,
                        listOf(
                            EntityTypeRelationshipDeleteRequest(
                                relationship = this,
                                action = definition.deleteAction,
                                type = existing
                            )
                        )
                    ).forEach { (key, type) ->
                        impactedEntityTypes[key] = type.toModel()
                    }
                }
            }

            else -> throw IllegalArgumentException("Unsupported definition type: ${definition::class.java}")

        }

        // Remove from entity type ordering
        existing.apply {
            order = order.filterNot { it.key == definition.id }
        }.let {
            entityTypeRepository.save(it).also {
                impactedEntityTypes[existing.key] = it.toModel()
                return EntityTypeImpactResponse(
                    impact = null,
                    updatedEntityTypes = impactedEntityTypes,
                    error = null
                )
            }
        }
    }

    /**
     * Reorder entity type columns (attributes/relationships).
     */
    fun reorderEntityTypeColumns(
        order: List<EntityTypeOrderingKey>,
        key: EntityTypeOrderingKey,
        prev: Int?,
        new: Int
    ): List<EntityTypeOrderingKey> {
        val mutableOrder = order.toMutableList()

        if (prev != null) {
            // Key already exists, remove it from its current position
            mutableOrder.removeAt(prev)
        }

        // Insert the key at the new position, coercing to valid bounds
        val insertIndex = new.coerceIn(0, mutableOrder.size)
        mutableOrder.add(insertIndex, key)

        return mutableOrder
    }


    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun deleteEntityType(
        organisationId: UUID,
        key: String,
        impactConfirmed: Boolean = false
    ): EntityTypeImpactResponse {
        val userId = authTokenService.getUserId()
        val existing = ServiceUtil.findOrThrow { entityTypeRepository.findByOrganisationIdAndKey(organisationId, key) }
        requireNotNull(existing.organisationId) { "Cannot delete system entity type" }

        existing.relationships?.let {


            if (!impactConfirmed) {
                val impact = impactAnalysisService.analyze(
                    organisationId,
                    existing,
                    diff = EntityTypeRelationshipDiff(
                        added = emptyList(),
                        modified = emptyList(),
                        removed = it.map { relationship ->
                            EntityTypeRelationshipDeleteRequest(
                                relationship = relationship,
                                action = if (relationship.relationshipType == EntityTypeRelationshipType.ORIGIN)
                                    DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP
                                else DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_ENTITY_TYPE,
                                type = existing
                            )
                        }
                    )
                )

                if (impactAnalysisService.hasNotableImpacts(impact)) {
                    return EntityTypeImpactResponse(
                        impact = impact,
                        updatedEntityTypes = null,
                        error = null
                    )
                }
            }
        }

        val affectedEntityTypes: Map<String, EntityType>? = existing.relationships?.let {
            entityRelationshipService.removeRelationships(organisationId, it.map { relationship ->
                EntityTypeRelationshipDeleteRequest(
                    relationship = relationship,
                    action = if (relationship.relationshipType == EntityTypeRelationshipType.ORIGIN)
                        DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP
                    else DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_ENTITY_TYPE,
                    type = existing
                )
            })
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

            return EntityTypeImpactResponse(
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