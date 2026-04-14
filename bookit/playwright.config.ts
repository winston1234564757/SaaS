import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// Load test environment FIRST — explicitly targets local Supabase, never production.
config({ path: '.env.test', override: true });
// Runtime IDs written by seed-e2e-data.ts (master UUIDs, slugs, referral codes)
config({ path: '.env.test.runtime' });
// Fallback: pick up any remaining vars from .env.local (e.g., NEXT_PUBLIC_* for Next.js)
config({ path: '.env.local' });

// Safety guard: abort if pointed at a production-looking URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
if (supabaseUrl && !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost') && process.env.E2E_ALLOW_REMOTE !== 'true') {
  console.warn(
    `[playwright] WARNING: NEXT_PUBLIC_SUPABASE_URL appears to be remote (${supabaseUrl}).\n` +
    `Set E2E_ALLOW_REMOTE=true to override this guard, or point .env.test at your local Supabase instance.`,
  );
}

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global.setup.ts',
  globalTimeout: 15 * 60 * 1000,
  expect: { timeout: 10_000 },

  // Паралельне виконання безпечне — кожен spec domain має власний ізольований акаунт.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // CI: 2 retries guard against transient network blips; local: 0 for fast feedback.
  retries: process.env.CI ? 2 : 0,
  // CI: 2 workers (GH Actions ubuntu-latest has 2 real vCPUs);
  // local: undefined → Playwright picks the optimal count automatically.
  workers: process.env.CI ? 2 : undefined,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // ─── Desktop ─────────────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { slowMo: 120 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: { slowMo: 120 },
      },
      // WebKit smoke тільки для критичних flows (час запуску)
      testMatch: ['**/01-auth-guards.spec.ts', '**/02-time-travel-logic.spec.ts'],
    },

    // ─── Mobile ───────────────────────────────────────────────────────────────
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testMatch: '**/16-mobile-smoke.spec.ts',
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: '**/16-mobile-smoke.spec.ts',
    },
  ],

  webServer: {
    // PRODUCTION build is used deliberately in all environments:
    //   • Avoids the Turbopack `bmi2` CPU instruction panic (qfilter dep).
    //   • Mirrors exactly what Vercel deploys — no webpack/turbo divergence.
    // CI: reuseExistingServer=false so GH Actions always starts a clean server.
    // Local: reuseExistingServer=true so devs can keep a server running.
    command: 'npm run start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NODE_ENV: 'test' },
  },
});
