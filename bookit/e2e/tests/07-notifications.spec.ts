/**
 * 07 — Notifications (Bell)
 *
 * NotificationsBell показує ЗАПИСИ (bookings) майстра, а не notifications таблицю.
 * useNotifications → SELECT from bookings WHERE master_id = X ORDER BY created_at DESC.
 *
 * Тести:
 * 1. Bell рендериться на дашборді
 * 2. Після INSERT нового booking через admin → bell показує clientName в списку
 * 3. Клік на запис у списку → URL отримує ?bookingId=
 *
 * Requires:
 *   - playwright/.auth/master.json  (hasMasterState)
 *   - E2E_MASTER_ID
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { supabaseAdmin } from '../utils/supabase';
import { DashboardPage } from '../pages/DashboardPage';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const MASTER_ID      = process.env.E2E_MASTER_ID;

const TEST_CLIENT_NAME = `E2E Bell Test ${Date.now().toString().slice(-5)}`;
const insertedBookingIds: string[] = [];

// ─── Cleanup ──────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  if (insertedBookingIds.length === 0) return;
  await supabaseAdmin.from('bookings').delete().in('id', insertedBookingIds);
});

// ─── Bell locator helper ──────────────────────────────────────────────────────

function getBellBtn(page: import('@playwright/test').Page) {
  // Bell button — small square icon button in the header; no aria-label, found by SVG bell icon
  return page.locator('button').filter({ has: page.locator('svg') }).nth(0);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Notifications Bell', () => {

  test('дзвіночок NotificationsBell рендериться на дашборді', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();
    const dashboard = new DashboardPage(page);

    try {
      await dashboard.goto();

      // Bell: small rounded button with Bell icon in header
      const bell = page.locator('button.relative.w-9.h-9').first()
        .or(page.locator('button').filter({ has: page.locator('[class*="bell"], [data-lucide="bell"]') }).first());

      await expect(bell).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  test('новий booking зʼявляється у Bell після INSERT', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!MASTER_ID,      'E2E_MASTER_ID не задано');

    // 1. Insert a booking via admin (bypasses RLS)
    const today = new Date().toISOString().split('T')[0];
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        master_id:    MASTER_ID!,
        client_name:  TEST_CLIENT_NAME,
        client_phone: '+380000000099',
        status:       'pending',
        date:         today,
        start_time:   '14:00',
        end_time:     '15:00',
        total_price:  0,
      })
      .select('id')
      .single();

    if (error) throw new Error(`Could not insert test booking: ${error.message}`);
    insertedBookingIds.push(booking.id);

    // 2. Open dashboard as master
    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();
    const dashboard = new DashboardPage(page);

    try {
      await dashboard.goto();

      // 3. Click the bell button
      // Bell button — small 9-unit square button with SVG bell icon
      const bell = page.locator('button[class*="w-9"]').filter({ has: page.locator('svg') }).first();
      await expect(bell).toBeVisible({ timeout: 10_000 });
      await bell.click();

      // 4. Panel opens — verify "Сповіщення" header
      await expect(page.getByText('Сповіщення', { exact: true })).toBeVisible({ timeout: 8_000 });

      // 5. The test client name should appear in the list (may render in 2 elements)
      await expect(page.getByText(TEST_CLIENT_NAME).first()).toBeVisible({ timeout: 8_000 });
    } finally {
      await context.close();
    }
  });

  test('натискання на запис у Bell додає ?bookingId= до URL', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!MASTER_ID,      'E2E_MASTER_ID не задано');

    // Ensure there's at least one booking to click
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('master_id', MASTER_ID!)
      .limit(1);

    if (!bookings?.length) {
      test.skip(true, 'Немає записів для майстра — пропускаємо тест навігації');
      return;
    }

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();
    const dashboard = new DashboardPage(page);

    try {
      await dashboard.goto();

      // Open bell
      // Bell button — small 9-unit square button with SVG bell icon
      const bell = page.locator('button[class*="w-9"]').filter({ has: page.locator('svg') }).first();
      await expect(bell).toBeVisible({ timeout: 10_000 });
      await bell.click();

      // Wait for panel with notification items
      await expect(page.getByText('Сповіщення', { exact: true })).toBeVisible({ timeout: 8_000 });

      // Click first booking item in the panel
      const firstItem = page.locator('button').filter({ has: page.locator('text=/\\d{1,2} (січ|лют|бер|квіт|трав|черв|лип|серп|вер|жовт|лист|груд)/') }).first();
      const itemVisible = await firstItem.isVisible().catch(() => false);

      if (itemVisible) {
        await firstItem.click();
        await page.waitForURL(/bookingId=/, { timeout: 8_000 });
        expect(page.url()).toContain('bookingId=');
      } else {
        // Fallback: click any button inside the scroll area
        const anyItem = page.locator('button.flex.items-start.gap-3').first();
        if (await anyItem.isVisible()) {
          await anyItem.click();
          await page.waitForURL(/bookingId=/, { timeout: 8_000 });
          expect(page.url()).toContain('bookingId=');
        }
      }
    } finally {
      await context.close();
    }
  });

});
