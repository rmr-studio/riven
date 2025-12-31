package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
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
    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.sourceId = :id and r.archived = false")
    fun findBySourceId(id: UUID): List<EntityRelationshipEntity>

    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.sourceId in :ids and r.archived = false")
    fun findBySourceIdIn(ids: Collection<UUID>): List<EntityRelationshipEntity>

    /**
     * Find all relationships where the given entity is the target.
     */
    fun findByTargetId(id: UUID): List<EntityRelationshipEntity>

    fun findBySourceIdAndFieldId(sourceId: UUID, fieldId: UUID): EntityRelationshipEntity?

    /**
     * Find all relationships with a specific fieldId where the given entity is the source.
     */
    fun findAllBySourceIdAndFieldId(sourceId: UUID, fieldId: UUID): List<EntityRelationshipEntity>

    /**
     * Find relationships with a specific source, target, and fieldId.
     */
    fun findBySourceIdAndTargetIdAndFieldId(
        sourceId: UUID,
        targetId: UUID,
        fieldId: UUID
    ): List<EntityRelationshipEntity>

    fun countBySourceIdAndFieldId(sourceId: UUID, fieldId: UUID): Long

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

    /**
     * Find all relationships for a source entity across multiple field IDs.
     */
    fun findAllBySourceIdAndFieldIdIn(sourceId: UUID, fieldIds: Collection<UUID>): List<EntityRelationshipEntity>

    /**
     * Delete all relationships for a source entity with a specific field ID.
     */
    fun deleteAllBySourceIdAndFieldId(sourceId: UUID, fieldId: UUID)

    /**
     * Delete relationships by source entity and field ID where target is in the given list.
     */
    fun deleteAllBySourceIdAndFieldIdAndTargetIdIn(sourceId: UUID, fieldId: UUID, targetIds: Collection<UUID>)

    @Modifying
    @Query("UPDATE EntityRelationshipEntity r SET r.archived = true, r.deletedAt = CURRENT_TIMESTAMP WHERE r.sourceId = :id or r.targetId = :id")
    fun archiveEntity(id: UUID): Int
}