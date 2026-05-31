/**
 * playwright.audit.config.ts — BookIT Global Impeccable Audit
 *
 * 3 sequential Playwright projects: blossom → studio → frost
 * Each project runs all 19 audit specs with the matching theme set in DB.
 *
 * Run:
 *   npx playwright test --config=playwright.audit.config.ts
 *   npx playwright test --config=playwright.audit.config.ts --project=audit-blossom
 *   npx playwright test --config=playwright.audit.config.ts e2e/audit/audit.03-dashboard.spec.ts
 */

import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.test', override: true });
config({ path: '.env.test.runtime' });
config({ path: '.env.local' });

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  // Audit specs are in e2e/audit/ — separate from regression tests
  testDir: './e2e/audit',
  globalSetup: './e2e/audit/setup/audit.global.setup.ts',

  // Sequential by design — themes must not run in parallel (DB state mutation)
  fullyParallel: false,
  workers: 1,

  // Generous timeouts for full-page audits with screenshots
  globalTimeout: 180 * 60 * 1000, // 3 hours total
  timeout: 90_000,               // 90s per test
  expect: { timeout: 15_000 },

  forbidOnly: !!process.env.CI,
  retries: 0, // Audit = zero tolerance for flakiness; fix the bug, not the test

  reporter: [
    ['html', { open: 'never', outputFolder: 'audit-report' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    timezoneId: 'Europe/Kyiv',
    // Always capture traces and screenshots for the audit report
    trace: 'off',
    screenshot: 'on',
    video: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    // Headless Chromium as agreed
    ...devices['Desktop Chrome'],
  },

  projects: [
    // ─── Phase 0: Auth Setup ──────────────────────────────────────────────────
    {
      name: 'audit-setup',
      testMatch: '**/audit.global.setup.ts',
    },

    // ─── Phase 1: Blossom (Warm Taupe) ───────────────────────────────────────
    {
      name: 'audit-blossom',
      testDir: './e2e/audit',
      dependencies: ['audit-setup'],
      use: {
        storageState: 'playwright/.auth/master-audit.json',
      },
    },

    // ─── Phase 2: Studio (Dark Teal) — after blossom ─────────────────────────
    {
      name: 'audit-studio',
      testDir: './e2e/audit',
      dependencies: ['audit-setup'],
      use: {
        storageState: 'playwright/.auth/master-audit.json',
      },
    },

    // ─── Phase 3: Frost (Ice Lavender) — after studio ────────────────────────
    {
      name: 'audit-frost',
      testDir: './e2e/audit',
      dependencies: ['audit-setup'],
      use: {
        storageState: 'playwright/.auth/master-audit.json',
      },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NODE_ENV: 'test' },
  },
});
