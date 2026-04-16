Workflow file for this run
.github/workflows/e2e.yml at cd696d9
name: E2E Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

# Cancel in-flight runs on the same branch to avoid spending CI minutes
# on superseded commits.
concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    name: Playwright E2E (Chromium · Ubuntu)
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      NEXT_TELEMETRY_DISABLED: 1

    defaults:
      run:
        working-directory: bookit

    # ── Supabase local stack ──────────────────────────────────────────────────
    # Services block intentionally empty — Supabase is started via CLI below.
    # We use the official supabase/setup-cli action to get a pinned binary.

    steps:
      # ── 1. Checkout ──────────────────────────────────────────────────────────
      - name: Checkout repository
        uses: actions/checkout@v4

      # ── 2. Setup Node 20 + npm cache ─────────────────────────────────────────
      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: bookit/package-lock.json

      # ── 3. Install Supabase CLI ───────────────────────────────────────────────
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      # ── 4. Start local Supabase ───────────────────────────────────────────────
      # supabase start boots Postgres + Auth + Storage + REST API locally.
      # --ignore-health-check skips Studio health check (not needed in CI).
      - name: Start Supabase local stack
        run: supabase start --ignore-health-check
        timeout-minutes: 5

      - name: Wait for Supabase health
        run: |
          for i in {1..30}; do
            if supabase status --output env | grep -qi 'API_URL'; then
              echo "Supabase is healthy!"
              exit 0
            fi
            echo "Waiting for Supabase components to be healthy... ($i/30)"
            sleep 5
          done
          echo "Supabase health check timed out"
          supabase status
          exit 1
      # ── 5. Setup Environment (Supabase + Next.js + E2E) ──────────────────────
      # We consolidate all environment injection into a single step to prevent
      # accidental file overwrites and ensure consistent variable naming.
      - name: Inject Environment Variables
        run: |
          # 1. Capture local Supabase credentials from the running stack
          STATUS_ENV=$(supabase status --output env)
          # Defensive: strip optional quotes from the status output
          LOCAL_URL=$(echo "$STATUS_ENV" | grep API_URL | cut -d'=' -f2 | sed 's/"//g')
          LOCAL_ANON=$(echo "$STATUS_ENV" | grep ANON_KEY | cut -d'=' -f2 | sed 's/"//g')
          LOCAL_SERVICE=$(echo "$STATUS_ENV" | grep SERVICE_ROLE_KEY | cut -d'=' -f2 | sed 's/"//g')
          # 2. Build .env.local (Used by Next.js build & runtime)
          # Note: CWD is 'bookit' (from defaults.run)
          # CRITICAL: NEXT_PUBLIC_SITE_URL must be localhost in CI to avoid 
          # absolute links pointing to production during E2E.
          cat <<EOF > .env.local
          NEXT_PUBLIC_SUPABASE_URL=${LOCAL_URL}
          NEXT_PUBLIC_SUPABASE_ANON_KEY=${LOCAL_ANON}
          SUPABASE_SERVICE_ROLE_KEY=${LOCAL_SERVICE}
          NEXT_PUBLIC_APP_URL=http://localhost:3000
          NEXT_PUBLIC_SITE_URL=http://localhost:3000
          NEXT_PUBLIC_VAPID_PUBLIC_KEY=${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}
          NEXT_PUBLIC_TELEGRAM_BOT_NAME=${{ secrets.NEXT_PUBLIC_TELEGRAM_BOT_NAME }}
          VAPID_PRIVATE_KEY=${{ secrets.VAPID_PRIVATE_KEY }}
          VAPID_SUBJECT=${{ secrets.VAPID_SUBJECT }}
          CRON_SECRET=${{ secrets.CRON_SECRET }}
          RESEND_API_KEY=${{ secrets.RESEND_API_KEY }}
          TURBOSMS_TOKEN=${{ secrets.TURBOSMS_TOKEN }}
          WAYFORPAY_MERCHANT_ACCOUNT=${{ secrets.WAYFORPAY_MERCHANT_ACCOUNT }}
          WAYFORPAY_MERCHANT_SECRET=${{ secrets.WAYFORPAY_MERCHANT_SECRET }}
          TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}
          TZ=Europe/Kyiv
          NEXT_PUBLIC_DEBUG_NOW=2026-05-01T11:00:00Z
          EOF
          # 3. Build .env.production (Used by Next.js production server)
          cat <<EOF > .env.production
          NEXT_PUBLIC_DEBUG_NOW=2026-05-01T11:00:00Z
          TZ=Europe/Kyiv
          EOF
          # 3. Build .env.test (Used by E2E seeder & Playwright runner)
          cat <<EOF > .env.test
          NEXT_PUBLIC_SUPABASE_URL=${LOCAL_URL}
          NEXT_PUBLIC_SUPABASE_ANON_KEY=${LOCAL_ANON}
          SUPABASE_SERVICE_ROLE_KEY=${LOCAL_SERVICE}
          E2E_BASE_URL=http://localhost:3000
          E2E_ALLOW_REMOTE=true
          E2E_SEED_FIXED_DATE=2026-05-01T11:00:00.000Z
          E2E_MASTER_SLUG=e2e-timetravel-master
          E2E_MASTER_TIMETRAVEL_EMAIL=e2e_master_timetravel@test.com
          E2E_MASTER_CRM_EMAIL=e2e_master_crm@test.com
          E2E_MASTER_AUTH_EMAIL=e2e_master_auth@test.com
          E2E_MASTER_REFERRAL_EMAIL=e2e_master_referral@test.com
          E2E_CLIENT_EMAIL=e2e_client_timetravel@test.com
          E2E_CLIENT_TIMETRAVEL_EMAIL=e2e_client_timetravel@test.com
          E2E_CLIENT_CRM_EMAIL=e2e_client_crm@test.com
          E2E_CLIENT_AUTH_EMAIL=e2e_client_auth@test.com
          E2E_CLIENT_REFERRAL_EMAIL=e2e_client_referral@test.com
          E2E_STUDIO_ADMIN_EMAIL=e2e_studioadmin@test.com
          NEXT_PUBLIC_DEBUG_NOW=2026-05-01T11:00:00Z
          TZ=Europe/Kyiv
          EOF
          # 4. Sync credentials to GITHUB_ENV for convenience (logging/debugging)
          echo "SUPABASE_URL=${LOCAL_URL}" >> $GITHUB_ENV
          echo "SUPABASE_ANON_KEY=${LOCAL_ANON}" >> $GITHUB_ENV
          echo "SUPABASE_SERVICE_ROLE_KEY=${LOCAL_SERVICE}" >> $GITHUB_ENV
          echo "TZ=Europe/Kyiv" >> $GITHUB_ENV
      # ── 8. Install npm dependencies ──────────────────────────────────────────
      - name: Install npm dependencies
        run: npm ci

      # ── 9. Install Playwright browsers (Chromium only in CI) ─────────────────
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      # ── 10. Seed E2E data ────────────────────────────────────────────────────
      # Creates isolated e2e_*@test.com accounts and deterministic fixtures.
      - name: Seed E2E database
        run: npx tsx scripts/seed-e2e-data.ts

      # ── 11. Cache Next.js build ──────────────────────────────────────────────
      - name: Cache Next.js build
        uses: actions/cache@v4
        with:
          path: bookit/.next/cache
          key: ${{ runner.os }}-nextjs-v2-${{ hashFiles('bookit/package-lock.json') }}-${{ hashFiles('bookit/src/**', 'bookit/app/**') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('bookit/package-lock.json') }}-
      # ── 12. Build Next.js production bundle ──────────────────────────────────
      # We NEVER use `next dev --turbo` in CI to avoid the bmi2 instruction
      # crash (qfilter dependency). The production build is stable everywhere.
      - name: Build Next.js (production)
        run: npm run build
        env:
          # Prevent OOM on constrained GH runners (default heap ~400MB)
          NODE_OPTIONS: --max-old-space-size=4096
          NEXT_PUBLIC_DEBUG_NOW: 2026-05-01T11:00:00Z

      # ── 12. Run Next.js production server in background ──────────────────────
      # Note: NEXT_PUBLIC_DEBUG_NOW is already baked in and loaded from .env.local
      - name: Start Next.js production server
        run: |
          npm run start > next-server.log 2>&1 &
        env:
          PORT: 3000
          NEXT_PUBLIC_DEBUG_NOW: 2026-05-01T11:00:00Z
          TZ: Europe/Kyiv

      # ── 13. Wait for server to be ready ──────────────────────────────────────
      - name: Wait for app to be ready
        run: npx wait-on http-get://127.0.0.1:3000 --timeout 120000

      - name: Output server logs on boot failure
        if: failure()
        run: cat next-server.log

      # ── 14. Run Playwright E2E tests ─────────────────────────────────────────
      - name: Run Playwright tests
        run: npx playwright test --project=chromium
        timeout-minutes: 15
        env:
          CI: true
          # Ensures playwright.config.ts uses CI-tuned retries/workers
          PLAYWRIGHT_HTML_REPORT: playwright-report

      - name: Output server logs on test failure
        if: failure()
        run: cat next-server.log

      # ── 15. Upload artifacts on failure ──────────────────────────────────────
      - name: Upload Playwright HTML report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ github.run_id }}
          path: bookit/playwright-report/
          retention-days: 14

      - name: Upload Playwright test results (traces + videos)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ github.run_id }}
          path: bookit/test-results/
          retention-days: 14

      - name: Upload Next.js server logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: next-server-logs-${{ github.run_id }}
          path: bookit/next-server.log
          retention-days: 14

      # ── 16. Stop Supabase (cleanup) ───────────────────────────────────────────
      - name: Stop Supabase
        if: always()
        run: supabase stop --no-backup || true


        ОТУТ ВПАЛО ВСЕ

         5 failed
    [chromium] › e2e/tests/02-time-travel-logic.spec.ts:55:7 › Dynamic Pricing — Peak hours › peak hours badge (+20%) shown for Fri/Sat evening slot 
    [chromium] › e2e/tests/02-time-travel-logic.spec.ts:112:7 › Dynamic Pricing — Peak hours › no dynamic pricing badge for off-peak slot 
    [chromium] › e2e/tests/02-time-travel-logic.spec.ts:168:7 › Dynamic Pricing — Last Minute › last_minute badge (−15%) shown for slot < 3h away 
    [chromium] › e2e/tests/02-time-travel-logic.spec.ts:232:7 › Smart Slots — Morning recommendation › morning slots show Рекомендовано badge for returning client 
    [chromium] › e2e/tests/02-time-travel-logic.spec.ts:298:7 › Loyalty Discount › loyalty discount banner visible for eligible client 
  36 skipped
  77 passed (4.8m)
Error: Process completed with exit code 1.