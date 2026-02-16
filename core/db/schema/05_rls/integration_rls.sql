-- =====================================================
-- INTEGRATION CONNECTIONS RLS POLICIES
-- =====================================================
-- Workspace-scoped access (matches existing entity pattern)
-- Note: integration_definitions has NO RLS - it's a global catalog

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

-- Integration connections can be read and written by workspace members
CREATE POLICY "integration_connections_write_by_workspace" ON integration_connections
    FOR ALL TO authenticated
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ))
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
