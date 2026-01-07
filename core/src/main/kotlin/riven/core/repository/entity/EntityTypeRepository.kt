package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityTypeEntity
import java.util.*

/**
 * Repository for EntityType entities.
 */
interface EntityTypeRepository : JpaRepository<EntityTypeEntity, UUID> {

    @Query("SELECT et FROM EntityTypeEntity et WHERE et.id = :id AND et.deleted = false")
    override fun findById(id: UUID): Optional<EntityTypeEntity>

    fun findByworkspaceId(id: UUID): List<EntityTypeEntity>


    /**
     * Find entity type by workspace and key.
     * Returns the single matching entity type (mutable pattern - only one row per org+key).
     */
    fun findByworkspaceIdAndKey(
        workspaceId: UUID,
        key: String
    ): Optional<EntityTypeEntity>

    fun findByworkspaceIdAndKeyIn(
        workspaceId: UUID,
        keys: List<String>
    ): List<EntityTypeEntity>
}
