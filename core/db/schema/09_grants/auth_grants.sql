-- =====================================================
-- AUTH GRANTS
-- =====================================================

-- Grant necessary permissions to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE
    ON FUNCTION public.custom_access_token_hook
    TO supabase_auth_admin;

REVOKE EXECUTE
    ON FUNCTION public.custom_access_token_hook
    FROM authenticated, anon, public;

GRANT ALL ON TABLE public.workspaces TO supabase_auth_admin;
GRANT ALL ON TABLE public.users TO supabase_auth_admin;
GRANT ALL ON TABLE public.workspace_members TO supabase_auth_admin;

-- Allow auth admin to read workspace member roles
CREATE POLICY "Allow auth admin to read workspace member roles" ON public.workspace_members
    AS PERMISSIVE FOR SELECT
    TO supabase_auth_admin
    USING (TRUE);
    