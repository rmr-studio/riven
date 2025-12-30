package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityEntity
import java.util.*

/**
 * Repository for Entity instances.
 */
interface EntityRepository : JpaRepository<EntityEntity, UUID> {

    @Query("SELECT e FROM EntityEntity e WHERE e.id = :id AND e.archived = false")
    override fun findById(id: UUID): Optional<EntityEntity>

    /**
     * Find all entities for an organization.
     */
    @Query("SELECT e FROM EntityEntity e WHERE e.organisationId = :organisationId AND e.archived = false")
    fun findByOrganisationId(organisationId: UUID): List<EntityEntity>

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
}
