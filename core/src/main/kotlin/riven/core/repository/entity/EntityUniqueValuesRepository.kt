package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityUniqueValueEntity
import java.util.*

interface EntityUniqueValuesRepository : JpaRepository<EntityUniqueValueEntity, UUID> {
    @Query(
        """
    SELECT e FROM EntityUniqueValueEntity e 
    WHERE e.typeId = :typeId 
      AND e.fieldId = :fieldId 
      AND e.fieldValue = :fieldValue
"""
    )
    fun findConflict(
        typeId: UUID,
        fieldId: UUID,
        fieldValue: String,
    ): EntityUniqueValueEntity?

    @Modifying
    @Query(
        """
        UPDATE EntityUniqueValueEntity e
        SET e.archived = true, e.deletedAt = CURRENT_TIMESTAMP
        WHERE e.entityId = :entityId AND e.archived = false
    """
    )
    fun archiveEntity(entityId: UUID): Int

    @Modifying
    @Query(
        """
        UPDATE EntityUniqueValueEntity e
        SET e.archived = true, e.deletedAt = CURRENT_TIMESTAMP
        WHERE e.typeId = :typeId AND e.archived = false
    """
    )
    fun archiveType(typeId: UUID): Int

}