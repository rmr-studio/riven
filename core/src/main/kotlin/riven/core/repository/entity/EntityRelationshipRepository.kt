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
    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.sourceId = :id")
    fun findBySourceId(id: UUID): List<EntityRelationshipEntity>

    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.sourceId in :ids")
    fun findBySourceIdIn(ids: Collection<UUID>): List<EntityRelationshipEntity>

    @Query("SELECT r FROM EntityRelationshipEntity r WHERE r.targetId in :ids")
    fun findByTargetIdIn(ids: Collection<UUID>): List<EntityRelationshipEntity>

    /**
     * Find all relationships with a specific definitionId where the given entity is the source.
     */
    fun findAllBySourceIdAndDefinitionId(sourceId: UUID, definitionId: UUID): List<EntityRelationshipEntity>

    /**
     * Find relationships with a specific source, target, and definitionId.
     */
    fun findBySourceIdAndTargetIdAndDefinitionId(
        sourceId: UUID,
        targetId: UUID,
        definitionId: UUID
    ): List<EntityRelationshipEntity>

    fun countBySourceIdAndDefinitionId(sourceId: UUID, definitionId: UUID): Long

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
     * Find all relationships for a source entity across multiple definition IDs.
     */
    fun findAllBySourceIdAndDefinitionIdIn(sourceId: UUID, definitionIds: Collection<UUID>): List<EntityRelationshipEntity>

    /**
     * Delete all relationships for a source entity with a specific definition ID.
     */
    fun deleteAllBySourceIdAndDefinitionId(sourceId: UUID, definitionId: UUID)

    /**
     * Delete relationships by source entity and definition ID where target is in the given list.
     */
    fun deleteAllBySourceIdAndDefinitionIdAndTargetIdIn(sourceId: UUID, definitionId: UUID, targetIds: Collection<UUID>)

    /**
     * Find all relationships for a target entity with a specific definition ID (inverse lookup).
     */
    @Query("""
        SELECT er FROM EntityRelationshipEntity er
        WHERE er.targetId = :targetId
        AND er.definitionId = :definitionId
    """)
    fun findByTargetIdAndDefinitionId(targetId: UUID, definitionId: UUID): List<EntityRelationshipEntity>

    /**
     * Count relationships for a given definition ID.
     */
    fun countByDefinitionId(definitionId: UUID): Long

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
                r.relationship_definition_id as definitionId,
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
                r.relationship_definition_id as definitionId,
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
