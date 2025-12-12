package riven.core.service.entity

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.models.entity.Entity
import riven.core.models.entity.EntityRelationship
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
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
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    @Transactional
    fun createRelationship(
        organisationId: UUID,
        sourceEntityId: UUID,
        targetEntityId: UUID,
        key: String,
        bidirectional: Boolean = false,
    ): List<EntityRelationshipEntity> {
        // Find Entity Relationship definition
        val source: Pair<Entity, EntityType> = findOrThrow { entityRepository.findById(sourceEntityId) }.let {
            // Run JPA lazy loading for type
            it.toModel(audit = false) to it.type.toModel()
        }
        val target: Pair<Entity, EntityType> = findOrThrow { entityRepository.findById(targetEntityId) }.let {
            // Run JPA lazy loading for type
            it.toModel(audit = false) to it.type.toModel()
        }

        val relDef = validateRelationship(source, target.second, key).also {
            // Run inverse validation if relationship should be bidirectional
            if (!bidirectional) return@also
            validateRelationship(target, source.second, key)
        }

        // TODO: CREATE RELATIONSHIP
        val sourceRelationship = EntityRelationshipEntity(
            organisationId = organisationId,
            sourceId = sourceEntityId,
            targetId = targetEntityId,
            key = key,
            label = relDef.name
        )

        // Create inverse relationship if bidirectional
        val inverseRelationship = if (bidirectional) {
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

    @Throws(IllegalArgumentException::class)
    private fun validateRelationship(
        source: Pair<Entity, EntityType>,
        target: EntityType,
        key: String
    ): EntityRelationshipDefinition {
        // Validation suitability to create relationship based on entity type
        val (sourceEntity, sourceType) = source

        sourceType.relationships.let {
            requireNotNull(it) {
                "Source entity type '${sourceType.key}' does not currently define any relationships"
            }

            it.find { relDef -> relDef.key == key }.let { relationshipDef ->
                requireNotNull(relationshipDef) {
                    "Source entity type '${sourceType.key}' does not define relationship with key '$key'"
                }

                if (relationshipDef.maxOccurs != null) {
                    entityRelationshipRepository.countBySourceIdAndKey(
                        sourceEntity.id,
                        key
                    ).run {
                        require(this < relationshipDef.maxOccurs) {
                            "Source entity '${sourceEntity.id}' has reached maximum occurrences (${
                                relationshipDef.maxOccurs
                            }) for relationship '${relationshipDef.key}'"
                        }
                    }
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


        val existing = findOrThrow { entityRelationshipRepository.findById(id) }

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
        return findManyResults {
            entityRelationshipRepository.findAllRelationshipsForEntity(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get relationships where entity is the source.
     */
    fun getOutgoingRelationships(entityId: UUID): List<EntityRelationship> {
        return findManyResults {
            entityRelationshipRepository.findBySourceId(entityId)
        }.map { it.toModel() }
    }

    /**
     * Get relationships where entity is the target.
     */
    fun getIncomingRelationships(entityId: UUID): List<EntityRelationship> {
        return findManyResults {
            entityRelationshipRepository.findByTargetId(entityId)
        }.map { it.toModel() }
    }
}
