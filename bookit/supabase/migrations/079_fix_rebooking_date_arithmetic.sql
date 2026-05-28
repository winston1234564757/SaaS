-- Migration 079: Fix date arithmetic in get_rebooking_due_clients
-- Bug: `p_today - cycle * INTERVAL '1 day'` returns TIMESTAMP, not DATE.
--      Comparing DATE = TIMESTAMP silently mismatches in Postgres.
-- Fix: `p_today - cycle` uses DATE - INTEGER = DATE arithmetic (correct).
--      Future booking check: `date > p_today` (date column vs date param, correct).

CREATE OR REPLACE FUNCTION get_rebooking_due_clients(p_today date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  master_id      uuid,
  client_id      uuid,
  master_tg_chat text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH master_cycles AS (
    SELECT
      id                                      AS master_id,
      COALESCE(retention_cycle_days, 30)      AS cycle,
      telegram_chat_id                        AS master_tg_chat
    FROM master_profiles
    WHERE is_published = true
  ),
  last_visits AS (
    SELECT b.master_id, b.client_id, MAX(b.date) AS last_date
    FROM bookings b
    WHERE b.status    = 'completed'
      AND b.client_id IS NOT NULL
    GROUP BY b.master_id, b.client_id
  ),
  due AS (
    SELECT lv.master_id, lv.client_id, mc.master_tg_chat
    FROM last_visits lv
    JOIN master_cycles mc ON mc.master_id = lv.master_id
    -- DATE - INTEGER = DATE (correct); previously DATE - INTERVAL = TIMESTAMP (wrong)
    WHERE lv.last_date = p_today - mc.cycle
  ),
  has_future AS (
    SELECT DISTINCT master_id, client_id
    FROM bookings
    WHERE status IN ('pending', 'confirmed')
      AND date > p_today
      AND client_id IS NOT NULL
  ),
  already_notified AS (
    SELECT related_master_id AS master_id, recipient_id AS client_id
    FROM notifications
    WHERE type         = 'rebooking_reminder'
      AND created_at::date = p_today
  )
  SELECT d.master_id, d.client_id, d.master_tg_chat
  FROM due d
  WHERE NOT EXISTS (
    SELECT 1 FROM has_future f
    WHERE f.master_id = d.master_id AND f.client_id = d.client_id
  )
    AND NOT EXISTS (
    SELECT 1 FROM already_notified n
    WHERE n.master_id = d.master_id AND n.client_id = d.client_id
  )
$$;

GRANT EXECUTE ON FUNCTION get_rebooking_due_clients(date) TO service_role;
