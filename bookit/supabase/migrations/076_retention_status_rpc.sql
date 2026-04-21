-- Migration 076: retention_status in get_master_clients RPC
-- Computed dynamically from last_visit_at (days since last completed booking).
-- No new table column — pure SQL expression inside the aggregation.
--
-- Thresholds:
--   'active'   → < 30 days since last visit
--   'sleeping' → 30–59 days
--   'at_risk'  → 60–89 days
--   'lost'     → ≥ 90 days
--
-- DROP required because CREATE OR REPLACE cannot change the return type.

DROP FUNCTION IF EXISTS get_master_clients(uuid);

CREATE FUNCTION get_master_clients(p_master_id uuid)
RETURNS TABLE (
  client_phone     text,
  client_name      text,
  client_id        uuid,
  total_visits     bigint,
  total_spent      numeric,
  average_check    numeric,
  last_visit_at    text,
  is_vip           boolean,
  relation_id      uuid,
  retention_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.client_phone,
    MAX(b.client_name)                                   AS client_name,
    MAX(b.client_id::text)::uuid                         AS client_id,
    COUNT(*)                                             AS total_visits,
    SUM(b.total_price)                                   AS total_spent,
    ROUND(SUM(b.total_price) / COUNT(*), 2)              AS average_check,
    MAX(b.date)::text                                    AS last_visit_at,
    COALESCE(BOOL_OR(r.is_vip), false)                   AS is_vip,
    MAX(r.id::text)::uuid                                AS relation_id,
    CASE
      WHEN MAX(b.date) IS NULL                                    THEN 'active'
      WHEN (CURRENT_DATE - MAX(b.date)) < 30                      THEN 'active'
      WHEN (CURRENT_DATE - MAX(b.date)) BETWEEN 30 AND 59         THEN 'sleeping'
      WHEN (CURRENT_DATE - MAX(b.date)) BETWEEN 60 AND 89         THEN 'at_risk'
      ELSE                                                              'lost'
    END                                                  AS retention_status
  FROM bookings b
  LEFT JOIN client_master_relations r
         ON r.master_id = p_master_id
        AND r.client_id = b.client_id
  WHERE b.master_id  = p_master_id
    AND b.status    != 'cancelled'
    AND b.client_phone IS NOT NULL
  GROUP BY b.client_phone
  ORDER BY COUNT(*) DESC
$$;

GRANT EXECUTE ON FUNCTION get_master_clients(uuid) TO authenticated;
