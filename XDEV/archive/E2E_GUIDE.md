# E2E Testing Guide (Playwright + Supabase)

This guide explains how the E2E testing pipeline works, how to run it locally, and how to maintain it in GitHub Actions.

## GitHub Actions setup

The E2E pipeline automatically runs on every push and pull request. To ensure it passes, you MUST configure the following Repository Secrets in GitHub (`Settings -> Secrets and variables -> Actions`):

### Required Secrets

- `NEXT_PUBLIC_SITE_URL`: The production/staging URL (used for absolute links).
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: For Web Push notifications.
- `VAPID_PRIVATE_KEY`: For Web Push notifications.
- `VAPID_SUBJECT`: Usually a `mailto:email@example.com`.
- `NEXT_PUBLIC_TELEGRAM_BOT_NAME`: Your Telegram bot name.
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token.
- `RESEND_API_KEY`: For sending emails.
- `CRON_SECRET`: To authorize cron jobs.
- `TURBOSMS_TOKEN`: For SMS notifications.
- `WAYFORPAY_MERCHANT_ACCOUNT`: Merchant ID for payments.
- `WAYFORPAY_MERCHANT_SECRET`: Secret key for payments.

## Local Development

To run E2E tests on your machine:

1.  **Start Supabase**: `supabase start`
2.  **Seed Data**: `npm run test:e2e:seed` (inside the `bookit` directory)
3.  **Run Dev Server**: `npm run dev` (in a separate terminal)
4.  **Run Tests**:
    -   Headless: `npx playwright test`
    -   Interactive UI: `npx playwright test --ui`

## Pipeline Architecture

1.  **Supabase CLI**: Starts a local Docker-based Supabase stack.
2.  **Data Seeding**: The `scripts/seed-e2e-data.ts` script wipes existing `e2e_*@test.com` accounts and recreates deterministic test data.
3.  **Production Build**: We build the app using `npm run build` in CI to ensure the environment matches production.
4.  **Wait-On**: We use `wait-on` to ensure the server is fully ready before starting tests.
5.  **Artifacts**: If tests fail, checkout the **Test Results** (videos/traces) and **Next.js Server Logs** in the "Artifacts" section of the GitHub run.

## Troubleshooting

-   **Test Deadlock**: If the pipeline hangs, the 15-minute global timeout will trigger. Check the `next-server.log` artifact to see if the Next.js server crashed during boot.
-   **Database Out of Sync**: If tests fail due to schema mismatches, run `supabase db reset` locally and ensure any migrations are committed to the repository.
-   **Flaky Tests**: Use Playwright traces (found in artifacts) to see exactly what happened in the browser during failure.
