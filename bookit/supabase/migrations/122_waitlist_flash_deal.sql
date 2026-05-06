-- Додаємо колонки для налаштування розумного таргетингу та знижок
ALTER TABLE master_profiles
ADD COLUMN IF NOT EXISTS waitlist_discount_pct INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS waitlist_lookback_days INT DEFAULT 14,
ADD COLUMN IF NOT EXISTS waitlist_lookahead_days INT DEFAULT 3;

-- Оновлюємо функцію для вибору кандидатів на Waitlist
CREATE OR REPLACE FUNCTION get_freed_slot_clients(
  p_master_id UUID,
  p_slot_timestamp TIMESTAMPTZ,
  p_excluded_client_id UUID DEFAULT NULL
)
RETURNS TABLE (
  client_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lookback_days INT;
  v_lookahead_days INT;
BEGIN
  -- 1. Отримуємо налаштування майстра (або дефолтні значення 14/3)
  SELECT COALESCE(waitlist_lookback_days, 14), COALESCE(waitlist_lookahead_days, 3)
  INTO v_lookback_days, v_lookahead_days
  FROM master_profiles
  WHERE id = p_master_id;

  -- 2. Шукаємо клієнтів
  RETURN QUERY
  SELECT cmr.client_id
  FROM   client_master_relations cmr
  WHERE  cmr.master_id = p_master_id
    AND  (p_excluded_client_id IS NULL OR cmr.client_id != p_excluded_client_id)
    AND  (
           -- Умова 1: Останній завершений запис більше ніж X днів тому
           EXISTS (
             SELECT 1
             FROM   bookings b
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     = 'completed'
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' < (CURRENT_DATE - (v_lookback_days || ' days')::INTERVAL)
           )
           OR
           -- Умова 2: Є майбутній запис далі ніж через Y днів
           EXISTS (
             SELECT 1
             FROM   bookings b
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     IN ('confirmed', 'pending')
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' > (CURRENT_DATE + (v_lookahead_days || ' days')::INTERVAL)
           )
         )
    -- Ігноруємо тих, у кого вже є запис у найближчі Y днів
    AND  NOT EXISTS (
           SELECT 1
           FROM   bookings b
           WHERE  b.client_id  = cmr.client_id
             AND  b.master_id  = p_master_id
             AND  b.status     IN ('confirmed', 'pending')
             AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv'
                  BETWEEN CURRENT_DATE
                      AND CURRENT_DATE + (v_lookahead_days || ' days')::INTERVAL
         );
END;
$$;

-- Створюємо політику для admin (service_role), щоб можна було вставляти flash deals без service_id
-- (перевірка, чи це дозволено). В таблиці flash_deals service_id вже може бути NULL.
