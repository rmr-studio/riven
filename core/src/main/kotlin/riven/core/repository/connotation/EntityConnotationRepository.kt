package riven.core.repository.connotation

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import riven.core.entity.connotation.EntityConnotationEntity
import java.util.UUID

/**
 * Repository for [EntityConnotationEntity].
 *
 * One envelope per entity. Use [findByEntityId] for the canonical lookup; saves
 * follow the upsert pattern (find → copy → save, or delete-then-insert when
 * the prior row's id is unknown).
 */
@Repository
interface EntityConnotationRepository : JpaRepository<EntityConnotationEntity, UUID> {

    /**
     * Find the connotation envelope for a given entity.
     *
     * @param entityId The entity UUID
     * @return The envelope row if it exists, null otherwise
     */
    @Query("SELECT e FROM EntityConnotationEntity e WHERE e.entityId = :entityId")
    fun findByEntityId(@Param("entityId") entityId: UUID): EntityConnotationEntity?

    /**
     * Hard-delete the connotation envelope for a given entity. Used by the
     * upsert pattern in [riven.core.service.enrichment.EnrichmentService.analyzeSemantics].
     */
    @Modifying
    @Query("DELETE FROM EntityConnotationEntity e WHERE e.entityId = :entityId")
    fun deleteByEntityId(@Param("entityId") entityId: UUID)
}
