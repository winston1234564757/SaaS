# Implementation Plan — Fix E2E Timeouts (No Anti-Patterns)

This plan addresses persistent E2E failures in CI by replacing flaky "networkidle" and "timeout" logic with deterministic Playwright assertions. We will instrument the UI with test IDs and refactor the POM/Spec to use explicit state-based waits.

## User Review Required

> [!IMPORTANT]
> This refactor introduces new `data-testid` attributes to the `DateTimePicker` component. While safe, it modifies the production component specifically to support robust testing in CI.

## Proposed Changes

### Component Instrumentation

#### [MODIFY] [DateTimePicker.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/shared/wizard/DateTimePicker.tsx)
- Add `data-testid="schedule-loader"` to the spinner shown during schedule loading.
- Add `data-testid="slots-grid"` to the container rendering the time slots.

---

### Page Object Refactoring

#### [MODIFY] [BookingWidgetPage.ts](file:///c:/Users/Vitossik/SaaS/bookit/e2e/pages/BookingWidgetPage.ts)
- **goto**: Wait for `this.masterName` to be visible instead of `networkidle`.
- **openBookingFlow**: Wait for `this.bookingSheet` to be visible instead of `networkidle`.
- **selectDateByISO**:
    - Wait for `[data-testid="schedule-loader"]` to be hidden before interacting with the date strip.
    - Remove `force: true` from the click.
    - Remove `networkidle`.
    - Wait for `[data-testid="slots-grid"]` to be visible after clicking.

---

### Test Suite Stabilization

#### [MODIFY] [02-time-travel-logic.spec.ts](file:///c:/Users/Vitossik/SaaS/bookit/e2e/tests/02-time-travel-logic.spec.ts)
- Remove all instances of `page.waitForLoadState('networkidle')`.
- In **Smart Slots** test: Replace `page.waitForTimeout(1_500)` with a wait for a slot inside the morning window to be visible.
- Remove `force: true` from all `.click()` calls.
- In **Loyalty Program** test: Wait for specific dashboard elements instead of `networkidle`.

## Verification Plan

### Automated Tests
- Run the localized E2E test to verify pass/fail:
  `npx playwright test e2e/tests/02-time-travel-logic.spec.ts`
- Target a specific test that is currently failing in CI (e.g., Dynamic Pricing):
  `npx playwright test -g "Peak hours"`

### Manual Verification
- Check CI logs in GitHub Actions to ensure the new `[Browser]` logs confirm loader transitions (Loader Hidden -> Slots Visible).
