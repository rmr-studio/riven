package riven.core.service.entity.type

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
import riven.core.util.ServiceUtil
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
     * Validates an entity types relationships
     * 1. Check all reference target entity types exist
     * 2. Check for any naming collisions
     * 3. Validates that all bi-directional relationships have an inverse correctly defined
     */
    private fun validateRelationshipDefinitions(
        relationships: List<EntityRelationshipDefinition>,
        organisationId: UUID
    ) {
        // Fetch all referenced entity types to load from the database
        val entityTypesMap: Map<String, EntityTypeEntity> = findAndValidateAssociatedEntityTypes(
            relationships = relationships,
            organisationId = organisationId
        )

        // Check for any naming collisions + Bi-directional inverse matching
        val nameSet: MutableSet<String> = mutableSetOf()
        relationships.forEach {
            it.name.let { name ->
                if (nameSet.contains(name)) {
                    throw IllegalArgumentException("Relationship name collision detected: '$name'")
                } else {
                    nameSet.add(name)
                }
            }


            if (it.bidirectional) {
                // Ensure bi-directional relationships have inverse names defined.
                // But also are included in original subset of entity type keys, given that the relationship is not polymorphic
                val inverseKeys = requireNotNull((it.bidirectionalEntityTypeKeys))

                if (it.inverseName.isNullOrBlank()) {
                    throw IllegalArgumentException("Bidirectional relationship for '${it.name}' must have an inverseName defined.")
                }

                if (!it.allowPolymorphic) {
                    val keys = requireNotNull(it.entityTypeKeys).toSet()
                    inverseKeys.forEach { targetKey ->
                        if (!keys.contains(targetKey)) {
                            throw IllegalArgumentException("Bidirectional relationship for '${it.name}' includes target entity type '$targetKey' which is not in the original entityTypeKeys list.")
                        }
                    }
                }

                // Ensure bi-directional relationships have matching inverse definitions
                inverseKeys.forEach { targetKey ->
                    // We should have already validated this prior. But i like to avoid type assertions
                    val type = requireNotNull(entityTypesMap[targetKey]) {
                        "Referenced entity type '$targetKey' does not exist."
                    }
                    type.relationships.let { targetRelationships ->
                        requireNotNull(targetRelationships) {
                            "Target entity type '$targetKey' does not currently define any relationships"
                        }

                        targetRelationships.find { relDef ->
                            relDef.originRelationshipId == it.id
                        }.run {
                            if (this == null) {
                                throw IllegalArgumentException("Bidirectional relationship for '${it.name}' does not have a matching inverse definition in target entity type '$targetKey'.")
                            }
                        }
                    }
                }
            }
        }
    }

    @Transactional
    fun createRelationships(
        definitions: List<EntityRelationshipDefinition>,
        organisationId: UUID
    ): List<EntityTypeEntity> {


        findAndValidateAssociatedEntityTypes(
            relationships = definitions,
            organisationId = organisationId
        )
        // Group definitions by source entity type
        val definitionsBySourceType: Map<String, List<EntityRelationshipDefinition>> =
            definitions.groupBy { it.sourceEntityTypeKey }

        val updatedEntityTypes = mutableListOf<EntityTypeEntity>()

        // For each source entity type, add/update relationships
        definitionsBySourceType.forEach { (sourceTypeKey, relDefs) ->
            val entityType = entityTypeRepository.findByOrganisationIdAndKey(
                organisationId,
                sourceTypeKey
            ).orElseThrow {
                IllegalArgumentException("Source entity type '$sourceTypeKey' does not exist.")
            }

            // Add or update each relationship definition
            var updatedEntityType = entityType
            relDefs.forEach { relDef ->
                updatedEntityType = addOrUpdateRelationship(
                    updatedEntityType,
                    relDef
                )
            }


            updatedEntityTypes.add(updatedEntityType)

            // Sync bidirectional relationships
            val bidirectionalUpdatedTypes = syncBidirectionalRelationships(
                key = sourceTypeKey,
                organisationId = organisationId,
                relationships = relDefs
            )
            updatedEntityTypes.addAll(bidirectionalUpdatedTypes)
        }

        // Save affected entity types and validate updated environment to ensure correctness
        return entityTypeRepository.saveAll(updatedEntityTypes).also {
            validateRelationshipDefinitions(definitions, organisationId)
        }
    }

    /**
     * Find and validate all associated entity types referenced in the relationships.
     */
    private fun findAndValidateAssociatedEntityTypes(
        relationships: Collection<EntityRelationshipDefinition>,
        organisationId: UUID
    ): Map<String, EntityTypeEntity> {
        // Fetch all referenced entity types to load from the database
        val referencedKeys = buildSet {
            relationships.forEach { rel ->
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
            .findByOrganisationIdAndKeyIn(organisationId, referencedKeys)

        val entityTypesByKey = entityTypes.associateBy { it.key }

        val missingKeys = referencedKeys - entityTypesByKey.keys
        if (missingKeys.isNotEmpty()) {
            throw IllegalArgumentException(
                "Referenced entity types do not exist: ${missingKeys.joinToString(", ")}"
            )
        }

        return entityTypesByKey
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
            ServiceUtil.findOrThrow { entityRepository.findById(sourceEntityId) }.let {
                // Run JPA lazy loading for type
                it.toModel(audit = false) to it.type.toModel()
            }
        val target: Pair<Entity, EntityType> =
            ServiceUtil.findOrThrow { entityRepository.findById(targetEntityId) }.let {
                // Run JPA lazy loading for type
                it.toModel(audit = false) to it.type.toModel()
            }

        // Get relationship definition and validate
        val relDef = validateRelationship(source, target.second, key)

        // Determine if inverse should be created based on definition and constraints
        val sourceEntityType = ServiceUtil.findOrThrow { entityRepository.findById(sourceEntityId) }.type
        val targetEntityType = ServiceUtil.findOrThrow { entityRepository.findById(targetEntityId) }.type
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


        val existing = ServiceUtil.findOrThrow { entityRelationshipRepository.findById(id) }

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
        return ServiceUtil.findManyResults {
            entityRelationshipRepository.findAllRelationshipsForEntity(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get relationships where entity is the source.
     */
    fun getOutgoingRelationships(entityId: UUID): List<EntityRelationship> {
        return ServiceUtil.findManyResults {
            entityRelationshipRepository.findBySourceId(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get relationships where entity is the target.
     */
    fun getIncomingRelationships(entityId: UUID): List<EntityRelationship> {
        return ServiceUtil.findManyResults {
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
                // If specific bidirectional types are listed, use those (even for polymorphic relationships)
                !relationship.bidirectionalEntityTypeKeys.isNullOrEmpty() -> {
                    relationship.bidirectionalEntityTypeKeys
                }
                // For polymorphic relationships without specific bidirectionalEntityTypeKeys, skip
                // (unrestricted polymorphic bidirectional doesn't make sense)
                relationship.allowPolymorphic -> {
                    return@forEach
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
            sourceKey = sourceEntityTypeKey,  // Original source entity type key
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