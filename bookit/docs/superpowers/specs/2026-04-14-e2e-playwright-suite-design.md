# Design: Global Playwright E2E & Time-Series Test Suite

**Date:** 2026-04-14  
**Status:** Approved  
**Project:** BookIT — B2B2C SaaS CRM for beauty industry

---

## 1. Problem Statement

BookIT contains time-dependent algorithms (Dynamic Pricing, Smart Slots, Loyalty Programs) and data-heavy features (CRM with 50+ clients, Analytics). Standard E2E tests that click through a blank UI cannot verify these. We need:

- Historical data mass in the DB to trigger algorithmic behavior
- Time manipulation to simulate "N hours before slot" conditions
- Isolated test accounts so parallel test runs never conflict
- Safe seeding that cannot accidentally destroy local dev data

---

## 2. Architecture

### 2.1 Execution Flow

```
npm run test:e2e
  ↓
npx tsx scripts/seed-e2e-data.ts   ← wipe E2E records + recreate deterministic state
  ↓
playwright test
  ↓
e2e/global.setup.ts                ← generate + cache auth storageState for 6 accounts
  ↓
spec files run in parallel         ← each domain uses its own isolated account
```

### 2.2 File Structure

```
bookit/
├── playwright.config.ts                        ← updated: WebKit, Mobile Safari, .env.test loader
├── .env.test.example                           ← template (safe to commit)
├── .env.test                                   ← gitignored, local values
├── .env.test.runtime                           ← gitignored, written by seeder (IDs/slugs)
├── scripts/
│   └── seed-e2e-data.ts                        ← NEW: main seeder
├── e2e/
│   ├── global.setup.ts                         ← updated: 6 isolated accounts
│   ├── utils/
│   │   ├── supabase.ts                         ← exists, no changes
│   │   └── seedHelpers.ts                      ← NEW: shared seed functions
│   ├── pages/
│   │   ├── DashboardPage.ts                    ← exists
│   │   ├── BookingWidgetPage.ts                ← NEW POM
│   │   └── ClientBookingsPage.ts               ← NEW POM
│   └── tests/
│       ├── 01-auth-guards.spec.ts              ← NEW
│       ├── 02-time-travel-logic.spec.ts        ← NEW
│       ├── 03-referral-engine.spec.ts          ← NEW
│       ├── 04-master-crm-smoke.spec.ts         ← NEW
│       ├── master-crud.spec.ts                 ← exists
│       ├── 05-loyalty-reviews.spec.ts          ← exists
│       └── 07-notifications.spec.ts            ← exists
```

---

## 3. Isolated Test Accounts

Each test domain owns one dedicated Supabase account. Parallel Playwright workers never touch the same data.

| Domain | Email | storageState | Used by |
|--------|-------|--------------|---------|
| Time Travel | `e2e_master_timetravel@test.com` | `master-timetravel.json` | `02-time-travel-logic.spec.ts` |
| CRM Smoke | `e2e_master_crm@test.com` | `master-crm.json` | `04-master-crm-smoke.spec.ts` |
| Auth Guards | `e2e_master_auth@test.com` | `master-auth.json` | `01-auth-guards.spec.ts` |
| Referral | `e2e_master_referral@test.com` | `master-referral.json` | `03-referral-engine.spec.ts` |
| Client | `e2e_client@test.com` | `client.json` | `02`, `03`, `05` |
| Studio Admin | `e2e_studioadmin@test.com` | `studio-admin.json` | Foundation (no tests yet) |

**Safety invariant:** `global.setup.ts` rejects any email not matching `/^e2e_.+@test\.com$/`. Cannot accidentally auth a real account.

---

## 4. Seeder (`scripts/seed-e2e-data.ts`)

### 4.1 Safety Guards

1. Checks `NEXT_PUBLIC_SUPABASE_URL` contains `127.0.0.1` or `localhost`. Aborts if remote, unless `E2E_ALLOW_REMOTE=true`.
2. All deletes scoped via `profiles.email LIKE 'e2e_%@test.com'` — never touches other data.
3. Resolves master/client UUIDs via email lookup before any write.

### 4.2 Wipe Strategy (per domain)

```
DELETE bookings          WHERE master_id IN (e2e master UUIDs)
DELETE loyalty_programs  WHERE master_id IN (e2e master UUIDs)
DELETE dynamic_pricing_rules WHERE master_id IN (e2e master UUIDs)
DELETE client_master_relations WHERE master_id IN (e2e master UUIDs)
DELETE reviews           WHERE master_id IN (e2e master UUIDs)
```

Only E2E-owned records are removed. Order respects FK constraints.

### 4.3 Per-Domain Seed

**`seedTimeTravelMaster()`**
- Ensures `master_profile` exists with completed onboarding
- Inserts 50 `completed` bookings spanning last 6 months (for Smart Slots history)
- Inserts 1 `confirmed` future booking at `NOW + 2h` (Dynamic Pricing trigger window)
- Inserts `dynamic_pricing_rule`: `+20% if time_before_slot < 3h`
- Inserts `dynamic_pricing_rule`: `DISCOUNT_10 if day_of_week IN [Mon, Tue]` (quiet days)

**`seedCrmMaster()`**
- Ensures `master_profile` exists
- Creates 50 `profiles` as clients (email: `e2e_client_{n}@test.com`)
- Creates 100 `bookings` with mixed statuses (`confirmed`, `completed`, `cancelled`)
- Assigns `subscription_tier = 'pro'` (unlocks Analytics page)

**`seedAuthMaster()`**
- Ensures `master_profile` exists with completed onboarding
- No extra data needed (auth guard tests only check redirects)

**`seedReferralMaster()`**
- Ensures `master_profile` with `referral_code` set
- Inserts 2 `client_promocodes` records (referral recipients)

**`seedStudioAdmin()`**
- Ensures `master_profile` with `subscription_tier = 'studio'`
- Foundation only — Studio feature is WIP

### 4.4 Runtime ID Export

After seeding, writes `.env.test.runtime`:
```
E2E_MASTER_TIMETRAVEL_ID=<uuid>
E2E_MASTER_TIMETRAVEL_SLUG=<slug>
E2E_MASTER_CRM_ID=<uuid>
E2E_MASTER_CRM_SLUG=<slug>
E2E_CLIENT_ID=<uuid>
...
```

Specs load this file at runtime via `dotenv`.

---

## 5. Time Machine Strategy

**Dual-layer approach:**

| Layer | Tool | What it covers |
|-------|------|----------------|
| Server-side | Seeder creates booking at `NOW + 2h` | API/DB dynamic pricing check |
| Client-side | `page.clock.setFixedTime(NOW - 1h)` | UI renders discounted/surged price |

Combined, both layers are tested. Neither alone is sufficient.

**`page.clock` usage pattern:**
```ts
await page.clock.install();
await page.clock.setFixedTime(slotTime - 60 * 60 * 1000); // 1h before slot
await page.goto(`/${masterSlug}`);
// assert price badge shows dynamic pricing label
```

---

## 6. Spec Files

### `01-auth-guards.spec.ts`
- No storageState → navigate `/dashboard` → assert redirect to `/login`
- No storageState → navigate `/my/bookings` → assert redirect to `/login`
- `master-auth.json` → navigate `/my/bookings` → assert redirect to `/dashboard` (proxy guards)

### `02-time-travel-logic.spec.ts`
- **Dynamic Pricing:** `page.clock` set to 1h before slot → assert price badge on booking widget
- **Loyalty:** seed 2nd booking for client → assert loyalty discount applied on booking summary
- **Smart Slots:** client has 5 morning bookings in history → assert morning slots marked "Рекомендовано"

### `03-referral-engine.spec.ts`
- Navigate `/invite/[referral_code]` → assert cookie set
- Complete booking flow as guest → assert `referral_code` stored on profile after auth
- C2B path: client signs up via referral → assert `client_promocodes` record created in DB

### `04-master-crm-smoke.spec.ts`
- Navigate `/dashboard/clients` with 50 seeded clients → assert list renders, no infinite spinner
- Navigate `/dashboard/bookings` with 100 bookings → assert pagination/scroll works
- Navigate `/dashboard/analytics` → assert Revenue Forecast shows non-zero numbers

---

## 7. Page Object Models

### `BookingWidgetPage` (public booking page `/{slug}`)
- `serviceList` — list of bookable services
- `dateStrip` — 14-day horizontal strip
- `slotGrid` — available time slots
- `recommendedBadge` — "Рекомендовано" star badge on slots
- `priceBadge` — dynamic pricing label badge
- `selectSlot(time)` — click a specific slot

### `ClientBookingsPage` (`/my/bookings`)
- `pastTab` — switch to past bookings
- `reviewBtn` — first "Залишити відгук" button
- `bookingCards` — list of booking cards

---

## 8. `playwright.config.ts` Changes

- Loads `.env.test` with `override: true`, fallback to `.env.local`
- Safety guard logs warning if `SUPABASE_URL` is not localhost
- Projects: `chromium` (all tests), `webkit` (01 + 02 only), `mobile-safari` + `mobile-chrome` (smoke only)
- `fullyParallel: true` — safe because accounts are isolated
- `video: 'retain-on-failure'`, `screenshot: 'only-on-failure'` (reduces CI artifact size)

---

## 9. `package.json` Script

```json
"test:e2e": "npx tsx scripts/seed-e2e-data.ts && playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:seed": "npx tsx scripts/seed-e2e-data.ts"
```

> Seeder завантажує `.env.test` через `dotenv` всередині скрипта — зовнішній `dotenv-cli` не потрібен.

---

## 10. Out of Scope

- Studio Admin E2E tests — feature is WIP ("у розробці")
- Load testing (500+ clients) — use k6 or Artillery separately
- CI pipeline integration — separate task
- WebKit mobile (`iPhone 14`) for all suites — only mobile-smoke for now
