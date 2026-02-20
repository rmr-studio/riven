package riven.core.service.entity.type

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.entity.EntityTypeRelationshipChangeType
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.entity.invert
import riven.core.enums.util.OperationType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeAttributeColumn
import riven.core.models.entity.relationship.EntityTypeReferenceRelationshipBuilder
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDeleteRequest
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDiff
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipModification
import riven.core.enums.entity.SemanticMetadataTargetType
import riven.core.models.request.entity.type.DeleteRelationshipDefinitionRequest
import riven.core.models.request.entity.type.SaveRelationshipDefinitionRequest
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.activity.log
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.EntityTypeSemanticMetadataService
import java.util.*

/**
 * Service for managing relationships between entities.
 */
@Service
class EntityTypeRelationshipService(
    private val entityTypeRepository: EntityTypeRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService,
    private val semanticMetadataService: EntityTypeSemanticMetadataService,
) {


    private fun validateNamingCollisions(types: List<EntityTypeEntity>) {
        types.forEach {
            val nameSet = mutableSetOf<String>()
            it.relationships?.forEach { relDef ->
                if (nameSet.contains(relDef.name)) {
                    throw IllegalArgumentException("Entity Type '${it.key}' has multiple relationships with the name '${relDef.name}'. Relationship names must be unique within an entity type.")
                }
                nameSet.add(relDef.name)
            }
        }
    }

    enum class RelationshipOperation {
        CREATE,
        UPDATE,
        DELETE
    }

    data class RelationshipDefinitionValidationContext(
        val definition: EntityRelationshipDefinition,
        val operation: RelationshipOperation = RelationshipOperation.CREATE
    )

    /**
     * Validates an entity types relationships
     * 1. Check all reference target entity types exist
     * 2. Check for any naming collisions
     * 3. Validates that all bi-directional relationships have an inverse correctly defined
     * 4. For DELETE operations, validates that the environment is clean after removal
     */
    private fun validateRelationshipDefinitions(
        relationships: List<RelationshipDefinitionValidationContext>,
        entityTypesMap: Map<String, EntityTypeEntity>,
    ) {
        // Check for any naming collisions + Bi-directional inverse matching
        validateNamingCollisions(entityTypesMap.values.toList())

        relationships.forEach { context ->
            val relDef = context.definition
            val operation = context.operation

            // Validate based on operation type
            when (operation) {
                RelationshipOperation.CREATE, RelationshipOperation.UPDATE -> {
                    validateRelationshipForCreateOrUpdate(relDef, entityTypesMap)
                }

                RelationshipOperation.DELETE -> {
                    validateRelationshipForDelete(relDef, entityTypesMap)
                }
            }
        }
    }

    /**
     * Validates a relationship definition for CREATE or UPDATE operations.
     */
    private fun validateRelationshipForCreateOrUpdate(
        relDef: EntityRelationshipDefinition,
        entityTypesMap: Map<String, EntityTypeEntity>
    ) {
        if (!relDef.bidirectional) return

        when (relDef.relationshipType) {
            EntityTypeRelationshipType.ORIGIN -> {
                // For ORIGIN relationships:
                // 1. Validate bidirectionalEntityTypeKeys are in entityTypeKeys (if not polymorphic)
                // 2. Cross-reference that each target entity type has a REFERENCE relationship pointing back

                // Ensure bi-directional relationships have inverse names defined.
                val inverseKeys = requireNotNull(relDef.bidirectionalEntityTypeKeys) {
                    "Bidirectional relationship for '${relDef.name}' must have bidirectionalEntityTypeKeys defined."
                }

                if (relDef.inverseName.isNullOrBlank()) {
                    throw IllegalArgumentException("Bidirectional relationship for '${relDef.name}' must have an inverseName defined.")
                }

                if (!relDef.allowPolymorphic) {
                    val keys = requireNotNull(relDef.entityTypeKeys).toSet()
                    inverseKeys.forEach { targetKey ->
                        if (!keys.contains(targetKey)) {
                            throw IllegalArgumentException("Bidirectional relationship for '${relDef.name}' includes target entity type '$targetKey' which is not in the original entityTypeKeys list.")
                        }
                    }
                }

                // Ensure each target entity type has matching inverse REFERENCE definition
                inverseKeys.forEach { targetKey ->
                    val type = requireNotNull(entityTypesMap[targetKey]) {
                        "Referenced entity type '$targetKey' does not exist."
                    }
                    val targetRelationships = requireNotNull(type.relationships) {
                        "Target entity type '$targetKey' does not currently define any relationships"
                    }

                    val inverseRelationship = targetRelationships.find { refDef ->
                        refDef.originRelationshipId == relDef.id && refDef.relationshipType == EntityTypeRelationshipType.REFERENCE
                    }

                    if (inverseRelationship == null) {
                        throw IllegalArgumentException(
                            "Bidirectional ORIGIN relationship '${relDef.name}' does not have a matching inverse REFERENCE definition in target entity type '$targetKey'."
                        )
                    }
                }
            }

            EntityTypeRelationshipType.REFERENCE -> {
                // For REFERENCE relationships:
                // Validate that this entity type is included in the origin relationship's bidirectionalEntityTypeKeys

                val originRelationshipId = requireNotNull(relDef.originRelationshipId) {
                    "REFERENCE relationship '${relDef.name}' must have an originRelationshipId defined."
                }

                // Find the origin entity type and relationship
                val originEntityTypeKey = requireNotNull(relDef.entityTypeKeys?.firstOrNull()) {
                    "REFERENCE relationship '${relDef.name}' must have entityTypeKeys pointing to the origin entity type."
                }

                val originEntityType = requireNotNull(entityTypesMap[originEntityTypeKey]) {
                    "Origin entity type '$originEntityTypeKey' does not exist for REFERENCE relationship '${relDef.name}'."
                }

                val origin: EntityRelationshipDefinition = requireNotNull(originEntityType.relationships) {
                    "Origin entity type '$originEntityTypeKey' does not define any relationships."
                }.let { defs ->
                    requireNotNull(defs.find { originDef ->
                        originDef.id == originRelationshipId && originDef.relationshipType == EntityTypeRelationshipType.ORIGIN
                    }) { "REFERENCE relationship '${relDef.name}' references origin relationship ID '$originRelationshipId' which does not exist in entity type '$originEntityTypeKey'." }
                }

                // Validate all reference relationships point back to the origin
                if (origin.sourceEntityTypeKey != relDef.sourceEntityTypeKey) {
                    throw IllegalArgumentException(
                        "REFERENCE relationship '${relDef.name}' source entity type '${relDef.sourceEntityTypeKey}' does not match origin relationship's source entity type '${origin.sourceEntityTypeKey}'."
                    )
                }
            }
        }
    }

    /**
     * Validates a relationship definition for DELETE operations.
     *
     * For ORIGIN relationships:
     * - Ensures all inverse REFERENCE relationships have been removed from target entity types
     *
     * For REFERENCE relationships:
     * - Ensures the origin ORIGIN relationship no longer includes this entity type in bidirectionalEntityTypeKeys
     */
    private fun validateRelationshipForDelete(
        relDef: EntityRelationshipDefinition,
        entityTypesMap: Map<String, EntityTypeEntity>
    ) {
        if (!relDef.bidirectional) return

        when (relDef.relationshipType) {
            EntityTypeRelationshipType.ORIGIN -> {
                // Validate that all inverse REFERENCE relationships have been cascaded (removed)
                val targetKeys = relDef.bidirectionalEntityTypeKeys ?: emptyList()

                targetKeys.forEach { targetKey ->
                    val targetEntityType = entityTypesMap[targetKey]
                    if (targetEntityType == null) {
                        // Target entity type doesn't exist, so no inverse relationships to check
                        return@forEach
                    }

                    val targetRelationships = targetEntityType.relationships ?: emptyList()
                    val orphanedReference = targetRelationships.find { refDef ->
                        refDef.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                                refDef.originRelationshipId == relDef.id
                    }

                    if (orphanedReference != null) {
                        throw IllegalStateException(
                            "Cannot delete ORIGIN relationship '${relDef.name}' (ID: ${relDef.id}). " +
                                    "Inverse REFERENCE relationship '${orphanedReference.name}' (ID: ${orphanedReference.id}) " +
                                    "still exists in entity type '$targetKey'. " +
                                    "All inverse REFERENCE relationships must be removed before deleting the ORIGIN relationship."
                        )
                    }
                }
            }

            EntityTypeRelationshipType.REFERENCE -> {
                // Validate that the origin ORIGIN relationship no longer includes this entity type
                val originRelationshipId = relDef.originRelationshipId
                if (originRelationshipId == null) {
                    // No origin relationship to validate
                    return
                }

                val originEntityTypeKey = relDef.entityTypeKeys?.firstOrNull()
                if (originEntityTypeKey == null) {
                    // No origin entity type specified
                    return
                }

                val originEntityType = entityTypesMap[originEntityTypeKey]
                if (originEntityType == null) {
                    // Origin entity type doesn't exist, so nothing to validate
                    return
                }

                val originRelationship = originEntityType.relationships?.find { originDef ->
                    originDef.id == originRelationshipId && originDef.relationshipType == EntityTypeRelationshipType.ORIGIN
                }

                if (originRelationship != null) {
                    val bidirectionalKeys = originRelationship.bidirectionalEntityTypeKeys ?: emptyList()
                    if (bidirectionalKeys.contains(relDef.sourceEntityTypeKey)) {
                        throw IllegalStateException(
                            "Cannot delete REFERENCE relationship '${relDef.name}' (ID: ${relDef.id}). " +
                                    "The origin ORIGIN relationship '${originRelationship.name}' (ID: ${originRelationship.id}) " +
                                    "still includes '${relDef.sourceEntityTypeKey}' in its bidirectionalEntityTypeKeys. " +
                                    "The origin relationship must be updated to remove this entity type before the REFERENCE can be deleted."
                        )
                    }
                }
            }
        }
    }


    /**
     * This function will take in a list of entity type definitions that will be used to create new relationships
     * and update the current ecosystem of entity types within the workspace.
     *
     * It will handle:
     * 1. Validating all referenced entity types exist
     * 2. Adding/Updating relationships on source entity types
     * 3. Creating inverse relationships for bidirectional ORIGIN relationships
     * 4. Updating origin relationships for bidirectional REFERENCE relationships
     * 5. Validating all relationship definitions after processing
     */
    @Transactional
    fun createRelationships(
        definitions: List<SaveRelationshipDefinitionRequest>,
        workspaceId: UUID
    ): List<EntityTypeEntity> {
        // Validate all associated entity types exist
        val entities = findAndValidateAssociatedEntityTypes(
            relationships = definitions.map { it.relationship },
            workspaceId = workspaceId
        ).toMutableMap()
        return this.createRelationships(entities, definitions, workspaceId)
    }

    @Transactional
    fun createRelationships(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        definitions: List<SaveRelationshipDefinitionRequest>,
        workspaceId: UUID,
        save: Boolean = true
    ): List<EntityTypeEntity> {
// Track all relationship definitions for final validation (including created inverses)
        val allRelationshipDefinitions = mutableListOf<EntityRelationshipDefinition>()

        // Group definitions by source entity type


        // Validate definitions
        definitions.forEach { request ->
            // Validate and add each relationship definition

            val (_, _, definition: EntityRelationshipDefinition) = request

            // Validate bidirectional ORIGIN relationships before adding
            if (definition.bidirectional && definition.relationshipType == EntityTypeRelationshipType.ORIGIN) {
                validateOriginBidirectionalRelationship(definition)
            }

            allRelationshipDefinitions.add(definition)

        }

        // Handle bidirectional relationships
        definitions.forEach { request ->

            val (key: String, _, definition: EntityRelationshipDefinition) = request
            // Add the relationship definition to the source entity type
            val entity = requireNotNull(entityTypes[key]) { "Entity type '$key' not found in entity types map" }
            entityTypes[key] = addOrUpdateRelationship(
                entityType = entity,
                newRelationship = definition
            )

            if (!definition.bidirectional) return@forEach
            when (definition.relationshipType) {
                // For ORIGIN bidirectional relationships: create REFERENCE relationships on target entity types
                EntityTypeRelationshipType.ORIGIN -> {
                    val createdReferences = createInverseReferenceRelationships(
                        originRelationship = definition,
                        workspaceId = workspaceId,
                        entityTypesByKey = entityTypes
                    )
                    allRelationshipDefinitions.addAll(createdReferences)
                }

                // For REFERENCE bidirectional relationships: update origin to include this entity type
                EntityTypeRelationshipType.REFERENCE -> {
                    updateOriginForReferenceRelationship(
                        referenceRelationship = definition,
                        key = key,
                        workspaceId = workspaceId,
                        entityTypesByKey = entityTypes
                    )
                }
            }
        }


        save.let {
            if (it) {
                entityTypeRepository.saveAll(entityTypes.values.toList()).also {
                    validateRelationshipDefinitions(
                        relationships = allRelationshipDefinitions.map { relDef ->
                            RelationshipDefinitionValidationContext(
                                definition = relDef,
                                operation = RelationshipOperation.CREATE
                            )
                        },
                        entityTypesMap = entityTypes
                    )
                }
            }
            // Save all affected entity types
            return entityTypes.values.toList()
        }
    }


    @Transactional
    fun updateRelationships(
        workspaceId: UUID,
        diff: EntityTypeRelationshipDiff
    ): Map<String, EntityTypeEntity> {
        // Load all target entity types
        val entityTypesMap: MutableMap<String, EntityTypeEntity> = findAndValidateAssociatedEntityTypes(
            relationships = diff.added.map { it.relationship } + diff.removed.map { it.relationship } + diff.modified.map { it.updated },
            workspaceId = workspaceId
        ).toMutableMap()

        // Also load source entity types for modifications and removals
        val sourceKeys = buildSet {
            diff.removed.forEach { add(it.relationship.sourceEntityTypeKey) }
            diff.modified.forEach { add(it.updated.sourceEntityTypeKey) }
            diff.added.forEach {
                add(it.key)
                add(it.relationship.sourceEntityTypeKey)
            }
        }

        // Load source entity types that aren't already in the map
        val missingSourceKeys = sourceKeys - entityTypesMap.keys
        if (missingSourceKeys.isNotEmpty()) {
            val sourceEntityTypes = entityTypeRepository.findByworkspaceIdAndKeyIn(
                workspaceId,
                missingSourceKeys.toList()
            )
            sourceEntityTypes.forEach { entityTypesMap[it.key] = it }
        }

        createRelationships(entityTypesMap, diff.added, workspaceId, save = false)
        removeRelationships(entityTypesMap, workspaceId, diff.removed, save = false)
        modifyRelationships(entityTypesMap, workspaceId, diff.modified, save = false)

        // Save all affected entity types and validate relationship environment
        return entityTypeRepository.saveAll(entityTypesMap.values.toList())

            .associateBy { it.key }.also { savedTypes ->

                // Build validation contexts with appropriate operations
                val validationContexts = mutableListOf<RelationshipDefinitionValidationContext>()

                // Added relationships - validate as CREATE
                validationContexts.addAll(diff.added.map { relDef ->
                    RelationshipDefinitionValidationContext(
                        definition = relDef.relationship,
                        operation = RelationshipOperation.CREATE
                    )
                })

                // Removed relationships - validate as DELETE (check that environment is clean)
                validationContexts.addAll(diff.removed.map { relDef ->
                    RelationshipDefinitionValidationContext(
                        definition = relDef.relationship,
                        operation = RelationshipOperation.DELETE
                    )
                })

                // Modified relationships - validate as UPDATE
                validationContexts.addAll(diff.modified.map { modification ->
                    RelationshipDefinitionValidationContext(
                        definition = modification.updated,
                        operation = RelationshipOperation.UPDATE
                    )
                })

                validateRelationshipDefinitions(
                    relationships = validationContexts,
                    entityTypesMap = savedTypes
                )
            }
    }

    fun removeRelationships(
        workspaceId: UUID,
        relationships: List<EntityTypeRelationshipDeleteRequest>,
    ): Map<String, EntityTypeEntity> {
        val entityTypesMap: MutableMap<String, EntityTypeEntity> = findAndValidateAssociatedEntityTypes(
            relationships = relationships.map { it.relationship },
            workspaceId = workspaceId
        ).toMutableMap()

        return removeRelationships(entityTypesMap, workspaceId, relationships, save = true).associateBy { it.key }
            .also {
                // Final validation to ensure environment integrity
                val validationContexts = relationships.map { relDef ->
                    RelationshipDefinitionValidationContext(
                        definition = relDef.relationship,
                        operation = RelationshipOperation.DELETE
                    )
                }

                validateRelationshipDefinitions(
                    relationships = validationContexts,
                    entityTypesMap = it
                )
            }


    }

    /**
     * Removes relationship definitions and handles cascading updates to related entity types.
     *
     * For ORIGIN relationships:
     * - Removes the relationship from the source entity type
     * - If bidirectional, removes all inverse REFERENCE relationships from target entity types
     *
     * For REFERENCE relationships:
     * - Removes the relationship from the source entity type
     * - Updates the origin ORIGIN relationship by removing this entity type from bidirectionalEntityTypeKeys
     * - If not polymorphic, also removes from entityTypeKeys
     * - If entityTypeKeys becomes empty, removes the entire ORIGIN relationship
     */
    private fun removeRelationships(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        workspaceId: UUID,
        relationships: List<EntityTypeRelationshipDeleteRequest>,
        save: Boolean = false
    ): List<EntityTypeEntity> {
        // Validate before removal to ensure system integrity
        validateRelationshipsBeforeRemoval(relationships.map { it.relationship }, entityTypes)

        val userId = authTokenService.getUserId()

        relationships.forEach { request ->
            when (request.relationship.relationshipType) {
                EntityTypeRelationshipType.ORIGIN -> {
                    removeOriginRelationship(
                        originRelationship = request.relationship,
                        entityTypes = entityTypes,
                        workspaceId = workspaceId
                    )
                }

                EntityTypeRelationshipType.REFERENCE -> {
                    removeReferenceRelationship(
                        workspaceId = workspaceId,
                        request = request,
                        entityTypes = entityTypes,
                    )
                }
            }

            val (relationship) = request

            // Log activity for relationship removal
            val sourceEntityType = entityTypes[relationship.sourceEntityTypeKey]
            if (sourceEntityType != null) {
                activityService.log(
                    activity = Activity.ENTITY_RELATIONSHIP,
                    operation = OperationType.DELETE,
                    userId = userId,
                    workspaceId = workspaceId,
                    entityType = ApplicationEntityType.ENTITY_TYPE,
                    entityId = sourceEntityType.id,
                    "relationshipId" to relationship.id.toString(),
                    "relationshipName" to relationship.name,
                    "relationshipType" to relationship.relationshipType.name,
                    "sourceEntityType" to relationship.sourceEntityTypeKey,
                    "bidirectional" to relationship.bidirectional,
                    "targetEntityTypes" to (relationship.entityTypeKeys?.joinToString(", ") ?: "polymorphic")
                )
            }
        }


        // TODO: Clean up actual entity relationship data from entity records
        // This requires iterating through all entities of affected types and:
        // 1. Removing relationship data for deleted relationships
        // 2. Potentially migrating or archiving the data before deletion
        // 3. Logging data loss warnings for audit trail

        save.let {
            if (it) {
                return entityTypeRepository.saveAll(entityTypes.values.toList())
            }

            return entityTypes.values.toList()
        }
    }

    /**
     * Removes an ORIGIN relationship and its inverse REFERENCE relationships.
     */
    private fun removeOriginRelationship(
        originRelationship: EntityRelationshipDefinition,
        entityTypes: MutableMap<String, EntityTypeEntity>,
        workspaceId: UUID
    ) {
        // Protected relationships check
        if (originRelationship.protected) {
            throw IllegalStateException(
                "Cannot remove protected relationship '${originRelationship.name}' (ID: ${originRelationship.id}). " +
                        "Protected relationships are system-managed and cannot be deleted."
            )
        }

        val sourceKey = originRelationship.sourceEntityTypeKey
        var sourceEntityType = requireNotNull(entityTypes[sourceKey]) {
            "Source entity type '$sourceKey' not found in entity types map"
        }

        // Remove the ORIGIN relationship from source entity type
        val updatedRelationships = sourceEntityType.relationships?.toMutableList() ?: mutableListOf()
        updatedRelationships.removeIf { it.id == originRelationship.id }
        val updatedOrder = sourceEntityType.columns.filter { it.key != originRelationship.id }
        sourceEntityType = sourceEntityType.copy(relationships = updatedRelationships, columns = updatedOrder)
        entityTypes[sourceKey] = sourceEntityType

        // Hard-delete semantic metadata for the removed ORIGIN relationship
        semanticMetadataService.deleteForTarget(
            entityTypeId = requireNotNull(sourceEntityType.id),
            targetType = SemanticMetadataTargetType.RELATIONSHIP,
            targetId = originRelationship.id,
        )

        // If bidirectional, remove all inverse REFERENCE relationships from target entity types
        if (originRelationship.bidirectional) {
            val targetKeys = originRelationship.bidirectionalEntityTypeKeys ?: emptyList()
            targetKeys.forEach { targetKey ->
                removeInverseReferenceRelationship(
                    targetEntityTypeKey = targetKey,
                    originRelationshipId = originRelationship.id,
                    entityTypes = entityTypes,
                    workspaceId = workspaceId
                )
            }
        }

        // TODO: Remove all entity relationship data for this ORIGIN relationship
        // This includes:
        // 1. Finding all entities of sourceEntityType that have data for this relationship
        // 2. Removing the relationship data from those entities
        // 3. Logging the data removal for audit trail
    }

    /**
     * Removes the inverse REFERENCE relationship from a target entity type.
     * Hard-deletes the associated semantic metadata record.
     */
    private fun removeInverseReferenceRelationship(
        targetEntityTypeKey: String,
        originRelationshipId: UUID,
        entityTypes: MutableMap<String, EntityTypeEntity>,
        workspaceId: UUID
    ) {
        var targetEntityType = retrieveEntityType(targetEntityTypeKey, workspaceId, entityTypes)
        val targetRelationships = targetEntityType.relationships?.toMutableList() ?: mutableListOf()

        // Find the REFERENCE relationship before removing it (need the ID for metadata cleanup)
        val removedReference = targetRelationships.find { relDef ->
            relDef.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                    relDef.originRelationshipId == originRelationshipId
        }

        // Find and remove the REFERENCE relationship that points to this ORIGIN
        targetRelationships.removeIf { relDef ->
            relDef.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                    relDef.originRelationshipId == originRelationshipId
        }

        targetEntityType = targetEntityType.copy(relationships = targetRelationships)
        entityTypes[targetEntityTypeKey] = targetEntityType

        // Hard-delete semantic metadata for the removed REFERENCE relationship
        if (removedReference != null) {
            semanticMetadataService.deleteForTarget(
                entityTypeId = requireNotNull(targetEntityType.id),
                targetType = SemanticMetadataTargetType.RELATIONSHIP,
                targetId = removedReference.id,
            )
        }
    }

    /**
     * Removes a bi-directional REFERENCE relationship. And alters the source definition based on the removal action.
     *
     * The removal flow is based on `removalAction`:
     * REMOVE_BIDIRECTIONAL: Removes the two-way view from the reference entity type. But keeps the ORIGIN relationship, and all existing data intact.
     * REMOVE_ENTITY_TYPE: Removes the relationship reference from the entity type, and all relationship data of that specific entity type. But keeps the relationship definition intact
     * DELETE_RELATIONSHIP: Deletes the entire relationship definition and removes the reference for every other entity type referencing the relationship
     *
     */
    private fun removeReferenceRelationship(
        request: EntityTypeRelationshipDeleteRequest,
        entityTypes: MutableMap<String, EntityTypeEntity>,
        workspaceId: UUID
    ) {

        val (referenceRelationship, type, action) = request

        if (referenceRelationship.protected) {
            throw IllegalStateException(
                "Cannot remove protected relationship '${referenceRelationship.name}' (ID: ${referenceRelationship.id}). " +
                        "Protected relationships are system-managed and cannot be deleted."
            )
        }

        // Find the ORIGIN relationship's source entity type
        val (sourceEntity: EntityTypeEntity, originRelationshipDef: EntityRelationshipDefinition) = requireNotNull(
            entityTypes[referenceRelationship.sourceEntityTypeKey]
        ) {
            "Source entity type '$referenceRelationship.sourceEntityTypeKey' not found in entity types map"
        }.let {
            val relationships = requireNotNull(it.relationships) {
                "Source entity type '${referenceRelationship.sourceEntityTypeKey}' has no relationships defined."
            }

            it to requireNotNull(relationships.firstOrNull { relDef ->
                relDef.id == referenceRelationship.originRelationshipId &&
                        relDef.relationshipType == EntityTypeRelationshipType.ORIGIN
            }) {
                "Origin relationship ID '${referenceRelationship.originRelationshipId}' not found in source entity type '${referenceRelationship.sourceEntityTypeKey}'."
            }
        }

        // Remove the REFERENCE relationship from the entity type (DELETE_RELATIONSHIP should handle cascading back to this relationship)
        if (action != DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP) {

            // Remove the REFERENCE relationship
            type.apply {
                relationships = relationships?.filter { it.id != referenceRelationship.id }
            }.also {
                entityTypes[type.key] = it
            }

            // Hard-delete semantic metadata for the removed REFERENCE relationship
            semanticMetadataService.deleteForTarget(
                entityTypeId = requireNotNull(type.id),
                targetType = SemanticMetadataTargetType.RELATIONSHIP,
                targetId = referenceRelationship.id,
            )
        }



        when (action) {
            DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_BIDIRECTIONAL -> {
                // Remove bidirectional key reference from origin type
                originRelationshipDef.apply {
                    bidirectionalEntityTypeKeys =
                        originRelationshipDef.bidirectionalEntityTypeKeys?.filter { it != type.key }
                }

                sourceEntity.apply {
                    relationships = relationships?.map { relDef ->
                        if (relDef.id == originRelationshipDef.id) {
                            originRelationshipDef
                        } else {
                            relDef
                        }
                    }
                }.also {
                    entityTypes[sourceEntity.key] = it
                }
            }

            DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_ENTITY_TYPE -> {
                // Remove from bidirectionalEntityTypeKeys and entityTypeKeys and remove all relationship data for this entity type
                // Remove bidirectional key reference from origin type
                originRelationshipDef.apply {
                    bidirectionalEntityTypeKeys =
                        originRelationshipDef.bidirectionalEntityTypeKeys?.filter { it != type.key }

                    entityTypeKeys = originRelationshipDef.entityTypeKeys?.filter { it != type.key }
                }

                sourceEntity.apply {
                    relationships = relationships?.map { relDef ->
                        if (relDef.id == originRelationshipDef.id) {
                            originRelationshipDef
                        } else {
                            relDef
                        }
                    }
                }.also {
                    entityTypes[sourceEntity.key] = it
                    // TODO: Remove all entity relationship data for this REFERENCE relationship and this entity type
                }
            }

            DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP -> {
                // Remove entire relationship, and update all OTHER referencing relationships
                this.removeRelationships(
                    // Recursive call back up to top level function, should delete the ORIGIN relationship and cascade appropriately
                    entityTypes, workspaceId, listOf(
                        EntityTypeRelationshipDeleteRequest(
                            relationship = originRelationshipDef,
                            type = sourceEntity,
                            action = DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP
                        )
                    ), save = false
                )
            }
        }

    }


    /**
     * Checks for:
     * 1. Required relationships that might break data integrity
     * 2. System-critical relationships
     * 3. Relationships with existing entity data (warning)
     */
    private fun validateRelationshipsBeforeRemoval(
        relationships: List<EntityRelationshipDefinition>,
        entityTypes: Map<String, EntityTypeEntity>
    ) {
        relationships.forEach { relationship ->
            // Check if relationship is required and warn about potential data integrity issues
            if (relationship.required) {
                val sourceEntityType = entityTypes[relationship.sourceEntityTypeKey]
                if (sourceEntityType != null) {
                    // Log a warning that a required relationship is being removed
                    // This could potentially leave existing entities in an invalid state
                    // TODO: Add more sophisticated checking for existing entity data
                    // TODO: Consider if we should block removal of required relationships with existing data
                }
            }

            // Additional validation could be added here:
            // - Check for circular dependency issues
            // - Verify that removing this relationship won't leave orphaned data
            // - Ensure system-critical relationships aren't removed
            // - Check cardinality constraints

            // Note: The actual entity data validation is deferred to the impact analysis
            // that runs before the user confirms the update (in EntityTypeService)
        }
    }

    fun modifyRelationships(
        workspaceId: UUID,
        diffs: List<EntityTypeRelationshipModification>,
        save: Boolean = false
    ): List<EntityTypeEntity> {
        val entityTypesMap: MutableMap<String, EntityTypeEntity> = findAndValidateAssociatedEntityTypes(
            relationships = diffs.flatMap { listOf(it.previous, it.updated) },
            workspaceId = workspaceId
        ).toMutableMap()

        return modifyRelationships(
            entityTypes = entityTypesMap,
            workspaceId = workspaceId,
            diffs = diffs,
            save = save
        )
    }

    /**
     * Modifies existing relationship definitions based on the detected changes.
     *
     * Handles various modification types:
     * - INVERSE_NAME_CHANGED: Updates inverse REFERENCE relationships still using default name
     * - CARDINALITY_CHANGED: Updates both ORIGIN and inverse REFERENCE cardinalities
     * - BIDIRECTIONAL_ENABLED: Creates inverse REFERENCE relationships
     * - BIDIRECTIONAL_DISABLED: Removes inverse REFERENCE relationships
     * - BIDIRECTIONAL_TARGETS_CHANGED: Adds/removes specific inverse relationships
     */
    private fun modifyRelationships(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        workspaceId: UUID,
        diffs: List<EntityTypeRelationshipModification>,
        save: Boolean = false
    ): List<EntityTypeEntity> {
        diffs.forEach { modification ->
            val prev = modification.previous
            val updated = modification.updated
            val changes = modification.changes

            // First, update the source relationship with the new definition
            updateSourceRelationship(
                entityTypes = entityTypes,
                updatedRelationship = updated
            )

            // Handle each type of change
            if (EntityTypeRelationshipChangeType.INVERSE_NAME_CHANGED in changes) {
                handleInverseNameChange(
                    entityTypes = entityTypes,
                    previous = prev,
                    updated = updated,
                    workspaceId = workspaceId
                )
            }

            if (EntityTypeRelationshipChangeType.CARDINALITY_CHANGED in changes) {
                handleCardinalityChange(
                    entityTypes = entityTypes,
                    previous = prev,
                    updated = updated,
                    workspaceId = workspaceId
                )
            }

            if (EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED in changes) {
                handleBidirectionalEnabled(
                    entityTypes = entityTypes,
                    updated = updated,
                    workspaceId = workspaceId
                )
            }

            if (EntityTypeRelationshipChangeType.BIDIRECTIONAL_DISABLED in changes) {
                handleBidirectionalDisabled(
                    entityTypes = entityTypes,
                    previous = prev,
                    workspaceId = workspaceId
                )
            }

            if (EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED in changes) {
                handleBidirectionalTargetsChanged(
                    entityTypes = entityTypes,
                    previous = prev,
                    updated = updated,
                    workspaceId = workspaceId
                )
            }
        }

        save.let {
            if (it) return entityTypeRepository.saveAll(entityTypes.values.toList())
            return entityTypes.values.toList()
        }
        // Save all affected entity types

    }

    /**
     * Updates the source relationship definition with the new version.
     */
    private fun updateSourceRelationship(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        updatedRelationship: EntityRelationshipDefinition
    ) {
        val sourceKey = updatedRelationship.sourceEntityTypeKey
        var sourceEntityType = requireNotNull(entityTypes[sourceKey]) {
            "Source entity type '$sourceKey' not found"
        }

        val relationships = sourceEntityType.relationships?.toMutableList() ?: mutableListOf()
        val index = relationships.indexOfFirst { it.id == updatedRelationship.id }

        if (index >= 0) {
            relationships[index] = updatedRelationship
            sourceEntityType = sourceEntityType.copy(relationships = relationships)
            entityTypes[sourceKey] = sourceEntityType
        }
    }

    /**
     * Handles INVERSE_NAME_CHANGED: Updates REFERENCE relationships still using the default inverse name.
     *
     * The inverse name acts as a skeleton/default name. If a REFERENCE relationship is still using
     * the default name (or a collision-resolved variant), it will be updated to match the new inverse name.
     * REFERENCE relationships that have been manually renamed are skipped.
     */
    private fun handleInverseNameChange(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        previous: EntityRelationshipDefinition,
        updated: EntityRelationshipDefinition,
        workspaceId: UUID
    ) {
        if (updated.relationshipType != EntityTypeRelationshipType.ORIGIN || !updated.bidirectional) {
            return
        }

        val oldInverseName = previous.inverseName ?: return
        val newInverseName = updated.inverseName ?: return
        val targetKeys = updated.bidirectionalEntityTypeKeys ?: emptyList()

        targetKeys.forEach { targetKey ->
            var targetEntityType = retrieveEntityType(targetKey, workspaceId, entityTypes)
            val relationships = targetEntityType.relationships?.toMutableList() ?: return@forEach

            // Find the REFERENCE relationship that points to this ORIGIN
            val refIndex = relationships.indexOfFirst { relDef ->
                relDef.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                        relDef.originRelationshipId == updated.id
            }

            if (refIndex < 0) return@forEach

            val referenceRelationship = relationships[refIndex]

            // Check if this REFERENCE is still using the default inverse name
            // (or a collision-resolved variant like "Inverse Name 2")
            if (isUsingDefaultInverseName(referenceRelationship.name, oldInverseName)) {
                // Update to new inverse name with collision detection
                val newName = resolveNameCollision(
                    desiredName = newInverseName,
                    existingRelationships = relationships,
                    excludeId = referenceRelationship.id
                )

                relationships[refIndex] = referenceRelationship.copy(name = newName)
                targetEntityType = targetEntityType.copy(relationships = relationships)
                entityTypes[targetKey] = targetEntityType
            }
        }
    }

    /**
     * Retrieves an entity type by its key from a provided map of entity types.
     *
     * If the entity type is not found and fallback is true, it attempts to load it from the repository,
     * otherwise it will throw an exception.
     *
     */
    private fun retrieveEntityType(
        key: String,
        workspaceId: UUID,
        entityTypes: MutableMap<String, EntityTypeEntity>,
        fallback: Boolean = true
    ): EntityTypeEntity {
        return entityTypes.getOrPut(key) {
            if (fallback) {
                entityTypeRepository.findByworkspaceIdAndKey(workspaceId, key)
                    .orElseThrow {
                        IllegalStateException("Entity type '$key' not found")
                    }
            } else {
                throw IllegalStateException("Entity type '$key' not found")
            }
        }

    }

    /**
     * Handles CARDINALITY_CHANGED: Updates the cardinality of both ORIGIN and inverse REFERENCE relationships.
     */
    private fun handleCardinalityChange(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        previous: EntityRelationshipDefinition,
        updated: EntityRelationshipDefinition,
        workspaceId: UUID
    ) {
        // If this is a bidirectional ORIGIN relationship, update all inverse REFERENCE relationships
        if (updated.relationshipType == EntityTypeRelationshipType.ORIGIN && updated.bidirectional) {
            val targetKeys = updated.bidirectionalEntityTypeKeys ?: emptyList()
            val newInverseCardinality = updated.cardinality.invert()

            targetKeys.forEach { targetKey ->
                val targetEntityType = retrieveEntityType(targetKey, workspaceId, entityTypes)
                val relationships = targetEntityType.relationships?.toMutableList() ?: return@forEach

                // Find and update the REFERENCE relationship
                relationships.find { relDef ->
                    relDef.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                            relDef.originRelationshipId == updated.id
                }.let {
                    if (it == null) throw IllegalStateException(
                        "Inverse REFERENCE relationship not found in target entity type '$targetKey' for ORIGIN relationship '${updated.name}'"
                    )

                    it.cardinality = newInverseCardinality
                    entityTypes[targetKey] = targetEntityType

                }
            }
        }

        // TODO: Handle entity payload data updates for cardinality changes
        // For restrictive changes (e.g., ONE_TO_MANY -> ONE_TO_ONE), we need to:
        // 1. Find all entities with relationship data for this relationship
        // 2. For relationships that violate the new cardinality, remove excess entries
        // 3. Determine which entries to keep (e.g., most recent, user-selected, etc.)
        // 4. Log data modifications for audit trail
        // 5. Consider user notification for data loss

        // Example: If changing from ONE_TO_MANY to ONE_TO_ONE:
        // - Find entities with multiple relationship values
        // - Keep only one value (potentially the first, or allow user to choose)
        // - Remove the rest
    }

    /**
     * Handles BIDIRECTIONAL_ENABLED: Creates inverse REFERENCE relationships for all target entity types.
     */
    private fun handleBidirectionalEnabled(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        updated: EntityRelationshipDefinition,
        workspaceId: UUID
    ) {
        require(updated.relationshipType == EntityTypeRelationshipType.ORIGIN) {
            "BIDIRECTIONAL_ENABLED can only be applied to ORIGIN relationships"
        }

        val targetKeys = requireNotNull(updated.bidirectionalEntityTypeKeys) {
            "bidirectionalEntityTypeKeys must not be null when enabling bidirectional relationship"
        }

        require(targetKeys.isNotEmpty()) {
            "bidirectionalEntityTypeKeys must not be empty when enabling bidirectional relationship"
        }

        // Create inverse REFERENCE relationships for each target entity type
        createInverseReferenceRelationships(
            originRelationship = updated,
            workspaceId = workspaceId,
            entityTypesByKey = entityTypes
        )
    }

    /**
     * Handles BIDIRECTIONAL_DISABLED: Removes all inverse REFERENCE relationships.
     */
    private fun handleBidirectionalDisabled(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        previous: EntityRelationshipDefinition,
        workspaceId: UUID
    ) {
        if (previous.relationshipType != EntityTypeRelationshipType.ORIGIN) {
            return
        }

        val targetKeys = previous.bidirectionalEntityTypeKeys ?: emptyList()

        targetKeys.forEach { targetKey ->
            removeInverseReferenceRelationship(
                targetEntityTypeKey = targetKey,
                originRelationshipId = previous.id,
                entityTypes = entityTypes,
                workspaceId = workspaceId
            )
        }

        // TODO: Clean up entity payload data for disabled bidirectional relationships
        // This requires:
        // 1. Finding all entities of target types that have inverse relationship data
        // 2. Removing the inverse relationship data from those entities
        // 3. Logging data removal for audit trail
        // 4. Consider user notification for data loss
    }

    /**
     * Handles BIDIRECTIONAL_TARGETS_CHANGED: Adds/removes inverse relationships based on the diff.
     */
    private fun handleBidirectionalTargetsChanged(
        entityTypes: MutableMap<String, EntityTypeEntity>,
        previous: EntityRelationshipDefinition,
        updated: EntityRelationshipDefinition,
        workspaceId: UUID
    ) {
        if (updated.relationshipType != EntityTypeRelationshipType.ORIGIN) {
            return
        }

        val previousTargets = (previous.bidirectionalEntityTypeKeys ?: emptyList()).toSet()
        val updatedTargets = (updated.bidirectionalEntityTypeKeys ?: emptyList()).toSet()

        // Find added and removed targets
        val addedTargets = updatedTargets - previousTargets
        val removedTargets = previousTargets - updatedTargets

        // Remove inverse relationships for removed targets
        removedTargets.forEach { targetKey ->
            removeInverseReferenceRelationship(
                targetEntityTypeKey = targetKey,
                originRelationshipId = updated.id,
                entityTypes = entityTypes,
                workspaceId = workspaceId
            )
        }

        // Add inverse relationships for added targets
        addedTargets.forEach { targetKey ->
            var targetEntityType = retrieveEntityType(targetKey, workspaceId, entityTypes)
            // Build the inverse REFERENCE relationship
            val inverseRelationship = EntityTypeReferenceRelationshipBuilder(
                origin = updated,
                targetEntity = targetEntityType.toModel()
            ).build()

            // Add the inverse relationship
            targetEntityType = addOrUpdateRelationship(targetEntityType, inverseRelationship)
            entityTypes[targetKey] = targetEntityType
        }
    }

    /**
     * Checks if a REFERENCE relationship name is still using the default inverse name.
     *
     * This includes:
     * - Exact match with inverse name
     * - Collision-resolved variants (e.g., "Inverse Name 2", "Inverse Name 3")
     */
    private fun isUsingDefaultInverseName(currentName: String, defaultInverseName: String): Boolean {
        // Exact match
        if (currentName == defaultInverseName) {
            return true
        }

        // Check for collision-resolved variant (e.g., "Inverse Name 2")
        val collisionPattern = Regex("^${Regex.escape(defaultInverseName)} \\d+$")
        return collisionPattern.matches(currentName)
    }

    /**
     * Resolves name collisions by appending a number if the desired name already exists.
     *
     * For example: "Inverse Name" -> "Inverse Name 2" -> "Inverse Name 3"
     */
    private fun resolveNameCollision(
        desiredName: String,
        existingRelationships: List<EntityRelationshipDefinition>,
        excludeId: UUID
    ): String {
        val existingNames = existingRelationships
            .filter { it.id != excludeId }
            .map { it.name }
            .toSet()

        if (!existingNames.contains(desiredName)) {
            return desiredName
        }

        // Find the next available number
        var counter = 2
        var candidateName: String
        do {
            candidateName = "$desiredName $counter"
            counter++
        } while (existingNames.contains(candidateName))

        return candidateName
    }

    /**
     * Validates that a bidirectional ORIGIN relationship is properly configured.
     */
    private fun validateOriginBidirectionalRelationship(relDef: EntityRelationshipDefinition) {
        // Validate entityTypeKeys is populated unless allowPolymorphic is true
        if (!relDef.allowPolymorphic) {
            relDef.entityTypeKeys.let {
                requireNotNull(it) {
                    "ORIGIN relationship '${relDef.name}' must have entityTypeKeys populated when allowPolymorphic is false."
                }
                require(it.isNotEmpty()) {
                    "ORIGIN relationship '${relDef.name}' must have at least one entity type in entityTypeKeys."
                }
            }
        }

        // Validate bidirectionalEntityTypeKeys is defined and is a subset of entityTypeKeys
        val bidirectionalKeys = requireNotNull(relDef.bidirectionalEntityTypeKeys) {
            "Bidirectional ORIGIN relationship '${relDef.name}' must have bidirectionalEntityTypeKeys defined."
        }

        if (!relDef.allowPolymorphic) {
            val entityTypeKeysSet = relDef.entityTypeKeys!!.toSet()
            val invalidKeys = bidirectionalKeys.filterNot { it in entityTypeKeysSet }
            require(invalidKeys.isEmpty()) {
                "Bidirectional ORIGIN relationship '${relDef.name}' has bidirectionalEntityTypeKeys that are not in entityTypeKeys: ${
                    invalidKeys.joinToString(
                        ", "
                    )
                }"
            }
        }
    }

    /**
     * Creates REFERENCE relationships on target entity types for a bidirectional ORIGIN relationship.
     * Returns the list of created REFERENCE relationships for validation.
     */
    private fun createInverseReferenceRelationships(
        originRelationship: EntityRelationshipDefinition,
        workspaceId: UUID,
        entityTypesByKey: MutableMap<String, EntityTypeEntity>
    ): List<EntityRelationshipDefinition> {
        val createdReferences = mutableListOf<EntityRelationshipDefinition>()
        val targetTypeKeys = requireNotNull(originRelationship.bidirectionalEntityTypeKeys) {
            "Bidirectional ORIGIN relationship must have bidirectionalEntityTypeKeys"
        }

        targetTypeKeys.forEach { targetKey ->
            var targetEntityType = retrieveEntityType(targetKey, workspaceId, entityTypesByKey)

            // Build the inverse REFERENCE relationship
            val inverseRelationship = EntityTypeReferenceRelationshipBuilder(
                origin = originRelationship,
                targetEntity = targetEntityType.toModel()
            ).build()

            // Add or update the inverse relationship on the target entity type
            targetEntityType = addOrUpdateRelationship(targetEntityType, inverseRelationship)
            entityTypesByKey[targetKey] = targetEntityType
            createdReferences.add(inverseRelationship)
        }

        return createdReferences
    }

    /**
     * Updates the ORIGIN relationship to include the REFERENCE relationship's source entity type
     * in its bidirectionalEntityTypeKeys and entityTypeKeys (if not polymorphic).
     */
    private fun updateOriginForReferenceRelationship(
        key: String,
        referenceRelationship: EntityRelationshipDefinition,
        workspaceId: UUID,
        entityTypesByKey: MutableMap<String, EntityTypeEntity>
    ) {
        val originRelationshipId = requireNotNull(referenceRelationship.originRelationshipId) {
            "REFERENCE relationship '${referenceRelationship.name}' must have originRelationshipId defined."
        }

        val originEntityTypeKey = requireNotNull(referenceRelationship.entityTypeKeys?.firstOrNull()) {
            "REFERENCE relationship '${referenceRelationship.name}' must have entityTypeKeys pointing to origin entity type."
        }

        var originEntityType = retrieveEntityType(originEntityTypeKey, workspaceId, entityTypesByKey)
        val relationships = requireNotNull(originEntityType.relationships) {
            "Origin entity type '$originEntityTypeKey' does not have any relationships defined."
        }.toMutableList()

        val originRelationshipIndex = relationships.indexOfFirst {
            it.id == originRelationshipId && it.relationshipType == EntityTypeRelationshipType.ORIGIN
        }

        require(originRelationshipIndex >= 0) {
            "Origin relationship with ID '$originRelationshipId' not found in entity type '$originEntityTypeKey'."
        }

        val originRelationship = relationships[originRelationshipIndex]
        referenceRelationship.sourceEntityTypeKey

        // Update bidirectionalEntityTypeKeys to include this entity type
        val updatedBidirectionalKeys = (originRelationship.bidirectionalEntityTypeKeys ?: emptyList()).toMutableList()
        if (!updatedBidirectionalKeys.contains(key)) {
            updatedBidirectionalKeys.add(key)
        }

        // Update entityTypeKeys if not polymorphic
        val updatedEntityTypeKeys = if (!originRelationship.allowPolymorphic) {
            val currentKeys = (originRelationship.entityTypeKeys ?: emptyList()).toMutableList()
            if (!currentKeys.contains(key)) {
                currentKeys.add(key)
            }
            currentKeys
        } else {
            originRelationship.entityTypeKeys
        }

        // Update the origin relationship
        val updatedOriginRelationship = originRelationship.copy(
            entityTypeKeys = updatedEntityTypeKeys,
            bidirectionalEntityTypeKeys = updatedBidirectionalKeys
        )

        relationships[originRelationshipIndex] = updatedOriginRelationship
        originEntityType = originEntityType.copy(relationships = relationships)
        entityTypesByKey[originEntityTypeKey] = originEntityType
    }

    /**
     * Adds or updates a relationship in an entity type.
     * Initializes a semantic metadata record for newly added relationships.
     */
    private fun addOrUpdateRelationship(
        entityType: EntityTypeEntity,
        newRelationship: EntityRelationshipDefinition
    ): EntityTypeEntity {
        val existingRelationships = entityType.relationships?.toMutableList() ?: mutableListOf()

        // Find existing relationship with same key
        val existingIndex = existingRelationships.indexOfFirst { it.id == newRelationship.id }

        if (existingIndex >= 0) {
            // Overwrite existing relationship
            existingRelationships[existingIndex] = newRelationship
        } else {
            // Add new relationship
            existingRelationships.add(newRelationship)

            // Append to table order
            entityType.columns += EntityTypeAttributeColumn(
                newRelationship.id,
                EntityPropertyType.RELATIONSHIP
            )

            // Initialize empty semantic metadata for the new relationship
            semanticMetadataService.initializeForTarget(
                entityTypeId = requireNotNull(entityType.id),
                workspaceId = requireNotNull(entityType.workspaceId),
                targetType = SemanticMetadataTargetType.RELATIONSHIP,
                targetId = newRelationship.id,
            )
        }

        return entityType.copy(relationships = existingRelationships)
    }

    /**
     * Find and validate all associated entity types referenced in the relationships.
     */
    private fun findAndValidateAssociatedEntityTypes(
        relationships: Collection<EntityRelationshipDefinition>,
        workspaceId: UUID
    ): Map<String, EntityTypeEntity> {
        // Fetch all referenced entity types to load from the database
        val referencedKeys = buildSet {
            relationships.forEach { rel ->
                add(rel.sourceEntityTypeKey)
                rel.entityTypeKeys?.let(::addAll)

                if (rel.allowPolymorphic) {
                    addAll(
                        requireNotNull(rel.bidirectionalEntityTypeKeys) {
                            "bidirectionalEntityTypeKeys must be provided when allowPolymorphic is true"
                        }
                    )
                }
            }
        }

        val entityTypes = entityTypeRepository
            .findByworkspaceIdAndKeyIn(workspaceId, referencedKeys.toList())

        val entityTypesByKey = entityTypes.associateBy { it.key }

        val missingKeys = referencedKeys - entityTypesByKey.keys
        if (missingKeys.isNotEmpty()) {
            throw IllegalArgumentException(
                "Referenced entity types do not exist: ${missingKeys.joinToString(", ")}"
            )
        }

        return entityTypesByKey
    }


}