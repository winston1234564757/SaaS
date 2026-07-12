-- Migration: get_analytics_extras — розділити scope 'finances' і 'stock'
-- Created: 2026-07-12
-- Affects: FUNCTION public.get_analytics_extras (тільки тіло, сигнатура не змінюється)
--
-- ПРОБЛЕМА (знайдено заміром на проді, OPTIMIZATION-BACKLOG/HANDOFF §Фаза DB):
--   Умова `IF p_is_pro AND p_scope IN ('all','finances','stock')` обчислювала
--   ОБИДВІ секції — і `finances` (get_finance_analytics), і `stock_forecast`
--   (get_stock_forecast) — для КОЖНОГО з цих scope.
--   Наслідок: StockTab (scope='stock') дарма ганяв найважчу функцію аналітики
--   (get_finance_analytics ≈ 7.8 мс), а FinancesTab (scope='finances') — дарма
--   рахував stock_forecast, ще й двічі (поточний + попередній період).
--   Доказ: scope='finances' і scope='stock' повертали байт-у-байт однаковий
--   payload (2618 байт), хоча кожен таб читає лише свою половину
--   (StockTab.tsx:78 → data.stock_forecast; FinancesTab.tsx:95,125 → data.finances).
--
-- ФІКС: дві незалежні умови. Решта тіла — 1:1 без змін.
-- Семантика для клієнта не змінюється: scope='all' і далі віддає обидві секції.

-- ============================================================
-- SAFETY CHECKS
-- ============================================================

DO $$
BEGIN
  -- Функція має існувати: це REPLACE тіла, не створення з нуля.
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_analytics_extras'
  ), 'get_analytics_extras не знайдено — міграція очікує наявну функцію';

  -- Обидві під-функції мають існувати, інакше REPLACE зламає аналітику.
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_finance_analytics'
  ), 'get_finance_analytics не знайдено';

  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_stock_forecast'
  ), 'get_stock_forecast не знайдено';
END $$;

-- ============================================================
-- SCHEMA CHANGES
-- ============================================================

-- ⚠️ `p_scope text DEFAULT 'all'` — дефолт ОБОВ'ЯЗКОВО зберегти 1:1.
-- CREATE OR REPLACE не вміє прибирати дефолти («cannot remove parameter defaults
-- from existing function»), а якби й умів — виклики без p_scope зламались би.
CREATE OR REPLACE FUNCTION public.get_analytics_extras(
  p_master_id  uuid,
  p_start_date date,
  p_end_date   date,
  p_is_pro     boolean,
  p_scope      text DEFAULT 'all'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r JSONB := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  -- Секція: health / score (завжди)
  r := r || jsonb_build_object(
    'business_health', get_business_health_score(p_master_id)
  );

  -- Секція: engagement (dynamic pricing uplift)
  IF p_scope IN ('all','main','engagement') THEN
    r := r || jsonb_build_object(
      'dynamic_pricing_uplift', get_dynamic_pricing_uplift(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  -- Секція: growth (ltv, cohort, churn) — Pro
  IF p_is_pro AND p_scope IN ('all','main','growth') THEN
    r := r || jsonb_build_object(
      'ltv_concentration', get_ltv_concentration(p_master_id, p_start_date, p_end_date),
      'cohort_matrix',     get_cohort_retention(p_master_id, p_start_date, p_end_date),
      'churn_predictions', get_churn_predictions(p_master_id)
    );
  END IF;

  -- Секція: ops (heatmap, anomaly, pairing, cross-sell, idle cost) — Pro
  IF p_is_pro AND p_scope IN ('all','main','ops') THEN
    r := r || jsonb_build_object(
      'occupancy_heatmap', get_occupancy_heatmap(p_master_id, p_start_date, p_end_date),
      'anomaly_alerts',    get_anomaly_alerts(p_master_id),
      'service_pairing',   get_service_pairing(p_master_id, p_start_date, p_end_date),
      'cross_sell_matrix', get_cross_sell_matrix(p_master_id),
      'idle_slots_cost',   get_idle_slots_cost(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  -- Секція: finances — Pro. ВІДОКРЕМЛЕНО від stock (було спільне `IN ('all','finances','stock')`).
  IF p_is_pro AND p_scope IN ('all','finances') THEN
    r := r || jsonb_build_object(
      'finances', get_finance_analytics(p_master_id, p_start_date, p_end_date)
    );
  END IF;

  -- Секція: stock — Pro. ВІДОКРЕМЛЕНО від finances.
  IF p_is_pro AND p_scope IN ('all','stock') THEN
    r := r || jsonb_build_object(
      'stock_forecast', get_stock_forecast(p_master_id)
    );
  END IF;

  -- Goals: завжди (навіть Starter)
  r := r || jsonb_build_object(
    'goal_progress', get_goal_progress(p_master_id, p_start_date, p_end_date)
  );

  RETURN r;
END;
$$;

-- ============================================================
-- PRIVILEGES (відтворюють стан прода 1:1 — anon НЕ має EXECUTE)
-- ============================================================

REVOKE ALL ON FUNCTION public.get_analytics_extras(uuid, date, date, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_analytics_extras(uuid, date, date, boolean, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_extras(uuid, date, date, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_extras(uuid, date, date, boolean, text) TO service_role;

-- ============================================================
-- ROLLBACK NOTES
-- ============================================================
-- Реверс: CREATE OR REPLACE тієї ж функції з поверненою спільною умовою
--   `IF p_is_pro AND p_scope IN ('all','finances','stock')` навколо обох
--   jsonb_build_object('finances', ...) і ('stock_forecast', ...).
-- Даних не чіпає, DDL лише на тілі функції — реверс безпечний і миттєвий.
