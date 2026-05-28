import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { supabaseAdmin } from '../utils/supabase';

const hasClientState = fs.existsSync('playwright/.auth/client.json');
// Correct ID for e2e_client@test.com session
const CLIENT_ID      = '2ba1e13a-3b20-462b-a848-a5070cb4c41b';

test.describe('Notification Adoption (UI) - Client', () => {

  test('ChannelBanner зʼявляється на /my/bookings, якщо немає підписок', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json');

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
