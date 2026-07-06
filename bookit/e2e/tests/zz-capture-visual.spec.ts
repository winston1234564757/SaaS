import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// The artifacts directory where we want to save the screenshots
const artifactsDir = 'C:\\Users\\Vitos\\.gemini\\antigravity-ide\\brain\\9fbddcd5-f58f-4db2-85b5-308c51dea4b0';

test('capture analytics screenshots', async ({ browser }) => {
  // Use the audit master state to have maximum data coverage
  const authPath = 'playwright/.auth/master-audit.json';
  const crmAuthPath = 'playwright/.auth/master-crm.json';
  
  const statePath = fs.existsSync(authPath) ? authPath : (fs.existsSync(crmAuthPath) ? crmAuthPath : null);
  
  if (!statePath) {
    console.error('No auth state found. You need to run e2e global setup or seed script.');
    return;
  }

  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();
  
  // Set a large viewport to see everything without mobile wrapping
  await page.setViewportSize({ width: 1440, height: 1080 });

  await page.goto('/dashboard/analytics');
  
  // Wait for the stats to load
  await expect(page.getByTestId('stats-ready').or(page.locator('h1'))).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000); // Give charts time to render

  // Force to "All Time" (Весь час) to ensure we see the seeded bookings
  const allTimeBtn = page.getByText('Весь час', { exact: true });
  if (await allTimeBtn.isVisible()) {
    await allTimeBtn.click();
    await page.waitForTimeout(2000);
  }

  // 1. Capture Main View
  await page.screenshot({ path: path.join(artifactsDir, 'analytics-main.png'), fullPage: true });

  // 2. Capture Tabs
  const tabsToClick = [
    'Відвідуваність',
    'Фінанси',
    'Знижки / Акції', // Note: Need to match exact text or partial
    'Джерела',
    'Послуги',
    'Відпустки',
    'Відгуки'
  ];

  const allTabs = await page.getByRole('tab').all();
  for (const tab of allTabs) {
    const tabName = await tab.textContent();
    if (!tabName) continue;
    
    await tab.click();
    await page.waitForTimeout(1000); // Wait for tab animations/data
    
    // Clean filename
    const safeName = tabName.replace(/[^a-z0-9а-яіїєґ]/gi, '_').toLowerCase();
    await page.screenshot({ path: path.join(artifactsDir, `analytics-tab-${safeName}.png`), fullPage: true });
  }

  await context.close();
});
