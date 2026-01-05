-- =====================================================
-- ACTIVITY LOGS INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_activity_logs_workspace_id;
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id
    ON public.activity_logs (workspace_id, user_id);
