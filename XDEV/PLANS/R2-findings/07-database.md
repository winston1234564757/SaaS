# R2 Database Audit — BookIT (prod: sqlrxsopllgztvgrerqk)

Date: 2026-07-06 · Method: read-only. Supabase Management API (advisors + SELECT-only query endpoint, `SET ROLE` to simulate anon/authenticated). No REST domain access from sandbox (HTTP 000) — RLS verified authoritatively via `SET ROLE` instead.

---

## OPEN DATA LEAK — ESCALATE

**[P1] `public.get_dynamic_pricing_uplift(uuid,date,date)` — IDOR revenue leak. PROVEN LIVE.**
SECURITY DEFINER, no `auth.uid()` gate, takes arbitrary `p_master_id`. prod `proacl = {=X, anon=X, authenticated=X, service_role=X}` → PUBLIC + anon + authenticated can execute. The CREATE OR REPLACE in `20260628000005_dynamic_pricing_uplift_discounts` preserved the legacy public grant; it was never REVOKEd (unlike the sibling stats RPCs).
Proof — as role `anon`, `get_dynamic_pricing_uplift('551c7a11-a02b-4944-9b34-594c41ccb951', '2020-01-01','2030-12-31')` returned:
`{ uplift_kopecks: 88000, rule_counts: { peak: 9, quiet: 17, last_minute: 22 }, saved_slots: 48 }`.
Failure: any anonymous visitor can enumerate every master's dynamic-pricing revenue (₴) and per-rule booking counts using the master_id embedded in the public booking URL. Competitive/business-intelligence leak across all masters. Not customer PII, so P1 not P0.
Fix: `REVOKE ALL ON FUNCTION get_dynamic_pricing_uplift(uuid,date,date) FROM public, anon;` and add `WHERE master_id = auth.uid()` (or accept no arg) so authenticated masters can only read their own.

---

## Findings

**[P2] Migration registry desync — `supabase_migrations.schema_migrations` vs local files.**
Local: 176 files. Prod registry: 167 rows. All numeric (001–137) migrations match. From `20260516` onward the registry version prefixes DIVERGE from local filename timestamps — the timestamp-era migrations were applied via a different mechanism (dashboard/re-versioning), matched by `name` not `version`. Critically, the TWO NEWEST local files are absent from the registry: `20260630000000_fix_analytics_extract_date_subtraction` and `20260706000000_orders_nova_poshta_fields`.
Caveat honored — probed actual objects: both are functionally LIVE on prod (orders.np_city_ref/np_city_name/np_warehouse_ref/np_warehouse_name columns exist; `get_churn_predictions` no longer contains the buggy `EXTRACT(day FROM ...)`). Likewise beta_requests table, get_master_referral_history(), master_profiles.partner_invite_token all exist despite absent registry rows.
Failure: no functional gap today, but `npx supabase db push` from this repo would try to re-apply ~9 unregistered migrations against objects that already exist → errors or drift on next deploy. Reconcile the registry before any future push.

**[P2] Two SECURITY DEFINER views (advisor ERROR ×2).** `public.booking_slots`, `public.master_subscriptions_public`. Being definer-mode views, they bypass the querying user's RLS. `master_subscriptions_public` is anon-readable and exposes billing state: `provider, plan_id, status, expires_at, next_charge_at, failed_attempts`. Failure: anonymous users can read any master's payment provider, next charge date, and failed-payment count. Set `security_invoker=on` and drop `failed_attempts`/`next_charge_at` from the public projection.

**[P2] `get_pricing_rule_stats(text)` & `get_pricing_rules_overview()` carry anon EXECUTE on prod** despite their migrations doing `REVOKE ALL FROM public; GRANT ... TO authenticated`. prod `proacl` shows explicit `anon=X`. Both internally gate on `auth.uid()`, so an anon call returns empty (no leak) — but the grant is drift and should be revoked. Low impact.

**[P2] `rls_policy_always_true` ×2 (advisor WARN).** `content_reports` policy "Anyone can create reports" (INSERT, `WITH CHECK true`) and `booking_services_insert_service_role`. Failure: content_reports allows unauthenticated INSERT of arbitrary rows → moderation-queue spam / storage-inflation DoS. Rate-limit or require a valid target id.

**[P3] `auth_rls_initplan` = 84 warnings** (R1 = 83; +1). `auth.uid()`/`auth.role()` re-evaluated per row instead of once. Wrap as `(select auth.uid())`. Perf degradation only at scale.

**[P3] Other performance advisors:** 175 `multiple_permissive_policies`, 64 `unused_index`, 1 `duplicate_index`. Housekeeping; not launch-blocking. Unused indexes are write-amplification cost, not correctness.

**[P3] `rls_enabled_no_policy` ×5 (advisor INFO):** beta_requests, rebooking_reminders, sms_logs, subscriptions, telegram_otps. RLS on + zero policies = deny-all to anon/authenticated (safe default) — confirm each is only touched via service-role server actions. telegram_otps/sms_logs deny-all is correct.

**[P3] `function_search_path_mutable` ×6 (advisor WARN):** touch_updated_at, set_updated_at, sync_client_health_to_relations, update_client_master_metrics, update_portfolio_item_updated_at, generate_short_code. All are non-SECDEF trigger/util funcs → low risk, but pin `SET search_path` for consistency.

**[P3] `public_bucket_allows_listing` ×4 (advisor WARN):** storage buckets permit anonymous object listing (enumeration of filenames). Confirm no sensitive filenames.

**[P3] `[slug]/shop/page.tsx` — `getMasterShop(slug)` called twice per request** (generateMetadata + page component), not wrapped in React `cache()`. Duplicate master_profiles round-trip. Not N+1; wrap in `cache()` to dedupe.

---

## Verified CLEAN (no defect)

- **anon CANNOT SELECT orders** — `SET ROLE anon; select count(*) from orders` → 0 of 5 rows. Client phone/name/NP-address PII is protected. orders RLS: master-scoped + client-scoped SELECT on `auth.uid()`, anon INSERT policies dropped (`20260627000005`).
- **0 public tables with `rowsecurity=false`** — every public table has RLS enabled.
- **0 SECURITY DEFINER functions missing `SET search_path`** — R1's 19-fix holds; all newer RPCs (get_service_reviews, get_product_reviews, pricing RPCs, uplift, analytics) have `search_path=public`.
- **0 FK columns without a covering index** — R1's 43-index sweep holds; orders/order_items/products/product_service_links/notification_logs all covered.
- **`get_pricing_rule_stats` / `get_pricing_rules_overview`** correctly filter on `auth.uid()` — no IDOR (contrast with uplift RPC).
- **`useOrders.ts`** — 2 embedded PostgREST queries (orders→order_items→products; bookings→booking_products), merged in JS. No N+1. `useMyOrders` single embedded query. (Note: no LIMIT on either; bounded by `!inner` — acceptable at current scale.)
- **`20260607000000_security_search_path_fix` IS applied on prod** (registry name `security_search_path_fix` + 0 secdef funcs missing search_path).

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 1 |
| P2 | 4 |
| P3 | 6 |

## Migration-parity verdict

No functional gap: every local migration's schema objects exist on prod (probed the unregistered ones directly). But the `schema_migrations` registry is desynced — 9 timestamp-era migrations, including the two newest (fix_analytics 20260630, orders_np 20260706), are unregistered because they were applied via dashboard rather than `db push`. Safe to launch as-is; UNSAFE to run `supabase db push` from this repo without reconciling the registry first.

## Explicit answers
- (a) `20260607000000_security_search_path_fix` applied on prod? **YES.**
- (b) Can anon call `get_dynamic_pricing_uplift`? **YES — proven leak of real revenue data.**
- (c) Can anon SELECT orders? **NO — RLS returns 0 rows.**
