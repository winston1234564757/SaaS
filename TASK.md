DIRECTIVE: GLOBAL PLAYWRIGHT E2E & TIME-SERIES TEST SUITE
ROLE: Principal QA Automation Engineer & Enterprise SDET.
CONTEXT: We are doing the FINAL PROJECT CHECK for "BookIT" (B2B2C SaaS CRM for independent service providers). We need a global, bulletproof Playwright E2E testing infrastructure.

CRITICAL CHALLENGE: The application contains complex, time-dependent algorithms and data-heavy features. Examples:

"Smart Slots": Recommending booking times to clients based on their historical visit patterns.

Dynamic Pricing: Prices changing automatically "N hours before" a slot.

Loyalty Programs: Discounts applying automatically on the 2nd/3rd visit.
To test these, you cannot just click through a blank UI. You must simulate historical data mass and manipulate browser/system time.

DIRECTIVE & ACTION PLAN:

1. Infrastructure & Global Setup (playwright.config.ts):

Configure Playwright to run in the browser (Chromium, WebKit, Mobile Safari).

Implement Authentication State Caching (global.setup.ts). Do NOT login via UI in every test. Generate and save storageState (cookies/localStorage) for 3 static test profiles: TestMaster, TestClient, TestStudioAdmin.

2. The "Time Machine" & Data Seeder (CRITICAL):

Create a scripts/seed-e2e-data.ts utility that interacts directly with Supabase Admin client.

This script MUST generate massive historical data for TestMaster:

Create 50+ past bookings spanning the last 6 months for specific clients to trigger the "Smart Slots" algorithm.

Create future bookings to test schedule conflicts.

Setup loyalty rules and dynamic pricing rules in the DB.

In tests requiring time manipulation, utilize Playwright's page.clock API (page.clock.install(), page.clock.setFixedTime()) to trick the frontend into thinking it's exactly 2 hours before a booking to verify Dynamic Pricing triggers correctly.

3. Test Epics to Implement (Spec Files):

01-auth-guards.spec.ts: Verify unauthenticated redirects. Ensure Google OAuth users who skip the phone number step are hard-locked on /my/setup/phone.

02-time-travel-logic.spec.ts: - Mock time to 3 days ago, book an appointment. Mock time to today, check if Loyalty discount applies for the second booking.

Verify Dynamic Pricing: Fast-forward time to "2 hours before slot", assert the UI shows the discounted/surged price.

Verify Smart Slots: Authenticate as TestClient who has 5 morning bookings in history, assert the booking widget highlights morning slots as "Recommended".

03-referral-engine.spec.ts: Test the C2B Barter and B2B2C Cartel links. Ensure cookies/referral parameters are correctly captured across the public booking flow and stored in the DB after auth.

04-master-crm-smoke.spec.ts: Heavy data rendering. Navigate the Master Dashboard with 500 seeded clients and 1000 bookings. Assert pagination, infinite scroll, and analytics calculations (Revenue Forecast) load correctly and display accurate numbers.

4. Execution Standards:

Use Page Object Model (POM) for all major screens.

Avoid page.waitForTimeout(). Use precise locator assertions (await expect(locator).toBeVisible()).

Add a script in package.json: "test:e2e": "npx tsx scripts/seed-e2e-data.ts && playwright test".

EXECUTE: Start by providing the playwright.config.ts, the Data Seeder script structure, and the 02-time-travel-logic.spec.ts logic.
///Користуйся GRAPHIFY активно