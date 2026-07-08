import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { supabaseAdmin } from '../utils/supabase';

const hasClientState = fs.existsSync('playwright/.auth/client.json');
// Client UUID for the session cached in client.json. The seeder writes it to
// .env.test.runtime (= clientTimeTravelId, the same account E2E_CLIENT_EMAIL points
// to); never hard-code — Supabase auth UUIDs are random on a fresh DB.
const CLIENT_ID      = process.env.E2E_CLIENT_ID;

test.describe('Notification Adoption (UI) - Client', () => {

  test('ChannelBanner зʼявляється на /my/bookings, якщо немає підписок', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json');
    test.skip(!CLIENT_ID, 'E2E_CLIENT_ID не задано (запусти seed-e2e-data)');

    // 1. Clear push subscriptions for this client
    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', CLIENT_ID);
    
    // 2. Open client bookings page
    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page    = await context.newPage();

    try {
      await page.goto('/my/bookings');
      
      // 3. Banner should be visible
      // It contains "Підключи сповіщення"
      const banner = page.getByText(/підключи сповіщення/i);
      await expect(banner).toBeVisible({ timeout: 15_000 });
      
      // 4. Connect buttons should be there
      const tgBtn = page.getByRole('link', { name: /Telegram/i });
      const pushBtn = page.getByRole('button', { name: /Push/i });
      
      await expect(tgBtn).toBeVisible();
      await expect(pushBtn).toBeVisible();
    } finally {
      await context.close();
    }
  });

});
