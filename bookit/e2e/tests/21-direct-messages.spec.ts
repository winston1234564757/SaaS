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
import { rt } from '../utils/runtimeEnv';
import { supabaseAdmin } from '../utils/supabase';

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

  // Regression: getOrCreateConversation returned null on the ?to= create-flow
  // (BUG-1, session 2026-07-10) — .single() on the lookup + no insert-conflict
  // recovery meant a fresh ?to= silently dropped the redirect and landed on the
  // inbox. This drives the real create path (no seeded conversation) end-to-end.
  test('?to= створює розмову й редіректить у чат', async ({ browser }) => {
    const CLIENT_ID = rt.clientId;               // Time Travel client (= client.json)
    const MASTER_ID = rt.masterReferralId;       // a master with NO seeded conversation
    test.skip(
      !hasClientState || !CLIENT_ID || !MASTER_ID,
      'Потрібні client.json + E2E_CLIENT_ID + E2E_MASTER_REFERRAL_ID (re-seed)',
    );

    // Guarantee the CREATE branch: wipe any pre-existing conversation first.
    const wipe = () =>
      supabaseAdmin.from('conversations').delete()
        .eq('client_id', CLIENT_ID).eq('master_id', MASTER_ID);
    await wipe();

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page = await context.newPage();
    try {
      await page.goto(`/my/messages/start?to=${MASTER_ID}`);

      // The route handler must 307 straight to a concrete conversation route,
      // not the inbox (a page-level redirect() would stream and be dropped here).
      await expect(page).toHaveURL(/\/my\/messages\/[0-9a-f-]{36}$/, { timeout: 15_000 });

      // And it must be a live chat pane (composer present), not an error state.
      await expect(page.getByLabel('Текст повідомлення')).toBeVisible({ timeout: 10_000 });

      // The conversation now exists in the DB (created by the action, not seeded).
      const { data: conv } = await supabaseAdmin
        .from('conversations').select('id')
        .eq('client_id', CLIENT_ID).eq('master_id', MASTER_ID).maybeSingle();
      expect(conv?.id).toBeTruthy();
    } finally {
      await context.close();
      await wipe();   // leave no trace → next run re-exercises the CREATE path
    }
  });
});
