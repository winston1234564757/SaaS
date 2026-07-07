-- Pre-Launch Audit R2 (2026-07-06) — P0 IDOR fix for analytics/CRM SECURITY DEFINER RPCs.
--
-- ROOT CAUSE: these functions take an owner-id arg (p_master_id / p_referrer_id), filter on
-- it, had NO auth.uid() check and NO REVOKE -> Postgres defaults EXECUTE to PUBLIC (incl. the
-- Supabase anon role). Any visitor with the public anon key + any master UUID (present in every
-- public page payload) could read that master's private CRM/analytics via POST /rest/v1/rpc/<fn>.
-- Worst offender: get_master_clients returned full client PII (names, phones, LTV, notes).
--
-- FULL FIX (ownership guards on the function bodies) was applied to prod directly via the
-- Supabase Management API on 2026-07-06, because the bodies are mixed LANGUAGE sql / plpgsql and
-- were guarded in place (plpgsql: IF-guard after BEGIN; sql: wrapped into plpgsql with RETURN
-- QUERY, RETURNS signature unchanged). Guard used (owner arg = p_master_id, or p_referrer_id for
-- get_c2c_balance):
--   IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN
--     RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
--   END IF;
-- Caller-safe: service_role/cron (null uid) passes, owner passes, other authenticated is blocked.
--
-- This migration re-asserts the REVOKE side idempotently as a safety net so re-running any legacy
-- migration that recreates one of these functions cannot silently re-open anon access. Safe to
-- run repeatedly. NOTE: the auth.uid() body guards themselves live on prod (applied via API); the
-- authoritative guarded bodies should be back-ported into each function's source migration during
-- the Day-3 repo-parity pass (migration registry is desync per the R2 database audit).

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(ARRAY[
      'get_anomaly_alerts','get_business_health_score','get_churn_predictions',
      'get_cohort_retention','get_cross_sell_matrix','get_dynamic_pricing_uplift',
      'get_finance_analytics','get_goal_progress','get_idle_slots_cost',
      'get_ltv_concentration','get_master_clients','get_occupancy_heatmap',
      'get_retention_stats','get_service_pairing','get_stock_forecast',
      'get_analytics_extras','get_c2c_stats_for_master','get_eligible_flash_deal_clients',
      'get_freed_slot_clients','get_c2c_balance','claim_phone_discount'
    ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
