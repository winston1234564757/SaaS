# Implementation Plan — Hydration & Animation Stability

This plan addresses the timeouts in CI by ensuring that tests wait for the client-side JavaScript to hydrate and for entrance animations to complete before interacting with the UI.

## User Review Required

> [!NOTE]
> I am adding a `mounted` state to the `PublicMasterPage` to provide an explicit synchronization point for E2E tests. This is a standard practice for stabilizing React apps in CI.

## Proposed Changes

### UI Instrumentation

#### [MODIFY] [PublicMasterPage.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/public/PublicMasterPage.tsx)
- Add a `mounted` state via `useEffect`.
- Add `data-hydrated={mounted}` to the main container div.
- This provides a deterministic way for Playwright to know when React has attached its event listeners.

---

### Page Object Refactoring

#### [MODIFY] [BookingWidgetPage.ts](file:///c:/Users/Vitossik/SaaS/bookit/e2e/pages/BookingWidgetPage.ts)
- **goto**: Wait for `[data-hydrated="true"]` to ensure the page is interactive.
- **openBookingFlow**: 
    - Wait for `book-button` to be visible.
    - Add a `waitForElementState('stable')` equivalent wait (handled by default in `click()`, but reinforced via `data-hydrated`).
- **selectDateByISO**: Ensure we wait for the hydration of the wizard sheet specifically if needed.

---

### Test Suite Clean-up

#### [MODIFY] [02-time-travel-logic.spec.ts](file:///c:/Users/Vitossik/SaaS/bookit/e2e/tests/02-time-travel-logic.spec.ts)
- No changes needed other than ensuring the `force: true` stays removed and we rely on the hardened POM.

## Verification Plan

### Automated Tests
- Run the localized E2E test to verify pass/fail:
  `npx playwright test e2e/tests/02-time-travel-logic.spec.ts`
- Target the failing test cases:
  `npx playwright test -g "Dynamic Pricing"`

### Manual Verification
- Monitor the CI logs for `[Browser]` entries to confirm the page reaches the "hydrated" state before the first click.
