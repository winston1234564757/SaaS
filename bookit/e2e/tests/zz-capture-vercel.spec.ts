import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const artifactsDir = 'C:\\Users\\Vitos\\.gemini\\antigravity-ide\\brain\\9fbddcd5-f58f-4db2-85b5-308c51dea4b0';

test('Capture Analytics on Vercel', async ({ page }) => {
  // Env-gated capture utility (hits remote Vercel + writes to a local artifacts dir).
  // Not a local/CI assertion — skip unless explicitly enabled.
  test.skip(!process.env.CAPTURE_VERCEL, 'Vercel capture — set CAPTURE_VERCEL=1 to run');
  test.setTimeout(120000); // 2 minutes

  console.log('Navigating to Vercel deployment...');
  await page.goto('https://bookit-five-psi.vercel.app/login', { waitUntil: 'networkidle' });

  console.log('Filling login credentials...');
  // Type email
  await page.getByPlaceholder('Email').fill('e2e_master_audit@test.com');
  
  // Type password
  await page.getByPlaceholder('••••••••').fill('E2E_Bookit_Test_2026!');

  // Click login
  await page.getByRole('button', { name: 'Увійти' }).click();

  console.log('Waiting for dashboard to load...');
  // Wait for dashboard or analytics page navigation
  await page.waitForURL('**/dashboard**');
  
  console.log('Navigating to Analytics...');
  await page.goto('https://bookit-five-psi.vercel.app/dashboard/analytics', { waitUntil: 'networkidle' });
  
  // Wait for the main analytics page to render its content
  await page.waitForTimeout(3000); 

  console.log('Taking screenshot of the main Analytics page...');
  await page.screenshot({ path: path.join(artifactsDir, 'vercel-analytics-main.png'), fullPage: true });

  const tabsToClick = [
    'Відвідуваність',
    'Фінанси',
    'Знижки / Акції', 
    'Джерела',
    'Послуги',
    'Відпустки',
    'Відгуки'
  ];

  const allTabs = await page.getByRole('tab').all();
  console.log(`Found ${allTabs.length} tabs`);

  for (const tab of allTabs) {
    const tabName = await tab.textContent();
    if (tabName && tabsToClick.includes(tabName.trim())) {
      console.log(`Clicking on tab: ${tabName.trim()}`);
      await tab.click();
      
      // Wait for the tab data to load
      await page.waitForTimeout(2500);
      
      // We will capture it
      await page.screenshot({ path: path.join(artifactsDir, `vercel-analytics-${tabName.trim().replace(/\s|\//g, '_')}.png`), fullPage: true });
    }
  }

  // Also try clicking "Огляд", "Зростання", "Поведінка", "Відгуки", "Джерела", "Фінанси", "Склад"
  const newTabs = [
    'Огляд', 'Зростання', 'Поведінка', 'Відгуки', 'Джерела', 'Фінанси', 'Склад'
  ];
  for (const tab of allTabs) {
    const tabName = await tab.textContent();
    if (tabName && newTabs.includes(tabName.trim())) {
      console.log(`Clicking on new tab: ${tabName.trim()}`);
      await tab.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(artifactsDir, `vercel-analytics-new-${tabName.trim()}.png`), fullPage: true });
    }
  }

  console.log('Done capturing screenshots!');
});
