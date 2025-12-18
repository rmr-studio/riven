package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.entity.EntityTypeEntity
import java.util.*

/**
 * Repository for EntityType entities.
 */
interface EntityTypeRepository : JpaRepository<EntityTypeEntity, UUID> {
    fun findByOrganisationId(id: UUID): List<EntityTypeEntity>

    /**
     * Find entity type by organization and key.
     * Returns the single matching entity type (mutable pattern - only one row per org+key).
     */
    fun findByOrganisationIdAndKey(
        organisationId: UUID,
        key: String
    ): Optional<EntityTypeEntity>
}
