# TEST-M6 — E2E suite stabilization (the suite is ~21% red from rot)

**Priority:** P1. **Status:** 🔄 IN PROGRESS (diagnosed 2026-07-07).
**Source:** full chromium run — **93 passed / 35 failed / 39 skipped** (167 total, 5.4m).

## Why this matters
This IS the answer to "why did old audits pass while bugs shipped": the e2e suite
rotted. 35/167 red means nobody kept it green, so it caught nothing — same syndrome
as the client-login crash. My new specs (00-role-login-smoke, 21-rls-security) and
the full unit suite (1013/1013) are green; the rot is in the **pre-existing** specs.

## Verified: my changes are NOT the cause
The failing specs (booking-flow, smoke, auth, analytics) do not touch the realtime
hooks I changed. Sampled 4 failures — all test-side drift (see categories).

## Failure categories (triage each; DO NOT blanket-pass)
Rule: stale test → fix the assertion; genuine app regression → fix the code and keep
the test red until fixed. Never edit a test just to make it green (that is the disease).

1. **Stale copy assertions** (confirmed):
   - `smoke.spec` `/explore` expects `"Красота поруч"`; page h1 is `"Знайди свого майстра"`.
   - `booking-flow` waits for `p.font-semibold` `"Обери послуги"` — text/selector drifted.
   - `17-retention-loyalty-engine` teaser / max-tier copy — verify against current strings.
2. **Drifted flow/selectors** (confirmed):
   - `auth.spec` clicks `Продовжити` but it is `disabled` — login flow now needs a role
     picked first. Update the page-object/steps.
   - `10-master-bookings` mode buttons / FAB selectors.
3. **Data-dependent assertions**:
   - `04-master-crm-smoke` analytics `expect(x).toBe(0)` got `4` — likely inverted/stale.
   - `15-analytics`, `19-services` — depend on seed data.
4. **Seed harness bugs** (partly fixed):
   - ✅ FIXED: audit-master products used `price`/`stock` → now `price_kopecks`/`stock_qty`.
   - ⬜ REMAINING: products upsert `onConflict: 'master_id,name'` has no matching unique
     constraint → audit products still not seeded. Fix: delete-then-insert, or add a
     `UNIQUE (master_id, name)` (only if the product model actually forbids dup names).
5. **Environment-only** (exclude from local/CI or gate):
   - `zz-capture-vercel` captures against Vercel — not a local assertion; should be
     project-gated or skipped locally.
6. **Known-flaky** (per TESTING_MAP): `02-time-travel` (×5), `12-flash-deals`,
   `17-retention`, `ux-premium` visual regression. Stabilize per the flaky guide
   (no fixed waitForTimeout; wait on concrete state).

## Method
- Triage top-down by category. For each spec: open the trace
  (`npx playwright show-trace test-results/<dir>/trace.zip`), decide stale-vs-real,
  fix accordingly, re-run that spec isolated to green, then move on.
- Track a running count; goal is 0 unexplained reds. Real bugs found → separate
  fix commits (this is the valuable output).
- After green: wire `TEST-M5` anti-drift so copy/selector drift fails fast next time.

## Progress (2026-07-07) — 8 specs green so far
- **Batch 1 (0003f358):** smoke.spec 4/4.
- **Batch 2 (3fafbef1):** booking-flow 4/4 (wizard data-testids + hero-band metric).
- **Seed fix (2b1b4b6c):** products `price_kopecks`/`stock_qty`.
- **Client-phone harness gap — FIXED (2026-07-08, option a):** root cause was
  `E2E_CLIENT_EMAIL=e2e_client@test.com` — an orphan the seeder NEVER creates (it
  makes `e2e_client_timetravel/crm/auth/referral@…`, each with a phone). So
  `global.setup` built `client.json` from a phoneless orphan → landed on
  `/my/setup/phone` → disallowed → `client.json` deleted → ALL client specs skip.
  Chose option (a) over (b): retarget `E2E_CLIENT_EMAIL` → `e2e_client_timetravel@test.com`
  (the data-rich TT client that `E2E_CLIENT_ID` already aliases via `clientTimeTravelId`),
  NOT create a new bare orphan (which would give an empty `/my/bookings` + mismatch
  with `E2E_CLIENT_ID`). Files: `.env.test:15`, `.github/workflows/e2e.yml` +
  `bookit/.github/workflows/e2e.yml` (both), `08-notification-adoption.spec.ts`
  (hard-coded `CLIENT_ID='2ba1e13a…'` [the orphan's id] → `process.env.E2E_CLIENT_ID`
  + skip guard — auth UUIDs are random per fresh DB, never hard-code), comment fixes
  in `global.setup.ts` + `17-retention`. Verified read-only against prod: target
  account exists id `dbab90dd-aaf2-4b92-9e39-418601136ee9`, phone `+380991111111`,
  role client, client_profile present → satisfies the `/my/bookings` landing contract.
  TSC:0. This un-skips client specs (08, 16-mobile, 14-client-journey, 17-retention B).
- **14-client-journey GREEN (2026-07-08, commit 2c344629):** verified LIVE (prod
  build + server, chromium). Root cause = C-DESK-01 dual-tree drift: client pages
  render separate mobile + `hidden lg:block` desktop trees, so `h1.first()` /
  `.bento-card` grabbed the hidden off-breakpoint copy or drifted markup. Fixes:
  (1) page-object `heading`/card/tab locators → `.filter({ visible: true }).first()`
  so the shown tree wins; (2) tab labels matched across both copies
  ("Майбутні записи"↔"Майбутні", "Минулі записи"↔"Раніше"); (3) restored the
  data-testids specs already target (`master-card`, `booking-card`) that the
  redesign dropped — additive, behavior-neutral, durable anti-drift. GENERAL RULE
  for every redesigned dual-tree surface: never `.first()` a bare tag — always
  scope to `:visible`, and prefer stable `data-testid` over class/copy selectors.
- Remaining: ~19 specs across the categories below. Ground truth is now stale
  (brief snapshot predates batch 2 + these fixes) — re-run the full chromium suite
  to get the current red list before triaging further.

**Batch 1 detail (commit 0003f358):** smoke.spec 4/4 green; booking-flow "open flow" green.
- LandingPage page-object: login `exact`, register CTA "Спробувати безкоштовно",
  `openMobileMenu()`; explore link is mobile-hamburger only now.
- PublicBookingPage: step title is `<h2 heading-serif>` not `<p font-semibold>`.
- smoke: /explore h1 "Знайди свого майстра"; explore-nav via mobile menu.

### Precise root causes for the remainder (verified in code — do these next)
1. **Wizard-internal selectors** (booking-flow lines 41/52, likely 08-booking too):
   `PublicBookingPage.serviceCard` / `nextBtn` target `div[class*="z-[60]"]` +
   `button.w-full.text-left` — neither exists in the redesigned wizard. Service
   card is a `<motion.button>` grid item containing `p.text-sm.font-semibold`
   (svc name); footer CTA "Далі" is in ServiceSelector.tsx:439. Re-derive both
   selectors from current markup (no product bug — pure selector drift).
2. **Client account has no phone → /my/setup/phone redirect** (16-mobile line 99,
   14-client-journey): HARNESS INCONSISTENCY — `global.setup.ts` builds
   `client.json` from `E2E_CLIENT_EMAIL=e2e_client@test.com`, but the seeder
   creates `clientTimeTravel/Crm/Auth/Referral@test.com` (with phones) — a
   DIFFERENT account. `e2e_client@test.com` is an orphan without a phone. Fix
   options: (a) point `global.setup` client at a seeded email, or (b) have the
   seeder also create+phone `e2e_client@test.com`. Decide deliberately — other
   specs consume `client.json`.
3. **04-crm analytics "non-zero revenue"** (line 231): asserts
   `skeletons.count() === 0`, got 4. AMBIGUOUS — either a real infinite-skeleton
   on /dashboard/analytics for the crm master, or the `[class*=skeleton]`
   selector catches non-spinner decorative elements. OPEN THE TRACE before
   deciding; this is the one that may be a real product bug.
4. **Untouched categories** (from §"Failure categories"): 03-referral (3),
   10-master-bookings (3), 15-analytics (1), 17-retention (2), 19-services (1),
   20-stabilization (2), broadcasts (2), ux-premium (1), 02-time-travel flaky (5),
   zz-capture-vercel (env-gate).

## Note on environment
This run hit the REMOTE prod Supabase (see SEC-01), which adds network flakiness on
top of the rot. Stabilization is cleaner once SEC-01 moves e2e to a local/dedicated DB.
