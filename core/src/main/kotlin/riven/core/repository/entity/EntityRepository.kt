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

    fun findByOrganisationIdAndTypeIdInAndArchivedIsFalse(
        organisationId: UUID,
        typeIds: List<UUID>
    ): List<EntityEntity>

    /**
     * Find all entities of a specific type.
     */
    @Query("SELECT e FROM EntityEntity e WHERE e.type.id = :typeId AND e.organisationId = :organisationId AND e.archived = false")
    fun findByTypeId(
        organisationId: UUID,
        typeId: UUID
    ): List<EntityEntity>

    /**
     * Find all active entities of a specific type by type key.
     */
    @Query("SELECT e FROM EntityEntity e WHERE e.key = :typeKey AND e.organisationId = :organisationId AND e.archived = false")
    fun findByTypeKey(
        organisationId: UUID,
        typeKey: String
    ): List<EntityEntity>
}
