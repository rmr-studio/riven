package riven.core.service.entity.type

import org.springframework.stereotype.Service
import riven.core.enums.entity.EntityTypeRelationshipChangeType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipModification

@Service
class EntityTypeRelationshipDiffService {
    fun calculateModification(
        previous: EntityRelationshipDefinition,
        updated: EntityRelationshipDefinition
    ): EntityTypeRelationshipModification {
        val changes = mutableSetOf<EntityTypeRelationshipChangeType>()

        if (previous.name != updated.name)
            changes += EntityTypeRelationshipChangeType.NAME_CHANGED
        if (previous.cardinality != updated.cardinality)
            changes += EntityTypeRelationshipChangeType.CARDINALITY_CHANGED
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
        // Only really care about target changes in an event where bi-directional is not enabled in the same calculation. As it would be implied that targets changed if enabling.
        if (previous.bidirectionalEntityTypeKeys != updated.bidirectionalEntityTypeKeys && !changes.contains(
                EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED
            )
        )
            changes += EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED

        return EntityTypeRelationshipModification(previous, updated, changes)
    }
}