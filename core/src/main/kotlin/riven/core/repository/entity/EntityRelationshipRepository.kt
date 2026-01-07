package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.projection.entity.EntityLinkProjection
import java.util.*


/**
 * Repository for relationships between entities.
 */
interface EntityRelationshipRepository : JpaRepository<EntityRelationshipEntity, UUID> {

    /**
     * Find all relationships where the given entity is the source.
     */
    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.sourceId = :id and r.deleted = false")
    fun findBySourceId(id: UUID): List<EntityRelationshipEntity>

    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.sourceId in :ids and r.deleted = false")
    fun findBySourceIdIn(ids: Collection<UUID>): List<EntityRelationshipEntity>

    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.targetId in :ids and r.deleted = false")
    fun findByTargetIdIn(ids: Collection<UUID>): List<EntityRelationshipEntity>

    /**
     * Find all relationships with a specific fieldId where the given entity is the source.
     */
    fun findAllBySourceIdAndFieldId(sourceId: UUID, fieldId: UUID): List<EntityRelationshipEntity>

    /**
     * Find relationships with a specific source, target, and fieldId.
     */
    fun findBySourceIdAndTargetIdAndFieldId(
        sourceId: UUID,
        targetId: UUID,
        fieldId: UUID
    ): List<EntityRelationshipEntity>

    fun countBySourceIdAndFieldId(sourceId: UUID, fieldId: UUID): Long

    /**
     * Find all relationships involving the given entity (as source or target).
     */
    @Query(
        """
        SELECT r FROM EntityRelationshipEntity r
        WHERE r.sourceId = :entityId OR r.targetId = :entityId
    """
    )
    fun findAllRelationshipsForEntity(entityId: UUID): List<EntityRelationshipEntity>

    /**
     * Find all relationships for a source entity across multiple field IDs.
     */
    fun findAllBySourceIdAndFieldIdIn(sourceId: UUID, fieldIds: Collection<UUID>): List<EntityRelationshipEntity>

    /**
     * Delete all relationships for a source entity with a specific field ID.
     */
    fun deleteAllBySourceIdAndFieldId(sourceId: UUID, fieldId: UUID)

    /**
     * Delete relationships by source entity and field ID where target is in the given list.
     */
    fun deleteAllBySourceIdAndFieldIdAndTargetIdIn(sourceId: UUID, fieldId: UUID, targetIds: Collection<UUID>)


    @Modifying
    @Query(
        """
        UPDATE entity_relationships
            SET deleted = true, 
            deleted_at = CURRENT_TIMESTAMP 
        WHERE 
            (source_entity_id = ANY(:ids) 
            or target_entity_id = ANY(:ids)) 
            AND workspace_id = :workspaceId 
            AND deleted = false
        RETURNING *
            """, nativeQuery = true
    )
    fun deleteEntities(ids: Array<UUID>, workspaceId: UUID): List<EntityRelationshipEntity>

    /**
     * Find all entity links for a source entity by joining relationships with target entities.
     * Extracts the label from the target entity's payload using its identifier_key.
     *
     * The query uses PostgreSQL JSONB operators:
     * - `payload -> identifier_key::text` accesses the JSONB object at the dynamic key
     * - `->> 'value'` extracts the 'value' field as text
     * - COALESCE falls back to the entity ID if the label is not found
     */
    @Query(
        value = """
            SELECT
                e.id as id,
                e.workspace_id as workspaceId,
                r.relationship_field_id as fieldId,
                r.source_entity_id as sourceEntityId,
                e.icon_type as iconType,
                e.icon_colour as iconColour,
                e.type_key as typeKey,
                COALESCE(
                    e.payload -> e.identifier_key::text ->> 'value',
                    e.id::text
                ) as label
            FROM entity_relationships r
            JOIN entities e ON r.target_entity_id = e.id
            WHERE r.source_entity_id = :sourceId
            AND r.deleted = false
            AND e.deleted = false
            AND e.workspace_id = :workspaceId
        """,
        nativeQuery = true
    )
    fun findEntityLinksBySourceId(sourceId: UUID, workspaceId: UUID): List<EntityLinkProjection>

    /**
     * Find all entity links for multiple source entities.
     * Returns a flat list that can be grouped by sourceEntityId in the service layer.
     */
    @Query(
        value = """
            SELECT
                e.id as id,
                e.workspace_id as workspaceId,
                r.relationship_field_id as fieldId,
                r.source_entity_id as sourceEntityId,
                e.icon_type as iconType,
                e.icon_colour as iconColour,
                e.type_key as typeKey,
                COALESCE(
                    e.payload -> e.identifier_key::text ->> 'value',
                    e.id::text
                ) as label
            FROM entity_relationships r
            JOIN entities e ON r.target_entity_id = e.id
            WHERE r.source_entity_id = ANY(:ids)
            AND r.deleted = false
            AND e.deleted = false
            AND e.workspace_id = :workspaceId
        """,
        nativeQuery = true
    )
    fun findEntityLinksBySourceIdIn(ids: Array<UUID>, workspaceId: UUID): List<EntityLinkProjection>
}