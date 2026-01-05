-- =====================================================
-- WORKSPACE FUNCTIONS
-- =====================================================

-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_workspace_member_count()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment member count on INSERT
        UPDATE public.workspaces
        SET member_count = member_count + 1,
            updated_at   = now()
        WHERE id = NEW.workspace_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement member count on DELETE
        UPDATE public.workspaces
        SET member_count = member_count - 1,
            updated_at   = now()
        WHERE id = OLD.workspace_id;
    END IF;

    RETURN NULL; -- Triggers on INSERT/DELETE do not modify the rows
END;
$$ LANGUAGE plpgsql;
