-- Migration 20260630000000: Fix `get_analytics_extras` crash (42883)
--
-- ROOT CAUSE: `get_churn_predictions` and `get_cross_sell_matrix` used
-- `EXTRACT(day FROM (dateA - dateB))`. In Postgres `date - date` already
-- yields an INTEGER (number of days), so this becomes
-- `EXTRACT(day FROM <integer>)` → ERROR `function pg_catalog.extract(unknown, integer)
-- does not exist` (SQLSTATE 42883). Because `get_analytics_extras` aggregates
-- these functions (growth + ops sections), ANY Pro account with qualifying data
-- made the whole RPC throw → `extras` came back null → LTV/uplift/cohort/
-- distribution всюди показували 0. (get_ltv_concentration сам по собі коректний.)
--
-- FIX: date subtraction already returns integer days — drop EXTRACT, cast directly.
-- Тіла функцій відтворено 1:1 з 20260605000001_analytics_system_v2.sql, змінено
-- лише три вирази дати.

-- ─── 4. CHURN RISK PREDICTIONS (fixed) ────────────────────────
CREATE OR REPLACE FUNCTION get_churn_predictions(
  p_master_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH client_visits AS (
    SELECT
      client_id,
      COUNT(*)::int AS visits_count,
      MIN(date) AS first_visit,
      MAX(date) AS last_visit,
      SUM(total_price) AS client_ltv
    FROM bookings
    WHERE master_id = p_master_id
      AND status = 'completed'
      AND client_id IS NOT NULL
    GROUP BY client_id
    HAVING COUNT(*) >= 2
  ),
  client_intervals AS (
    SELECT
      cv.client_id,
      cv.visits_count,
      cv.last_visit,
      cv.client_ltv,
      (now()::date - cv.last_visit)::int AS days_inactive,
      GREATEST(14, ROUND(((cv.last_visit - cv.first_visit)::decimal / (cv.visits_count - 1))))::int AS avg_interval
    FROM client_visits cv
  ),
  churn_risks AS (
    SELECT
      ci.client_id,
      p.full_name AS client_name,
      p.phone AS client_phone,
      ci.last_visit,
      ci.days_inactive,
      ci.avg_interval,
      ROUND(ci.client_ltv * 100)::int AS ltv_kopecks,
      (ci.days_inactive::decimal / ci.avg_interval)::decimal AS risk_ratio
    FROM client_intervals ci
    JOIN profiles p ON ci.client_id = p.id
    WHERE ci.days_inactive > ci.avg_interval * 1.5
  )
  SELECT jsonb_agg(jsonb_build_object(
    'client_id', cr.client_id,
    'client_name', cr.client_name,
    'client_phone', cr.client_phone,
    'last_visit_date', cr.last_visit,
    'days_inactive', cr.days_inactive,
    'avg_interval', cr.avg_interval,
    'ltv', cr.ltv_kopecks,
    'risk_level',
      CASE
        WHEN cr.risk_ratio >= 2.5 THEN 'high'
        ELSE 'medium'
      END
  ) ORDER BY cr.days_inactive DESC)
  INTO result
  FROM churn_risks cr
  LIMIT 15;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ─── 5. CROSS-SELL MATRIX (fixed) ─────────────────────────────
CREATE OR REPLACE FUNCTION get_cross_sell_matrix(
  p_master_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH ordered_bookings AS (
    SELECT
      b.client_id,
      bs.service_name AS service_name,
      b.date AS visit_date,
      LEAD(bs.service_name) OVER (PARTITION BY b.client_id ORDER BY b.date, b.start_time) AS next_service_name,
      LEAD(b.date) OVER (PARTITION BY b.client_id ORDER BY b.date, b.start_time) AS next_visit_date
    FROM bookings b
    JOIN booking_services bs ON b.id = bs.booking_id
    WHERE b.master_id = p_master_id
      AND b.status = 'completed'
      AND b.client_id IS NOT NULL
  ),
  service_transitions AS (
    SELECT
      service_name AS service_a,
      next_service_name AS service_b,
      (next_visit_date - visit_date)::int AS days_diff
    FROM ordered_bookings
    WHERE next_service_name IS NOT NULL
      AND service_name <> next_service_name
  ),
  transition_stats AS (
    SELECT
      service_a,
      service_b,
      COUNT(*)::int AS transition_count,
      ROUND(AVG(days_diff))::int AS avg_days_diff
    FROM service_transitions
    GROUP BY service_a, service_b
  ),
  service_totals AS (
    SELECT service_a, SUM(transition_count) AS total_a
    FROM transition_stats
    GROUP BY service_a
  )
  SELECT jsonb_agg(jsonb_build_object(
    'service_a', ts.service_a,
    'service_b', ts.service_b,
    'pair_count', ts.transition_count,
    'avg_days', ts.avg_days_diff,
    'conversion_pct', ROUND((ts.transition_count::decimal / st.total_a) * 100)
  ) ORDER BY ts.transition_count DESC)
  INTO result
  FROM transition_stats ts
  JOIN service_totals st ON ts.service_a = st.service_a
  WHERE ts.transition_count >= 2
  LIMIT 10;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
