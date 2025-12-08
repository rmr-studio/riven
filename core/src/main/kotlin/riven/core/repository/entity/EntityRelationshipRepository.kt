package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityRelationshipEntity
import java.util.*

/**
 * Repository for relationships between entities.
 */
interface EntityRelationshipRepository : JpaRepository<EntityRelationshipEntity, UUID> {

    /**
     * Find all relationships where the given entity is the source.
     */
    fun findBySourceEntityId(sourceEntityId: UUID): List<EntityRelationshipEntity>

    /**
     * Find all relationships where the given entity is the target.
     */
    fun findByTargetEntityId(targetEntityId: UUID): List<EntityRelationshipEntity>

    /**
     * Find all relationships involving the given entity (as source or target).
     */
    @Query("""
        SELECT r FROM EntityRelationshipEntity r
        WHERE r.sourceEntity.id = :entityId OR r.targetEntity.id = :entityId
    """)
    fun findAllRelationshipsForEntity(entityId: UUID): List<EntityRelationshipEntity>

    /**
     * Find all relationships managed by a relationship entity.
     */
    fun findByRelationshipEntityId(relationshipEntityId: UUID): List<EntityRelationshipEntity>

    /**
     * Count relationships managed by a relationship entity.
     */
    fun countByRelationshipEntityId(relationshipEntityId: UUID): Int
}
