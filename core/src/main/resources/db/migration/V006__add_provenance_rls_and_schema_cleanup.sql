-- =====================================================
-- PROVENANCE RLS + SCHEMA CLEANUP
-- =====================================================
-- 1. Add RLS to entity_attribute_provenance (joins through entities for workspace scope)
-- 2. Remove redundant indexes (cleaned up in V003/V004 source, dropped here for safety)

-- =====================================================
-- 1. ENTITY ATTRIBUTE PROVENANCE RLS
-- =====================================================
-- Provenance inherits workspace scope through its entity_id FK to entities.
-- RLS policy uses a subquery to check workspace membership via the parent entity.

ALTER TABLE entity_attribute_provenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provenance_select_by_workspace" ON entity_attribute_provenance
    FOR SELECT TO authenticated
    USING (entity_id IN (
        SELECT id FROM entities WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "provenance_write_by_workspace" ON entity_attribute_provenance
    FOR ALL TO authenticated
    USING (entity_id IN (
        SELECT id FROM entities WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    ))
    WITH CHECK (entity_id IN (
        SELECT id FROM entities WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    ));

-- =====================================================
-- 2. CLEANUP REDUNDANT INDEXES (defensive drops)
-- =====================================================

DROP INDEX IF EXISTS idx_integration_definitions_slug;
DROP INDEX IF EXISTS idx_integration_connections_workspace;

-- =====================================================
-- 3. CLEANUP REDUNDANT RLS POLICY (defensive drop)
-- =====================================================

DROP POLICY IF EXISTS "integration_connections_select_by_workspace" ON integration_connections;
