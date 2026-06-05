-- ============================================================
-- 139 — Advanced Analytics System RPCs
-- ============================================================

-- ─── 1. OCCUPANCY HEATMAP ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_occupancy_heatmap(
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
  result JSONB;
BEGIN
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
$$;

-- ─── 2. COHORT RETENTION ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_cohort_retention(
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
  result JSONB;
BEGIN
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
$$;

-- ─── 3. LTV CONCENTRATION ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_ltv_concentration(
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
  v_total_revenue DECIMAL(12,2);
  v_top20_revenue DECIMAL(12,2);
  v_concentration_pct INT := 0;
  v_winback_candidates JSONB;
  v_ltv_distribution JSONB;
BEGIN
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
$$;

-- ─── 4. DYNAMIC PRICING UPLIFT ────────────────────────────────
CREATE OR REPLACE FUNCTION get_dynamic_pricing_uplift(
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
  v_uplift_kopecks BIGINT := 0;
  v_rule_counts JSONB;
BEGIN
  SELECT COALESCE(SUM(dynamic_extra_kopecks), 0) INTO v_uplift_kopecks
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN p_start_date AND p_end_date
    AND status IN ('confirmed', 'completed', 'pending');

  WITH rules_stat AS (
    SELECT 
      COALESCE(dynamic_pricing_label, 'default') AS rule_label,
      COUNT(*) AS usage_count
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN p_start_date AND p_end_date
      AND dynamic_extra_kopecks > 0
    GROUP BY 1
  )
  SELECT jsonb_object_agg(rule_label, usage_count) INTO v_rule_counts
  FROM rules_stat;

  RETURN jsonb_build_object(
    'uplift_kopecks', v_uplift_kopecks,
    'rule_counts', COALESCE(v_rule_counts, '{}'::jsonb)
  );
END;
$$;

-- ─── 5. ANOMALY ALERTS ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_anomaly_alerts(
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
$$;

-- ─── 6. SERVICE PAIRING ──────────────────────────────────────
CREATE OR REPLACE FUNCTION get_service_pairing(
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
  result JSONB;
BEGIN
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
$$;

-- ─── 7. MAIN ORCHESTRATOR ────────────────────────────────────
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
  -- Section: engagement (broadcast, flash, dynamic pricing uplift) — завжди
  IF p_scope IN ('all','main','engagement') THEN
    r := r || jsonb_build_object(
      'dynamic_pricing_uplift',   get_dynamic_pricing_uplift(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  -- Section: growth (loyalty, referral, ltv, cohort) — Pro
  IF p_is_pro AND p_scope IN ('all','main','growth') THEN
    r := r || jsonb_build_object(
      'ltv_concentration', get_ltv_concentration(p_master_id, p_start_date, p_end_date),
      'cohort_matrix',     get_cohort_retention(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  -- Section: ops (heatmap, anomaly, service pairing) — Pro
  IF p_is_pro AND p_scope IN ('all','main','ops') THEN
    r := r || jsonb_build_object(
      'occupancy_heatmap',  get_occupancy_heatmap(p_master_id, p_start_date, p_end_date),
      'anomaly_alerts',     get_anomaly_alerts(p_master_id),
      'service_pairing',    get_service_pairing(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  RETURN r;
END;
$$;
