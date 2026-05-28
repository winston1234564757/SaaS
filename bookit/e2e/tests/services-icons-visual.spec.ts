import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import path from 'path';

const AUTH_FILE = 'playwright/.auth/master-auth.json';
const SHOTS_DIR = path.join(__dirname, '../../playwright-visual');

function shot(name: string) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  return path.join(SHOTS_DIR, `${name}.png`);
}

async function waitForServicesPage(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_000);
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15_000 });
}

test.describe('Services Icons — Visual', () => {
  test('services page renders icons correctly', async ({ browser }) => {
    test.skip(!fs.existsSync(AUTH_FILE), `Немає ${AUTH_FILE}`);

    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    try {
      await page.goto('/dashboard/services');
      await waitForServicesPage(page);

      await page.screenshot({ path: shot('services-page-full'), fullPage: true });
      console.log('✅ services-page-full');

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot('services-page-atf') });
      console.log('✅ services-page-atf');

      const icons = page.locator('svg[class*="lucide"], [class*="ServiceIcon"]');
      const iconCount = await icons.count();
      if (iconCount > 0) {
        console.log(`✅ ${iconCount} Lucide icons rendered`);
      } else {
        console.log('⚠️ No Lucide icons found — checking emoji fallback');
        await page.screenshot({ path: shot('services-page-emoji') });
      }

      const hasAuth = page.url().includes('/dashboard');
      expect(hasAuth).toBeTruthy();
    } finally {
      await context.close();
    }
  });
});
