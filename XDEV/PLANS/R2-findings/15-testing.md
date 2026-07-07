# R2 Testing-Gap Audit — 15-testing

Date: 2026-07-07 · Launch: 2026-07-10 (real Monobank)
Scope: Test coverage vs risk for a payments+booking launch. Inventoried all Vitest units (`src/**/*.test.ts`) and Playwright e2e (`e2e/**/*.spec.ts`), mapped them onto the money/security paths (mono-webhook, recurring-charge cron, createBooking, shop orders, OTP/auth, notification cascade + SMS budget), and identified the critical untested surfaces + any test asserting on now-changed behavior.
Mode: READ-ONLY. No project source or test edited. Every gap verified by reading both the test and the code it claims to cover.

## Headline
Coverage is **wide but shallow-in-the-wrong-places**. The pure/domain layer is genuinely strong: `createBooking()` has a 30-case real-function integration suite (price integrity, 40% discount cap, manual-discount cap, C2C, flash-deal slot match, atomic-stock rollback, manual-source auth gate), stock actions are covered for idempotency + restock, pricing/billing math is exercised directly, and `notifMap` templates get a full build+XSS sweep. But the **three server surfaces that move real money on launch day are effectively untested**: (1) the **mono-webhook route** — the entire signature/idempotency/replay/recurring-settlement handler — has zero tests against the real handler; its two "test" files (`mono-webhook.test.ts`, `billing.test.ts`) test **re-implemented copies of the logic pasted into the test file**, so they pass forever regardless of what the route does. (2) The just-refactored **recurring-charge cron** (`expire-subscriptions/route.ts` — atomic claim lock, pending-deferral, dunning, free-month) has **no test at all**. (3) The launch shop money path `createPublicOrder`/`createOrder` has **no test**, even though the exact mock harness that would cover it already exists in `createBooking.action.test.ts`. Same copy-not-import pattern hides the OTP rate-limiter and the new SMS budget cap. E2e stops at guest-booking "Success" — no e2e touches payment, PostBookingAuth, shop orders, or notification delivery.

---

## Coverage summary

**Vitest (unit/integration) — `src/**`:** ~47 suites, baseline `npm test` = 1004 passed / 4 failed (stale — see P3).
- Strong, real-function integration: `createBooking.action.test.ts` (30 cases), `bookings/__tests__/stock.action.test.ts` (completeBooking/cancelBooking/updateBookingStatus), `partners.test.ts`, `referrals.action.test.ts`, `flashDeal.test.ts`, `waitlist.test.ts`, `support.test.ts`.
- Strong pure/domain: `billing/pricing.test.ts`, `actions/__tests__/pricing.math.test.ts`, `utils/dynamicPricing.test.ts`, `utils/bookingEngine.test.ts`, `utils/smartSlots.test.ts`, `utils/occupancy.test.ts`, plus dates/phone/token/uuid/pluralUk/currency/slug/errors.
- Notifications: `notifMap.test.ts` (thorough — 23 events, XSS, SITE_URL, minimal-data resilience); `NotificationOrchestrator.test.ts` (**one** assertion only).
- Copy-not-import (real code NOT executed): `mono-webhook.test.ts`, `billing/billing.test.ts`, `send-sms/route.test.ts`, and the trial-days block of `referrals.test.ts`.

**Playwright (e2e) — `e2e/`:** 18 `audit/*` page-level a11y/render sweeps + ~24 `tests/*` flow specs (booking-complete, referral-engine, crm-logic, loyalty-reviews, notifications, dynamic-pricing, flash-deals, client-journey, mobile-smoke). Runs against **local** Supabase with a production build. Grep for `mono|payment|checkout|PostBookingAuth|createPublicOrder|otp` across all of `e2e/` returns only incidental hits (auth pages, a billing page-load audit) — **no e2e exercises payment, OTP send/verify, shop order, or notification delivery**.

---

## Findings

### P0

`[P0] src/app/api/billing/mono-webhook/route.ts — the real webhook handler is entirely untested (money-in, launch day).` The two suites that name it test **copies**: `actions/__tests__/mono-webhook.test.ts` defines its own `parseMonoReference`/`checkFreshness`/`computeNewExpiry` inline (lines 5-31) and `billing/billing.test.ts` defines its own `verifyBody` (lines 8-19) — neither imports `route.ts`. Untested in the actual handler: missing `x-sign` → 403 (`:202`), ECDSA verify + stale-key refresh-and-retry (`:211-217`), first-payment idempotency via `billing_events` `23505` dedup (`:307-311`), replay freshness window on `bookit_*` refs (`:270-278`), and the **entire `settleRecurringCharge`** (`:69-191`): success → grant 30d + `syncReferralAndBounty`; non-success → `failed_attempts++`, dunning at 3 → `status='past_due'` + downgrade `subscription_tier='starter'`; dup-invoice dedup; clearing the cron's `charging_at`/`pending_invoice_id` claim. **Risk:** a signature-bypass, a double-grant on webhook replay, or a broken dunning downgrade all ship silently — this is real money and paid-tier entitlement. **Minimal test:** import `POST`, mock `createAdminClient` (reuse the `makeAdmin` harness from `createBooking.action.test.ts`) + `getMonoPubKey`/`createVerify`; assert 403 on absent/bad sig, `{status:'ok'}` + no second grant on a duplicate `invoiceId` (RPC/insert returns `23505`), and that 3 consecutive recurring failures flip `master_subscriptions.status` to `past_due` and `master_profiles.subscription_tier` to `starter`.

`[P0] src/app/api/cron/expire-subscriptions/route.ts — recurring-charge engine has zero tests (just refactored: atomic claim lock + reconciliation).` No file imports this route. Untested: cron-secret gate (`:58`, `verifyCronSecret` is unit-tested in isolation but the route wiring is not), the **PENDING branch** that must NOT grant and instead records `pending_invoice_id` + a `pending` billing_event and returns `deferred` (`:256-275`), timeout/throw → treated as failure not paid (`:247-250`), dunning increment + downgrade at `MAX_FAILED_ATTEMPTS=3` (`:311-339`), the **free-month branch** `commit_free_month` when discount ≥ 100% (`:111-166`), Studio flat-price vs Pro `calculateBillingDecision` branch (`:92-108`), and `Promise.allSettled` per-row failure isolation / result tallies (`:200-215`). **Risk:** the whole point of the refactor — never granting a month on an unconfirmed `pending`, and not re-charging a claimed row — is exactly what has no regression guard; a regression re-introduces double-charges or free paid months. **Minimal test:** import `GET`, mock the admin RPCs (`get_pending_subscriptions_for_billing`, `get_master_billing_state`, `commit_free_month`, `commit_paid_month`) + a fake `MonoProvider.chargeRecurrent`; assert (a) `pending` result writes `pending_invoice_id` and returns `deferred:1, succeeded:0`, (b) a thrown/timeout charge increments `failed_attempts` and does NOT touch `subscription_expires_at`, (c) discount ≥100% calls `commit_free_month` and inserts a `free_*` event with `amount:0`.

`[P0] src/app/[slug]/actions.ts:118 createPublicOrder (and dashboard/products/actions.ts:319 createOrder) — the shop money path has no test.` This is a launch-day purchase path with the same integrity surface as `createBooking`: integer/≥1 qty guard (`:128-132`, comment explicitly warns a negative qty inflates stock), price sourced from DB not client (`:160`), atomic `decrement_product_stock_atomic` with **rollback of already-reserved units AND the order** on mid-flight exhaustion (`:205-233`), and `sale` ledger rows. **Risk:** oversell, negative totals, or ledger drift on the retail flow — money and inventory, unguarded. The mock harness to test it already exists verbatim in `createBooking.action.test.ts` (`makeAdmin`/`makeChain`), so this is a low-effort, high-value add. **Minimal test:** import `createPublicOrder`, mock admin; assert (a) `qty:-1`/`qty:0`/`qty:1.5` → `'Невірна кількість товару'` before any DB write, (b) `stock_qty < qty` → per-product error, (c) `decrement_product_stock_atomic` returning `false` on the 2nd of two items rolls back item 1 via `increment_stock` and deletes the order.

---

### P1

`[P1] src/lib/notifications/__tests__/NotificationOrchestrator.test.ts — a single assertion for the whole cascade engine.` The one test (`:40-54`) only checks that `sendTelegramMessage` was called. Untested: the **push→TG→SMS critical-only gating** (the core rule — a non-critical event must never fall through to paid SMS), `notifMap[event].isCritical` branching, dedup/`notification_log` writes, multi-channel recipient resolution, and interaction with the new SMS budget guard. `notifMap.test.ts` proves the *templates* render but nothing proves the *routing/gating*. **Risk:** a regression that SMS-blasts non-critical events (cost + spam) or, worse, drops a critical `subscription_failed`/`booking_cancelled` SMS. **Minimal test:** drive `send()` for a critical vs non-critical event with a recipient that has phone+TG+push, assert SMS is attempted only for the critical one and TG/push fire per cascade order.

`[P1] src/app/api/auth/send-sms/route.ts — OTP rate-limiter and account-conflict guard untested (SMS-bombing + cost + takeover surface).` `send-sms/route.test.ts` again tests only copied helpers (`generateOtp`, `isTurboSmsSuccess`, `normalizePhoneInline`) — never imports the route. Untested real logic: the atomic `check_and_log_sms_send` RPC branches → `phone_limit`/`ip_limit` 429 (`:79-93`), the number-already-linked-to-another-account 409 guard (`:43-60`, security-relevant given the recent P0 link-phone takeover fix), and RPC-error → 500 fail-closed (`:71-77`). **Risk:** an unbounded SMS bill or a re-opened account-linkage hole ships with a green test suite. **Minimal test:** import `POST`, mock admin so the RPC returns `'phone_limit'`/`'ip_limit'` → expect 429; conflict row present → 409; RPC error → 500 (and TurboSMS never called).

`[P1] src/lib/turbosms.ts:12-23 — new SMS daily-budget guard is untested, and it fails OPEN.` `check_notification_sms_budget` suppression (`allowed === false` → `{ok:false, code:-1}`) and the deliberate **fail-open on RPC error** (`:15-16`, "sending anyway") have no test. No `turbosms.test.ts` exists. **Risk:** the budget cap is the only thing standing between a notification bug and an unbounded SMS bill; fail-open means a broken RPC silently disables the cap — exactly the case a regression test should pin. **Minimal test:** mock the RPC → `false` asserts fetch is NOT called and `code:-1` returned; RPC → error asserts fetch IS called (documents the fail-open contract intentionally).

`[P1] verify-sms + PostBookingAuth linkage untested (auth completion of the booking funnel).` `send-sms/verify-sms/schema.test.ts` covers only the Zod schema; the actual OTP-match, session issue, and client→booking linkage have no unit or e2e coverage (grep `PostBookingAuth` in `e2e/` = 0 flow hits). **Risk:** a client completes a booking but the post-booking account link silently fails, breaking the launch-critical "guest booking becomes an account" conversion. **Minimal test (unit):** verify OTP mismatch/expiry paths; **or (e2e):** extend `08-booking-complete` past Success into the OTP step using a seeded/known OTP.

---

### P2

`[P2] e2e happy path stops at guest-booking "Success" — the launch-critical chain is not covered end-to-end.` `e2e/tests/08-booking-complete.spec.ts` walks service→datetime→contacts→Success (and is `test.skip` unless `E2E_MASTER_SLUG` is set). Nothing continues into PostBookingAuth OTP, payment (test mode), shop order, or asserts a notification landed. The register→onboarding→booking→auth→payment→order→notify chain the audit asks about exists only as disjoint page audits. **Risk:** integration seams between these steps (the most common place launch bugs hide) are unverified. **Minimal test:** one `@smoke` spec chaining booking → OTP verify (seeded) → assert a `notification_log`/`billing_events` row via the admin util already used in `e2e/utils/supabase.ts`.

`[P2] Copy-not-import test pattern is a systemic false-confidence risk (meta).` Four suites (`mono-webhook.test.ts`, `billing/billing.test.ts`, `send-sms/route.test.ts`, and `referrals.test.ts:70` `resolveTrialDays`) re-declare the production logic inside the test and assert against the copy. These **cannot fail when the real code changes** — they gave the money paths a green check while covering nothing. **Risk:** every future refactor of those routes is unguarded yet appears tested. **Action:** treat the P0/P1 items above as the fix; going forward, prefer importing the real export (the `createBooking`/`stock.action` suites are the model).

---

### P3

`[P3] Known-stale failing tests (the 4 baseline failures) — flag, don't trust.` Per baseline: `partners.test.ts` / `referrals.action.test.ts` need updated admin-client + token fixtures, and a C2B trial test asserts 30d while the code is now correctly 21d. Note `referrals.test.ts:80-81` still asserts C2B → **30** days against its inline copy — the canonical trial-days value must be re-confirmed and these assertions updated to 21d so the suite goes green and the assertion reflects shipped behavior. **Risk (low):** a red suite trains the team to ignore failures, masking a real regression later.

`[P3] verifyCronSecret is unit-tested but no route asserts it is actually wired.` `utils/verifyCronSecret.test.ts` proves the comparator; no test proves `expire-subscriptions` (or other crons) return 401 when the header is absent. Folds into the P0 cron test. **Risk (low):** an unauthenticated cron trigger.

---

## Re-verified strengths (well-covered — no finding)
- **`createBooking()`** — `actions/__tests__/createBooking.action.test.ts` is the model suite: real function, mocked Supabase, 30 cases covering schema validation, manual-source auth gate (session≠master, client-role rejection — the just-hardened spoof guard), starter 40-booking cap, service/product not-found + inactive, **atomic stock decrement rollback** (RPC `false` and error), dynamic pricing + starter trial cap, loyalty discount, **40% combined-discount cap**, manual-discount 50→40% double-cap, C2C 5-condition eligibility, slot-collision `23505`, booking_services rollback, and flash-deal slot match/mismatch/claim.
- **Stock actions** — `stock.action.test.ts`: completeBooking idempotency (no double-deduct on already-completed), atomic `deduct_consumable_stock` + ledger row, cancel/updateStatus restock via `increment_stock`, master-ownership gate.
- **notifMap** — 23 events build across inApp/push/telegram/sms, XSS escaping, SITE_URL button URLs, minimal-data resilience.
- **Pricing/billing math** — `billing/pricing.test.ts`, `pricing.math.test.ts`, `dynamicPricing.test.ts` exercise the real functions directly.
- **Utils** — dense direct coverage (bookingEngine, smartSlots, occupancy, dates, phone, token, uuid, pluralUk, currency, slug, errors).
- **e2e breadth** — 18 audit sweeps + ~24 flow specs, local-Supabase safety guard in `playwright.config.ts`, isolated per-domain accounts.

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0       | 3     |
| P1       | 4     |
| P2       | 2     |
| P3       | 2     |

**Top pre-launch picks: (1) mono-webhook route real-handler test — sig/idempotency/replay/recurring-dunning (P0, money-in); (2) recurring-charge cron test — pending-deferral + dunning + free-month (P0, just refactored, no guard); (3) createPublicOrder/createOrder test — qty/price integrity + atomic-stock rollback (P0, shop money, harness already exists).**
