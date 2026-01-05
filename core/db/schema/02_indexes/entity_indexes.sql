-- =====================================================
-- ENTITY INDEXES
-- =====================================================

-- Entity Types Indexes
DROP INDEX IF EXISTS idx_entity_types_workspace;
CREATE INDEX IF NOT EXISTS idx_entity_types_workspace
    ON entity_types (workspace_id)
    WHERE deleted = FALSE;


DROP INDEX IF EXISTS idx_entity_types_workspace_key;
CREATE INDEX IF NOT EXISTS idx_entities_workspace_type
    ON entities (workspace_id, type_id)
    WHERE deleted = FALSE;

DROP INDEX IF EXISTS idx_entities_payload_gin;
CREATE INDEX IF NOT EXISTS idx_entities_payload_gin
    ON entities USING GIN (payload)
    WHERE deleted = FALSE AND deleted_at IS NULL;

-- Entity Relationships Indexes
DROP INDEX IF EXISTS idx_entity_relationships_workspace_source;
CREATE INDEX IF NOT EXISTS idx_entity_relationships_workspace_source
    ON entity_relationships (workspace_id, source_entity_id)
    WHERE deleted = FALSE AND deleted_at IS NULL;

DROP INDEX IF EXISTS idx_entity_relationships_workspace_target;
CREATE INDEX IF NOT EXISTS idx_entity_relationships_workspace_target
    ON entity_relationships (workspace_id, target_entity_id)
    WHERE deleted = FALSE AND deleted_at IS NULL;


DROP INDEX IF EXISTS idx_entity_relationships_workspace_source_type;
CREATE INDEX IF NOT EXISTS idx_entity_relationships_workspace_source_type
    ON entity_relationships (workspace_id, source_entity_type_id)
    WHERE deleted = FALSE AND deleted_at IS NULL;


DROP INDEX IF EXISTS idx_entity_relationships_workspace_target_type;
CREATE INDEX IF NOT EXISTS idx_entity_relationships_workspace_target_type
    ON entity_relationships (workspace_id, target_entity_type_id)
    WHERE deleted = FALSE AND deleted_at IS NULL;
