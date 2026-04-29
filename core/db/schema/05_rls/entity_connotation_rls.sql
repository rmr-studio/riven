-- =====================================================
-- ENTITY CONNOTATION ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on entity_connotation
ALTER TABLE entity_connotation
    ENABLE ROW LEVEL SECURITY;

-- Workspace members can select connotation envelopes for their workspace's entities
CREATE POLICY "entity_connotation_select" ON entity_connotation
    FOR SELECT TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- Workspace members can write connotation envelopes for their workspace's entities.
-- Authoring is gated to system code paths (enrichment pipeline) at the application layer.
CREATE POLICY "entity_connotation_write" ON entity_connotation
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
