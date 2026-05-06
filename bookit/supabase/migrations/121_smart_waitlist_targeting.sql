-- Migration 121: Smart Waitlist and Flash Deal Targeting
-- Implement advanced filtering rules:
-- 1. Client has NO bookings in the next 3 days
-- AND 2. (Client's last completed booking was > 14 days ago OR Client has a future booking > 3 days away)

-- ─────────────────────────────────────────────────────────────────────────
-- RPC 1: get_freed_slot_clients
-- Використовується при автоматичному скасуванні запису (Waitlist).
-- Не прив'язано до конкретної послуги.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_freed_slot_clients(
  p_master_id      UUID,
  p_slot_timestamp TIMESTAMPTZ
)
RETURNS TABLE(client_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cmr.client_id
  FROM   client_master_relations cmr
  WHERE  cmr.master_id = p_master_id
    AND  NOT EXISTS (
           -- Фільтр: немає записів на найближчі 3 дні від сьогодні
           SELECT 1
           FROM   bookings b
           WHERE  b.client_id  = cmr.client_id
             AND  b.master_id  = p_master_id
             AND  b.status     IN ('confirmed', 'pending')
             AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv'
                  BETWEEN CURRENT_DATE
                      AND CURRENT_DATE + INTERVAL '3 days'
         )
    AND  (
           -- Умова 1: Останній завершений запис більше ніж 14 днів тому
           EXISTS (
             SELECT 1
             FROM   bookings b
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     = 'completed'
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' < (CURRENT_DATE - INTERVAL '14 days')
           )
           OR
           -- Умова 2: Є майбутній запис НЕ раніше ніж через 3 дні
           EXISTS (
             SELECT 1
             FROM   bookings b
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     IN ('confirmed', 'pending')
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' > (CURRENT_DATE + INTERVAL '3 days')
           )
         );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC 2: get_eligible_flash_deal_clients
-- Оновлена версія для Флеш-акцій. 
-- Перевіряє, що клієнт робив САМЕ ЦЮ послугу 14 днів тому (або має майбутній запис).
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS get_eligible_flash_deal_clients(UUID, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_eligible_flash_deal_clients(
  p_master_id      UUID,
  p_service_id     UUID,
  p_slot_timestamp TIMESTAMPTZ
)
RETURNS TABLE(client_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cmr.client_id
  FROM   client_master_relations cmr
  WHERE  cmr.master_id = p_master_id
    AND  NOT EXISTS (
           -- Фільтр: немає записів на найближчі 3 дні від сьогодні
           SELECT 1
           FROM   bookings b
           WHERE  b.client_id  = cmr.client_id
             AND  b.master_id  = p_master_id
             AND  b.status     IN ('confirmed', 'pending')
             AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv'
                  BETWEEN CURRENT_DATE
                      AND CURRENT_DATE + INTERVAL '3 days'
         )
    AND  (
           -- Умова 1: Останній запис на ЦЮ Ж послугу був більше ніж 14 днів тому
           EXISTS (
             SELECT 1
             FROM   bookings b
             JOIN   booking_services bs ON bs.booking_id = b.id
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     = 'completed'
               AND  bs.service_id = p_service_id
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' < (CURRENT_DATE - INTERVAL '14 days')
           )
           OR
           -- Умова 2: Є майбутній запис (на будь-яку послугу) НЕ раніше ніж через 3 дні
           EXISTS (
             SELECT 1
             FROM   bookings b
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     IN ('confirmed', 'pending')
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' > (CURRENT_DATE + INTERVAL '3 days')
           )
         );
$$;
