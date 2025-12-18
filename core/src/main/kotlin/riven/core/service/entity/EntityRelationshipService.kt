package riven.core.service.entity

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.util.OperationType
import riven.core.models.entity.Entity
import riven.core.models.entity.EntityRelationship
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.util.ServiceUtil.findManyResults
import riven.core.util.ServiceUtil.findOrThrow
import java.util.*

/**
 * Service for managing relationships between entities.
 */
@Service
class EntityRelationshipService(
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val entityRepository: EntityRepository,
    private val entityTypeRepository: EntityTypeRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {

    /**
     * Validates relationship definitions before syncing.
     * Checks that non-polymorphic relationships reference existing entity types.
     */
    private fun validateRelationshipDefinitions(
        relationships: List<EntityRelationshipDefinition>,
        organisationId: UUID
    ) {
        relationships.forEach { rel ->
            // Skip polymorphic relationships - they can reference any type
            if (rel.allowPolymorphic) return@forEach

            // Validate that all referenced entity types exist
            rel.entityTypeKeys?.forEach { typeKey ->
                val exists = entityTypeRepository.findByOrganisationIdAndKey(organisationId, typeKey)
                    .isPresent

                require(exists) {
                    "Relationship '${rel.key}' references non-existent entity type '$typeKey'"
                }
            }

            // Validate bidirectional target types exist
            rel.bidirectionalEntityTypeKeys?.forEach { typeKey ->
                val exists = entityTypeRepository.findByOrganisationIdAndKey(organisationId, typeKey)
                    .isPresent

                require(exists) {
                    "Relationship '${rel.key}' bidirectional target references non-existent entity type '$typeKey'"
                }
            }
        }
    }

    @Transactional
    fun syncRelationships(type: EntityTypeEntity, prev: List<EntityRelationshipDefinition>? = null) {
        val typeId = requireNotNull(type.id) { "Entity Type ID can not be null" }
        val organisationId = requireNotNull(type.organisationId) { "Organization ID can not be null" }
        val currentRelationships = type.relationships ?: emptyList()

        // STEP 0: Validate relationship definitions
        validateRelationshipDefinitions(currentRelationships, organisationId)

        // STEP 1: Handle completely removed relationships
        if (prev != null) {
            val currentKeys = currentRelationships.map { it.key }.toSet()
            val removedRelationships = prev.filter { !currentKeys.contains(it.key) }

            removedRelationships.forEach { removedRel ->
                // Cleanup instances of this relationship
                cleanupRemovedRelationshipInstances(
                    entityTypeId = typeId,
                    relationshipKey = removedRel.key,
                    organisationId = organisationId,
                )

                // If it was bidirectional, remove inverse definitions from target types
                if (removedRel.bidirectional && !removedRel.bidirectionalEntityTypeKeys.isNullOrEmpty()) {
                    removeBidirectionalSync(
                        sourceEntityTypeKey = type.key,
                        relationshipKey = removedRel.key,
                        targetEntityTypeKeys = removedRel.bidirectionalEntityTypeKeys,
                        organisationId = organisationId
                    )
                }
            }
        }

        // STEP 2: Handle bidirectionality changes on existing relationships
        if (prev != null) {
            currentRelationships.forEach { currentRel ->
                val previousRel = prev.find { it.key == currentRel.key }

                if (previousRel != null) {
                    // Case A: Was bidirectional, now unidirectional
                    if (previousRel.bidirectional && !currentRel.bidirectional) {
                        val targetTypes = previousRel.bidirectionalEntityTypeKeys ?: emptyList()
                        if (targetTypes.isNotEmpty()) {
                            // Remove inverse definitions from target types
                            removeBidirectionalSync(
                                sourceEntityTypeKey = type.key,
                                relationshipKey = currentRel.key,
                                targetEntityTypeKeys = targetTypes,
                                organisationId = organisationId
                            )
                            // Cleanup inverse relationship instances
                            cleanupBidirectionalInstances(
                                sourceEntityTypeId = typeId,
                                relationshipKey = currentRel.key,
                                targetEntityTypeKeys = targetTypes,
                                organisationId = organisationId
                            )
                        }
                    }
                    // Case B: Still bidirectional but target types changed
                    else if (previousRel.bidirectional && currentRel.bidirectional) {
                        val prevTargets = previousRel.bidirectionalEntityTypeKeys ?: emptyList()
                        val currentTargets = currentRel.bidirectionalEntityTypeKeys ?: emptyList()
                        val removedTargets = prevTargets - currentTargets.toSet()

                        if (removedTargets.isNotEmpty()) {
                            // Remove inverse definitions from removed target types
                            removeBidirectionalSync(
                                sourceEntityTypeKey = type.key,
                                relationshipKey = currentRel.key,
                                targetEntityTypeKeys = removedTargets,
                                organisationId = organisationId
                            )
                            // Cleanup inverse relationship instances for removed targets
                            cleanupBidirectionalInstances(
                                sourceEntityTypeId = typeId,
                                relationshipKey = currentRel.key,
                                targetEntityTypeKeys = removedTargets,
                                organisationId = organisationId
                            )
                        }
                    }
                }
            }
        }

        // STEP 3: Sync new/updated bidirectional relationships
        // This adds inverse relationship definitions to target entity types
        syncBidirectionalRelationships(
            key = type.key,
            organisationId = organisationId,
            relationships = currentRelationships
        )
    }

    /**
     * Create a relationship between two entities.
     * Bidirectionality is automatically determined from the relationship definition.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    @Transactional
    fun createRelationship(
        organisationId: UUID,
        sourceEntityId: UUID,
        targetEntityId: UUID,
        key: String
    ): List<EntityRelationshipEntity> {
        // Find Entity Relationship definition
        val source: Pair<Entity, EntityType> =
            findOrThrow { entityRepository.findById(sourceEntityId) }.let {
                // Run JPA lazy loading for type
                it.toModel(audit = false) to it.type.toModel()
            }
        val target: Pair<Entity, EntityType> =
            findOrThrow { entityRepository.findById(targetEntityId) }.let {
                // Run JPA lazy loading for type
                it.toModel(audit = false) to it.type.toModel()
            }

        // Get relationship definition and validate
        val relDef = validateRelationship(source, target.second, key)

        // Determine if inverse should be created based on definition and constraints
        val sourceEntityType = findOrThrow { entityRepository.findById(sourceEntityId) }.type
        val targetEntityType = findOrThrow { entityRepository.findById(targetEntityId) }.type
        val shouldCreateInverse = shouldCreateInverseRelationship(
            relationshipDef = relDef,
            sourceEntityType = sourceEntityType,
            targetEntityType = targetEntityType
        )

        // Validate inverse if needed
        if (shouldCreateInverse) {
            validateRelationship(target, source.second, key)
        }

        // Create primary relationship
        val sourceRelationship = EntityRelationshipEntity(
            organisationId = organisationId,
            sourceId = sourceEntityId,
            targetId = targetEntityId,
            key = key,
            label = relDef.name
        )

        // Create inverse relationship if constraints satisfied
        val inverseRelationship = if (shouldCreateInverse) {
            EntityRelationshipEntity(
                organisationId = organisationId,
                sourceId = targetEntityId,
                targetId = sourceEntityId,
                key = key,
                label = relDef.inverseName ?: relDef.name
            )
        } else null

        // Save relationships
        return if (inverseRelationship != null) {
            entityRelationshipRepository.saveAll(listOf(sourceRelationship, inverseRelationship))
        } else {
            listOf(entityRelationshipRepository.save(sourceRelationship))
        }.also {
            // Log activity for each relationship created
            it.forEach { relationship ->
                activityService.logActivity(
                    activity = Activity.ENTITY_RELATIONSHIP,
                    operation = OperationType.CREATE,
                    userId = authTokenService.getUserId(),
                    organisationId = relationship.organisationId,
                    entityId = relationship.id!!,
                    entityType = ApplicationEntityType.ENTITY,
                    details = mapOf(
                        "key" to relationship.key,
                        "sourceEntityId" to relationship.sourceId.toString(),
                        "targetEntityId" to relationship.targetId.toString()
                    )
                )
            }
        }
    }

    /**
     * Determines if an inverse relationship should be created based on:
     * 1. Relationship definition has bidirectional = true
     * 2. Target entity type is in bidirectionalEntityTypeKeys (if specified)
     */
    private fun shouldCreateInverseRelationship(
        relationshipDef: EntityRelationshipDefinition,
        sourceEntityType: EntityTypeEntity,
        targetEntityType: EntityTypeEntity
    ): Boolean {
        // Check if relationship is bidirectional
        if (!relationshipDef.bidirectional) {
            return false
        }

        // If bidirectionalEntityTypeKeys is not specified, allow all
        if (relationshipDef.bidirectionalEntityTypeKeys.isNullOrEmpty()) {
            return true
        }

        // Check if target entity type is in the allowed list
        return relationshipDef.bidirectionalEntityTypeKeys.contains(targetEntityType.key)
    }

    @Throws(IllegalArgumentException::class)
    private fun validateRelationship(
        source: Pair<Entity, EntityType>,
        target: EntityType,
        key: String
    ): EntityRelationshipDefinition {
        // Validation suitability to create relationship based on entity type
        val (_, sourceType) = source

        sourceType.relationships.let {
            requireNotNull(it) {
                "Source entity type '${sourceType.key}' does not currently define any relationships"
            }

            it.find { relDef -> relDef.key == key }.let { relationshipDef ->
                requireNotNull(relationshipDef) {
                    "Source entity type '${sourceType.key}' does not define relationship with key '$key'"
                }

                // Validate target entity type matches definition
                if (!relationshipDef.allowPolymorphic) {
                    relationshipDef.entityTypeKeys?.let { allowedTypes ->
                        require(allowedTypes.contains(target.key)) {
                            "Target entity type '${target.key}' is not allowed for relationship '${relationshipDef.key}'"
                        }
                    }
                }

                return relationshipDef
            }
        }
    }

    //todo
    // Check all target entity types for overlaps
    // Return list of overlaps with suggested resolutions
//    private fun validateRelationshipOverlaps(): List<RelationshipOverlap> {

//    }

    /**
     * Delete a relationship.
     */
    @Transactional
    fun deleteRelationship(id: UUID) {
        /**
         * TODO: If a entity relationship is defined as required. We would need to ensure that this
         * deletion does not remove the last validation relationship an entity has.
         * Would need to return a conflicting response. The following options would be possible:
         * 1. Prevent deletion if it would violate required relationship constraints.
         * 2. Cascade delete or archive related entities to maintain integrity.
         * 3. Provide a mechanism to reassign relationships before deletion.
         * */


        val existing = findOrThrow { entityRelationshipRepository.findById(id) }

        entityRelationshipRepository.deleteById(id)

        activityService.logActivity(
            activity = Activity.ENTITY_RELATIONSHIP,
            operation = OperationType.DELETE,
            userId = authTokenService.getUserId(),
            organisationId = existing.organisationId,
            entityId = id,
            entityType = ApplicationEntityType.ENTITY,
            details = mapOf(
                "key" to existing.key,
                "sourceEntityId" to existing.sourceId.toString(),
                "targetEntityId" to existing.targetId.toString()
            )
        )
    }

    /**
     * Get all relationships for an entity (as source or target).
     */
    fun getRelationshipsForEntity(entityId: UUID): List<EntityRelationship> {
        return findManyResults {
            entityRelationshipRepository.findAllRelationshipsForEntity(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get relationships where entity is the source.
     */
    fun getOutgoingRelationships(entityId: UUID): List<EntityRelationship> {
        return findManyResults {
            entityRelationshipRepository.findBySourceId(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get relationships where entity is the target.
     */
    fun getIncomingRelationships(entityId: UUID): List<EntityRelationship> {
        return findManyResults {
            entityRelationshipRepository.findByTargetId(entityId)
        }.map { it.toModel() }
    }

    // ========== BIDIRECTIONAL RELATIONSHIP SYNCHRONIZATION ==========

    /**
     * Synchronizes bidirectional relationships between entity types.
     * For each relationship with bidirectional=true, adds inverse relationship
     * to target entity types specified in bidirectionalEntityTypeKeys.
     *
     * If bidirectionalEntityTypeKeys is null/empty, defaults to all entityTypeKeys.
     * Polymorphic relationships cannot be bidirectional (would create circular dependencies).
     *
     * @param key The source entity type key
     * @param organisationId Organisation ID
     * @param relationships List of relationship definitions to sync
     * @return List of target entity types that were updated
     */
    private fun syncBidirectionalRelationships(
        key: String,
        organisationId: UUID,
        relationships: List<EntityRelationshipDefinition>,
    ): List<EntityTypeEntity> {

        val updatedTypes = mutableListOf<EntityTypeEntity>()

        relationships.filter { it.bidirectional }.forEach { relationship ->
            // Determine which entity types should have bidirectional relationship
            val targetTypeKeys = when {
                // Polymorphic relationships cannot be bidirectional
                relationship.allowPolymorphic -> {
                    // Skip polymorphic bidirectional relationships - they don't make sense
                    return@forEach
                }
                // If specific types are listed, use those
                !relationship.bidirectionalEntityTypeKeys.isNullOrEmpty() -> {
                    relationship.bidirectionalEntityTypeKeys
                }
                // Otherwise default to all allowed entity types
                !relationship.entityTypeKeys.isNullOrEmpty() -> {
                    relationship.entityTypeKeys
                }
                // No target types specified - skip
                else -> {
                    return@forEach
                }
            }

            targetTypeKeys.forEach { typeKey ->
                // Find target entity type
                val targetEntityType = entityTypeRepository.findByOrganisationIdAndKey(
                    organisationId,
                    typeKey
                ).orElse(null)

                if (targetEntityType == null) {
                    // Log warning but continue - target type might not exist yet
                    // This is okay for forward references
                    return@forEach
                }

                // Create inverse relationship definition
                val inverseRelationship = createInverseRelationship(
                    relationship,
                    key
                )

                // Add or update inverse on target entity type
                val updatedTarget = addOrUpdateRelationship(
                    targetEntityType,
                    inverseRelationship
                )

                // Save updated target entity type
                entityTypeRepository.save(updatedTarget)
                updatedTypes.add(updatedTarget)
            }
        }

        return updatedTypes
    }

    /**
     * Creates an inverse relationship definition from a forward relationship.
     */
    private fun createInverseRelationship(
        forwardRelationship: EntityRelationshipDefinition,
        sourceEntityTypeKey: String
    ): EntityRelationshipDefinition {
        return EntityRelationshipDefinition(
            name = forwardRelationship.inverseName ?: forwardRelationship.name,
            key = forwardRelationship.key,  // Same key for both directions
            required = false,  // Inverse is typically optional
            cardinality = invertCardinality(forwardRelationship.cardinality),
            entityTypeKeys = listOf(sourceEntityTypeKey),  // Points back to source
            allowPolymorphic = false,  // Inverse is not polymorphic
            bidirectional = true,  // Mark as bidirectional
            bidirectionalEntityTypeKeys = listOf(sourceEntityTypeKey),  // Points back
            inverseName = forwardRelationship.name  // Original name becomes inverse name
        )
    }

    /**
     * Inverts relationship cardinality for inverse relationships.
     */
    private fun invertCardinality(
        cardinality: EntityRelationshipCardinality
    ): EntityRelationshipCardinality {
        return when (cardinality) {
            EntityRelationshipCardinality.ONE_TO_ONE ->
                EntityRelationshipCardinality.ONE_TO_ONE

            EntityRelationshipCardinality.ONE_TO_MANY ->
                EntityRelationshipCardinality.MANY_TO_ONE

            EntityRelationshipCardinality.MANY_TO_ONE ->
                EntityRelationshipCardinality.ONE_TO_MANY

            EntityRelationshipCardinality.MANY_TO_MANY ->
                EntityRelationshipCardinality.MANY_TO_MANY
        }
    }

    /**
     * Adds or updates a relationship in an entity type.
     * If relationship with same key exists, overwrites it (last write wins).
     */
    private fun addOrUpdateRelationship(
        entityType: EntityTypeEntity,
        newRelationship: EntityRelationshipDefinition
    ): EntityTypeEntity {
        val existingRelationships = entityType.relationships?.toMutableList() ?: mutableListOf()

        // Find existing relationship with same key
        val existingIndex = existingRelationships.indexOfFirst { it.key == newRelationship.key }

        if (existingIndex >= 0) {
            // Overwrite existing relationship
            existingRelationships[existingIndex] = newRelationship
        } else {
            // Add new relationship
            existingRelationships.add(newRelationship)
        }

        return entityType.copy(relationships = existingRelationships)
    }

    /**
     * Removes inverse relationships from target entity types when a bidirectional
     * relationship is deleted or made unidirectional.
     */
    @Transactional
    fun removeBidirectionalSync(
        sourceEntityTypeKey: String,
        relationshipKey: String,
        targetEntityTypeKeys: List<String>,
        organisationId: UUID
    ) {
        targetEntityTypeKeys.forEach { targetKey ->
            val targetEntityType = entityTypeRepository.findByOrganisationIdAndKey(
                organisationId,
                targetKey
            ).orElse(null) ?: return@forEach

            // Remove relationship with matching key that points back to source
            val updatedRelationships = targetEntityType.relationships?.filterNot {
                it.key == relationshipKey && it.entityTypeKeys?.contains(sourceEntityTypeKey) == true
            }

            entityTypeRepository.save(targetEntityType.copy(relationships = updatedRelationships))
        }
    }

    /**
     * Cleans up EntityRelationshipEntity instances when relationship definitions are removed.
     * Removes all relationship records with the given key for entities of the given type.
     */
    @Transactional
    fun cleanupRemovedRelationshipInstances(
        entityTypeId: UUID,
        relationshipKey: String,
        organisationId: UUID
    ) {
        // Find all entities of this type
        val entities = entityRepository.findByOrganisationIdAndTypeId(organisationId, entityTypeId)

        entities.forEach { entity ->
            // Find and delete all relationships with this key where entity is the source
            val relationships = entityRelationshipRepository.findAllBySourceIdAndKey(entity.id!!, relationshipKey)
            entityRelationshipRepository.deleteAll(relationships)

            // Log activity for each deleted relationship
            relationships.forEach { relationship ->
                activityService.logActivity(
                    activity = Activity.ENTITY_RELATIONSHIP,
                    operation = OperationType.DELETE,
                    userId = authTokenService.getUserId(),
                    organisationId = organisationId,
                    entityId = relationship.id!!,
                    entityType = ApplicationEntityType.ENTITY,
                    details = mapOf(
                        "key" to relationship.key,
                        "sourceEntityId" to relationship.sourceId.toString(),
                        "targetEntityId" to relationship.targetId.toString(),
                        "reason" to "Relationship definition removed from entity type"
                    )
                )
            }
        }
    }

    /**
     * Cleans up inverse EntityRelationshipEntity instances when bidirectionality is removed
     * or when target entity types are removed from bidirectionalEntityTypeKeys.
     */
    @Transactional
    fun cleanupBidirectionalInstances(
        sourceEntityTypeId: UUID,
        relationshipKey: String,
        targetEntityTypeKeys: List<String>,
        organisationId: UUID
    ) {
        // Find all source entities of this type
        val sourceEntities = entityRepository.findByOrganisationIdAndTypeId(organisationId, sourceEntityTypeId)

        sourceEntities.forEach { sourceEntity ->
            // Find all relationships with this key where source entity is the source
            val forwardRelationships = entityRelationshipRepository.findAllBySourceIdAndKey(
                sourceEntity.id!!,
                relationshipKey
            )

            forwardRelationships.forEach { forwardRel ->
                // Get the target entity
                val targetEntity = entityRepository.findById(forwardRel.targetId).orElse(null) ?: return@forEach

                // Check if target entity type is in the removed list
                if (targetEntityTypeKeys.contains(targetEntity.type.key)) {
                    // Find and delete the inverse relationship (target → source)
                    val inverseRelationships = entityRelationshipRepository.findBySourceIdAndTargetIdAndKey(
                        forwardRel.targetId,
                        forwardRel.sourceId,
                        relationshipKey
                    )

                    entityRelationshipRepository.deleteAll(inverseRelationships)

                    // Log activity for each deleted inverse relationship
                    inverseRelationships.forEach { inverseRel ->
                        activityService.logActivity(
                            activity = Activity.ENTITY_RELATIONSHIP,
                            operation = OperationType.DELETE,
                            userId = authTokenService.getUserId(),
                            organisationId = organisationId,
                            entityId = inverseRel.id!!,
                            entityType = ApplicationEntityType.ENTITY,
                            details = mapOf(
                                "key" to inverseRel.key,
                                "sourceEntityId" to inverseRel.sourceId.toString(),
                                "targetEntityId" to inverseRel.targetId.toString(),
                                "reason" to "Bidirectionality removed or target type removed from bidirectionalEntityTypeKeys"
                            )
                        )
                    }
                }
            }
        }
    }
}
