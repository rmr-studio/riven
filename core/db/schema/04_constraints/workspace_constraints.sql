-- =====================================================
-- WORKSPACE CONSTRAINTS
-- =====================================================

-- Ensure workspace_members has unique constraint on workspace_id + user_id
-- Note: This is already defined in 01_tables/workspace.sql as part of table creation
-- This ALTER is for existing databases that need the constraint added
ALTER TABLE public.workspace_members
    ADD CONSTRAINT uq_workspace_user UNIQUE (workspace_id, user_id);

-- Ensure workspace_invites has unique invite code
ALTER TABLE workspace_invites
    ADD CONSTRAINT uq_invite_code UNIQUE (invite_code);
