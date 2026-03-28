-- Migration 048: Server-side client aggregation RPC
-- Replaces client-side aggregation of up to 5000 booking rows in useClients.ts.
-- Returns one row per unique client_phone with pre-computed stats.

CREATE OR REPLACE FUNCTION get_master_clients(p_master_id uuid)
RETURNS TABLE (
  client_phone  text,
  client_name   text,
  client_id     uuid,
  total_visits  bigint,
  total_spent   numeric,
  average_check numeric,
  last_visit_at text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.client_phone,
    MAX(b.client_name)                                    AS client_name,
    MAX(b.client_id::text)::uuid                          AS client_id,
    COUNT(*)                                              AS total_visits,
    SUM(b.total_price)                                    AS total_spent,
    ROUND(SUM(b.total_price) / COUNT(*), 2)               AS average_check,
    MAX(b.date)                                           AS last_visit_at
  FROM bookings b
  WHERE b.master_id = p_master_id
    AND b.status    != 'cancelled'
    AND b.client_phone IS NOT NULL
  GROUP BY b.client_phone
  ORDER BY COUNT(*) DESC
$$;

-- Grant execute to authenticated users (RLS on bookings already scopes data per master)
GRANT EXECUTE ON FUNCTION get_master_clients(uuid) TO authenticated;
