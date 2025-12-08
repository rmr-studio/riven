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
    fun findByOrganisationId(organisationId: UUID): List<EntityEntity>

    /**
     * Find all entities of a specific type.
     */
    fun findByOrganisationIdAndTypeId(
        organisationId: UUID,
        typeId: UUID
    ): List<EntityEntity>

    /**
     * Find all entities of a specific type by type key.
     */
    @Query("SELECT e FROM EntityEntity e WHERE e.type.key = :typeKey AND e.organisationId = :organisationId")
    fun findByOrganisationIdAndTypeKey(
        organisationId: UUID,
        typeKey: String
    ): List<EntityEntity>
}
