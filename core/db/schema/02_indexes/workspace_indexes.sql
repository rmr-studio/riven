-- =====================================================
-- WORKSPACE INDEXES
-- =====================================================

-- Workspace Members Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
    ON public.workspace_members (user_id);

-- Workspace Invites Indexes
CREATE INDEX IF NOT EXISTS idx_invite_workspace_id
    ON public.workspace_invites (workspace_id);

CREATE INDEX IF NOT EXISTS idx_invite_email
    ON public.workspace_invites (email);

CREATE INDEX IF NOT EXISTS idx_invite_token
    ON public.workspace_invites (invite_code);
