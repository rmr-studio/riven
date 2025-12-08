package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityTypeEntity
import java.util.*

/**
 * Repository for EntityType entities.
 */
interface EntityTypeRepository : JpaRepository<EntityTypeEntity, UUID> {

    /**
     * Find entity type by key (any version, any org).
     */
    fun findByKey(key: String): Optional<EntityTypeEntity>

    /**
     * Find all entity types for an organization, including system types.
     */
    @Query("SELECT e FROM EntityTypeEntity e WHERE e.organisationId = :organisationId OR e.system = true")
    fun findByOrganisationIdOrSystem(organisationId: UUID): List<EntityTypeEntity>

    /**
     * Find entity type by organization and key.
     * Returns the single matching entity type (mutable pattern - only one row per org+key).
     */
    fun findByOrganisationIdAndKey(
        organisationId: UUID,
        key: String
    ): Optional<EntityTypeEntity>

    /**
     * Find system entity type by key.
     */
    fun findBySystemTrueAndKey(key: String): Optional<EntityTypeEntity>
}
