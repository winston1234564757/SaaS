-- Migration 090: get_retention_stats RPC
-- Replaces the sequential JS retention scan in useAnalytics.
-- Runs in parallel with the main analytics query — eliminates query waterfall
-- and 2-year unbounded JS loop.
--
-- Logic mirrors the existing JS code:
--   active_phones = unique phones with non-cancelled bookings in [start, end]
--   phone_history = total visits per phone over last 2 years up to end_date
--   returning     = total_visits > 1 (visited before in the window)
--   new           = total_visits = 1 (first ever visit in this window)

CREATE OR REPLACE FUNCTION get_retention_stats(
  p_master_id  UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS TABLE(returning_clients INT, new_clients INT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH active_phones AS (
    SELECT DISTINCT client_phone
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN p_start_date AND p_end_date
      AND status != 'cancelled'
      AND client_phone IS NOT NULL
  ),
  phone_history AS (
    SELECT
      ap.client_phone,
      COUNT(b.id) AS total_visits
    FROM active_phones ap
    JOIN bookings b
      ON  b.client_phone = ap.client_phone
      AND b.master_id    = p_master_id
      AND b.status      != 'cancelled'
      AND b.date        >= (CURRENT_DATE - INTERVAL '2 years')
      AND b.date        <= p_end_date
    GROUP BY ap.client_phone
  )
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE total_visits > 1), 0)::INT AS returning_clients,
    COALESCE(COUNT(*) FILTER (WHERE total_visits = 1), 0)::INT AS new_clients
  FROM phone_history;
$$;

GRANT EXECUTE ON FUNCTION get_retention_stats(uuid, date, date) TO authenticated;
