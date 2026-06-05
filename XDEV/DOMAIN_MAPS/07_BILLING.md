# 07 — Billing & Subscriptions Domain Map

## 1. Domain Overview

Монобанк-еквайринг для підписок майстрів. Три тарифи, рекурентні платежі, Ed25519 вебхук, Dunning-процес, стекінг знижок.

### Key Files
- `src/lib/billing/PaymentProvider.ts` — Abstract interface
- `src/lib/billing/MonoProvider.ts` — Monobank implementation
- `src/lib/billing/pricing.ts` — Pricing logic (unit-tested)
- `src/lib/billing/pricing.test.ts` — 27 unit tests
- `src/lib/billing/billing.test.ts` — 6 webhook tests
- `src/app/(master)/dashboard/billing/page.tsx` — Billing page
- `src/app/(master)/dashboard/billing/actions.ts` — Billing server actions
- `src/app/api/billing/mono-webhook/route.ts` — Monobank webhook
- `src/app/api/billing/test-charge/route.ts` — Test charge (dev)
- `src/app/api/billing/paid/route.ts` — Post-payment redirect
- `src/app/api/cron/expire-subscriptions/route.ts` — Daily recurring
- `src/app/api/cron/reset-monthly/route.ts` — Monthly downgrade

### DB Tables
- `master_subscriptions` — token, status, failed_attempts, next_charge_at
- `payments` — provider, status, amount
- `billing_events` — external_id UNIQUE, idempotency
- `master_profiles.subscription_tier` — Current plan (starter/pro/studio)

### Plans
| Plan | Price | Limits | Features |
|---|---|---|---|
| Starter | 0 ₴ | 40 bookings/month | Basic, watermark |
| Pro | 700 ₴/mo | Unlimited | Full analytics, CRM, Telegram, Push |
| Studio | 299 ₴/master/mo | Team (2-10) | All Pro + team management |

---

## 2. State Machine

### 2.1 Subscription Lifecycle

```
[TRIAL] → Pro trial (14-30 days, from referral)
  → [ACTIVE] → Pro paid
    → recurring charge successful → [ACTIVE] (renewed)
    → recurring charge fails → [DUNNING]
      → day 1: charge retry → fails → notify
      → day 2: charge retry → fails → notify
      → day 3: charge retry → fails → notify (subscription_failed SMS)
      → day 4: → [FREE_MONTH] (grace period)
        → free month expires → [DOWNGRADING]
          → downgrade to Starter → [STARTER]
  → [CANCELLED] → master cancels subscription
  → [EXPIRED] → never paid or trial ended
```

**States:**
| State | Description | Features |
|---|---|---|
| `active` | Paid, fully functional | Full |
| `trialing` | Free trial period | Full (time-limited) |
| `dunning` | Payment failed, retrying | Full (3-day window) |
| `free_month` | Grace period after 3 fails | Full (1 month) |
| `past_due` | Overdue | Degraded? |
| `cancelled` | Manually cancelled | Until period end |
| `expired` | No active subscription | Starter only |
| `starter` | Free tier | Limited (40 bookings) |

### 2.2 Payment Flow (Checkout)

```
[PLAN_SELECTED] → master chooses plan
  → POST /api/billing/test-charge (dev) OR
  → createCheckout(plan, masterId):
    → INSERT payments (status: pending)
    → Monobank API /personal/merchant/invoice/create
      → params: amount, ccard=true (save token)
    → return checkout_url
  → [REDIRECT] → Monobank payment page
  → [CALLBACK] → user returns to /dashboard/billing?paid=1
  → [WEBHOOK] → /api/billing/mono-webhook
    → verify Ed25519 signature
    → find payment by external_id
    → UPDATE payments (status: success)
    → UPSERT master_subscriptions (token, next_charge_at)
    → UPDATE master_profiles (tier: pro)
    → notify subscription_paid
```

### 2.3 Webhook Verification

```
POST /api/billing/mono-webhook
  → extract X-Mono-Signature header
  → fetch Monobank public key (cache, with rotation)
  → ed25519.verify(signature, body, publicKey)
    → valid → process payment
    → invalid → 403 Forbidden (strict, no soft-mode)
  → check billing_events.external_id UNIQUE
    → exists → 200 OK (idempotent, no double process)
    → new → process
```

### 2.4 Dunning Process

```
cron/expire-subscriptions (daily 02:00):
  → SELECT * FROM get_pending_subscriptions_for_billing()
    → FOR UPDATE SKIP LOCKED (race-safe)
  → FOR each subscription:
    → chargeRecurrent(token, amount)
      → success → next_charge_at += 30d, notify paid
      → failure:
        → failed_attempts++
        → IF failed_attempts >= 3:
          → set free_month = true, next_charge += 30d
          → notify subscription_failed
        → IF free_month expired:
          → downgrade to starter
          → notify subscription_downgraded
```

### 2.5 Monthly Reset

```
cron/reset-monthly (1st day 00:05):
  → Find expired subscriptions (2-4 days before expiry)
    → notify subscription_expiring
  → Find overdue subscriptions (expired)
    → downgrade to Starter
    → notify subscription_downgraded
```

---

## 3. Environment Matrix

| Environment | Billing Behavior |
|---|---|
| Production | Real Monobank API |
| Development | Test mode (5 UAH charges) |
| CI/E2E | Mock/billing bypass |
| Offline | Cannot process payments |

### Plan Tier Effects
| Feature | Starter | Pro | Studio |
|---|---|---|---|
| Bookings/month | 40 | Unlimited | Unlimited |
| Analytics | Basic | Full | Full |
| CRM clients | Limited | Unlimited | Unlimited |
| Portfolio items | 5 | Unlimited | Unlimited |
| Products | Limited | Unlimited | Unlimited |
| Broadcasts | ❌ | ✅ | ✅ |
| Flash Deals | ❌ | ✅ | ✅ |
| Dynamic Pricing | ❌ | ✅ | ✅ |
| Watermark | ✅ | ❌ | ❌ |
| Team | ❌ | ❌ | ✅ (2-10) |

---

## 4. Load & Concurrency Vectors

| Vector | Risk | Mitigation |
|---|---|---|
| Two webhooks same invoice | Double payment | billing_events UNIQUE |
| Cron overlap | Double charge | FOR UPDATE SKIP LOCKED |
| Expire + Reset same day | Conflicting actions | Separate crons, diff times |
| Ed25519 key rotation | Stale key cache | Auto-refresh on fail |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| Payment amount mismatch | Webhook amount != expected → alert |
| Zero amount (free plan) | No charge needed |
| Negative amount (discount exceeds) | Floor at 0 |
| Card declined | failed_attempts++ |
| Card expired | Permanent failure |
| Monobank API down | Retry next cron cycle |
| Invoice expired (>24h) | Create new invoice |
| Master_profiles missing | Webhook fails gracefully |
| Subscription token missing | Human intervention |

---

## 6. Test Vectors

### Unit Tests (pricing.test.ts — 27 tests)
- [x] Base tier pricing correct
- [x] Lifetime discount percentage stacking
- [x] Bounty balance deduction
- [x] Discount exceeding total (floor at 0)
- [x] Rounding to nearest kopiyka
- [x] Mixed discount types (bounty + lifetime)
- [x] Edge: zero discount
- [x] Edge: max lifetime (50%)
- [x] Edge: max bounty (any amount)

### Unit Tests (billing.test.ts — 6 tests)
- [x] Ed25519 signature verification (valid)
- [x] Ed25519 signature verification (tampered body → fail)
- [x] Ed25519 signature verification (wrong key → fail)
- [x] Key rotation (fetch new key if old fails)
- [x] Webhook body parsing
- [x] Idempotency (same external_id → no duplicate)

### Integration Tests
- [ ] Checkout flow: create invoice → Monobank URL
- [ ] Webhook: valid signature → payment processed
- [ ] Webhook: invalid signature → 403
- [ ] Webhook: duplicate external_id → 200 (no duplicate)
- [ ] Dunning: charge fails → failed_attempts++ → notify
- [ ] Dunning: 3 fails → free month → downgrade
- [ ] Monthly reset: downgrade expired → notify
- [ ] Monthly reset: warn 2-4 days before expiry

### E2E Tests
- [ ] Billing page: all 3 plans visible
- [ ] Billing page: current plan highlighted
- [ ] Checkout: click plan → redirect to Monobank
- [ ] Checkout: return with ?paid=1 → success state
- [ ] Starter plan: 40 bookings → block 41st
- [ ] Pro plan: unlimited bookings
- [ ] Plan upgrade/downgrade UI

### Security Tests
- [ ] Webhook signature: missing header → 403
- [ ] Webhook signature: tampered body → 403
- [ ] Webhook signature: replay attack → idempotency
- [ ] Cron: missing Bearer → 401
- [ ] Billing API: master A cannot see B's data

---

## 7. File Inventory

### Core
- `src/lib/billing/PaymentProvider.ts`
- `src/lib/billing/MonoProvider.ts`
- `src/lib/billing/pricing.ts`
- `src/lib/billing/pricing.test.ts`
- `src/lib/billing/billing.test.ts`

### Pages & Components
- `src/app/(master)/dashboard/billing/page.tsx`
- `src/app/(master)/dashboard/billing/actions.ts`
- `src/components/master/billing/BillingPage.tsx`

### API Routes
- `src/app/api/billing/mono-webhook/route.ts`
- `src/app/api/billing/test-charge/route.ts`
- `src/app/api/billing/paid/route.ts`

### Cron
- `src/app/api/cron/expire-subscriptions/route.ts`
- `src/app/api/cron/reset-monthly/route.ts`

### DB Migrations
- `036_payment_enums.sql`
- `037_check_constraints.sql`
- Related billing migrations (multiple)

### Existing Tests (28 total)
- `src/lib/billing/pricing.test.ts` — 27 tests
- `src/lib/billing/billing.test.ts` — 6 tests
