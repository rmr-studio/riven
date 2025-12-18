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
    fun findBySourceId(id: UUID): List<EntityRelationshipEntity>

    /**
     * Find all relationships where the given entity is the target.
     */
    fun findByTargetId(id: UUID): List<EntityRelationshipEntity>

    fun findBySourceIdAndKey(sourceId: UUID, key: String): EntityRelationshipEntity?

    /**
     * Find all relationships with a specific key where the given entity is the source.
     */
    fun findAllBySourceIdAndKey(sourceId: UUID, key: String): List<EntityRelationshipEntity>

    /**
     * Find relationships with a specific source, target, and key.
     */
    fun findBySourceIdAndTargetIdAndKey(sourceId: UUID, targetId: UUID, key: String): List<EntityRelationshipEntity>

    fun countBySourceIdAndKey(sourceId: UUID, key: String): Long

    /**
     * Find all relationships involving the given entity (as source or target).
     */
    @Query(
        """
        SELECT r FROM EntityRelationshipEntity r
        WHERE r.sourceId = :entityId OR r.targetId = :entityId
    """
    )
    fun findAllRelationshipsForEntity(entityId: UUID): List<EntityRelationshipEntity>
}
