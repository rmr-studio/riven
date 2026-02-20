package riven.core.service.entity.type

import jakarta.transaction.Transactional
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.util.OperationType
import riven.core.models.common.validation.Schema
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeAttributeColumn
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDeleteRequest
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDiff
import riven.core.models.request.entity.type.*
import riven.core.enums.entity.SemanticMetadataTargetType
import riven.core.models.entity.EntityTypeSemanticMetadata
import riven.core.models.response.entity.type.EntityTypeImpactResponse
import riven.core.models.response.entity.type.EntityTypeWithSemanticsResponse
import riven.core.models.response.entity.type.SemanticMetadataBundle
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.activity.log
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.EntityTypeSemanticMetadataService
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
    private val entityTypeRelationshipService: EntityTypeRelationshipService,
    private val entityAttributeService: EntityTypeAttributeService,
    private val relationshipDiffService: EntityTypeRelationshipDiffService,
    private val impactAnalysisService: EntityTypeRelationshipImpactAnalysisService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
    private val semanticMetadataService: EntityTypeSemanticMetadataService,
) {

    /**
     * Create and publish a new entity type.
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun publishEntityType(workspaceId: UUID, request: CreateEntityTypeRequest): EntityType {
        authTokenService.getUserId().let { userId ->
            val primaryId: UUID = UUID.randomUUID()

            EntityTypeEntity(
                displayNameSingular = request.name.singular,
                displayNamePlural = request.name.plural,
                key = request.key,
                workspaceId = workspaceId,
                identifierKey = primaryId,
                description = request.description,
                iconType = request.icon.type,
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
                columns = listOf(
                    EntityTypeAttributeColumn(
                        key = primaryId,
                        type = EntityPropertyType.ATTRIBUTE
                    )
                )
            ).run {
                entityTypeRepository.save(this)
            }.also {
                val entityTypeId = requireNotNull(it.id)
                semanticMetadataService.initializeForEntityType(
                    entityTypeId = entityTypeId,
                    workspaceId = workspaceId,
                    attributeIds = listOf(primaryId)
                )
                activityService.log(
                    activity = Activity.ENTITY_TYPE,
                    operation = OperationType.CREATE,
                    userId = userId,
                    workspaceId = requireNotNull(it.workspaceId) { "Cannot create system entity type" },
                    entityType = ApplicationEntityType.ENTITY_TYPE,
                    entityId = entityTypeId,
                    "type" to it.key,
                    "version" to 1,
                    "category" to it.type.name
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
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun updateEntityTypeConfiguration(
        workspaceId: UUID,
        type: EntityType
    ): EntityType {
        authTokenService.getUserId()
        requireNotNull(type.workspaceId) { "Cannot update system entity type" }
        val existing: EntityTypeEntity = ServiceUtil.findOrThrow { entityTypeRepository.findById(type.id) }

        return existing.apply {
            displayNameSingular = type.name.singular
            displayNamePlural = type.name.plural
            description = type.description
            iconType = type.icon.type
            iconColour = type.icon.colour
            columns = type.columns
        }.let {
            entityTypeRepository.save(it).toModel()
        }
    }

    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun saveEntityTypeDefinition(
        workspaceId: UUID,
        request: SaveTypeDefinitionRequest,
        impactConfirmed: Boolean = false
    ): EntityTypeImpactResponse {
        val (index: Int?, definition) = request
        val existing =
            ServiceUtil.findOrThrow { entityTypeRepository.findByworkspaceIdAndKey(workspaceId, definition.key) }

        val impactedEntityTypes = mutableMapOf<String, EntityType>()

        when (definition) {
            is SaveAttributeDefinitionRequest -> {
                entityAttributeService.saveAttributeDefinition(workspaceId, existing, definition).also {
                    impactedEntityTypes[existing.key] = existing.toModel()
                }
            }

            is SaveRelationshipDefinitionRequest -> {
                val (_, id: UUID, relationship: EntityRelationshipDefinition) = definition

                // Find prev, if exists
                existing.relationships?.firstOrNull { it.id == id }.run {
                    // If new, just add new relationships
                    if (this == null) {
                        entityTypeRelationshipService.updateRelationships(
                            workspaceId,
                            diff = EntityTypeRelationshipDiff(
                                added = listOf(definition),
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
                            workspaceId,
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
                    entityTypeRelationshipService.updateRelationships(
                        workspaceId,
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
        val currentIndex = existing.columns.indexOfFirst { it.key == definition.id }
        // New attribute/relationship being added
        if (currentIndex == -1) {
            val updatedOrdering = reorderEntityTypeColumns(
                order = existing.columns,
                key = EntityTypeAttributeColumn(
                    key = definition.id,
                    type = when (definition) {
                        is SaveAttributeDefinitionRequest -> EntityPropertyType.ATTRIBUTE
                        is SaveRelationshipDefinitionRequest -> EntityPropertyType.RELATIONSHIP
                        else -> throw IllegalArgumentException("Unsupported definition type: ${definition::class.java}")
                    }
                ),
                prev = null,
                new = request.index ?: existing.columns.size
            )

            existing.apply {
                columns = updatedOrdering
            }
        } else {
            request.index?.run {
                if (this == index) return@run
                // Existing attribute/relationship being reordered
                val updatedOrdering = reorderEntityTypeColumns(
                    order = existing.columns,
                    key = EntityTypeAttributeColumn(
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
                    columns = updatedOrdering
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
        workspaceId: UUID,
        request: DeleteTypeDefinitionRequest,
        impactConfirmed: Boolean = false
    ): EntityTypeImpactResponse {
        val (definition) = request
        val existing =
            ServiceUtil.findOrThrow { entityTypeRepository.findByworkspaceIdAndKey(workspaceId, definition.key) }

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
                            workspaceId,
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
                    entityTypeRelationshipService.removeRelationships(
                        workspaceId,
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
            columns = columns.filterNot { it.key == definition.id }
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
        order: List<EntityTypeAttributeColumn>,
        key: EntityTypeAttributeColumn,
        prev: Int?,
        new: Int
    ): List<EntityTypeAttributeColumn> {
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


    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun deleteEntityType(
        workspaceId: UUID,
        key: String,
        impactConfirmed: Boolean = false
    ): EntityTypeImpactResponse {
        val userId = authTokenService.getUserId()
        val existing = ServiceUtil.findOrThrow { entityTypeRepository.findByworkspaceIdAndKey(workspaceId, key) }
        requireNotNull(existing.workspaceId) { "Cannot delete system entity type" }

        existing.relationships?.let {
            if (!impactConfirmed) {
                val impact = impactAnalysisService.analyze(
                    workspaceId,
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
            entityTypeRelationshipService.removeRelationships(workspaceId, it.map { relationship ->
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

        semanticMetadataService.softDeleteForEntityType(requireNotNull(existing.id))
        entityTypeRepository.delete(existing).also {
            activityService.log(
                activity = Activity.ENTITY_TYPE,
                operation = OperationType.DELETE,
                userId = userId,
                workspaceId = workspaceId,
                entityType = ApplicationEntityType.ENTITY_TYPE,
                entityId = existing.id,
                "type" to existing.key
            )

            return EntityTypeImpactResponse(
                impact = null,
                updatedEntityTypes = affectedEntityTypes,
                error = null
            )
        }
    }


    // ------ Public read operations ------

    /**
     * Get all entity types for a workspace, optionally enriched with semantic metadata.
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getWorkspaceEntityTypesWithIncludes(
        workspaceId: UUID,
        include: List<String>,
    ): List<EntityTypeWithSemanticsResponse> {
        val entityTypes = getWorkspaceEntityTypes(workspaceId)

        val bundleMap = if ("semantics" in include) {
            val allMetadata = semanticMetadataService.getMetadataForEntityTypes(entityTypes.map { it.id })
            val metadataByEntityType = allMetadata.groupBy { it.entityTypeId }
            entityTypes.associate { et ->
                et.id to buildSemanticBundle(et.id, metadataByEntityType[et.id] ?: emptyList())
            }
        } else {
            emptyMap()
        }

        return entityTypes.map { et ->
            EntityTypeWithSemanticsResponse(entityType = et, semantics = bundleMap[et.id])
        }
    }

    /**
     * Get a single entity type by key, optionally enriched with semantic metadata.
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getEntityTypeByKeyWithIncludes(
        workspaceId: UUID,
        key: String,
        include: List<String>,
    ): EntityTypeWithSemanticsResponse {
        val entityType = getByKey(key, workspaceId).toModel()

        val bundle = if ("semantics" in include) {
            val allMetadata = semanticMetadataService.getAllMetadataForEntityType(workspaceId, entityType.id)
            buildSemanticBundle(entityType.id, allMetadata)
        } else {
            null
        }

        return EntityTypeWithSemanticsResponse(entityType = entityType, semantics = bundle)
    }

    /**
     * Get all entity types for a workspace (including system types).
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getWorkspaceEntityTypes(workspaceId: UUID): List<EntityType> {
        return ServiceUtil.findManyResults {
            entityTypeRepository.findByworkspaceId(workspaceId)
        }.map { it.toModel() }
    }

    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getByKey(key: String, workspaceId: UUID): EntityTypeEntity {
        return ServiceUtil.findOrThrow { entityTypeRepository.findByworkspaceIdAndKey(workspaceId, key) }
    }

    /**
     * Get entity type by ID.
     */
    fun getById(id: UUID): EntityTypeEntity {
        return ServiceUtil.findOrThrow { entityTypeRepository.findById(id) }
    }

    /**
     * Get entity types by IDs.
     */
    fun getByIds(ids: Collection<UUID>): List<EntityTypeEntity> {
        return ServiceUtil.findManyResults { entityTypeRepository.findAllById(ids) }
    }

    // ------ Semantic helpers ------

    fun buildSemanticBundle(
        entityTypeId: UUID,
        metadata: List<EntityTypeSemanticMetadata>,
    ): SemanticMetadataBundle {
        return SemanticMetadataBundle(
            entityType = metadata.firstOrNull { it.targetType == SemanticMetadataTargetType.ENTITY_TYPE },
            attributes = metadata.filter { it.targetType == SemanticMetadataTargetType.ATTRIBUTE }
                .associateBy { it.targetId },
            relationships = metadata.filter { it.targetType == SemanticMetadataTargetType.RELATIONSHIP }
                .associateBy { it.targetId },
        )
    }
}