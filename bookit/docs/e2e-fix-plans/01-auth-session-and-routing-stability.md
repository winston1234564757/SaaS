# E2E Fix Report #1 (Highest Impact): Auth Session & Routing Stability

## Why this is priority #1

This cluster blocks the entire suite because most business scenarios start from authenticated routes.  
When auth bootstrap is unstable, tests fail as false negatives before feature logic is even reached.

## Scope and observed failures

The run ended with 85 failed tests. A large share is connected to session/routing mismatches:

- Auth guard failures in `e2e/tests/01-auth-guards.spec.ts` (including complete WebKit failures).
- Login and role routing failures in `e2e/tests/auth.spec.ts`.
- Redirect-to-login side effects in `e2e/tests/booking-flow.spec.ts`, `e2e/tests/master-crud.spec.ts`, and mobile specs.
- Mobile failures that land on unexpected URLs (`/login`, `/my/setup/phone`) instead of expected protected routes.

## Core problem statement

There is no single, deterministic auth contract between:

1. Seeded users/profiles and required onboarding flags.
2. Persisted Playwright `storageState` sessions.
3. Guard middleware behavior by role and platform project.

As a result, many tests validate route destination but the app is in a different auth state than expected.

## Technical hypotheses to validate first

1. Storage states generated in `global.setup.ts` are stale or inconsistent with runtime-seeded identities.
2. Some seeded accounts are not fully onboarding-complete (phone/profile gate), causing redirects to setup flows.
3. Guard logic differs by project/browser due to cookie/storage differences (especially WebKit).
4. Session cookies or auth tokens are invalidated during long suite execution.

## Fix plan

### A. Make auth bootstrap deterministic

1. Rebuild `global.setup.ts` to:
   - verify each seeded user can open expected landing route immediately after state capture;
   - fail fast if redirected to onboarding/login.
2. Store per-role health assertions during setup:
   - `master` -> `/dashboard`
   - `client` -> `/my/bookings`
   - `studio-admin` -> expected admin route
3. Regenerate `playwright/.auth/*.json` only after validation passes.

### B. Align seed and guard prerequisites

1. Extend seed script to enforce required onboarding fields for test users.
2. Add explicit DB assertions after seed (phone verified/profile complete/role mapping exists).
3. Add one "auth contract" smoke test that checks all role routing before full suite.

### C. Harden guard-related tests

1. Replace brittle URL-only checks with two-step assertions:
   - final URL;
   - stable page marker (h1, role-specific widget).
2. For redirect tests, normalize wait conditions (`waitForURL`, then marker assertion).

### D. WebKit-specific stabilization

1. Run reduced auth guard subset in WebKit only until deterministic pass is achieved.
2. Compare cookie/storage behavior per project and patch test helper if needed.

## Expected impact after this fix group

- Unblocks a major fraction of downstream failures that are currently auth side effects.
- Converts many false negatives into either pass or feature-specific failures.
- Provides a stable base for fixes #2-#5.

## Success criteria

1. Auth contract smoke passes on all configured projects.
2. `01-auth-guards.spec.ts` and `auth.spec.ts` are green on Chromium first, then WebKit.
3. No unexpected redirects to `/login` or `/my/setup/phone` in unrelated suites.
