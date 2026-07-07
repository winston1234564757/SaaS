# R2 Billing Audit — 10-billing

Date: 2026-07-06 · Launch: 2026-07-10 (real Monobank, day 1)
Scope: mono-webhook, subscription engine, NEW shop orders, price computation, dunning, audit trail.
Mode: READ-ONLY. No project files edited.

## Headline
No attacker-exploitable P0 money hole found. Shop orders are **cash/card-on-delivery (COD)** — no online Mono path, totals computed server-side. Mono subscription amounts are set server-side and the webhook is ECDSA-signature-gated. The real risks are **self-inflicted revenue leaks** in the recurring-charge engine (pending-treated-as-paid, SKIP-LOCKED lock released before charge) and a monthly-only downgrade gap.

---

## Findings

### Shop orders (M-SHOP-05) — HOW PAID
`[INFO] src/components/public/shop/ShopCartBar.tsx:369` — Checkout copy: "Оплата готівкою або картою при отриманні". Shop = **COD only**. No Monobank acquiring, no online payment, no webhook. `createOrder` is the only money touch and it is server-authoritative (below). No online money hole in the shop path.

`[OK] src/app/(master)/dashboard/products/actions.ts:337-356` — `createOrder` re-fetches `price_kopecks` from `products` by id + `master_id` + `is_active`, and computes `total_kopecks` server-side. Client-supplied prices are **ignored** (client only sends `product_id` + `qty`). Order-item prices are also taken from the DB map, not the client. No amount-tampering vector.

---

### P1

`[P1] src/lib/billing/MonoProvider.ts:117-122 + src/app/api/cron/expire-subscriptions/route.ts:236` — `chargeRecurrent` maps any status that is not literally `'success'`/`'failure'` to `'pending'`; `chargeAndCommit` then does `succeeded = result.status !== 'failure'` — so **`pending` is treated as PAID**. On a pending charge the cron grants +30 days, sets tier active, runs `commit_paid_month`/`commit_free_month` (resets the discount reserve), inserts a `status:'success'` billing_event and notifies "оплачено". Failure: a Mono charge that is pending-then-declined leaves the master with a free 30-day Pro/Studio, a false `success` audit row, and a wiped referral discount reserve. There is **no webhook reconciliation** for recurring charges (see next finding), so nothing corrects it. Revenue loss per event = 700₴ (Pro) / 299₴ (Studio) + dispute-trail corruption.

`[P1] src/app/api/cron/expire-subscriptions/route.ts:88,233 vs src/app/api/billing/mono-webhook/route.ts:124-145` — Recurring charges use `orderId = recurring_{subId}_{period}`. The webhook parses `reference` as `bookit_{tier}_{uid32}_{ts}` and rejects anything where `parts[1]` is not `pro`/`studio` or `uid32.length !== 32` (line 142). A recurring-charge webhook therefore hits "bad reference format" and is **acked and discarded**. Consequence: recurring renewals rely **entirely** on the synchronous `chargeRecurrent` return value; the webhook provides zero idempotency or reconciliation for renewals (only the initial checkout is webhook-backed). Combined with the pending bug above, a mis-classified charge is never corrected.

`[P1] supabase/migrations/086_subscriptions_billing_engine.sql:23-39 + expire-subscriptions/route.ts:64` — `get_pending_subscriptions_for_billing` uses `FOR UPDATE SKIP LOCKED`, and the comment claims "transaction must stay open while charging". It does NOT: Supabase/PostgREST runs each `.rpc()` as its own transaction that **commits when the function returns**, releasing the row locks immediately — before the up-to-8s charge. Two overlapping cron invocations (Vercel has been observed double-firing crons) both fetch the same due row and both call `chargeRecurrent` → **double charge (700₴ ×2)**. `billing_events` dedups on `invoiceId` (unique per charge, not on the deterministic `orderId`), so it does not catch it. Likelihood is low (daily `0 2 * * *` cadence + `next_charge_at` advances on first success), but the impact is a real customer double-charge / chargeback. The SKIP LOCKED protection the design assumes is effectively absent.

---

### P2

`[P2] src/app/api/cron/reset-monthly/route.ts:27-35 (schedule 5 3 1 * *)` — The only downgrade path for **tokenless** expired subscriptions (referral-granted Pro with no saved card, or masters who cancelled their card) runs **once a month, on the 1st**. Tier gating reads `master_profiles.subscription_tier` directly with **no read-time expiry check** (layout.tsx / context.tsx select the column but never compare `subscription_expires_at` to now). A Pro that expires on the 2nd keeps full Pro features until the next 1st — up to ~28 days of unpaid Pro. Token subs are fine (daily `expire-subscriptions` handles renewal/dunning). Bounded revenue leak.

`[P2] src/app/api/cron/expire-subscriptions/route.ts:13 + billing/actions.ts:28` — `STUDIO_KOPECKS = 29_900` (and first-invoice `studio: 29900`) is a **flat charge regardless of master count**, contradicting the "299₴ / master / month" model (invoice destination literally says "за майстра/місяць", BillingPage shows "299 ₴ за майстра"). No `× masterCount` anywhere. De-risked for launch because Studio is `wip:true` (BillingPage.tsx:21) / early-access form only — not self-serve. BUT `createMonoInvoice('studio')` (billing/actions.ts:19-28) has **no wip guard server-side**, so a crafted request self-subscribes Studio at flat 299₴. **Escalates to P1 the day multi-master Studio launches.**

`[P2] src/app/(master)/dashboard/products/actions.ts:398-415` — Stock decrement is check-then-update (TOCTOU). Line 352 reads stock and errors if short; the write at 402 uses `.update({stock_qty:newStock}).gte('stock_qty', item.qty)` but **never checks the affected-row count**. Two concurrent orders for the last unit: both pass the read check, the `.gte` guard prevents negative stock so only ONE update lands, yet **both** orders are created and both insert a `sale` `-qty` row into `product_transactions`. Result: oversold item (COD, so a fulfillment failure not a Mono loss) + `product_transactions` ledger drifts from `products.stock_qty`. Note: this path does NOT use the atomic `increment_stock` RPC (that RPC is only used on cancel/return, actions.ts:618).

---

### P3

`[P3] src/app/api/billing/mono-webhook/route.ts:153-198` — The webhook stores `body.amount` but never validates it against the expected plan price before granting 30 days. Signature-gated (only Mono can sign), so not attacker-exploitable — flagged as defense-in-depth only.

`[P3] notifyMasterBilling call sites` — mono-webhook:234, expire-subscriptions:157/272/295/296 all use fire-and-forget `.catch(...)` (per commit 4d2fdd2, 6 places incl. reset-monthly). Confirmed still `.catch`, not awaited. In serverless the function can freeze after the response before the promise flushes → notifications may be lost. Non-money (notifications only), low impact.

`[P3] expire-subscriptions/route.ts:245-258 & 279-294` — Money-critical multi-step commits run in `Promise.all` with **no DB transaction**. If one leg rejects (e.g. billing_events dup), the others (tier update / card charge already done) are not rolled back → partial state / audit gap. Low probability, but a genuine atomicity gap on the money path.

---

## Re-verified from R1 (still holding)
- ECDSA X-Sign verify: correct (`createVerify('SHA256')` over raw body, PEM decoded from base64), key cached 24h with fresh-key retry. mono-webhook:43-56.
- Replay protection: 15-min freshness window on `reference` timestamp. mono-webhook:124-135.
- Idempotency: `billing_events` UNIQUE(payment_id, provider) + UNIQUE(provider, external_id); webhook catches `23505` and acks. migrations 075/085, webhook:164-171.
- `createAdminClient` used (not inline). MIN_KOPECKS floor + `r2()` precision + 40% discount cap intact; `finalTotal`/barter clamped `Math.max(0, …)` — cannot go negative. pricing.ts, computeBookingPrice.ts:163.
- First-payment amount is server-set (`plan.priceKopecks`); client sends only tier. No amount tampering. billing/actions.ts:26-43.
- Dunning: 3 failed attempts → `status='past_due'` + tier→starter. Note: nothing reads `master_subscriptions.status` to lock features (grep: past_due only in cron + types) — feature lock happens via `subscription_tier='starter'` set at dunning, which is the effective gate. Works, but "past_due" itself is inert.

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0       | 0     |
| P1       | 3     |
| P2       | 3     |
| P3       | 3     |
| INFO/OK  | 2     |

**Shop orders are paid COD (cash/card on delivery) — no online Mono path, totals server-authoritative. No attacker-exploitable money hole. Top risks are self-inflicted recurring-billing revenue leaks (P1).**
