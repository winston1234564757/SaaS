# BookIT Pre-Launch Security Audit — Round 2

Scope: whole codebase, priority on commits since 2026-06-20 (shop/M-SHOP-05, client desk C-DESK-01, dynamic pricing M-REV-04/05, orders). Read-only. Launch 2026-07-10 with real Monobank.

Finding format: `[Px] file:line — defect. Failure: inputs → outcome.`

---

## P0 — Critical (actively exploitable IDOR cluster — BLOCK LAUNCH)

Root cause for all P0s: SECURITY DEFINER RPCs take a `p_master_id` UUID argument, filter `WHERE master_id = p_master_id`, perform **no `auth.uid()` check**, and issue **no `REVOKE ... FROM public`**. Postgres defaults `EXECUTE` to `PUBLIC`, which in Supabase includes the **anon** role. Result: an unauthenticated request carrying only the public `NEXT_PUBLIC_SUPABASE_ANON_KEY` (shipped in the JS bundle) plus any master's UUID (trivially present in client-side payloads of every public booking/shop page) can read that master's private data via `POST /rest/v1/rpc/<fn>`.

- [P0] supabase/migrations/20260605000001_analytics_system_v2.sql:585 — `get_analytics_extras(p_master_id,…)` has no auth check, no REVOKE; called straight from the browser (src/lib/supabase/hooks/useAnalyticsExtras.ts:179 passes `masterProfile.id`). Failure: anon POST rpc/get_analytics_extras with a victim UUID → returns full revenue, finances/margins, business-health, occupancy, plus churn_predictions and ltv winback lists **containing client full_name + phone**. Mass cross-tenant revenue + PII leak.
- [P0] supabase/migrations/20260605000001_analytics_system_v2.sql:349 & :420 — `get_churn_predictions(p_master_id)` and `get_cross_sell_matrix`/`get_finance_analytics`/`get_business_health_score`/`get_stock_forecast`/`get_idle_slots_cost`/`get_goal_progress` are each independently defined SECURITY DEFINER with `p_master_id`, no auth, no REVOKE → each individually anon-callable via PostgREST. Failure: `get_churn_predictions` alone dumps any master's inactive clients with names + phone numbers + LTV.
- [P0] supabase/migrations/20260605000000_analytics_system.sql — sibling v1 sub-functions `get_ltv_concentration` / `get_cohort_retention` / `get_occupancy_heatmap` / `get_anomaly_alerts` / `get_service_pairing` (same p_master_id, no auth guard, no REVOKE). Failure: `get_ltv_concentration` returns winback_candidates (client_name, client_phone, ltv) for any master UUID.
- [P0] supabase/migrations/118_update_get_master_clients_rpc.sql:6 (also 048, 076, 125 — same fn, latest wins) — `get_master_clients(p_master_id)` SECURITY DEFINER, filters only by `p_master_id`, `GRANT ... TO authenticated` but **no REVOKE FROM public** → still anon-executable. Called from browser hook src/lib/supabase/hooks/useClients.ts:36. Failure: any anon/authenticated caller passes a victim master UUID → full CRM dump: every client's name, phone, visit count, LTV, VIP flags, notes. This is the entire client base of every master on the platform.
- [P0] supabase/migrations/20260628000005_dynamic_pricing_uplift_discounts.sql:7 — `get_dynamic_pricing_uplift(p_master_id,…)` (the confirmed lead). SECURITY DEFINER, `WHERE master_id = p_master_id`, no auth.uid(), no GRANT/REVOKE. M-REV-05 regressed the IDOR protection its sibling `get_pricing_rule_stats` (20260628000003, correctly uses auth.uid() + REVOKE/GRANT) got right. Failure: anon reads any master's dynamic-pricing uplift revenue + rule usage counts.

Fix pattern (all P0): drop the `p_master_id` param and filter `WHERE master_id = auth.uid()`; add `REVOKE ALL ON FUNCTION … FROM public; REVOKE EXECUTE … FROM anon; GRANT EXECUTE … TO authenticated;`. Copy the exact guard already used in 20260628000003 and 20260628000007.

---

## P1 — High

- [P1] supabase/migrations/090_retention_rpc.sql:12 — `get_retention_stats(p_master_id,…)` SECURITY DEFINER, no auth.uid(), no REVOKE (GRANT authenticated only); called browser-side src/lib/supabase/hooks/useAnalytics.ts:174. Failure: anon/authenticated passes a victim UUID → any master's retention rate, returning-client counts, and period revenue. Same fix pattern as P0.

---

## P2 — Medium

- [P2] src/app/(master)/dashboard/products/actions.ts:318 — `createOrder` is a public server action (auth optional by design) with no rate-limit/captcha; it immediately decrements `products.stock_qty` and writes a `sale` transaction with no payment/hold gate. Failure: anon script POSTs repeated orders with valid `master_id` + product_ids → drains a master's entire inventory to zero and spams stock-alert Telegram/push notifications. Business-logic DoS. Totals are correctly server-computed (not client-trusted) — that part is fine.
- [P2] src/app/api/telegram/webhook/route.ts:201 — the `/start <uuid>` branch runs `UPDATE profiles SET telegram_chat_id = <caller chatId> WHERE id = <param>` with only regex validation, no ownership/connect-token binding. Failure: anyone who learns a victim's profile UUID DMs the bot `/start <victim-uuid>` → the victim's notifications are rebound to the attacker's Telegram chat (notification hijack / info disclosure). The parallel `TOKEN_RE` branch (random connect token) is safe; only the raw-UUID branch is vulnerable.
- [P2] supabase/migrations/116_broadcasts.sql:143 — `claim_phone_discount(p_phone, p_master_id,…)` SECURITY DEFINER, GRANT to authenticated, no verification the caller owns the phone/master. Failure: an authenticated attacker guessing/knowing a (master_id, phone) pair marks that recipient's discount `used_at` → griefing: burns discount codes belonging to other clients.
- [P2] src/app/api/billing/mono-webhook/route.ts:102 — `console.log('[mono-webhook] payload:', JSON.stringify(body))` logs the entire Monobank payload including `walletData.cardToken` (the recurring-charge token) in plaintext. Failure: anyone with Vercel log access obtains persistent card-charge tokens. Signature verification itself is correct (strict ECDSA, replay window, idempotency) — the issue is only the log line. Redact walletData before logging.

---

## P3 — Low / hardening

- [P3] src/lib/actions/novaPoshta.ts:11 — `searchNpCities` / `getNpWarehouses` are unauthenticated public server actions proxying the Nova Poshta API with no rate-limit. Failure: automated calls burn the shared NOVAPOSHTA_API_KEY quota (the key stays server-side — that part is correct). Min-length 2 + Limit caps reduce but don't prevent abuse.
- [P3] src/app/api/billing/test-charge/route.ts:10 — authenticated but not production-gated; issues a real 5 UAH Monobank checkout. Low risk (charges the caller's own card), but a live "test" endpoint should be disabled in prod.
- [P3] src/components/public/MasterLocationCard.tsx:16 / src/components/master/settings/LocationPicker.tsx:65 — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is shipped to the client (unavoidable for Maps JS). Confirm the key is HTTP-referrer-restricted to bookit domains in Google Cloud Console, else quota theft.

---

## Passed (verified secure)

- Mono webhook signature: src/app/api/billing/mono-webhook/route.ts — strict ECDSA SHA-256 verify, rejects missing/invalid x-sign (403), 15-min replay window, idempotency via billing_events unique constraint.
- Cron auth: all five routes (reminders, rebooking, reset-monthly, expire-subscriptions, check-uncompleted) gated by `verifyCronSecret` (Bearer CRON_SECRET).
- Debug endpoint: src/app/api/debug/fire-notifs/route.ts — 404 in production + DEBUG_TOKEN header gate.
- Products/orders ownership: dashboard/products/actions.ts — every mutation scoped by `master_id = getMasterId()`; `updateOrderStatus`/`getProductStats` verify ownership first; `createOrder` server-computes totals from DB prices (client total not trusted); stock decrement guarded with `.gte('stock_qty', qty)`.
- Client desk actions: my/bookings/actions.ts `cancelBooking`/`submitReview` scoped by `client_id = user.id` with status eligibility checks — no IDOR.
- Phone change: my/setup/phone/actions.ts `confirmPhone` — rate-limited via `check_and_log_sms_attempt`, OTP TTL, cross-account uniqueness conflict check.
- Nova Poshta key: src/lib/novaposhta/client.ts — `import 'server-only'`, key never sent to browser.
- Auth guard: my/layout.tsx — `redirect('/login')` when no user; B2CRouteGuard phone gate.
- XSS: JSON-LD at [slug]/page.tsx:471 escapes `< > &` (no </script> breakout); legal/[slug]/page.tsx dangerouslySetInnerHTML sources static hardcoded `LEGAL_HTML` constant; ProductDetailView renders name/description as React-escaped JSX text.
- No secret leakage: only anon key, VAPID public key, and Maps key appear under NEXT_PUBLIC_ — no service-role key in client code.
- Correctly-guarded RPCs (reference implementations): get_pricing_rule_stats (20260628000003), get_pricing_rules_overview (20260628000004), get_loyalty_overview/get_loyalty_impact (20260628000007) — all use auth.uid() + REVOKE public/anon + GRANT authenticated.

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0 | 5 findings (single IDOR anti-pattern across ~18 analytics/CRM RPCs) |
| P1 | 1 |
| P2 | 4 |
| P3 | 3 |
