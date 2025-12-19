package riven.core.service.entity.type

import org.springframework.stereotype.Service
import riven.core.enums.entity.EntityTypeRelationshipChangeType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.relationship.EntityTypeRelationshipDiff
import riven.core.models.entity.relationship.EntityTypeRelationshipModification
import java.util.UUID

@Service
class RelationshipDiffService {
    fun calculate(
        previous: List<EntityRelationshipDefinition>,
        updated: List<EntityRelationshipDefinition>
    ): EntityTypeRelationshipDiff {
        val previousById = previous.associateBy { it.id }
        val updatedById = updated.associateBy { it.id }

        val previousIds: Set<UUID> = previousById.keys
        val updatedIds: Set<UUID> = updatedById.keys

        val addedIds: Set<UUID> = updatedIds - previousIds
        val removedIds: Set<UUID> = previousIds - updatedIds
        val potentiallyModifiedIds: Set<UUID> = previousIds.intersect(updatedIds)

        val added = addedIds.map { updatedById[it]!! }
        val removed = removedIds.map { previousById[it]!! }

        val modified = potentiallyModifiedIds.toList()
            .map { id: UUID ->
                val (prev, updated) = id.let {
                    previousById.getValue(it) to updatedById.getValue(it)
                }
                calculateModification(prev, updated)
            }
            .filter { it.changes.isNotEmpty() }

        return EntityTypeRelationshipDiff(added, removed, modified)
    }

    private fun calculateModification(
        previous: EntityRelationshipDefinition,
        updated: EntityRelationshipDefinition
    ): EntityTypeRelationshipModification {
        val changes = mutableSetOf<EntityTypeRelationshipChangeType>()

        if (previous.name != updated.name)
            changes += EntityTypeRelationshipChangeType.NAME_CHANGED
        if (previous.cardinality != updated.cardinality)
            changes += EntityTypeRelationshipChangeType.CARDINALITY_CHANGED
        if (previous.required != updated.required)
            changes += EntityTypeRelationshipChangeType.REQUIRED_CHANGED
        if (previous.inverseName != updated.inverseName)
            changes += EntityTypeRelationshipChangeType.INVERSE_NAME_CHANGED

        // Target type changes
        val prevTargets = previous.entityTypeKeys ?: emptySet()
        val updTargets = updated.entityTypeKeys ?: emptySet()
        if ((updTargets - prevTargets.toSet()).isNotEmpty())
            changes += EntityTypeRelationshipChangeType.TARGET_TYPES_ADDED
        if ((prevTargets - updTargets.toSet()).isNotEmpty())
            changes += EntityTypeRelationshipChangeType.TARGET_TYPES_REMOVED

        // Bidirectional changes
        if (!previous.bidirectional && updated.bidirectional)
            changes += EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED
        if (previous.bidirectional && !updated.bidirectional)
            changes += EntityTypeRelationshipChangeType.BIDIRECTIONAL_DISABLED
        if (previous.bidirectionalEntityTypeKeys != updated.bidirectionalEntityTypeKeys)
            changes += EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED

        return EntityTypeRelationshipModification(previous, updated, changes)
    }
}