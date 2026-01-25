-- =====================================================
-- USER FUNCTIONS
-- =====================================================

-- Function to handle new user creation from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = ''
AS
$$
BEGIN
    INSERT INTO public.users (id, name, email, phone, avatar_url)
    VALUES (NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
            COALESCE(NEW.raw_user_meta_data ->> 'avatar_url',
                     NEW.raw_user_meta_data ->> 'picture',
                     ''));
    RETURN NEW;
END
$$;

-- Function to handle phone number confirmation updates
CREATE OR REPLACE FUNCTION public.handle_phone_confirmation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = ''
AS
$$
BEGIN
    IF NEW.phone IS NOT NULL THEN
        UPDATE public.users
        SET phone = NEW.phone
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;
