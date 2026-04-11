-- Migration 068: add is_vip + relation_id to get_master_clients
-- Eliminates the second round-trip to client_master_relations in useClients.ts.
-- BOOL_OR(r.is_vip): true if ANY relation for this phone is VIP.
-- MAX(r.id): one deterministic relation_id; toggleClientVip uses client_id, not relation_id.
-- DROP required because CREATE OR REPLACE cannot change the return type signature.

DROP FUNCTION IF EXISTS get_master_clients(uuid);

CREATE FUNCTION get_master_clients(p_master_id uuid)
RETURNS TABLE (
  client_phone  text,
  client_name   text,
  client_id     uuid,
  total_visits  bigint,
  total_spent   numeric,
  average_check numeric,
  last_visit_at text,
  is_vip        boolean,
  relation_id   uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.client_phone,
    MAX(b.client_name)                       AS client_name,
    MAX(b.client_id::text)::uuid             AS client_id,
    COUNT(*)                                 AS total_visits,
    SUM(b.total_price)                       AS total_spent,
    ROUND(SUM(b.total_price) / COUNT(*), 2)  AS average_check,
    MAX(b.date)                              AS last_visit_at,
    COALESCE(BOOL_OR(r.is_vip), false)       AS is_vip,
    MAX(r.id::text)::uuid                    AS relation_id
  FROM bookings b
  LEFT JOIN client_master_relations r
         ON r.master_id  = p_master_id
        AND r.client_id  = b.client_id
        AND b.client_id IS NOT NULL
  WHERE b.master_id  = p_master_id
    AND b.status    != 'cancelled'
    AND b.client_phone IS NOT NULL
  GROUP BY b.client_phone
  ORDER BY COUNT(*) DESC
$$;

GRANT EXECUTE ON FUNCTION get_master_clients(uuid) TO authenticated;
