-- =====================================================
-- INSIGHTS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_insights_chat_sessions_workspace_recent
    ON public.insights_chat_sessions (workspace_id, last_message_at DESC)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_insights_messages_session_created
    ON public.insights_messages (session_id, created_at);

-- Demo-seeded entity/cluster cleanup lookup
CREATE INDEX IF NOT EXISTS idx_entities_demo_session
    ON public.entities (demo_session_id)
    WHERE demo_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_identity_clusters_demo_session
    ON public.identity_clusters (demo_session_id)
    WHERE demo_session_id IS NOT NULL;
