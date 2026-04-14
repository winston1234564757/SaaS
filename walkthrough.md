# E2E Test Stabilization: Phase 5 (CI/CD Pipeline & Platform Stability)

In this phase, we integrated the fully-verified local E2E suite into a GitHub Actions CI/CD pipeline and applied platform-level tuning to prevent OOM failures and Turbopack crashes on constrained CI runners.

## Changes Made

### 1. GitHub Actions Workflow (`bookit/.github/workflows/e2e.yml`)
- Created a 16-step pipeline triggered on `push` and `pull_request` to `main`.
- Uses `supabase/setup-cli@v1` + `supabase start --ignore-health-check` to boot a **fully local Postgres/Auth/Storage stack** on every CI run — no remote Supabase, no stale state between PRs.
- Credentials (`ANON_KEY`, `SERVICE_ROLE_KEY`, `API_URL`) are exported via `supabase status --output env` and piped into `$GITHUB_ENV` — zero hardcoding.
- Writes `.env.test` (all `e2e_*@test.com` accounts) and `.env.local` (all `NEXT_PUBLIC_*` build vars) from local Supabase output + GitHub Secrets, replacing the production values that exist in the repo's `.env.local`.
- Runs `npx tsx scripts/seed-e2e-data.ts` to inject deterministic fixtures before the build.
- Runs `npm run build` (production Turbopack build, **never** `next dev`) with `NODE_OPTIONS: --max-old-space-size=4096` to prevent OOM on the 2-vCPU ubuntu-latest runner.
- Gates test execution behind `npx wait-on http://localhost:3000` — a proper HTTP readiness probe instead of a blind `sleep`.
- Runs `npx playwright test --project=chromium` (Chromium primary gate; WebKit/mobile are non-blocking per Fix Plan 05).
- On failure: uploads `playwright-report/` (HTML) and `test-results/` (trace + video) as artifacts with 14-day retention.
- Always runs `supabase stop` on cleanup.
- `concurrency:` group cancels superseded runs on the same branch — no wasted CI minutes.

### 2. `playwright.config.ts` — CI comments hardened
- Added explanatory comments to `retries`, `workers`, and `reuseExistingServer` clarifying exactly why each CI value differs from local:
  - `retries: 2` — guards against transient auth blips on fresh Supabase cold start.
  - `workers: 2` — matches ubuntu-latest vCPU count.
  - `reuseExistingServer: !process.env.CI` — CI always boots fresh; local devs reuse a running server.
- `webServer.command` remains `npm run start` with a comment explaining the Turbopack `bmi2` bypass rationale.

### 3. `next.config.ts` — OOM guard note
- Attempted to add webpack filesystem cache (prevents in-memory spike on GH Actions), but Next.js 16 Turbopack **rejects** any `webpack:` config key.
- Removed the block, added an explanatory comment pointing to `NODE_OPTIONS` in the workflow as the correct OOM solution.

### 4. `package.json` — `wait-on` installed
- Added `wait-on@^8` as a `devDependency` — used by the CI workflow to poll `http://localhost:3000` before Playwright begins.

## GitHub Secrets Required

Add these in **Settings → Secrets → Actions** on the repo before the first CI run:

| Secret | Source |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel deployment URL |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `.env.local` |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | `.env.local` |
| `VAPID_PRIVATE_KEY` | `.env.local` |
| `VAPID_SUBJECT` | `.env.local` |
| `CRON_SECRET` | `.env.local` |
| `RESEND_API_KEY` | `.env.local` |
| `TURBOSMS_TOKEN` | `.env.local` |
| `WAYFORPAY_MERCHANT_ACCOUNT` | `.env.local` |
| `WAYFORPAY_MERCHANT_SECRET` | `.env.local` |
| `TELEGRAM_BOT_TOKEN` | `.env.local` |

> **Note:** Supabase `ANON_KEY` and `SERVICE_ROLE_KEY` are **not** needed as secrets — the local Supabase CLI generates them at runtime inside the CI container.

## Local Build Verification (post-changes)

```bash
> npm run build

✓ Compiled successfully in 49s
Exit code: 0
```

Pipeline є чистою та готовою до першого `git push`.
