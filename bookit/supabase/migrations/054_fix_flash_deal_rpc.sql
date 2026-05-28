-- Migration 054: Виправлення get_eligible_flash_deal_clients
-- Проблема: попередня версія брала клієнтів з client_master_relations,
-- яка заповнюється ТІЛЬКИ для completed бронювань (через тригер).
-- Клієнти з confirmed/pending записами — відсутні в таблиці.
--
-- Рішення: SELECT DISTINCT client_id прямо з bookings (всі хто бронював),
-- потім виключаємо тих у кого є confirmed/pending у вікні ±48 год.

CREATE OR REPLACE FUNCTION get_eligible_flash_deal_clients(
  p_master_id      UUID,
  p_slot_timestamp TIMESTAMPTZ
)
RETURNS TABLE(client_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT b.client_id
  FROM   bookings b
  WHERE  b.master_id  = p_master_id
    AND  b.client_id  IS NOT NULL
    AND  NOT EXISTS (
           SELECT 1
           FROM   bookings b2
           WHERE  b2.client_id = b.client_id
             AND  b2.master_id = p_master_id
             AND  b2.status    IN ('confirmed', 'pending')
             AND  (b2.date + b2.start_time) AT TIME ZONE 'Europe/Kyiv'
                  BETWEEN p_slot_timestamp - INTERVAL '48 hours'
                      AND p_slot_timestamp + INTERVAL '48 hours'
         );
$$;
