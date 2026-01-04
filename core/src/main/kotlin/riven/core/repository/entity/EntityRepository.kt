package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityEntity
import java.util.*

/**
 * Repository for Entity instances.
 */
interface EntityRepository : JpaRepository<EntityEntity, UUID> {

    @Query("SELECT e FROM EntityEntity e WHERE e.id = :id AND e.archived = false")
    override fun findById(id: UUID): Optional<EntityEntity>

    @Query("SELECT e FROM EntityEntity e WHERE e.id in :ids AND e.archived = false")
    fun findByIdIn(ids: Collection<UUID>): List<EntityEntity>

    /**
     * Find all entities for an organization.
     */
    @Query("SELECT e FROM EntityEntity e WHERE e.workspaceId = :workspaceId AND e.archived = false")
    fun findByworkspaceId(workspaceId: UUID): List<EntityEntity>

    @Query("SELECT e FROM EntityEntity e WHERE e.typeId = :typeId AND e.archived = false")
    fun findByTypeId(typeId: UUID): List<EntityEntity>

    @Query(
        """
       SELECT e FROM EntityEntity e 
            WHERE e.typeId in :typeIds 
            AND e.archived = false 
    """
    )
    fun findByTypeIdIn(typeIds: List<UUID>): List<EntityEntity>

    @Modifying
    @Query(
        value = """
        UPDATE entities
        SET archived = true, deleted_at = CURRENT_TIMESTAMP
        WHERE id = ANY(:ids)
          AND workspace_id = :workspaceId
          AND archived = false
        RETURNING *
    """, nativeQuery = true
    )
    fun archiveByIds(ids: Array<UUID>, workspaceId: UUID): List<EntityEntity>

}
