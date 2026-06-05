-- ============================================================
-- 20260605000001 — BookIT Analytics v2.0 Extensions
-- ============================================================

-- ─── 1. FINANCES & MARGINALIZATION ────────────────────────────
CREATE OR REPLACE FUNCTION get_finance_analytics(
  p_master_id  UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_services_revenue DECIMAL(12,2) := 0;
  v_products_revenue DECIMAL(12,2) := 0;
  v_materials_cost DECIMAL(12,2) := 0;
  v_discount_amount DECIMAL(12,2) := 0;
  v_net_profit DECIMAL(12,2) := 0;
  
  v_services_list JSONB;
  v_products_list JSONB;
BEGIN
  -- 1. Виручка від послуг (completed)
  SELECT COALESCE(SUM(total_price), 0) INTO v_services_revenue
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN p_start_date AND p_end_date
    AND status = 'completed';

  -- 2. Виручка від товарів ( completed orders )
  SELECT COALESCE(SUM(total_kopecks) / 100.0, 0) INTO v_products_revenue
  FROM orders
  WHERE master_id = p_master_id
    AND created_at::date BETWEEN p_start_date AND p_end_date
    AND status = 'completed';

  -- Додаємо retail товари продані на сеансах
  DECLARE
    v_booking_retail_rev DECIMAL(12,2) := 0;
  BEGIN
    SELECT COALESCE(SUM(bp.product_price * bp.quantity), 0) INTO v_booking_retail_rev
    FROM bookings b
    JOIN booking_products bp ON b.id = bp.booking_id
    JOIN products p ON bp.product_id = p.id
    WHERE b.master_id = p_master_id
      AND b.date BETWEEN p_start_date AND p_end_date
      AND b.status = 'completed'
      AND p.product_type = 'retail';
      
    v_products_revenue := v_products_revenue + v_booking_retail_rev;
  END;

  -- 3. Собівартість розхідників (використаних на completed сеансах)
  SELECT COALESCE(SUM(psl.quantity * COALESCE(p.cost_kopecks, 0)) / 100.0, 0) INTO v_materials_cost
  FROM bookings b
  JOIN booking_services bs ON b.id = bs.booking_id
  JOIN product_service_links psl ON bs.service_id = psl.service_id
  JOIN products p ON psl.product_id = p.id
  WHERE b.master_id = p_master_id
    AND b.date BETWEEN p_start_date AND p_end_date
    AND b.status = 'completed';

  -- 4. Розрахунок знижок
  DECLARE
    v_base_price_sum DECIMAL(12,2) := 0;
  BEGIN
    SELECT COALESCE(SUM(bs.service_price), 0) INTO v_base_price_sum
    FROM bookings b
    JOIN booking_services bs ON b.id = bs.booking_id
    WHERE b.master_id = p_master_id
      AND b.date BETWEEN p_start_date AND p_end_date
      AND b.status = 'completed';
      
    IF v_base_price_sum > v_services_revenue THEN
      v_discount_amount := v_base_price_sum - v_services_revenue;
    END IF;
  END;

  v_net_profit := v_services_revenue + v_products_revenue - v_materials_cost - v_discount_amount;

  -- 5. Деталі по послугах
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
      AND b.date BETWEEN p_start_date AND p_end_date
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

  -- 6. Деталі по товарах
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
      AND b.date BETWEEN p_start_date AND p_end_date
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
    'services_revenue', ROUND(v_services_revenue * 100)::bigint,
    'products_revenue', ROUND(v_products_revenue * 100)::bigint,
    'materials_cost', ROUND(v_materials_cost * 100)::bigint,
    'discount_amount', ROUND(v_discount_amount * 100)::bigint,
    'net_profit', ROUND(v_net_profit * 100)::bigint,
    'services', COALESCE(v_services_list, '[]'::jsonb),
    'products', COALESCE(v_products_list, '[]'::jsonb)
  );
END;
$$;

-- ─── 2. PREDICTIVE RESTOCK FORECAST ───────────────────────────
CREATE OR REPLACE FUNCTION get_stock_forecast(
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
$$;

-- ─── 3. BUSINESS HEALTH SCORE (0-100) ─────────────────────────
CREATE OR REPLACE FUNCTION get_business_health_score(
  p_master_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT COALESCE(SUM(total_duration), 0) INTO v_duration_sum
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
$$;

-- ─── 4. CHURN RISK PREDICTIONS ────────────────────────────────
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
      EXTRACT(day FROM (now()::date - cv.last_visit))::int AS days_inactive,
      GREATEST(14, ROUND((EXTRACT(day FROM (cv.last_visit - cv.first_visit))::decimal / (cv.visits_count - 1))))::int AS avg_interval
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

-- ─── 5. CROSS-SELL MATRIX ─────────────────────────────────────
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
      EXTRACT(day FROM (next_visit_date - visit_date))::int AS days_diff
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

-- ─── 6. IDLE SLOTS COST ───────────────────────────────────────
CREATE OR REPLACE FUNCTION get_idle_slots_cost(
  p_master_id  UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_check DECIMAL(10,2) := 0;
  result JSONB;
BEGIN
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
$$;

-- ─── 7. GOAL PROGRESS HELPER ──────────────────────────────────
CREATE OR REPLACE FUNCTION get_goal_progress(
  p_master_id  UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue BIGINT := 0;
  v_target BIGINT := 10000000; -- Дефолт 100,000 грн в копійках
BEGIN
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
$$;

-- ─── 8. UPDATED ORCHESTRATOR RPC ──────────────────────────────
CREATE OR REPLACE FUNCTION get_analytics_extras(
  p_master_id  UUID,
  p_start_date DATE,
  p_end_date   DATE,
  p_is_pro     BOOLEAN,
  p_scope      TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r JSONB := '{}'::jsonb;
BEGIN
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
$$;
