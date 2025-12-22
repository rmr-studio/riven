package riven.core.service.entity.type

import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.entity.*
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.relationship.analysis.*
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import java.util.*

@Service
class EntityTypeRelationshipImpactAnalysisService(
    private val entityTypeRepository: EntityTypeRepository,
    private val entityRepository: EntityRepository
) {
    fun analyze(
        organisationId: UUID,
        sourceEntityType: EntityTypeEntity,
        diff: EntityTypeRelationshipDiff
    ): EntityTypeRelationshipImpactAnalysis {
        val warnings = mutableListOf<EntityTypeRelationshipDataLossWarning>()
        val deletions = mutableListOf<EntityImpactSummary>()
        val updates = mutableListOf<EntityImpactSummary>()
        val affectedTypes = mutableSetOf<String>()


        // Round up all entity types affected by the changes
        val entityTypeMap: Map<String, EntityTypeEntity> = entityTypeRepository
            .findByOrganisationIdAndKeyIn(
                organisationId,
                diff.removed.map { it.sourceEntityTypeKey } +
                        diff.modified.filter { it.changes.any { change -> change.canCauseImpact() } }.flatMap {
                            listOf(
                                it.previous.sourceEntityTypeKey,
                                it.updated.sourceEntityTypeKey
                            )
                        }
            )
            .associateBy { it.key }

        // Analyze removals
        diff.removed.forEach {
            analyseRelationRemovalImpact(it, entityTypeMap, affectedTypes, deletions, warnings)
        }

        // Analyze modifications
        diff.modified.forEach {
            analyzeModificationImpact(it, affectedTypes, warnings, deletions, updates)
        }

        return EntityTypeRelationshipImpactAnalysis(
            affectedEntityTypes = affectedTypes.toList(),
            dataLossWarnings = warnings,
            columnsRemoved = deletions,
            columnsModified = updates
        )
    }

    /**
     * Analyzes the impact of a modification to an entity type relationship.
     * Notable impacts would include
     * - Deletion of bidirectional targets. This would potentially delete records in other entity types that rely on this entity type.
     * - Changes to inverse names for bidirectional relationships. This would require updating the relationship name in other entity types that still use the default inverse name
     * - Changes to cardinality that could result in data loss (e.g. MANY_TO_MANY to ONE_TO_MANY), as existing columns that use a MANY cardinality may have multiple values that cannot be represented in the new cardinality.
     */
    private fun analyzeModificationImpact(
        entityTypeMap: Map<String, EntityTypeEntity>,
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
                    relationshipName = upd.name,
                    impact = "Column name in ${entityTypeMap[targetKey] ?: targetKey} changed from '${prev.inverseName}' to '${upd.inverseName}'"
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

                    )
            }
        }
    }

    private fun analyseRelationRemovalImpact(
        relationship: EntityRelationshipDefinition,
        entityTypeMap: Map<String, EntityTypeEntity>,
        affectedTypes: MutableSet<String>,
        removedColumns: MutableList<EntityImpactSummary>,
        dataLossWarnings: MutableList<EntityTypeRelationshipDataLossWarning>
    ) {

        if (relationship.relationshipType == EntityTypeRelationshipType.ORIGIN && relationship.bidirectional) {
            relationship.bidirectionalEntityTypeKeys?.forEach { targetKey ->
                affectedTypes += targetKey
                removedColumns.addLast(
                    EntityImpactSummary(
                        entityTypeKey = targetKey,
                        relationshipId = relationship.id,
                        relationshipName = relationship.name
                    )
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

    /**
     * Determines if the impact analysis contains notable impacts that require user confirmation.
     */
    fun hasNotableImpacts(impact: EntityTypeRelationshipImpactAnalysis): Boolean {
        return impact.affectedEntityTypes.isNotEmpty() ||
                impact.dataLossWarnings.isNotEmpty() ||
                impact.columnsRemoved.isNotEmpty()
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