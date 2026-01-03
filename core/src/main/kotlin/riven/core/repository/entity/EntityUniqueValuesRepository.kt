package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityUniqueValueEntity
import java.util.*

interface EntityUniqueValuesRepository : JpaRepository<EntityUniqueValueEntity, UUID> {

    /**
     * Check if a conflict exists for a unique value, excluding the current entity.
     * Uses native query to completely avoid Hibernate entity tracking.
     */
    @Query(
        value = """
            SELECT EXISTS(
                SELECT 1 FROM entities_unique_values
                WHERE type_id = :typeId
                  AND field_id = :fieldId
                  AND field_value = :fieldValue
                  AND archived = false
                  AND (:excludeEntityId IS NULL OR entity_id <> :excludeEntityId)
            )
        """,
        nativeQuery = true
    )
    fun existsConflict(
        typeId: UUID,
        fieldId: UUID,
        fieldValue: String,
        excludeEntityId: UUID? = null
    ): Boolean

    /**
     * Delete all unique values for an entity using native SQL.
     * Completely bypasses Hibernate entity tracking.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = "DELETE FROM entities_unique_values WHERE entity_id = :entityId",
        nativeQuery = true
    )
    fun deleteAllByEntityId(entityId: UUID): Int

    /**
     * Insert a unique value using native SQL.
     * Bypasses Hibernate to avoid stale state issues.
     */
    @Modifying
    @Query(
        value = """
            INSERT INTO entities_unique_values (id, type_id, entity_id, field_id, field_value, archived)
            VALUES (:id, :typeId, :entityId, :fieldId, :fieldValue, false)
        """,
        nativeQuery = true
    )
    fun insertUniqueValue(
        id: UUID,
        typeId: UUID,
        entityId: UUID,
        fieldId: UUID,
        fieldValue: String
    )

    @Modifying(clearAutomatically = true)
    @Query(
        value = """
            UPDATE entities_unique_values
            SET archived = true, deleted_at = CURRENT_TIMESTAMP
            WHERE entity_id = :entityId AND archived = false
        """,
        nativeQuery = true
    )
    fun archiveEntity(entityId: UUID): Int

    @Modifying(clearAutomatically = true)
    @Query(
        value = """
            UPDATE entities_unique_values
            SET archived = true, deleted_at = CURRENT_TIMESTAMP
            WHERE type_id = :typeId AND archived = false
        """,
        nativeQuery = true
    )
    fun archiveType(typeId: UUID): Int
}
