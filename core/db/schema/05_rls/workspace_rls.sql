-- =====================================================
-- WORKSPACE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on workspaces table
ALTER TABLE workspaces
    ENABLE ROW LEVEL SECURITY;

-- Users can view their own workspaces
CREATE POLICY "Users can view their own workspaces" ON workspaces
    FOR SELECT
    TO authenticated
    USING (
    id IN (SELECT workspace_id
           FROM workspace_members
           WHERE user_id = auth.uid())
    );
