package riven.core.service.entity.type

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.RelationshipDefinitionEntity
import riven.core.entity.entity.RelationshipTargetRuleEntity
import riven.core.enums.activity.Activity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.entity.semantics.SemanticMetadataTargetType
import riven.core.enums.util.OperationType
import riven.core.models.entity.RelationshipDefinition
import riven.core.models.entity.RelationshipTargetRule
import riven.core.models.request.entity.type.SaveRelationshipDefinitionRequest
import riven.core.models.request.entity.type.SaveTargetRuleRequest
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.RelationshipDefinitionRepository
import riven.core.repository.entity.RelationshipTargetRuleRepository
import riven.core.service.activity.ActivityService
import riven.core.service.activity.log
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.EntityTypeSemanticMetadataService
import riven.core.util.ServiceUtil
import java.util.*

/**
 * Result of an impact check when deleting a relationship definition with existing instance data.
 */
data class DeleteDefinitionImpact(
    val definitionId: UUID,
    val definitionName: String,
    val impactedLinkCount: Long,
)

/**
 * Service for managing relationship definitions and their target rules.
 *
 * Handles CRUD for type-level relationship configuration stored in
 * `relationship_definitions` and `relationship_target_rules` tables.
 */
@Service
class EntityTypeRelationshipService(
    private val definitionRepository: RelationshipDefinitionRepository,
    private val targetRuleRepository: RelationshipTargetRuleRepository,
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService,
    private val semanticMetadataService: EntityTypeSemanticMetadataService,
    private val logger: KLogger,
) {

    // ------ Create ------

    /**
     * Creates a new relationship definition with its target rules.
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun createRelationshipDefinition(
        workspaceId: UUID,
        sourceEntityTypeId: UUID,
        request: SaveRelationshipDefinitionRequest,
    ): RelationshipDefinition {
        val userId = authTokenService.getUserId()

        val entity = RelationshipDefinitionEntity(
            workspaceId = workspaceId,
            sourceEntityTypeId = sourceEntityTypeId,
            name = request.name,
            iconType = request.iconType ?: IconType.LINK,
            iconColour = request.iconColour ?: IconColour.NEUTRAL,
            allowPolymorphic = request.allowPolymorphic,
            cardinalityDefault = request.cardinalityDefault,
        )
        val savedDefinition = definitionRepository.save(entity)
        val defId = requireNotNull(savedDefinition.id)

        val ruleEntities = buildTargetRuleEntities(defId, request.targetRules)
        val savedRules = targetRuleRepository.saveAll(ruleEntities)

        semanticMetadataService.initializeForTarget(
            entityTypeId = sourceEntityTypeId,
            workspaceId = workspaceId,
            targetType = SemanticMetadataTargetType.RELATIONSHIP,
            targetId = defId,
        )

        activityService.log(
            activity = Activity.ENTITY_RELATIONSHIP,
            operation = OperationType.CREATE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.ENTITY_TYPE,
            entityId = sourceEntityTypeId,
            "relationshipId" to defId.toString(),
            "relationshipName" to request.name,
        )

        logger.info { "Created relationship definition '${request.name}' ($defId) for entity type $sourceEntityTypeId" }

        return savedDefinition.toModel(savedRules.map { it.toModel() })
    }

    // ------ Update ------

    /**
     * Updates an existing relationship definition and diffs its target rules.
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun updateRelationshipDefinition(
        workspaceId: UUID,
        definitionId: UUID,
        request: SaveRelationshipDefinitionRequest,
    ): RelationshipDefinition {
        val userId = authTokenService.getUserId()
        val existing = ServiceUtil.findOrThrow { definitionRepository.findByIdAndWorkspaceId(definitionId, workspaceId) }

        existing.name = request.name
        existing.iconType = request.iconType ?: existing.iconType
        existing.iconColour = request.iconColour ?: existing.iconColour
        existing.allowPolymorphic = request.allowPolymorphic
        existing.cardinalityDefault = request.cardinalityDefault

        val savedDefinition = definitionRepository.save(existing)
        val updatedRules = diffTargetRules(definitionId, request.targetRules)

        activityService.log(
            activity = Activity.ENTITY_RELATIONSHIP,
            operation = OperationType.UPDATE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.ENTITY_TYPE,
            entityId = existing.sourceEntityTypeId,
            "relationshipId" to definitionId.toString(),
            "relationshipName" to request.name,
        )

        logger.info { "Updated relationship definition '${request.name}' ($definitionId)" }

        return savedDefinition.toModel(updatedRules)
    }

    // ------ Delete ------

    /**
     * Deletes a relationship definition using the two-pass impact pattern.
     *
     * If instance data exists and `impactConfirmed` is false, returns impact analysis.
     * If `impactConfirmed` is true or no instance data exists, soft-deletes the definition,
     * hard-deletes the rules, and cleans up semantic metadata.
     *
     * @return Impact analysis if confirmation needed, null if deletion was executed
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun deleteRelationshipDefinition(
        workspaceId: UUID,
        definitionId: UUID,
        impactConfirmed: Boolean,
    ): DeleteDefinitionImpact? {
        val userId = authTokenService.getUserId()
        val existing = ServiceUtil.findOrThrow { definitionRepository.findByIdAndWorkspaceId(definitionId, workspaceId) }

        check(!existing.protected) {
            "Cannot delete protected relationship '${existing.name}' ($definitionId). Protected relationships are system-managed."
        }

        val linkCount = entityRelationshipRepository.countByDefinitionId(definitionId)

        if (linkCount > 0 && !impactConfirmed) {
            return DeleteDefinitionImpact(
                definitionId = definitionId,
                definitionName = existing.name,
                impactedLinkCount = linkCount,
            )
        }

        executeDeletion(existing, definitionId, workspaceId, userId)
        return null
    }

    private fun executeDeletion(
        entity: RelationshipDefinitionEntity,
        definitionId: UUID,
        workspaceId: UUID,
        userId: UUID,
    ) {
        // Soft-delete associated relationship links
        entityRelationshipRepository.softDeleteByDefinitionId(definitionId)

        // Soft-delete the definition
        entity.deleted = true
        entity.deletedAt = java.time.ZonedDateTime.now()
        definitionRepository.save(entity)

        // Hard-delete target rules (configuration, not user data)
        targetRuleRepository.deleteByRelationshipDefinitionId(definitionId)

        // Clean up semantic metadata
        semanticMetadataService.deleteForTarget(
            entityTypeId = entity.sourceEntityTypeId,
            targetType = SemanticMetadataTargetType.RELATIONSHIP,
            targetId = definitionId,
        )

        activityService.log(
            activity = Activity.ENTITY_RELATIONSHIP,
            operation = OperationType.DELETE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.ENTITY_TYPE,
            entityId = entity.sourceEntityTypeId,
            "relationshipId" to definitionId.toString(),
            "relationshipName" to entity.name,
        )

        logger.info { "Deleted relationship definition '${entity.name}' ($definitionId)" }
    }

    // ------ Read ------

    /**
     * Returns all relationship definitions an entity type participates in,
     * including forward definitions (where the type is the source) and
     * inverse-visible definitions (where the type is a target with inverse_visible = true).
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getDefinitionsForEntityType(
        workspaceId: UUID,
        entityTypeId: UUID,
    ): List<RelationshipDefinition> {
        // Forward definitions: this type is the source
        val forwardEntities = definitionRepository.findByWorkspaceIdAndSourceEntityTypeId(workspaceId, entityTypeId)

        // Inverse definitions: this type is a target with inverse_visible = true
        val inverseRules = targetRuleRepository.findInverseVisibleByTargetEntityTypeId(entityTypeId)
        val inverseDefIds = inverseRules.map { it.relationshipDefinitionId }.distinct()
        val inverseEntities = if (inverseDefIds.isNotEmpty()) {
            definitionRepository.findAllById(inverseDefIds)
        } else {
            emptyList()
        }

        // Hydrate forward definitions with their rules
        val forwardDefIds = forwardEntities.mapNotNull { it.id }
        val forwardRules = if (forwardDefIds.isNotEmpty()) {
            targetRuleRepository.findByRelationshipDefinitionIdIn(forwardDefIds)
                .groupBy { it.relationshipDefinitionId }
        } else {
            emptyMap()
        }

        // Hydrate inverse definitions with their rules
        val inverseRulesByDef = if (inverseDefIds.isNotEmpty()) {
            targetRuleRepository.findByRelationshipDefinitionIdIn(inverseDefIds)
                .groupBy { it.relationshipDefinitionId }
        } else {
            emptyMap()
        }

        val forwardModels = forwardEntities.map { entity ->
            val rules = forwardRules[entity.id]?.map { it.toModel() } ?: emptyList()
            entity.toModel(rules)
        }

        val inverseModels = inverseEntities.map { entity ->
            val rules = inverseRulesByDef[entity.id]?.map { it.toModel() } ?: emptyList()
            entity.toModel(rules)
        }

        return forwardModels + inverseModels
    }

    /**
     * Retrieves a single relationship definition by ID with its target rules.
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getDefinitionById(
        workspaceId: UUID,
        definitionId: UUID,
    ): RelationshipDefinition {
        val entity = ServiceUtil.findOrThrow { definitionRepository.findByIdAndWorkspaceId(definitionId, workspaceId) }
        val rules = targetRuleRepository.findByRelationshipDefinitionId(definitionId).map { it.toModel() }
        return entity.toModel(rules)
    }

    // ------ Private helpers ------

    /**
     * Diffs the requested target rules against existing rules, performing add/remove/update operations.
     */
    private fun diffTargetRules(
        definitionId: UUID,
        requestedRules: List<SaveTargetRuleRequest>,
    ): List<RelationshipTargetRule> {
        val existingRules = targetRuleRepository.findByRelationshipDefinitionId(definitionId)
        val existingById = existingRules.associateBy { it.id }

        // Rules with an ID that matches existing → keep/update; without → new; existing not in request → remove
        val requestedIds = requestedRules.mapNotNull { it.id }.toSet()
        val toRemove = existingRules.filter { it.id !in requestedIds }
        if (toRemove.isNotEmpty()) {
            targetRuleRepository.deleteAll(toRemove)
        }

        val toSave = requestedRules.map { req ->
            if (req.id != null && existingById.containsKey(req.id)) {
                // Update existing rule
                val existing = existingById[req.id]!!
                existing.copy(
                    targetEntityTypeId = req.targetEntityTypeId,
                    semanticTypeConstraint = req.semanticTypeConstraint,
                    cardinalityOverride = req.cardinalityOverride,
                    inverseVisible = req.inverseVisible,
                    inverseName = req.inverseName,
                )
            } else {
                // New rule
                RelationshipTargetRuleEntity(
                    relationshipDefinitionId = definitionId,
                    targetEntityTypeId = req.targetEntityTypeId,
                    semanticTypeConstraint = req.semanticTypeConstraint,
                    cardinalityOverride = req.cardinalityOverride,
                    inverseVisible = req.inverseVisible,
                    inverseName = req.inverseName,
                )
            }
        }

        return targetRuleRepository.saveAll(toSave).map { it.toModel() }
    }

    private fun buildTargetRuleEntities(
        definitionId: UUID,
        rules: List<SaveTargetRuleRequest>,
    ): List<RelationshipTargetRuleEntity> {
        return rules.map { rule ->
            RelationshipTargetRuleEntity(
                relationshipDefinitionId = definitionId,
                targetEntityTypeId = rule.targetEntityTypeId,
                semanticTypeConstraint = rule.semanticTypeConstraint,
                cardinalityOverride = rule.cardinalityOverride,
                inverseVisible = rule.inverseVisible,
                inverseName = rule.inverseName,
            )
        }
    }
}
