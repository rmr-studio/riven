package riven.core.service.entity

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.EntityType
import riven.core.enums.util.OperationType
import riven.core.models.entity.EntityRelationship
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
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
    private val entityService: EntityService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {

    /**
     * Create a relationship between two entities.
     */
    @Transactional
    fun createRelationship(
        organisationId: UUID,
        sourceEntityId: UUID,
        targetEntityId: UUID,
        relationshipType: String,
        relationshipLabel: String? = null,
        relationshipEntityId: UUID? = null,
        metadata: Map<String, Any> = emptyMap(),
        bidirectional: Boolean = false
    ): EntityRelationship {
        val userId = authTokenService.getUserId()
        val sourceEntity = findOrThrow { entityRepository.findById(sourceEntityId) }
        val targetEntity = findOrThrow { entityRepository.findById(targetEntityId) }

        val relationshipEntity = relationshipEntityId?.let {
            findOrThrow { entityRepository.findById(it) }
        }

        val relationship = EntityRelationshipEntity(
            organisationId = organisationId,
            sourceEntity = sourceEntity,
            targetEntity = targetEntity,
            relationshipEntity = relationshipEntity,
            relationshipType = relationshipType,
            relationshipLabel = relationshipLabel,
            metadata = metadata,
            bidirectional = bidirectional
        )

        return entityRelationshipRepository.save(relationship).run {
            // If relationship entity exists, validate it has required relationships
            relationshipEntityId?.let { entityService.validateRelationshipEntityConstraints(it) }

            activityService.logActivity(
                activity = Activity.ENTITY_RELATIONSHIP,
                operation = OperationType.CREATE,
                userId = userId,
                organisationId = organisationId,
                entityId = this.id,
                entityType = EntityType.DYNAMIC_ENTITY,
                details = mapOf(
                    "relationshipType" to relationshipType,
                    "sourceEntityId" to sourceEntityId.toString(),
                    "targetEntityId" to targetEntityId.toString(),
                    "bidirectional" to bidirectional
                )
            )
            this.toModel()
        }
    }

    /**
     * Delete a relationship.
     */
    @Transactional
    fun deleteRelationship(id: UUID) {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { entityRelationshipRepository.findById(id) }

        entityRelationshipRepository.deleteById(id)

        activityService.logActivity(
            activity = Activity.ENTITY_RELATIONSHIP,
            operation = OperationType.DELETE,
            userId = userId,
            organisationId = existing.organisationId,
            entityId = id,
            entityType = EntityType.DYNAMIC_ENTITY,
            details = mapOf(
                "relationshipType" to existing.relationshipType,
                "sourceEntityId" to existing.sourceEntity.id.toString(),
                "targetEntityId" to existing.targetEntity.id.toString()
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
            entityRelationshipRepository.findBySourceEntityId(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get relationships where entity is the target.
     */
    fun getIncomingRelationships(entityId: UUID): List<EntityRelationship> {
        return findManyResults {
            entityRelationshipRepository.findByTargetEntityId(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get all relationships managed by a relationship entity.
     */
    fun getRelationshipsForRelationshipEntity(relationshipEntityId: UUID): List<EntityRelationship> {
        return findManyResults {
            entityRelationshipRepository.findByRelationshipEntityId(relationshipEntityId)
        }.map { it.toModel() }
    }
}
