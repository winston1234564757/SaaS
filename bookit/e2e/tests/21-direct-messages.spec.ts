/**
 * 21 — Direct Messages (client ↔ master chat)
 *
 * P0-TEST-1: the Direct Chat feature (conversations + direct_messages tables,
 * MessagesListPage, DirectChatPage) had zero e2e coverage. The seeder plants a
 * deterministic conversation (E2E_CONVERSATION_ID) with one master message, so
 * this drives chat history, sending, persistence and the conversation list.
 *
 * Uses the generic client state (client.json = the time-travel client, who is
 * the seeded conversation's participant).
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const CONV_ID = process.env.E2E_CONVERSATION_ID;
const SEEDED = 'E2E seeded chat message';
const hasClientState = fs.existsSync('playwright/.auth/client.json');

test.describe('Direct Messages — клієнт ↔ майстер', () => {
  test('історія, надсилання, персистентність, список', async ({ browser }) => {
    test.skip(!hasClientState || !CONV_ID, 'Потрібні client.json + E2E_CONVERSATION_ID (re-seed)');

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page = await context.newPage();
    try {
      // 1. Open the seeded conversation → incoming (master) message is shown
      await page.goto(`/my/messages/${CONV_ID}`);
      await expect(page.getByText(SEEDED).first()).toBeVisible({ timeout: 15_000 });

      // 2. Compose + send an outgoing message
      const msg = `E2E надіслано ${Date.now()}`;
      const input = page.getByLabel('Текст повідомлення');
      await expect(input).toBeVisible();
      await input.fill(msg);
      await page.getByRole('button', { name: 'Надіслати' }).click();
      await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });

      // 3. Persists across a reload of the conversation
      await page.reload();
      await expect(page.getByText(msg)).toBeVisible({ timeout: 10_000 });

      // 4. Conversation list surfaces the latest message. /my/messages renders
      // both a mobile list (lg:hidden) and the desktop pane — filter to the
      // visible copy so we don't match the hidden one.
      await page.goto('/my/messages');
      await expect(
        page.getByText(msg).filter({ visible: true }).first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });
});
