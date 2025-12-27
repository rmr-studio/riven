package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityEntity
import java.util.*

/**
 * Repository for Entity instances.
 */
interface EntityRepository : JpaRepository<EntityEntity, UUID> {

    /**
     * Find all entities for an organization.
     */
    @Query("SELECT e FROM EntityEntity e WHERE e.organisationId = :organisationId AND e.archived = false")
    fun findByOrganisationId(organisationId: UUID): List<EntityEntity>


}
