-- Migration 023: Fix handle_new_user trigger for Google OAuth and phone auth
-- Problems fixed:
--   1. Google returns name (not full_name) in raw_user_meta_data
--   2. Trigger did not create client_profiles for client users
--   3. role cast could fail if metadata is missing

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  extracted_name TEXT;
  assigned_role  user_role;
BEGIN
  -- Google returns 'name', phone auth returns 'full_name', fallback to email prefix
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Користувач'
  );

  assigned_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'client'::user_role
  );

  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (NEW.id, assigned_role, extracted_name, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email;

  IF assigned_role = 'client' THEN
    INSERT INTO public.client_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
