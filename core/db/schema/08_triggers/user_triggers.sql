-- =====================================================
-- USER TRIGGERS
-- =====================================================

-- Trigger to create user in public.users when auth.users is created
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();
