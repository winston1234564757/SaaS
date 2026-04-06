-- Migration 059: Fix handle_new_user trigger — копіює phone з user_metadata у profiles
--
-- Проблема: попередній тригер не копіював raw_user_meta_data->>'phone' у profiles.phone.
-- Уся відповідальність лежала на application-layer upsert у verify-sms (step 8b).
-- Це друга лінія захисту (defense in depth): якщо application-layer щось пропустить,
-- тригер гарантує що phone записується вже в момент INSERT в auth.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  extracted_name TEXT;
  assigned_role  user_role;
  extracted_phone TEXT;
BEGIN
  -- Google повертає 'name', SMS auth — 'full_name', fallback до email prefix
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

  -- SMS OTP flow зберігає телефон у user_metadata.phone (формат 380XXXXXXXXX)
  extracted_phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.profiles (id, role, full_name, email, phone)
  VALUES (NEW.id, assigned_role, extracted_name, NEW.email, extracted_phone)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email,
        -- COALESCE: не затираємо існуючий телефон якщо новий NULL (напр. Google OAuth)
        phone     = COALESCE(EXCLUDED.phone, profiles.phone);

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
