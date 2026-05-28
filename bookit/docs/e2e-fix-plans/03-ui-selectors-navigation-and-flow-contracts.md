# E2E Fix Report #3: UI Selectors, Navigation & Flow Contracts

## Why this is priority #3

A significant set of failures come from UI assertion fragility rather than backend errors.  
When selectors and route transition checks are unstable, valid flows appear broken.

## Scope and observed failures

Affected suites include:

- `e2e/tests/08-booking-complete.spec.ts`
- `e2e/tests/09-master-settings.spec.ts`
- `e2e/tests/10-master-bookings.spec.ts`
- `e2e/tests/11-master-clients.spec.ts`
- `e2e/tests/12-flash-deals.spec.ts`
- `e2e/tests/13-dynamic-pricing.spec.ts`
- `e2e/tests/14-client-journey.spec.ts`
- `e2e/tests/15-analytics.spec.ts`
- `e2e/tests/master-crud.spec.ts`

## Core problem statement

Tests are coupled to UI details that are not stable enough across role state, page load timing, and responsive variants:

1. selectors are too generic or text-fragile;
2. route assertions happen before actual navigation settles;
3. tests expect elements that are feature-tier or state dependent without pre-checks.

## Root-cause candidates

1. Missing dedicated `data-testid` markers for key journey controls.
2. Assertions rely on localized text that changes with UX updates.
3. UI flow waits for element visibility but not data readiness.
4. Shared page objects are incomplete, causing duplicated brittle selectors.

## Fix plan

### A. Introduce a stable selector strategy

1. Add `data-testid` to critical controls in booking/settings/crud/analytics flows.
2. Refactor tests to prioritize testid selectors over text selectors.
3. Keep fallback text selectors only for user-facing assertions.

### B. Normalize navigation waits

1. Standardize helper wrappers:
   - `navigateAndAssertUrl`
   - `waitForPageReadyMarker`
2. For multi-step forms, assert each step marker before interacting.

### C. Strengthen page objects

1. Expand page object coverage for booking widget, master dashboard, and client area.
2. Centralize selectors to avoid per-test drift.

### D. Add precondition checks in scenario tests

1. Detect feature gate/empty state upfront and branch assertions appropriately.
2. Fail with explicit diagnostics when prerequisite is missing.

## Expected impact after this fix group

- Significant reduction of false negatives in long UI journeys.
- Better resilience to minor UI copy/layout updates.
- Faster triage because failures point to real broken behavior instead of selector drift.

## Success criteria

1. Booking flow and CRUD tests pass reliably on repeated local runs.
2. Same tests do not alternate pass/fail between sequential runs.
3. At least 80% of critical flow assertions use stable `data-testid` contracts.
