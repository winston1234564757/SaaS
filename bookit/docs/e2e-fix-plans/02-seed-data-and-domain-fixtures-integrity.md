# E2E Fix Report #2: Seed Data & Domain Fixtures Integrity

## Why this is priority #2

Several failures indicate the UI cannot find expected domain objects immediately after seed.  
When fixtures are inconsistent, business tests become non-deterministic and flaky.

## Scope and observed failures

Most visible in:

- `e2e/tests/02-time-travel-logic.spec.ts`
- `e2e/tests/03-referral-engine.spec.ts`
- `e2e/tests/04-crm-logic.spec.ts`
- `e2e/tests/06-referrals.spec.ts`
- `e2e/tests/07-notifications.spec.ts`

One explicit runtime signal from logs:

- `Could not find master with slug "e2e-master-test": Cannot coerce the result to a single JSON object`

## Core problem statement

Test fixtures are present, but domain keys (slug/code/ownership/state transitions) do not always match what tests query.  
This mismatch breaks referral, CRM, dynamic pricing, loyalty, and notification scenarios.

## Root-cause candidates

1. Seed data uses generated values (slug/ref code/IDs) while tests expect fixed aliases.
2. Cleanup wipes records needed by later suites when run in one pipeline.
3. Foreign-key relations are complete at DB level but not discoverable by UI queries used in tests.
4. Post-seed derived data (analytics aggregates, relation tables) is not materialized before assertions begin.

## Fix plan

### A. Enforce canonical fixture contract

1. Define one fixture manifest file with strict constants:
   - master slugs
   - referral codes
   - expected service/product names
   - expected loyalty and pricing presets
2. Seed script must write exactly those values and fail if conflict exists.

### B. Add post-seed verification layer

1. After seed, run DB checks for each scenario:
   - referral linkability (`master` + `referral_code`);
   - CRM status transition preconditions;
   - notification-triggerable bookings;
   - dynamic pricing and loyalty prerequisites.
2. Stop test run if verification fails (prevent noisy false negatives).

### C. Isolate destructive cleanup

1. Ensure cleanup targets only entities created by current seed run.
2. Guard cleanup by scoped IDs/tags to avoid deleting fixture roots.

### D. Propagate runtime IDs consistently

1. Keep `.env.test.runtime` as single source for generated IDs.
2. Update test helpers to read runtime values from one utility module only.

## Expected impact after this fix group

- Stabilizes core domain tests where current failures are mostly fixture mismatch.
- Reduces noisy failures in referral/CRM/notifications/dynamic-pricing flows.
- Makes reruns reproducible across machines and CI agents.

## Success criteria

1. Seed verification stage is green and deterministic.
2. Referral and CRM logic tests fail only on real product bugs, not missing fixture entities.
3. No "cannot find master by slug/code" errors in run logs.
