package riven.core.service.entity.type

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.relationship.EntityTypeReferenceRelationshipBuilder
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipModification
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import java.util.*

/**
 * Service for managing relationships between entities.
 */
@Service
class EntityRelationshipService(
    private val entityTypeRepository: EntityTypeRepository,
    private val relationshipDiffService: EntityTypeRelationshipDiffService,
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

        validateRelationshipDefinitions(relationships, entityTypesMap)
    }

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

    private fun validateRelationshipDefinitions(
        relationships: List<EntityRelationshipDefinition>,
        entityTypesMap: Map<String, EntityTypeEntity>,
    ) {
        // Check for any naming collisions + Bi-directional inverse matching
        validateNamingCollisions(entityTypesMap.values.toList())

        relationships.forEach {
            if (it.bidirectional) {

                // Validate based on relationship type
                when (it.relationshipType) {
                    EntityTypeRelationshipType.ORIGIN -> {
                        // For ORIGIN relationships:
                        // 1. Validate bidirectionalEntityTypeKeys are in entityTypeKeys (if not polymorphic)
                        // 2. Cross-reference that each target entity type has a REFERENCE relationship pointing back

                        // Ensure bi-directional relationships have inverse names defined.
                        val inverseKeys = requireNotNull((it.bidirectionalEntityTypeKeys)) {
                            "Bidirectional relationship for '${it.name}' must have bidirectionalEntityTypeKeys defined."
                        }

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

                        // Ensure each target entity type has matching inverse REFERENCE definition
                        inverseKeys.forEach { targetKey ->
                            val type = requireNotNull(entityTypesMap[targetKey]) {
                                "Referenced entity type '$targetKey' does not exist."
                            }
                            val targetRelationships = requireNotNull(type.relationships) {
                                "Target entity type '$targetKey' does not currently define any relationships"
                            }

                            val inverseRelationship = targetRelationships.find { relDef ->
                                relDef.originRelationshipId == it.id && relDef.relationshipType == EntityTypeRelationshipType.REFERENCE
                            }

                            if (inverseRelationship == null) {
                                throw IllegalArgumentException(
                                    "Bidirectional ORIGIN relationship '${it.name}' does not have a matching inverse REFERENCE definition in target entity type '$targetKey'."
                                )
                            }
                        }
                    }

                    EntityTypeRelationshipType.REFERENCE -> {
                        // For REFERENCE relationships:
                        // Validate that this entity type is included in the origin relationship's bidirectionalEntityTypeKeys

                        val originRelationshipId = requireNotNull(it.originRelationshipId) {
                            "REFERENCE relationship '${it.name}' must have an originRelationshipId defined."
                        }

                        // Find the origin entity type and relationship
                        val originEntityTypeKey = requireNotNull(it.entityTypeKeys?.firstOrNull()) {
                            "REFERENCE relationship '${it.name}' must have entityTypeKeys pointing to the origin entity type."
                        }

                        val originEntityType = requireNotNull(entityTypesMap[originEntityTypeKey]) {
                            "Origin entity type '$originEntityTypeKey' does not exist for REFERENCE relationship '${it.name}'."
                        }

                        val origin: EntityRelationshipDefinition = requireNotNull(originEntityType.relationships) {
                            "Origin entity type '$originEntityTypeKey' does not define any relationships."
                        }.let { defs ->
                            requireNotNull(defs.find { relDef ->
                                relDef.id == originRelationshipId && relDef.relationshipType == EntityTypeRelationshipType.ORIGIN
                            }) { "REFERENCE relationship '${it.name}' references origin relationship ID '$originRelationshipId' which does not exist in entity type '$originEntityTypeKey'." }
                        }

                        // Validate this entity type is in the origin's bidirectionalEntityTypeKeys
                        requireNotNull(origin.bidirectionalEntityTypeKeys) {
                            "Origin relationship '${origin.name}' must have bidirectionalEntityTypeKeys defined for bidirectional REFERENCE relationship '${it.name}'."
                        }.run {
                            if (!this.contains(it.sourceEntityTypeKey)) {
                                throw IllegalArgumentException(
                                    "REFERENCE relationship '${it.name}' has sourceEntityTypeKey '${it.sourceEntityTypeKey}' which is not included in the origin relationship's bidirectionalEntityTypeKeys: ${
                                        this.joinToString(
                                            ", "
                                        )
                                    }."
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * This function will take in a list of entity type definitions that will be used to create new relationships
     * and update the current ecosystem of entity types within the organisation.
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
        id: UUID,
        definitions: List<EntityRelationshipDefinition>,
        organisationId: UUID
    ): List<EntityTypeEntity> {
        // Validate all associated entity types exist
        val entityTypes: MutableMap<String, EntityTypeEntity> = findAndValidateAssociatedEntityTypes(
            relationships = definitions,
            organisationId = organisationId
        ).toMutableMap()

        // Track all relationship definitions for final validation (including created inverses)
        val allRelationshipDefinitions = mutableListOf<EntityRelationshipDefinition>()

        // Group definitions by source entity type
        val definitionsBySourceType: Map<String, List<EntityRelationshipDefinition>> =
            definitions.groupBy { it.sourceEntityTypeKey }

        // Validate definitions
        definitionsBySourceType.forEach { (_, relDefs) ->
            // Validate and add each relationship definition
            relDefs.forEach { relDef ->
                // Validate bidirectional ORIGIN relationships before adding
                if (relDef.bidirectional && relDef.relationshipType == EntityTypeRelationshipType.ORIGIN) {
                    validateOriginBidirectionalRelationship(relDef)
                }

                allRelationshipDefinitions.add(relDef)
            }
        }

        // Handle bidirectional relationships
        definitionsBySourceType.forEach { (_, relDefs) ->
            relDefs.forEach { relDef ->
                if (!relDef.bidirectional) return@forEach
                when (relDef.relationshipType) {
                    // For ORIGIN bidirectional relationships: create REFERENCE relationships on target entity types
                    EntityTypeRelationshipType.ORIGIN -> {
                        val createdReferences = createInverseReferenceRelationships(
                            originRelationship = relDef,
                            organisationId = organisationId,
                            entityTypesByKey = entityTypes
                        )
                        allRelationshipDefinitions.addAll(createdReferences)
                    }

                    // For REFERENCE bidirectional relationships: update origin to include this entity type
                    EntityTypeRelationshipType.REFERENCE -> {
                        updateOriginForReferenceRelationship(
                            referenceRelationship = relDef,
                            organisationId = organisationId,
                            entityTypesByKey = entityTypes
                        )
                    }
                }
            }
        }

        // Save all affected entity types
        return entityTypeRepository.saveAll(entityTypes.values.toList()).also {
            validateRelationshipDefinitions(allRelationshipDefinitions, it.associateBy { type -> type.key })
        }.toList()
    }

    @Transactional
    fun updateRelationships(
        id: UUID,
        organisationId: UUID,
        curr: List<EntityRelationshipDefinition>,
        prev: List<EntityRelationshipDefinition>? = null
    ): List<EntityTypeEntity> {
        prev.let {
            if (it == null) {
                // No Diff. Just Add new
                return createRelationships(id, curr, organisationId)
            }

            val (added: List<EntityRelationshipDefinition>, removed: List<EntityRelationshipDefinition>, modified: List<EntityTypeRelationshipModification>) = relationshipDiffService.calculate(
                it,
                curr
            )



            createRelationships(id, added, organisationId)

            removed.forEach {

            }

            modified.forEach {

            }
        }
        TODO()
    }

    private fun removeRelationships() {}

    private fun modifyRelationships() {}

    /**
     * Validates that a bidirectional ORIGIN relationship is properly configured.
     */
    private fun validateOriginBidirectionalRelationship(relDef: EntityRelationshipDefinition) {
        // Validate entityTypeKeys is populated unless allowPolymorphic is true
        if (!relDef.allowPolymorphic) {
            requireNotNull(relDef.entityTypeKeys) {
                "ORIGIN relationship '${relDef.name}' must have entityTypeKeys populated when allowPolymorphic is false."
            }
            require(relDef.entityTypeKeys.isNotEmpty()) {
                "ORIGIN relationship '${relDef.name}' must have at least one entity type in entityTypeKeys."
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
        organisationId: UUID,
        entityTypesByKey: MutableMap<String, EntityTypeEntity>
    ): List<EntityRelationshipDefinition> {
        val createdReferences = mutableListOf<EntityRelationshipDefinition>()
        val targetTypeKeys = requireNotNull(originRelationship.bidirectionalEntityTypeKeys) {
            "Bidirectional ORIGIN relationship must have bidirectionalEntityTypeKeys"
        }

        targetTypeKeys.forEach { targetKey ->
            var targetEntityType = entityTypesByKey.getOrPut(targetKey) {
                entityTypeRepository.findByOrganisationIdAndKey(
                    organisationId,
                    targetKey
                ).orElse(null) ?: run {
                    // Entity type doesn't exist yet - skip for now
                    return@forEach
                }
            }

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
        referenceRelationship: EntityRelationshipDefinition,
        organisationId: UUID,
        entityTypesByKey: MutableMap<String, EntityTypeEntity>
    ) {
        val originRelationshipId = requireNotNull(referenceRelationship.originRelationshipId) {
            "REFERENCE relationship '${referenceRelationship.name}' must have originRelationshipId defined."
        }

        val originEntityTypeKey = requireNotNull(referenceRelationship.entityTypeKeys?.firstOrNull()) {
            "REFERENCE relationship '${referenceRelationship.name}' must have entityTypeKeys pointing to origin entity type."
        }

        var originEntityType = entityTypesByKey.getOrPut(originEntityTypeKey) {
            entityTypeRepository.findByOrganisationIdAndKey(
                organisationId,
                originEntityTypeKey
            ).orElseThrow {
                IllegalArgumentException("Origin entity type '$originEntityTypeKey' does not exist.")
            }
        }

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
        val sourceKey = referenceRelationship.sourceEntityTypeKey

        // Update bidirectionalEntityTypeKeys to include this entity type
        val updatedBidirectionalKeys = (originRelationship.bidirectionalEntityTypeKeys ?: emptyList()).toMutableList()
        if (!updatedBidirectionalKeys.contains(sourceKey)) {
            updatedBidirectionalKeys.add(sourceKey)
        }

        // Update entityTypeKeys if not polymorphic
        val updatedEntityTypeKeys = if (!originRelationship.allowPolymorphic) {
            val currentKeys = (originRelationship.entityTypeKeys ?: emptyList()).toMutableList()
            if (!currentKeys.contains(sourceKey)) {
                currentKeys.add(sourceKey)
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
        }

        return entityType.copy(relationships = existingRelationships)
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
            .findByOrganisationIdAndKeyIn(organisationId, referencedKeys.toList())

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