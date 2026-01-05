-- =====================================================
-- AUTH / JWT FUNCTIONS
-- =====================================================

-- Add Workspace Roles to Supabase JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
    RETURNS jsonb
    LANGUAGE plpgsql
    STABLE
AS
$$
DECLARE
    claims jsonb;
    _roles jsonb;
BEGIN
    SELECT COALESCE(
                   jsonb_agg(jsonb_build_object('workspace_id', workspace_id, 'role', role)),
                   '[]'::jsonb)
    INTO _roles
    FROM public.workspace_members
    WHERE user_id = (event ->> 'user_id')::uuid;

    claims := event -> 'claims';
    claims := jsonb_set(claims, '{roles}', _roles, TRUE);
    event := jsonb_set(event, '{claims}', claims, TRUE);

    RETURN event;
END;
$$;
