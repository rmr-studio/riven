package riven.core.service.entity

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.models.entity.EntityLink
import riven.core.models.entity.RelationshipDefinition
import riven.core.models.entity.RelationshipTargetRule
import riven.core.projection.entity.toEntityLink
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import java.util.*

/**
 * Service for managing entity relationship instances.
 *
 * Handles creating/removing individual relationship links between entities,
 * with write-time cardinality enforcement and target type validation.
 * No inverse row storage — bidirectional visibility is resolved at query time.
 */
@Service
class EntityRelationshipService(
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val entityRepository: EntityRepository,
    private val logger: KLogger,
) {

    // ------ Save relationships ------

    /**
     * Saves relationships for a single definition on a source entity.
     *
     * Diffs the current links against the requested targets:
     * additions are validated and inserted, removals are deleted.
     * Cardinality is enforced at write time based on the definition and matching target rules.
     *
     * @param id Source entity ID
     * @param workspaceId Workspace ID
     * @param definitionId The relationship definition ID
     * @param definition Pre-loaded relationship definition with target rules
     * @param targetIds Requested target entity IDs (the desired end state)
     */
    @Transactional
    fun saveRelationships(
        id: UUID,
        workspaceId: UUID,
        definitionId: UUID,
        definition: RelationshipDefinition,
        targetIds: List<UUID>,
    ) {
        val existingRels = entityRelationshipRepository.findAllBySourceIdAndDefinitionId(id, definitionId)
        val existingTargetIds = existingRels.map { it.targetId }.toSet()
        val requestedTargetIds = targetIds.toSet()

        val toAdd = requestedTargetIds - existingTargetIds
        val toRemove = existingTargetIds - requestedTargetIds

        // Remove stale links
        if (toRemove.isNotEmpty()) {
            entityRelationshipRepository.deleteAllBySourceIdAndDefinitionIdAndTargetIdIn(id, definitionId, toRemove)
        }

        // Nothing to add — done
        if (toAdd.isEmpty()) return

        // Validate and create new links
        val targetEntities = entityRepository.findAllById(toAdd).associateBy { requireNotNull(it.id) }

        validateTargets(definition, targetEntities.mapValues { it.value.typeId })
        enforceCardinality(definition, id, definitionId, existingTargetIds.size - toRemove.size, toAdd.size, targetEntities.mapValues { it.value.typeId })

        val newRelationships = toAdd.mapNotNull { targetId ->
            if (!targetEntities.containsKey(targetId)) return@mapNotNull null
            EntityRelationshipEntity(
                workspaceId = workspaceId,
                sourceId = id,
                targetId = targetId,
                definitionId = definitionId,
            )
        }

        entityRelationshipRepository.saveAll(newRelationships)
    }

    // ------ Read ------

    /**
     * Finds all entity links for a source entity, grouped by definition ID.
     */
    fun findRelatedEntities(entityId: UUID, workspaceId: UUID): Map<UUID, List<EntityLink>> {
        return entityRelationshipRepository.findEntityLinksBySourceId(entityId, workspaceId)
            .groupBy { it.getDefinitionId() }
            .mapValues { (_, projections) ->
                projections.map { it.toEntityLink() }
            }
    }

    /**
     * Finds all entity links for multiple source entities, grouped by source then definition.
     */
    fun findRelatedEntities(entityIds: Set<UUID>, workspaceId: UUID): Map<UUID, Map<UUID, List<EntityLink>>> {
        return entityRelationshipRepository.findEntityLinksBySourceIdIn(entityIds.toTypedArray(), workspaceId)
            .groupBy { it.getSourceEntityId() }
            .mapValues { (_, projections) ->
                projections.groupBy { it.getDefinitionId() }
                    .mapValues { (_, fieldProjections) ->
                        fieldProjections.map { it.toEntityLink() }
                    }
            }
    }

    /**
     * Finds all relationships where the given entities are targets.
     */
    fun findByTargetIdIn(ids: List<UUID>): Map<UUID, List<EntityRelationshipEntity>> {
        return entityRelationshipRepository.findByTargetIdIn(ids).groupBy { it.targetId }
    }

    /**
     * Soft-deletes all relationships involving the given entities (as source or target).
     */
    fun archiveEntities(ids: Collection<UUID>, workspaceId: UUID): List<EntityRelationshipEntity> {
        return entityRelationshipRepository.deleteEntities(ids.toTypedArray(), workspaceId)
    }

    // ------ Private validation helpers ------

    /**
     * Validates that all target entity types are allowed by the definition's target rules.
     *
     * For polymorphic definitions, all targets are accepted.
     * For non-polymorphic definitions, each target must match a rule by explicit type ID
     * or semantic constraint (semantic lookup is stubbed for now).
     */
    private fun validateTargets(
        definition: RelationshipDefinition,
        targetTypesByEntityId: Map<UUID, UUID>,
    ) {
        if (definition.allowPolymorphic) return

        val rules = definition.targetRules
        targetTypesByEntityId.forEach { (entityId, typeId) ->
            val matchingRule = findMatchingRule(rules, typeId)
            if (matchingRule == null) {
                throw IllegalArgumentException(
                    "Target entity $entityId has type $typeId which is not allowed by relationship definition '${definition.name}' (${definition.id})"
                )
            }
        }
    }

    /**
     * Enforces cardinality constraints for the relationship.
     *
     * Determines the effective cardinality (rule override or definition default)
     * and validates that the total link count after additions won't exceed the limit.
     */
    private fun enforceCardinality(
        definition: RelationshipDefinition,
        sourceEntityId: UUID,
        definitionId: UUID,
        existingCount: Int,
        addCount: Int,
        targetTypesByEntityId: Map<UUID, UUID>,
    ) {
        val totalAfterAdd = existingCount + addCount
        val maxAllowed = resolveMaxLinks(definition, targetTypesByEntityId.values.toSet())

        if (maxAllowed != null && totalAfterAdd > maxAllowed) {
            throw IllegalArgumentException(
                "Adding $addCount link(s) would exceed the cardinality limit of $maxAllowed for relationship '${definition.name}' (${definition.id}). Current count: $existingCount."
            )
        }
    }

    /**
     * Resolves the maximum number of target links allowed based on cardinality.
     *
     * For ONE_TO_ONE and MANY_TO_ONE: max 1 target per source.
     * For ONE_TO_MANY and MANY_TO_MANY: unlimited (null).
     *
     * If any target type has a cardinality override, the most restrictive applies.
     */
    private fun resolveMaxLinks(
        definition: RelationshipDefinition,
        targetTypeIds: Set<UUID>,
    ): Int? {
        val effectiveCardinalities = targetTypeIds.map { typeId ->
            val rule = findMatchingRule(definition.targetRules, typeId)
            rule?.cardinalityOverride ?: definition.cardinalityDefault
        }

        // Use the most restrictive cardinality across all target types
        val mostRestrictive = effectiveCardinalities.minByOrNull { it.maxTargets() } ?: definition.cardinalityDefault
        return mostRestrictive.maxTargets()
    }

    /**
     * Finds a matching target rule for a given target entity type ID.
     */
    private fun findMatchingRule(
        rules: List<RelationshipTargetRule>,
        targetTypeId: UUID,
    ): RelationshipTargetRule? {
        // First: exact type ID match
        val typeMatch = rules.find { it.targetEntityTypeId == targetTypeId }
        if (typeMatch != null) return typeMatch

        // Second: semantic constraint match (stubbed — semantic lookup not yet available)
        // When entity-type-level semantic classification is implemented, this will query
        // EntityTypeSemanticMetadata to check if the target type matches the constraint.
        // For now, semantic-only rules don't match any target types at runtime.
        return null
    }
}

/**
 * Returns the maximum number of target links a source entity can have under this cardinality.
 * Returns null for unlimited.
 */
private fun EntityRelationshipCardinality.maxTargets(): Int? = when (this) {
    EntityRelationshipCardinality.ONE_TO_ONE -> 1
    EntityRelationshipCardinality.MANY_TO_ONE -> 1
    EntityRelationshipCardinality.ONE_TO_MANY -> null
    EntityRelationshipCardinality.MANY_TO_MANY -> null
}
