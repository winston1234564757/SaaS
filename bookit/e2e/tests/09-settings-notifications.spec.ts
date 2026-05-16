import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { supabaseAdmin } from '../utils/supabase';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
// Using Viktor's ID for this specific test to verify "Connected" state
const VIKTOR_ID = '551c7a11-a02b-4944-9b34-594c41ccb951';

test.describe('Master Settings - Notifications', () => {

  test('Статус Telegram бота відображається як "Підключено"', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    // 1. Ensure Viktor has a telegram_chat_id in DB (it should be 491264635)
    await supabaseAdmin
      .from('master_profiles')
      .update({ telegram_chat_id: '491264635' })
      .eq('id', VIKTOR_ID);

    // 2. Open settings page
    // Note: We use storageState, but the ID in the state might not be Viktor's.
    // However, if we are testing the UI component, any master with a chat_id should work.
    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();

    try {
      await page.goto('/dashboard/settings');
      
      // 3. Find the Telegram Bot section in TechnicalIsland
      const tgSection = page.locator('div:has-text("Telegram Бот")').last();
      await expect(tgSection).toBeVisible({ timeout: 15_000 });
      
      // 4. Verify text
      await expect(page.getByText('Сповіщення про нові записи підключено.')).toBeVisible();
      
      // 5. Verify "Connected" icon (Check icon in success colors)
      const successIcon = tgSection.locator('svg.lucide-check');
      await expect(successIcon).toBeVisible();
    } finally {
      await context.close();
    }
  });

});
