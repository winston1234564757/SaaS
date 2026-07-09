import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { attachConsoleGuard } from '../support/consoleGuard';

/**
 * Runtime-guard smoke — regression for the client-login crash
 * (realtime channel topic collision in useUnreadDMCount, fix commit d7971dad).
 *
 * The crash was invisible to every existing spec because:
 *   1. audit.* specs run under a fake storageState and assert only URL/visibility;
 *   2. no spec listened for pageerror / console.error.
 *
 * This spec navigates the real authenticated surfaces of each role at BOTH
 * desktop and mobile viewports (both MyBottomNav and MyDesktopSidebar mount
 * regardless of viewport — CSS only hides one), and fails on any runtime error.
 */

// Each test walks 3–5 authenticated routes × a 1.5s realtime-settle wait, under
// launchOptions.slowMo=120. That inherent ~12–25s cost brushes the default 30s timeout
// once several workers contend for CPU in a full parallel run (routes themselves load in
// <500ms — verified — so this is scheduling latency, not an app hang). Give the walk room.
test.describe.configure({ timeout: 90_000 });

const hasClientAuth = fs.existsSync('playwright/.auth/client.json');
const hasMasterAuth = fs.existsSync('playwright/.auth/master-auth.json');

const CLIENT_ROUTES = ['/my/bookings', '/my/loyalty', '/my/profile', '/my/masters', '/my/notifications'];
const MASTER_ROUTES = ['/dashboard', '/dashboard/clients', '/dashboard/bookings'];

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

async function walkRoutes(
  browser: import('@playwright/test').Browser,
  storageState: string,
  viewport: { width: number; height: number },
  routes: string[],
) {
  const context = await browser.newContext({ storageState, viewport });
  const page = await context.newPage();
  const guard = attachConsoleGuard(page);

  try {
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await guard.settle();
      guard.assertClean(`${route} @ ${viewport.width}x${viewport.height}`);
    }
  } finally {
    await context.close();
  }
}

test.describe('Runtime-guard — client portal', () => {
  test.skip(!hasClientAuth, 'playwright/.auth/client.json not found');

  test('client /my/* mounts clean on desktop', async ({ browser }) => {
    await walkRoutes(browser, 'playwright/.auth/client.json', DESKTOP, CLIENT_ROUTES);
  });

  test('client /my/* mounts clean on mobile', async ({ browser }) => {
    await walkRoutes(browser, 'playwright/.auth/client.json', MOBILE, CLIENT_ROUTES);
  });
});

test.describe('Runtime-guard — master dashboard', () => {
  test.skip(!hasMasterAuth, 'playwright/.auth/master-auth.json not found');

  test('master /dashboard/* mounts clean on desktop', async ({ browser }) => {
    await walkRoutes(browser, 'playwright/.auth/master-auth.json', DESKTOP, MASTER_ROUTES);
  });

  test('master /dashboard/* mounts clean on mobile', async ({ browser }) => {
    await walkRoutes(browser, 'playwright/.auth/master-auth.json', MOBILE, MASTER_ROUTES);
  });
});
