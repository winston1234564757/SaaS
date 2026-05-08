-- Migration 125: Include last service name in get_master_clients RPC
-- Purpose: Show the service name of the last visit on the client dashboard cards.

DROP FUNCTION IF EXISTS get_master_clients(uuid);

CREATE OR REPLACE FUNCTION get_master_clients(p_master_id uuid)
RETURNS TABLE (
  client_phone      text,
  client_name       text,
  client_id         uuid,
  total_visits      bigint,
  total_spent       numeric,
  average_check     numeric,
  last_visit_at     text,
  last_service_name text,
  is_vip            boolean,
  relation_id       uuid,
  retention_status  text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cycle(n) AS (
    SELECT COALESCE(mp.retention_cycle_days, 30)
    FROM master_profiles mp
    WHERE mp.id = p_master_id
  ),
  last_visit_info AS (
    SELECT DISTINCT ON (b.client_phone)
      b.client_phone,
      bs.service_name
    FROM bookings b
    LEFT JOIN booking_services bs ON b.id = bs.booking_id
    WHERE b.master_id = p_master_id AND b.status != 'cancelled'
    ORDER BY b.client_phone, b.date DESC, b.start_time DESC
  )
  SELECT
    b.client_phone,
    MAX(b.client_name)                                   AS client_name,
    MAX(b.client_id::text)::uuid                         AS client_id,
    COUNT(*)                                             AS total_visits,
    SUM(b.total_price)                                   AS total_spent,
    ROUND(SUM(b.total_price) / COUNT(*), 2)              AS average_check,
    MAX(b.date)::text                                    AS last_visit_at,
    MAX(lvi.service_name)                                AS last_service_name,
    COALESCE(BOOL_OR(r.is_vip), false)                   AS is_vip,
    MAX(r.id::text)::uuid                                AS relation_id,
    CASE
      WHEN MAX(b.date) IS NULL                                             THEN 'active'
      WHEN (CURRENT_DATE - MAX(b.date)) <  (SELECT n     FROM cycle)      THEN 'active'
      WHEN (CURRENT_DATE - MAX(b.date)) <  (SELECT n * 2 FROM cycle)      THEN 'sleeping'
      WHEN (CURRENT_DATE - MAX(b.date)) <  (SELECT n * 3 FROM cycle)      THEN 'at_risk'
      ELSE                                                                      'lost'
    END                                                  AS retention_status
  FROM bookings b
  LEFT JOIN client_master_relations r
         ON r.master_id = p_master_id
        AND r.client_id = b.client_id
  LEFT JOIN last_visit_info lvi ON lvi.client_phone = b.client_phone
  WHERE b.master_id  = p_master_id
    AND b.status    != 'cancelled'
    AND b.client_phone IS NOT NULL
    AND (r.is_archived IS NULL OR r.is_archived = false)
  GROUP BY b.client_phone
  ORDER BY COUNT(*) DESC
$$;

GRANT EXECUTE ON FUNCTION get_master_clients(uuid) TO authenticated;
