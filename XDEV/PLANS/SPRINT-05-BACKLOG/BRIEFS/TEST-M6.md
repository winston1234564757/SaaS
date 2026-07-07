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

## Note on environment
This run hit the REMOTE prod Supabase (see SEC-01), which adds network flakiness on
top of the rot. Stabilization is cleaner once SEC-01 moves e2e to a local/dedicated DB.
