-- Pre-Launch Audit R2 — repo-parity: back-port authoritative (guarded) function bodies from prod.
--
-- PROVENANCE: bodies below were pulled from the PROD database (ref sqlrxsopllgztvgrerqk) via the
-- Supabase Management API on 2026-07-08 with pg_get_functiondef(). The R2 IDOR fix (migration
-- 20260706120000) applied auth.uid() ownership guards to these SECURITY DEFINER RPCs directly on
-- prod via the API; the guard bodies never lived in repo source. This migration re-asserts them so
-- a future `supabase db push` reproduces the guarded state instead of regressing to legacy bodies.
-- Also adds decrement_product_stock_atomic (existed on prod, was missing from repo entirely).
--
-- Guard pattern (owner arg p_master_id, or p_referrer_id for get_c2c_balance):
--   IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN
--     RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;
-- claim_phone_discount is intentionally NOT owner-guarded (called by the CLIENT, not the master);
-- its protection is REVOKE-from-anon (authenticated-only). decrement_product_stock_atomic is a
-- server-side atomic stock op (no ownership arg).
--
-- CREATE OR REPLACE preserves existing grants on prod; the REVOKE/GRANT block at the end makes this
-- migration self-contained and order-independent on a fresh `db push`. Idempotent, safe to re-run.


-- ── claim_phone_discount(p_phone text, p_master_id uuid, p_service_id uuid) ──
CREATE OR REPLACE FUNCTION public.claim_phone_discount(p_phone text, p_master_id uuid, p_service_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(discount_percent integer, discount_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_discount phone_discounts%ROWTYPE;
BEGIN
  -- Lock the row
  SELECT * INTO v_discount
  FROM phone_discounts
  WHERE phone = p_phone
    AND master_id = p_master_id
    AND used_at IS NULL
    AND expires_at > NOW()
    AND (service_id IS NULL OR service_id = p_service_id)
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Mark used
  UPDATE phone_discounts SET used_at = NOW() WHERE id = v_discount.id;

  -- Update recipient log
  UPDATE broadcast_recipients
  SET discount_used_at = NOW()
  WHERE broadcast_id = v_discount.broadcast_id AND phone = p_phone;

  RETURN QUERY SELECT v_discount.discount_percent, v_discount.id;
END;
$function$;

-- ── decrement_product_stock_atomic(p_product_id uuid, p_qty integer) ──
CREATE OR REPLACE FUNCTION public.decrement_product_stock_atomic(p_product_id uuid, p_qty integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE products
  SET stock_qty = stock_qty - p_qty
  WHERE id = p_product_id
    AND stock_qty >= p_qty;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$function$;

-- ── get_analytics_extras(p_master_id uuid, p_start_date date, p_end_date date, p_is_pro boolean, p_scope text) ──
CREATE OR REPLACE FUNCTION public.get_analytics_extras(p_master_id uuid, p_start_date date, p_end_date date, p_is_pro boolean, p_scope text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r JSONB := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  -- Section: health / score (завжди)
  r := r || jsonb_build_object(
    'business_health', get_business_health_score(p_master_id)
  );

  -- Section: engagement (broadcast, dynamic pricing uplift) — завжди
  IF p_scope IN ('all','main','engagement') THEN
    r := r || jsonb_build_object(
      'dynamic_pricing_uplift',   get_dynamic_pricing_uplift(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  -- Section: growth (loyalty, referral, ltv, cohort, churn) — Pro
  IF p_is_pro AND p_scope IN ('all','main','growth') THEN
    r := r || jsonb_build_object(
      'ltv_concentration',   get_ltv_concentration(p_master_id, p_start_date, p_end_date),
      'cohort_matrix',       get_cohort_retention(p_master_id, p_start_date, p_end_date),
      'churn_predictions',   get_churn_predictions(p_master_id)
    );
  END IF;

  -- Section: ops (heatmap, anomaly, service pairing, cross sell, idle cost) — Pro
  IF p_is_pro AND p_scope IN ('all','main','ops') THEN
    r := r || jsonb_build_object(
      'occupancy_heatmap',  get_occupancy_heatmap(p_master_id, p_start_date, p_end_date),
      'anomaly_alerts',     get_anomaly_alerts(p_master_id),
      'service_pairing',    get_service_pairing(p_master_id, p_start_date, p_end_date),
      'cross_sell_matrix',  get_cross_sell_matrix(p_master_id),
      'idle_slots_cost',    get_idle_slots_cost(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  -- Section: finances & stock — Pro
  IF p_is_pro AND p_scope IN ('all','finances','stock') THEN
    r := r || jsonb_build_object(
      'finances',           get_finance_analytics(p_master_id, p_start_date, p_end_date),
      'stock_forecast',     get_stock_forecast(p_master_id)
    );
  END IF;

  -- Goals: завжди (навіть Starter)
  r := r || jsonb_build_object(
    'goal_progress', get_goal_progress(p_master_id, p_start_date, p_end_date)
  );

  RETURN r;
END;
$function$;

-- ── get_anomaly_alerts(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_anomaly_alerts(p_master_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  -- Виявляємо дні наступного тижня з аномально низьким завантаженням
  WITH daily_stats AS (
    SELECT 
      date,
      EXTRACT(ISODOW FROM date)::int AS dow,
      COUNT(*)::decimal AS booking_count
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN now()::date - INTERVAL '90 days' AND now()::date
      AND status IN ('confirmed', 'completed')
    GROUP BY 1, 2
  ),
  dow_stats AS (
    SELECT 
      dow,
      AVG(booking_count) AS avg_bookings,
      STDDEV(booking_count) AS stddev_bookings
    FROM daily_stats
    GROUP BY 1
  ),
  future_bookings AS (
    SELECT 
      date,
      EXTRACT(ISODOW FROM date)::int AS dow,
      COUNT(*) AS booking_count
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN now()::date + 1 AND now()::date + 7
      AND status IN ('confirmed', 'pending')
    GROUP BY 1, 2
  )
  SELECT jsonb_agg(jsonb_build_object(
    'date', fb.date,
    'dow', fb.dow,
    'booking_count', fb.booking_count,
    'avg_bookings', ROUND(ds.avg_bookings, 1),
    'deviation', ROUND((fb.booking_count - ds.avg_bookings) / COALESCE(NULLIF(ds.stddev_bookings, 0), 1), 2),
    'alert_type', 'low_occupancy_alert'
  ))
  INTO result
  FROM future_bookings fb
  JOIN dow_stats ds ON fb.dow = ds.dow
  WHERE fb.booking_count < ds.avg_bookings - 1.5 * COALESCE(ds.stddev_bookings, 1)
    OR (fb.booking_count = 0 AND ds.avg_bookings > 2);

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- ── get_business_health_score(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_business_health_score(p_master_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_retention_score INT := 80;
  v_noshow_score INT := 95;
  v_ticket_score INT := 80;
  v_occupancy_score INT := 70;
  v_ltv_score INT := 85;
  v_total_score INT;
  
  v_total_clients INT;
  v_returning_clients INT;
  v_total_bookings INT;
  v_noshow_bookings INT;
  v_completed_bookings INT;
  v_duration_sum INT;
  
  v_avg_check_recent DECIMAL(10,2);
  v_avg_check_prev DECIMAL(10,2);
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  -- 1. Retention score (90 днів)
  WITH client_stats AS (
    SELECT client_id, COUNT(*) AS visit_count
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN current_date - 90 AND current_date
      AND status = 'completed'
      AND client_id IS NOT NULL
    GROUP BY client_id
  )
  SELECT 
    COUNT(*), 
    COUNT(CASE WHEN visit_count >= 2 THEN 1 END)
  INTO v_total_clients, v_returning_clients
  FROM client_stats;
  
  IF COALESCE(v_total_clients, 0) > 0 THEN
    v_retention_score := ROUND((v_returning_clients::decimal / v_total_clients) * 100);
  END IF;

  -- 2. No-show score (90 днів)
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status = 'no_show' THEN 1 END),
    COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO v_total_bookings, v_noshow_bookings, v_completed_bookings
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN current_date - 90 AND current_date
    AND status IN ('completed', 'no_show');

  IF COALESCE(v_completed_bookings + v_noshow_bookings, 0) > 0 THEN
    v_noshow_score := 100 - ROUND((v_noshow_bookings::decimal / (v_completed_bookings + v_noshow_bookings)) * 100);
  END IF;

  -- 3. Average Check Trend (30 днів vs попередні 30 днів)
  SELECT AVG(total_price) INTO v_avg_check_recent
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN current_date - 30 AND current_date
    AND status = 'completed';
    
  SELECT AVG(total_price) INTO v_avg_check_prev
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN current_date - 60 AND current_date - 31
    AND status = 'completed';

  IF COALESCE(v_avg_check_recent, 0) > 0 AND COALESCE(v_avg_check_prev, 0) > 0 THEN
    IF v_avg_check_recent > v_avg_check_prev THEN
      v_ticket_score := 100;
    ELSIF v_avg_check_recent = v_avg_check_prev THEN
      v_ticket_score := 85;
    ELSE
      v_ticket_score := 60;
    END IF;
  END IF;

  -- 4. Occupancy score (30 днів)
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/60), 0) INTO v_duration_sum
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN current_date - 30 AND current_date
    AND status IN ('confirmed', 'completed');

  -- 176 годин = 10560 хвилин
  IF v_duration_sum > 0 THEN
    v_occupancy_score := LEAST(100, ROUND((v_duration_sum::decimal / 10560.0) * 100));
  ELSE
    v_occupancy_score := 0;
  END IF;

  v_ltv_score := ROUND((v_retention_score + v_occupancy_score) / 2.0);
  v_total_score := ROUND((v_retention_score + v_noshow_score + v_ticket_score + v_occupancy_score + v_ltv_score) / 5.0);

  RETURN jsonb_build_object(
    'score', v_total_score,
    'retention_score', v_retention_score,
    'noshow_score', v_noshow_score,
    'ticket_score', v_ticket_score,
    'occupancy_score', v_occupancy_score,
    'ltv_score', v_ltv_score
  );
END;
$function$;

-- ── get_c2c_balance(p_referrer_id uuid, p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_c2c_balance(p_referrer_id uuid, p_master_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_earned INTEGER;
  v_used   INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_referrer_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE='42501'; END IF;

  -- Сумуємо фактичні відсотки з кожного завершеного реферала
  SELECT COALESCE(SUM(discount_pct), 0) INTO v_earned
  FROM c2c_referrals
  WHERE referrer_id = p_referrer_id 
    AND master_id = p_master_id 
    AND status = 'completed';

  -- Віднімаємо вже використані бонуси
  SELECT COALESCE(SUM(discount_used), 0) INTO v_used
  FROM c2c_bonus_uses
  WHERE referrer_id = p_referrer_id AND master_id = p_master_id;

  RETURN GREATEST(0, v_earned - v_used);
END;
$function$;

-- ── get_c2c_stats_for_master(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_c2c_stats_for_master(p_master_id uuid)
 RETURNS TABLE(total_referrals bigint, completed_referrals bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
SELECT
    COUNT(*)                                    AS total_referrals,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_referrals
  FROM c2c_referrals
  WHERE master_id = p_master_id;
END;
$function$;

-- ── get_churn_predictions(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_churn_predictions(p_master_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

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
$function$;

-- ── get_cohort_retention(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_cohort_retention(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  WITH client_first_visit AS (
    SELECT 
      client_id,
      MIN(date) AS first_visit_date,
      DATE_TRUNC('month', MIN(date))::date AS cohort_month
    FROM bookings
    WHERE master_id = p_master_id
      AND status IN ('confirmed', 'completed')
      AND client_id IS NOT NULL
    GROUP BY client_id
  ),
  cohort_sizes AS (
    SELECT cohort_month, COUNT(DISTINCT client_id) AS cohort_size
    FROM client_first_visit
    GROUP BY cohort_month
  ),
  visits AS (
    SELECT 
      b.client_id,
      cfv.cohort_month,
      DATE_TRUNC('month', b.date)::date AS visit_month,
      (EXTRACT(year FROM age(DATE_TRUNC('month', b.date), cfv.cohort_month)) * 12 +
       EXTRACT(month FROM age(DATE_TRUNC('month', b.date), cfv.cohort_month)))::int AS month_diff
    FROM bookings b
    JOIN client_first_visit cfv ON b.client_id = cfv.client_id
    WHERE b.master_id = p_master_id
      AND b.status IN ('confirmed', 'completed')
  ),
  cohort_retention AS (
    SELECT 
      cohort_month,
      month_diff,
      COUNT(DISTINCT client_id) AS returning_clients
    FROM visits
    WHERE month_diff >= 0 AND month_diff <= 12
    GROUP BY 1, 2
  )
  SELECT jsonb_agg(jsonb_build_object(
    'cohort_month', cr.cohort_month,
    'cohort_size', cs.cohort_size,
    'month_diff', cr.month_diff,
    'retention_pct', ROUND((cr.returning_clients::decimal / cs.cohort_size) * 100)
  ) ORDER BY cr.cohort_month DESC, cr.month_diff ASC)
  INTO result
  FROM cohort_retention cr
  JOIN cohort_sizes cs ON cr.cohort_month = cs.cohort_month;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- ── get_cross_sell_matrix(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_cross_sell_matrix(p_master_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

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
$function$;

-- ── get_dynamic_pricing_uplift(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_dynamic_pricing_uplift(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uplift_kopecks BIGINT := 0;
  v_rule_counts JSONB;
  v_saved_slots INT := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  SELECT COALESCE(SUM(dynamic_extra_kopecks), 0) INTO v_uplift_kopecks
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN p_start_date AND p_end_date
    AND status IN ('confirmed', 'completed', 'pending');

  WITH lbl AS (
    SELECT dynamic_pricing_label AS l, dynamic_extra_kopecks AS kop
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN p_start_date AND p_end_date
      AND status IN ('confirmed', 'completed', 'pending')
      AND dynamic_pricing_label IS NOT NULL
  )
  SELECT
    jsonb_strip_nulls(jsonb_build_object(
      'peak',        NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Пік%'), 0),
      'quiet',       NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Тихий час%'), 0),
      'early_bird',  NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Рання бронь%'), 0),
      'last_minute', NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Остання хвилина%'), 0)
    )),
    (SELECT count(*) FROM lbl WHERE kop = 0)
  INTO v_rule_counts, v_saved_slots;

  RETURN jsonb_build_object(
    'uplift_kopecks', v_uplift_kopecks,
    'rule_counts',    COALESCE(v_rule_counts, '{}'::jsonb),
    'saved_slots',    v_saved_slots
  );
END;
$function$;

-- ── get_eligible_flash_deal_clients(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_eligible_flash_deal_clients(p_master_id uuid)
 RETURNS TABLE(client_id uuid, client_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
SELECT
    cmr.client_id,
    COALESCE(p.full_name, 'Клієнт') AS client_name
  FROM client_master_relations cmr
  JOIN profiles p ON p.id = cmr.client_id
  WHERE cmr.master_id = p_master_id
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.client_id = cmr.client_id
        AND b.master_id = p_master_id
        AND b.status    IN ('confirmed', 'pending')
        AND (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv'
            BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
    );
END;
$function$;

-- ── get_finance_analytics(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_finance_analytics(p_master_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_services_base_revenue DECIMAL(12,2) := 0;
  v_products_base_revenue DECIMAL(12,2) := 0;
  v_actual_total_paid DECIMAL(12,2) := 0;
  v_materials_cost DECIMAL(12,2) := 0;
  v_discount_amount DECIMAL(12,2) := 0;
  v_operational_expenses DECIMAL(12,2) := 0;
  v_net_profit DECIMAL(12,2) := 0;
  v_services_list JSONB;
  v_products_list JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  -- 1. Фактично сплачена сума (з урахуванням знижок/націнок)
  SELECT COALESCE(SUM(total_price), 0) INTO v_actual_total_paid
  FROM bookings b
  WHERE b.master_id = p_master_id
    AND (p_start_date IS NULL OR b.date >= p_start_date)
    AND (p_end_date IS NULL OR b.date <= p_end_date)
    AND b.status = 'completed';

  -- 2. Базова виручка від послуг
  SELECT COALESCE(SUM(bs.service_price), 0) INTO v_services_base_revenue
  FROM bookings b
  JOIN booking_services bs ON b.id = bs.booking_id
  WHERE b.master_id = p_master_id
    AND (p_start_date IS NULL OR b.date >= p_start_date)
    AND (p_end_date IS NULL OR b.date <= p_end_date)
    AND b.status = 'completed';

  -- 3. Базова виручка від товарів
  SELECT COALESCE(SUM(bp.product_price * bp.quantity), 0) INTO v_products_base_revenue
  FROM bookings b
  JOIN booking_products bp ON b.id = bp.booking_id
  WHERE b.master_id = p_master_id
    AND (p_start_date IS NULL OR b.date >= p_start_date)
    AND (p_end_date IS NULL OR b.date <= p_end_date)
    AND b.status = 'completed';
    
  -- 4. Собівартість розхідників (використаних на completed сеансах)
  SELECT COALESCE(SUM(psl.quantity * COALESCE(p.cost_kopecks, 0)) / 100.0, 0) INTO v_materials_cost
  FROM bookings b
  JOIN booking_services bs ON b.id = bs.booking_id
  JOIN product_service_links psl ON bs.service_id = psl.service_id
  JOIN products p ON psl.product_id = p.id
  WHERE b.master_id = p_master_id
    AND (p_start_date IS NULL OR b.date >= p_start_date)
    AND (p_end_date IS NULL OR b.date <= p_end_date)
    AND b.status = 'completed';

  -- 5. Операційні витрати з master_expenses
  SELECT COALESCE(SUM(amount_kopecks) / 100.0, 0) INTO v_operational_expenses
  FROM master_expenses
  WHERE master_id = p_master_id
    AND (p_start_date IS NULL OR expense_date >= p_start_date)
    AND (p_end_date IS NULL OR expense_date <= p_end_date);

  -- 6. Знижки та чистий прибуток
  v_discount_amount := (v_services_base_revenue + v_products_base_revenue) - v_actual_total_paid;
  v_net_profit := v_actual_total_paid - v_materials_cost - v_operational_expenses;

  -- 7. Деталі по послугах
  WITH service_stats AS (
    SELECT 
      bs.service_id,
      bs.service_name,
      COUNT(*)::int AS bookings_count,
      SUM(bs.service_price * 100)::bigint AS revenue_kopecks,
      SUM(COALESCE(psl.quantity * p.cost_kopecks, 0))::bigint AS cost_kopecks
    FROM bookings b
    JOIN booking_services bs ON b.id = bs.booking_id
    LEFT JOIN product_service_links psl ON bs.service_id = psl.service_id
    LEFT JOIN products p ON psl.product_id = p.id AND p.product_type = 'consumable' AND p.is_archived = false
    WHERE b.master_id = p_master_id
      AND (p_start_date IS NULL OR b.date >= p_start_date)
      AND (p_end_date IS NULL OR b.date <= p_end_date)
      AND b.status = 'completed'
    GROUP BY bs.service_id, bs.service_name
  )
  SELECT jsonb_agg(jsonb_build_object(
    'service_id', service_id,
    'service_name', service_name,
    'bookings_count', bookings_count,
    'revenue_kopecks', revenue_kopecks,
    'cost_kopecks', cost_kopecks,
    'margin_pct', 
      CASE 
        WHEN revenue_kopecks > 0 THEN 
          ROUND(((revenue_kopecks - cost_kopecks)::decimal / revenue_kopecks) * 100)
        ELSE 100
      END
  ) ORDER BY revenue_kopecks DESC)
  INTO v_services_list
  FROM service_stats;

  -- 8. Деталі по товарах
  WITH product_stats AS (
    SELECT 
      bp.product_id,
      bp.product_name,
      SUM(bp.quantity)::int AS sold_qty,
      SUM(bp.product_price * 100 * bp.quantity)::bigint AS revenue_kopecks,
      SUM(COALESCE(p.cost_kopecks, 0) * bp.quantity)::bigint AS cost_kopecks
    FROM bookings b
    JOIN booking_products bp ON b.id = bp.booking_id
    JOIN products p ON bp.product_id = p.id
    WHERE b.master_id = p_master_id
      AND (p_start_date IS NULL OR b.date >= p_start_date)
      AND (p_end_date IS NULL OR b.date <= p_end_date)
      AND b.status = 'completed'
    GROUP BY bp.product_id, bp.product_name
  )
  SELECT jsonb_agg(jsonb_build_object(
    'product_id', product_id,
    'product_name', product_name,
    'sold_qty', sold_qty,
    'revenue_kopecks', revenue_kopecks,
    'cost_kopecks', cost_kopecks,
    'margin_pct', 
      CASE 
        WHEN revenue_kopecks > 0 THEN 
          ROUND(((revenue_kopecks - cost_kopecks)::decimal / revenue_kopecks) * 100)
        ELSE 100
      END
  ) ORDER BY revenue_kopecks DESC)
  INTO v_products_list
  FROM product_stats;

  RETURN jsonb_build_object(
    'services_revenue',           ROUND(v_services_base_revenue * 100)::bigint,
    'products_revenue',           ROUND(v_products_base_revenue * 100)::bigint,
    'materials_cost',             ROUND(v_materials_cost * 100)::bigint,
    'discount_amount',            ROUND(v_discount_amount * 100)::bigint,
    'operational_expenses_total', ROUND(v_operational_expenses * 100)::bigint,
    'net_profit',                 ROUND(v_net_profit * 100)::bigint,
    'services',                   COALESCE(v_services_list, '[]'::jsonb),
    'products',                   COALESCE(v_products_list, '[]'::jsonb)
  );
END;
$function$;

-- ── get_freed_slot_clients(p_master_id uuid, p_slot_timestamp timestamp with time zone) ──
CREATE OR REPLACE FUNCTION public.get_freed_slot_clients(p_master_id uuid, p_slot_timestamp timestamp with time zone)
 RETURNS TABLE(client_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
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
END;
$function$;

-- ── get_freed_slot_clients(p_master_id uuid, p_slot_timestamp timestamp with time zone, p_excluded_client_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_freed_slot_clients(p_master_id uuid, p_slot_timestamp timestamp with time zone, p_excluded_client_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(client_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lookback_days INT;
  v_lookahead_days INT;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  -- 1. Отримуємо налаштування майстра (або дефолтні значення 1/3 для тесту)
  SELECT COALESCE(waitlist_lookback_days, 1), COALESCE(waitlist_lookahead_days, 3)
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
           -- Умова 1: Був хоча б раз завершений запис (спрощено)
           EXISTS (
             SELECT 1
             FROM   bookings b
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     = 'completed'
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
$function$;

-- ── get_goal_progress(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_goal_progress(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_revenue BIGINT := 0;
  v_target BIGINT := 10000000; -- Дефолт 100,000 грн в копійках
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  -- Поточна виручка за період в копійках
  SELECT COALESCE(SUM(total_price * 100), 0)::bigint INTO v_revenue
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN p_start_date AND p_end_date
    AND status = 'completed';

  RETURN jsonb_build_object(
    'revenue_kopecks', v_revenue,
    'target_kopecks', v_target,
    'progress_pct', LEAST(100, ROUND((v_revenue::decimal / v_target) * 100))
  );
END;
$function$;

-- ── get_idle_slots_cost(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_idle_slots_cost(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_avg_check DECIMAL(10,2) := 0;
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  SELECT COALESCE(AVG(total_price), 0) INTO v_avg_check
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN p_start_date AND p_end_date
    AND status = 'completed';

  IF v_avg_check = 0 THEN
    SELECT COALESCE(AVG(price), 500) INTO v_avg_check
    FROM services
    WHERE master_id = p_master_id AND is_active = true;
  END IF;

  WITH date_series AS (
    SELECT d::date AS date, EXTRACT(ISODOW FROM d)::int AS dow
    FROM generate_series(p_start_date::date, p_end_date::date, '1 day'::interval) d
  ),
  working_hours_slots AS (
    SELECT ds.date, ds.dow, h AS hour
    FROM date_series ds
    CROSS JOIN generate_series(10, 18) h
    WHERE ds.dow BETWEEN 1 AND 6
  ),
  booked_slots AS (
    SELECT date, EXTRACT(HOUR FROM start_time)::int AS hour, COUNT(*) AS booked_count
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN p_start_date AND p_end_date
      AND status IN ('confirmed', 'completed', 'pending')
    GROUP BY date, hour
  ),
  empty_slots AS (
    SELECT 
      whs.dow,
      whs.hour,
      COUNT(DISTINCT whs.date) AS total_days_in_period,
      COUNT(whs.date) - COALESCE(SUM(bs.booked_count), 0) AS empty_days_count
    FROM working_hours_slots whs
    LEFT JOIN booked_slots bs ON whs.date = bs.date AND whs.hour = bs.hour
    GROUP BY whs.dow, whs.hour
  )
  SELECT jsonb_agg(jsonb_build_object(
    'dow', dow,
    'hour', hour,
    'empty_count', empty_days_count,
    'lost_revenue', ROUND(empty_days_count * v_avg_check * 100)::bigint
  ) ORDER BY empty_days_count DESC)
  INTO result
  FROM empty_slots
  WHERE empty_days_count > 0;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- ── get_ltv_concentration(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_ltv_concentration(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_revenue DECIMAL(12,2);
  v_top20_revenue DECIMAL(12,2);
  v_concentration_pct INT := 0;
  v_winback_candidates JSONB;
  v_ltv_distribution JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  -- 1. Розрахунок LTV концентрації (принцип Парето 80/20)
  SELECT SUM(total_spent) INTO v_total_revenue
  FROM client_master_relations
  WHERE master_id = p_master_id;

  IF COALESCE(v_total_revenue, 0) > 0 THEN
    WITH ranked_clients AS (
      SELECT 
        total_spent,
        ROW_NUMBER() OVER (ORDER BY total_spent DESC) AS rank,
        COUNT(*) OVER () AS total_count
      FROM client_master_relations
      WHERE master_id = p_master_id
    )
    SELECT SUM(total_spent) INTO v_top20_revenue
    FROM ranked_clients
    WHERE rank <= CEIL(total_count * 0.20);

    v_concentration_pct := ROUND((COALESCE(v_top20_revenue, 0) / v_total_revenue) * 100);
  END IF;

  -- 2. Гістограма розподілу LTV (діапазони)
  WITH ltv_ranges AS (
    SELECT 
      CASE 
        WHEN total_spent < 1000.00 THEN 'under_1k'
        WHEN total_spent BETWEEN 1000.00 AND 3000.00 THEN '1k_3k'
        WHEN total_spent BETWEEN 3000.00 AND 7000.00 THEN '3k_7k'
        ELSE 'above_7k'
      END AS range_bucket,
      COUNT(*) AS client_count
    FROM client_master_relations
    WHERE master_id = p_master_id AND total_spent > 0
    GROUP BY 1
  )
  SELECT jsonb_object_agg(range_bucket, client_count) INTO v_ltv_distribution
  FROM ltv_ranges;

  -- 3. VIP клієнти, які не поверталися (Winback Candidates)
  WITH winback_rows AS (
    SELECT 
      p.full_name AS client_name,
      p.phone AS client_phone,
      cmr.total_spent,
      cmr.last_visit_at
    FROM client_master_relations cmr
    JOIN profiles p ON cmr.client_id = p.id
    WHERE cmr.master_id = p_master_id
      AND cmr.last_visit_at < now() - INTERVAL '60 days'
      AND (cmr.is_vip = true OR cmr.total_visits >= 3)
    ORDER BY cmr.total_spent DESC
    LIMIT 5
  )
  SELECT jsonb_agg(jsonb_build_object(
    'client_name', client_name,
    'client_phone', client_phone,
    'ltv', ROUND(total_spent * 100)::int, -- в копійках
    'last_visit_date', last_visit_at::date,
    'days_inactive', EXTRACT(day FROM age(now(), last_visit_at))::int
  ))
  INTO v_winback_candidates
  FROM winback_rows;

  RETURN jsonb_build_object(
    'concentration_pct', v_concentration_pct,
    'ltv_distribution', COALESCE(v_ltv_distribution, '{}'::jsonb),
    'winback_candidates', COALESCE(v_winback_candidates, '[]'::jsonb)
  );
END;
$function$;

-- ── get_master_clients(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_master_clients(p_master_id uuid)
 RETURNS TABLE(client_phone text, client_name text, client_id uuid, total_visits bigint, total_spent numeric, average_check numeric, last_visit_at text, last_service_name text, is_vip boolean, relation_id uuid, retention_status text, health_notes text, medical_notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
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
    END                                                  AS retention_status,
    MAX(r.health_notes)                                  AS health_notes,
    MAX(r.medical_notes)                                 AS medical_notes
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
  ORDER BY COUNT(*) DESC;
END;
$function$;

-- ── get_occupancy_heatmap(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_occupancy_heatmap(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  WITH date_counts AS (
    -- Кількість унікальних дат для кожного дня тижня у періоді
    SELECT EXTRACT(ISODOW FROM d)::int AS dow, COUNT(DISTINCT d) AS total_days
    FROM generate_series(p_start_date::date, p_end_date::date, '1 day'::interval) d
    GROUP BY 1
  ),
  booking_slots AS (
    SELECT 
      EXTRACT(ISODOW FROM date)::int AS dow,
      EXTRACT(HOUR FROM start_time)::int AS hour,
      COUNT(*)::decimal AS slot_count
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN p_start_date AND p_end_date
      AND status IN ('confirmed', 'completed', 'pending')
    GROUP BY 1, 2
  )
  SELECT jsonb_agg(jsonb_build_object(
    'dow', bs.dow,
    'hour', bs.hour,
    'occupancy_pct', ROUND((bs.slot_count / COALESCE(dc.total_days, 1)) * 100)
  ))
  INTO result
  FROM booking_slots bs
  LEFT JOIN date_counts dc ON bs.dow = dc.dow;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- ── get_retention_stats(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_retention_stats(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(returning_clients integer, new_clients integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
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
END;
$function$;

-- ── get_service_pairing(p_master_id uuid, p_start_date date, p_end_date date) ──
CREATE OR REPLACE FUNCTION public.get_service_pairing(p_master_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  WITH pair_counts AS (
    SELECT 
      bs1.service_name AS service_a,
      bs2.service_name AS service_b,
      COUNT(*) AS pair_count
    FROM booking_services bs1
    JOIN booking_services bs2 ON bs1.booking_id = bs2.booking_id AND bs1.id < bs2.id
    JOIN bookings b ON bs1.booking_id = b.id
    WHERE b.master_id = p_master_id
      AND b.date BETWEEN p_start_date AND p_end_date
      AND b.status IN ('confirmed', 'completed')
    GROUP BY 1, 2
    ORDER BY pair_count DESC
    LIMIT 5
  )
  SELECT jsonb_agg(jsonb_build_object(
    'service_a', service_a,
    'service_b', service_b,
    'pair_count', pair_count
  ) ORDER BY pair_count DESC)
  INTO result
  FROM pair_counts;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- ── get_stock_forecast(p_master_id uuid) ──
CREATE OR REPLACE FUNCTION public.get_stock_forecast(p_master_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE EXCEPTION 'access denied' USING ERRCODE = '42501'; END IF;

  WITH future_bookings AS (
    SELECT b.id, b.date
    FROM bookings b
    WHERE b.master_id = p_master_id
      AND b.date BETWEEN current_date AND current_date + 14
      AND b.status IN ('confirmed', 'pending')
  ),
  future_material_needs AS (
    SELECT 
      psl.product_id,
      SUM(psl.quantity) AS required_qty
    FROM future_bookings fb
    JOIN booking_services bs ON fb.id = bs.booking_id
    JOIN product_service_links psl ON bs.service_id = psl.service_id
    GROUP BY psl.product_id
  ),
  past_bookings AS (
    SELECT b.id
    FROM bookings b
    WHERE b.master_id = p_master_id
      AND b.date BETWEEN current_date - 30 AND current_date - 1
      AND b.status = 'completed'
  ),
  past_material_usage AS (
    SELECT 
      psl.product_id,
      SUM(psl.quantity) AS used_qty
    FROM past_bookings pb
    JOIN booking_services bs ON pb.id = bs.booking_id
    JOIN product_service_links psl ON bs.service_id = psl.service_id
    GROUP BY psl.product_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'product_id', p.id,
    'product_name', p.name,
    'stock_qty', p.stock_qty,
    'stock_alert_threshold', p.stock_alert_threshold,
    'cost_kopecks', p.cost_kopecks,
    'required_qty_14_days', COALESCE(fmn.required_qty, 0),
    'used_qty_past_30_days', COALESCE(pmu.used_qty, 0),
    'predicted_days_left', 
      CASE 
        WHEN p.stock_qty <= 0 THEN 0
        WHEN COALESCE(fmn.required_qty, 0) > 0 THEN 
          ROUND((p.stock_qty::decimal / (fmn.required_qty::decimal / 14.0)))
        WHEN COALESCE(pmu.used_qty, 0) > 0 THEN 
          ROUND((p.stock_qty::decimal / (pmu.used_qty::decimal / 30.0)))
        ELSE 999
      END
  ))
  INTO result
  FROM products p
  LEFT JOIN future_material_needs fmn ON p.id = fmn.product_id
  LEFT JOIN past_material_usage pmu ON p.id = pmu.product_id
  WHERE p.master_id = p_master_id
    AND p.product_type = 'consumable'
    AND p.is_archived = false;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- Re-assert least-privilege grants (order-independent safety net; mirrors 20260706120000).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(ARRAY[
      'get_anomaly_alerts',
      'get_business_health_score',
      'get_churn_predictions',
      'get_cohort_retention',
      'get_cross_sell_matrix',
      'get_dynamic_pricing_uplift',
      'get_finance_analytics',
      'get_goal_progress',
      'get_idle_slots_cost',
      'get_ltv_concentration',
      'get_master_clients',
      'get_occupancy_heatmap',
      'get_retention_stats',
      'get_service_pairing',
      'get_stock_forecast',
      'get_analytics_extras',
      'get_c2c_stats_for_master',
      'get_eligible_flash_deal_clients',
      'get_freed_slot_clients',
      'get_c2c_balance',
      'claim_phone_discount'
    ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
