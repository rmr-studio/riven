package riven.core.service.entity

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.exceptions.InvalidRelationshipException
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
        val existingRels = entityRelationshipRepository.findAllBySourceIdAndDefinitionIdForUpdate(id, definitionId)
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

        // Load ALL final-state targets (retained + new) for cardinality checks
        val finalTargetEntities = entityRepository.findAllById(requestedTargetIds).associateBy { requireNotNull(it.id) }

        val missingIds = toAdd - finalTargetEntities.keys
        require(missingIds.isEmpty()) {
            "Target entities not found: $missingIds"
        }

        val finalTypesByEntityId = finalTargetEntities.mapValues { it.value.typeId }
        val newTargetTypesByEntityId = finalTypesByEntityId.filterKeys { it in toAdd }

        validateTargets(definition, newTargetTypesByEntityId)
        enforceCardinality(definition, definitionId, finalTypesByEntityId, newTargetTypesByEntityId)

        val newRelationships = toAdd.map { targetId ->
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
     * Includes both forward links (entity is source) and inverse links (entity is target
     * with inverse_visible = true on the target rule).
     */
    fun findRelatedEntities(entityId: UUID, workspaceId: UUID): Map<UUID, List<EntityLink>> {
        val forward = entityRelationshipRepository.findEntityLinksBySourceId(entityId, workspaceId)
        val inverse = entityRelationshipRepository.findInverseEntityLinksByTargetId(entityId, workspaceId)

        return (forward + inverse)
            .groupBy { it.getDefinitionId() }
            .mapValues { (_, projections) ->
                projections.map { it.toEntityLink() }
            }
    }

    /**
     * Finds all entity links for multiple source entities, grouped by source then definition.
     * Includes both forward and inverse-visible links.
     */
    fun findRelatedEntities(entityIds: Set<UUID>, workspaceId: UUID): Map<UUID, Map<UUID, List<EntityLink>>> {
        val ids = entityIds.toTypedArray()
        val forward = entityRelationshipRepository.findEntityLinksBySourceIdIn(ids, workspaceId)
        val inverse = entityRelationshipRepository.findInverseEntityLinksByTargetIdIn(ids, workspaceId)

        return (forward + inverse)
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
     * Dispatches cardinality enforcement across both axes:
     * source-side (how many targets of each type a source can have) and
     * target-side (how many sources can link to each target).
     */
    private fun enforceCardinality(
        definition: RelationshipDefinition,
        definitionId: UUID,
        finalTypesByEntityId: Map<UUID, UUID>,
        newTargetTypesByEntityId: Map<UUID, UUID>,
    ) {
        enforceSourceSideCardinality(definition, finalTypesByEntityId)
        enforceTargetSideCardinality(definition, definitionId, newTargetTypesByEntityId)
    }

    /**
     * Enforces source-side cardinality: checks per-type limits on how many targets
     * of each type a source entity can have.
     *
     * Groups ALL final targets (retained + new) by type and checks each group
     * against the effective cardinality (rule override or definition default).
     */
    private fun enforceSourceSideCardinality(
        definition: RelationshipDefinition,
        finalTypesByEntityId: Map<UUID, UUID>,
    ) {
        val finalByType = finalTypesByEntityId.values.groupingBy { it }.eachCount()

        finalByType.forEach { (typeId, count) ->
            val effective = resolveCardinality(definition, typeId)
            val max = effective.maxSourceTargets()
            if (max != null && count > max) {
                throw InvalidRelationshipException(
                    "Having $count target(s) of type $typeId would exceed the per-type source-side limit of $max " +
                        "for relationship '${definition.name}' (${definition.id})."
                )
            }
        }
    }

    /**
     * Enforces target-side cardinality: for each NEW target, checks that the target
     * is not already linked by another source under this definition (when cardinality
     * requires target exclusivity).
     *
     * Applies to ONE_TO_ONE and ONE_TO_MANY (each target linked by at most one source).
     */
    private fun enforceTargetSideCardinality(
        definition: RelationshipDefinition,
        definitionId: UUID,
        newTargetTypesByEntityId: Map<UUID, UUID>,
    ) {
        newTargetTypesByEntityId.forEach { (targetId, typeId) ->
            val effective = resolveCardinality(definition, typeId)
            val max = effective.maxTargetSources()
            if (max != null) {
                val existingLinks = entityRelationshipRepository.findByTargetIdAndDefinitionId(targetId, definitionId)
                if (existingLinks.isNotEmpty()) {
                    throw InvalidRelationshipException(
                        "Target entity $targetId is already linked by source ${existingLinks.first().sourceId} " +
                            "under ${effective.name} relationship '${definition.name}' (${definition.id})."
                    )
                }
            }
        }
    }

    /**
     * Resolves the effective cardinality for a target type: uses the matching rule's
     * override if present, otherwise falls back to the definition default.
     */
    private fun resolveCardinality(
        definition: RelationshipDefinition,
        targetTypeId: UUID,
    ): EntityRelationshipCardinality {
        val rule = findMatchingRule(definition.targetRules, targetTypeId)
        return rule?.cardinalityOverride ?: definition.cardinalityDefault
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
 * Returns the maximum number of targets of a given type that a source entity can have.
 * Returns null for unlimited.
 *
 * ONE_TO_ONE / MANY_TO_ONE → 1 (source can have at most 1 target per type)
 * ONE_TO_MANY / MANY_TO_MANY → null (unlimited targets per type)
 */
private fun EntityRelationshipCardinality.maxSourceTargets(): Int? = when (this) {
    EntityRelationshipCardinality.ONE_TO_ONE -> 1
    EntityRelationshipCardinality.MANY_TO_ONE -> 1
    EntityRelationshipCardinality.ONE_TO_MANY -> null
    EntityRelationshipCardinality.MANY_TO_MANY -> null
}

/**
 * Returns the maximum number of sources that can link to a given target.
 * Returns null for unlimited.
 *
 * ONE_TO_ONE / ONE_TO_MANY → 1 (each target linked by at most 1 source)
 * MANY_TO_ONE / MANY_TO_MANY → null (unlimited sources per target)
 */
private fun EntityRelationshipCardinality.maxTargetSources(): Int? = when (this) {
    EntityRelationshipCardinality.ONE_TO_ONE -> 1
    EntityRelationshipCardinality.ONE_TO_MANY -> 1
    EntityRelationshipCardinality.MANY_TO_ONE -> null
    EntityRelationshipCardinality.MANY_TO_MANY -> null
}
