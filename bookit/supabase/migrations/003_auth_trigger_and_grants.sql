-- ─────────────────────────────────────────────────────────────────────────────
-- Міграція 003: тригер авто-створення профілю + GRANT для PostgREST
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. GRANT — даємо PostgREST доступ до всіх таблиць
--    (потрібно коли міграція запускалась вручну через SQL, а не через Supabase UI)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Щоб нові таблиці в майбутньому також отримували grants автоматично
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;


-- 2. Тригер: автоматично створює рядок у `profiles` при реєстрації
--    Запускається після INSERT в auth.users з привілеями власника БД (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'client'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;  -- ідемпотентно, якщо профіль вже є

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Не блокуємо реєстрацію якщо щось пішло не так
  RETURN NEW;
END;
$$;

-- Видаляємо якщо вже є, щоб уникнути конфлікту
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
