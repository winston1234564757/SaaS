-- Migration: RPC get_week_new_client_phones — set-diff «нових клієнтів тижня» у SQL
-- Created: 2026-07-12
-- Affects: NEW FUNCTION public.get_week_new_client_phones (нових таблиць/колонок нема)
--
-- ПРОБЛЕМА (OPT-DB-04):
--   useDashboardStats.ts:77-83 тягнув до 5000 історичних `client_phone`
--   (`.limit(5000)` БЕЗ `ORDER BY`), щоб у JS порахувати, які з телефонів цього
--   тижня — нові (`:112-124`).
--   🔴 Це не лише перф. `LIMIT` без `ORDER BY` не гарантує, ЯКІ саме рядки
--   повернуться. Щойно в майстра стане >5000 історичних бронювань, частина
--   телефонів мовчки випаде з набору `prevPhones` → давній клієнт порахується
--   як «новий». Помилки не буде — просто цифра на дашборді стане брехливою.
--   Сьогодні на проді максимум 244 бронювання на майстра, тож не стріляє.
--   Це фікс КОРЕКТНОСТІ на випередження, не оптимізація.
--
-- ЧОМУ МАСИВ, А НЕ ЛІЧИЛЬНИК:
--   Бриф OPT-DB-04 пропонував повертати число. Живий код це спростував:
--   `weekNewPhones` реально споживається — StatsWidget (blossom/studio) передає
--   його в `StatsModals.tsx:93` як `Set<string>`, щоб позначити нових клієнтів
--   у списку записів. Тому RPC віддає САМІ нормалізовані телефони: їх одиниці
--   (нові клієнти тижня), на відміну від 5000 історичних рядків.
--   Виграш зберігається, баг зникає, обидва споживачі лишаються живі.
--   Нормалізація 1:1 повторює клієнтську (`norm` = `p.replace(/\D/g, '')`),
--   бо `StatsModals` звіряє telefon через `newPhones.has(norm(b.client_phone))`.
--
-- ІНДЕКС: новий НЕ потрібен. Обидві гілки покриває наявний partial-індекс
--   `idx_bookings_master_status_date` — btree (master_id, status, date)
--   WHERE status <> 'cancelled'.

-- ============================================================
-- SAFETY CHECKS
-- ============================================================

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ), 'таблиці bookings не знайдено';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'client_phone'
  ), 'bookings.client_phone не знайдено';
END $$;

-- ============================================================
-- SCHEMA CHANGES
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_week_new_client_phones(
  p_master_id  uuid,
  p_week_start date,
  p_week_end   date
)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phones text[];
BEGIN
  -- Той самий ownership-guard, що й у get_analytics_extras.
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  -- Порожній результат нормалізації відкидаємо: телефон із самих не-цифр
  -- ("---") у JS ставав ключем '' і міг «схлопнути» кількох клієнтів в одного.
  WITH week_phones AS (
    SELECT DISTINCT regexp_replace(client_phone, '\D', '', 'g') AS phone
    FROM bookings
    WHERE master_id  = p_master_id
      AND date      >= p_week_start
      AND date      <= p_week_end
      AND status    <> 'cancelled'
      AND client_phone IS NOT NULL
      AND regexp_replace(client_phone, '\D', '', 'g') <> ''
  )
  SELECT COALESCE(array_agg(w.phone), ARRAY[]::text[])
  INTO   v_phones
  FROM   week_phones w
  WHERE  NOT EXISTS (
    SELECT 1
    FROM   bookings b
    WHERE  b.master_id  = p_master_id
      AND  b.date       < p_week_start
      AND  b.status    <> 'cancelled'
      AND  b.client_phone IS NOT NULL
      AND  regexp_replace(b.client_phone, '\D', '', 'g') = w.phone
  );

  RETURN COALESCE(v_phones, ARRAY[]::text[]);
END;
$$;

-- ============================================================
-- PRIVILEGES (той самий патерн, що в решти аналітичних RPC — anon без EXECUTE)
-- ============================================================

REVOKE ALL ON FUNCTION public.get_week_new_client_phones(uuid, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_week_new_client_phones(uuid, date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_week_new_client_phones(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_week_new_client_phones(uuid, date, date) TO service_role;

-- ============================================================
-- ROLLBACK NOTES
-- ============================================================
-- Реверс: DROP FUNCTION IF EXISTS public.get_week_new_client_phones(uuid, date, date);
-- Безпечно: функція нова, нічого не перезаписує; повернути клієнт на старий
-- fetch+JS-diff можна незалежно (useDashboardStats.ts).
