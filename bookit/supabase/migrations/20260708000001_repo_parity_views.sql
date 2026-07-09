-- ============================================================
-- repo-parity: back-fill 2 public VIEWS that exist on prod but no repo migration produces
-- in a from-scratch build (2026-07-08).
--
-- WHY: a full prod-vs-local relation diff (pg_class relkind='v') showed prod has 2 views that a
-- fresh `supabase start` / `db reset` never ends up with:
--   • booking_slots            — NO repo migration ever creates it (only orphan-applied on prod).
--   • master_subscriptions_public — migration 119 creates it EARLY, but it references columns
--     (next_charge_at, failed_attempts) that a LATER migration (20260707130000 billing recurring)
--     adds / recreates the master_subscriptions table for → the early view ends up dropped
--     (CASCADE) or never matches, so it's absent locally.
-- Symptom: the booking wizard (useWizardSchedule) queried public.booking_slots →
--   PGRST205 "Could not find the table 'public.booking_slots' in the schema cache",
-- cascading into ~6 e2e failures (booking flow, smart slots, peak-hours badge, mounts-clean).
--
-- View bodies are verbatim from PROD (ref sqlrxsopllgztvgrerqk) via pg_get_viewdef() 2026-07-08.
-- CREATE OR REPLACE VIEW is idempotent (no-op against prod, identical bodies). Runs LAST so both
-- base tables (bookings, master_subscriptions) already have their final column sets.
-- ============================================================

-- booking_slots — read-only projection over bookings used by the booking wizard schedule.
CREATE OR REPLACE VIEW public.booking_slots AS
SELECT id,
       master_id,
       date,
       start_time,
       end_time,
       status
FROM public.bookings;

-- master_subscriptions_public — safe subscription view (hides recurrent card tokens).
-- Mirrors migration 119; recreated here after billing-recurring columns exist.
CREATE OR REPLACE VIEW public.master_subscriptions_public AS
SELECT id,
       master_id,
       provider,
       plan_id,
       status,
       expires_at,
       next_charge_at,
       failed_attempts,
       created_at,
       updated_at
FROM public.master_subscriptions;

GRANT SELECT ON public.master_subscriptions_public TO authenticated;
