# E2E Fix Report #4: Feature Gates, Analytics & Plan-Aware Assertions

## Why this is priority #4

Multiple failures are tied to plan-dependent UX and derived metrics pages.  
Tests currently assume one product tier behavior while seed/user state may expose another.

## Scope and observed failures

Most evident in:

- `e2e/tests/04-master-crm-smoke.spec.ts` (analytics sections)
- `e2e/tests/05-loyalty-reviews.spec.ts`
- `e2e/tests/12-flash-deals.spec.ts`
- `e2e/tests/13-dynamic-pricing.spec.ts`
- `e2e/tests/15-analytics.spec.ts`

## Core problem statement

The suite mixes two different validation models:

1. strict "feature must exist" checks;
2. "feature gate OR feature UI is acceptable" checks.

Without a consistent plan contract per seeded user, this creates contradictory expectations.

## Root-cause candidates

1. Seeded subscription tiers drift from what tests assume.
2. Feature flags are not pinned for E2E environment.
3. Analytics widgets rely on asynchronous aggregates not ready at assertion time.
4. Some tests are not plan-aware but run against mixed-tier identities.

## Fix plan

### A. Lock plan/feature matrix for E2E users

1. Define explicit tier for each test account (Starter/Pro/Trial).
2. Freeze feature flags in `.env.test` for deterministic E2E behavior.
3. Log resolved tier/features at test setup for diagnostics.

### B. Split assertions by plan mode

1. For gated pages, assert one of:
   - gate visible (expected on Starter), or
   - full feature UI visible (expected on Pro).
2. Avoid asserting both in the same path unless intentionally testing transitions.

### C. Stabilize analytics readiness

1. Introduce wait helper for analytics data-ready signal.
2. Seed minimal deterministic revenue/bookings set per analytics scenario.
3. Add timeout diagnostics indicating whether data absent vs UI broken.

### D. Rationalize flaky feature tests

1. Tag high-variance analytics tests separately (e.g., `@analytics-heavy`).
2. Keep a slim deterministic smoke path in main CI lane.

## Expected impact after this fix group

- Eliminates contradictory outcomes on gated pages.
- Stabilizes analytics and tier-sensitive tests.
- Improves trust in failures (real regressions vs tier mismatch).

## Success criteria

1. Tier-aware suites produce same result across reruns.
2. Analytics tests fail only with clear data or rendering defects.
3. No ambiguous "gate vs feature UI" assertions remain.
