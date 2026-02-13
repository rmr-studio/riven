package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.entity.EntityAttributeProvenanceEntity
import java.util.*

interface EntityAttributeProvenanceRepository : JpaRepository<EntityAttributeProvenanceEntity, UUID> {
    fun findByEntityId(entityId: UUID): List<EntityAttributeProvenanceEntity>
    fun findByEntityIdIn(entityIds: Collection<UUID>): List<EntityAttributeProvenanceEntity>
    fun deleteByEntityId(entityId: UUID)
}
