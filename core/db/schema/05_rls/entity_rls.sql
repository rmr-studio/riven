-- =====================================================
-- ENTITY ROW LEVEL SECURITY POLICIES
-- =====================================================

-- =====================================================
-- ENTITY TYPES RLS
-- =====================================================

-- Enable RLS on entity_types
ALTER TABLE entity_types
    ENABLE ROW LEVEL SECURITY;

-- Entity types can be selected by workspace members or if system (workspace_id IS NULL)
CREATE POLICY "entity_types_select_by_org" ON entity_types
    FOR SELECT TO authenticated
    USING (
    workspace_id IS NULL OR
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- Entity types can be written by workspace members
CREATE POLICY "entity_types_write_by_org" ON entity_types
    FOR ALL TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    )
    WITH CHECK (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- =====================================================
-- ENTITIES RLS
-- =====================================================

-- Enable RLS on entities
ALTER TABLE entities
    ENABLE ROW LEVEL SECURITY;

-- Entities can be selected by workspace members
CREATE POLICY "entities_select_by_org" ON entities
    FOR SELECT TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- Entities can be written by workspace members
CREATE POLICY "entities_write_by_org" ON entities
    FOR ALL TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    )
    WITH CHECK (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- =====================================================
-- ENTITY RELATIONSHIPS RLS
-- =====================================================

-- Enable RLS on entity_relationships
ALTER TABLE entity_relationships
    ENABLE ROW LEVEL SECURITY;

-- Entity relationships can be selected by workspace members
CREATE POLICY "entity_relationships_select_by_org" ON entity_relationships
    FOR SELECT TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- Entity relationships can be written by workspace members
CREATE POLICY "entity_relationships_write_by_org" ON entity_relationships
    FOR ALL TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    )
    WITH CHECK (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- =====================================================
-- ENTITY ATTRIBUTE PROVENANCE RLS
-- =====================================================
-- Provenance inherits workspace scope through entity_id FK

ALTER TABLE entity_attribute_provenance
    ENABLE ROW LEVEL SECURITY;

-- Provenance records can be selected by workspace members (via parent entity)
CREATE POLICY "provenance_select_by_workspace" ON entity_attribute_provenance
    FOR SELECT TO authenticated
    USING (entity_id IN (
        SELECT id FROM entities WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    ));

-- Provenance records can be written by workspace members (via parent entity)
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
