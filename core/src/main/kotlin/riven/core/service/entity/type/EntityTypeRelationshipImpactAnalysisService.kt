package riven.core.service.entity.type

import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipChangeType
import riven.core.enums.entity.EntityTypeRelationshipDataLossReason
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.models.entity.relationship.analysis.*
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository

@Service
class EntityTypeRelationshipImpactAnalysisService(
    private val entityTypeRepository: EntityRelationshipRepository,
    private val entityRepository: EntityRepository
) {
    fun analyze(
        sourceEntityType: EntityTypeEntity,
        diff: EntityTypeRelationshipDiff
    ): EntityTypeRelationshipImpactAnalysis {
        val warnings = mutableListOf<EntityTypeRelationshipDataLossWarning>()
        val deletions = mutableListOf<EntityImpactSummary>()
        val updates = mutableListOf<EntityImpactSummary>()
        val affectedTypes = mutableSetOf<String>()

        // Analyze removals
        for (removed in diff.removed) {
            if (removed.relationshipType == EntityTypeRelationshipType.ORIGIN && removed.bidirectional) {
                removed.bidirectionalEntityTypeKeys?.forEach { targetKey ->
                    affectedTypes += targetKey
                    deletions += EntityImpactSummary(
                        entityTypeKey = targetKey,
                        relationshipId = removed.id,
                        relationshipName = removed.name
                    )
                }
            }

            // Check for data loss
            // TODO Implement counting affected entities
            val affectedCount = 0L
//            val affectedCount = entityDataRepository
//                .countEntitiesWithRelationshipData(sourceEntityType.key, removed.id)
            if (affectedCount > 0) {
                warnings += EntityTypeRelationshipDataLossWarning(
                    entityTypeKey = sourceEntityType.key,
                    relationship = removed,
                    reason = EntityTypeRelationshipDataLossReason.RELATIONSHIP_DELETED,
                    estimatedImpactCount = affectedCount
                )
            }
        }


        // Analyze modifications
        for (mod in diff.modified) {
            analyzeModificationImpact(mod, affectedTypes, warnings, deletions, updates)
        }

        return EntityTypeRelationshipImpactAnalysis(
            affectedEntityTypes = affectedTypes.toList(),
            dataLossWarnings = warnings,
            removals = deletions,
            modifications = updates
        )
    }

    private fun analyzeModificationImpact(
        mod: EntityTypeRelationshipModification,
        affectedTypes: MutableSet<String>,
        warnings: MutableList<EntityTypeRelationshipDataLossWarning>,
        deletions: MutableList<EntityImpactSummary>,
        updates: MutableList<EntityImpactSummary>
    ) {
        val prev = mod.previous
        val upd = mod.updated

        // Bidirectional targets changed
        if (EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED in mod.changes) {
            val prevBiTargets = prev.bidirectionalEntityTypeKeys ?: emptySet()
            val updBiTargets = upd.bidirectionalEntityTypeKeys ?: emptySet()

            // Removed bidirectional targets → delete references
            (prevBiTargets - updBiTargets.toSet()).forEach { targetKey ->
                affectedTypes += targetKey
                deletions += EntityImpactSummary(targetKey, prev.id, prev.name)
            }
        }

        // Inverse name changed → update references
        if (EntityTypeRelationshipChangeType.INVERSE_NAME_CHANGED in mod.changes && prev.bidirectional) {
            prev.bidirectionalEntityTypeKeys?.forEach { targetKey ->
                affectedTypes += targetKey
                updates += EntityImpactSummary(
                    entityTypeKey = targetKey,
                    relationshipId = prev.id,
                    relationshipName = upd.name
                )
            }
        }

        // Cardinality changed → potentially update references + warn about data
        if (EntityTypeRelationshipChangeType.CARDINALITY_CHANGED in mod.changes) {
            if (isRestrictiveCardinalityChange(prev.cardinality, upd.cardinality)) {
                warnings += EntityTypeRelationshipDataLossWarning(
                    entityTypeKey = prev.sourceEntityTypeKey,
                    relationship = prev,
                    reason = EntityTypeRelationshipDataLossReason.CARDINALITY_RESTRICTION,
                    estimatedImpactCount = null  // Complex to calculate
                )
            }
        }
    }

    private fun isRestrictiveCardinalityChange(
        from: EntityRelationshipCardinality,
        to: EntityRelationshipCardinality
    ): Boolean {
        // Changes that could cause data loss
        return (from == EntityRelationshipCardinality.MANY_TO_MANY && to != EntityRelationshipCardinality.MANY_TO_MANY) ||
                (from == EntityRelationshipCardinality.ONE_TO_MANY && to == EntityRelationshipCardinality.ONE_TO_ONE) ||
                (from == EntityRelationshipCardinality.MANY_TO_ONE && to == EntityRelationshipCardinality.ONE_TO_ONE)
    }
}