-- =====================================================
-- WORKSPACE TRIGGERS
-- =====================================================

-- Trigger for INSERT and DELETE on workspace_members
CREATE OR REPLACE TRIGGER trg_update_workspace_member_count
    AFTER INSERT OR DELETE
    ON public.workspace_members
    FOR EACH ROW
EXECUTE FUNCTION public.update_workspace_member_count();
