/**
 * 04 — CRM Logic
 *
 * Tests booking status transitions triggered by master actions and the
 * downstream DB side-effects (trigger trg_update_crm_metrics).
 *
 * Requires:
 *   - playwright/.auth/master.json  (hasMasterState)
 *   - E2E_MASTER_ID                 (master UUID in master_profiles)
 *   - E2E_CLIENT_ID                 (client UUID — for total_visits assertion)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import {
  supabaseAdmin,
  getBookingById,
  getClientMasterRelation,
} from '../utils/supabase';
import { BookingsPage } from '../pages/BookingsPage';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const MASTER_ID  = process.env.E2E_MASTER_ID;
const CLIENT_ID  = process.env.E2E_CLIENT_ID;
const MASTER_SLUG = process.env.E2E_MASTER_SLUG ?? 'e2e-test-master';

// ─── Per-test booking ID tracking (avoids cross-worker cleanup races) ────────

// Each test pushes its own inserted booking IDs here.
// afterEach deletes ONLY those specific IDs — safe for parallel workers.
let insertedBookingIds: string[] = [];

test.afterEach(async () => {
  if (insertedBookingIds.length === 0) return;
  await supabaseAdmin.from('bookings').delete().in('id', insertedBookingIds);
  insertedBookingIds = [];
});

// ─── Helper: insert a minimal test booking ───────────────────────────────────

async function insertTestBooking(overrides: Record<string, unknown> = {}) {
  if (!MASTER_ID) throw new Error('E2E_MASTER_ID is not set');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      master_id:    MASTER_ID,
      client_name:  'E2E CRM Test Client',
      client_phone: '+380000000001',
      status:       'pending',
      date:         today,
      start_time:   '10:00',
      end_time:     '11:00',
      total_price:  50000, // kopecks
      ...overrides,
    })
    .select('id')
    .single();

  if (error) throw new Error(`insertTestBooking: ${error.message}`);
  insertedBookingIds.push(data.id);
  return data.id as string;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('CRM: Зміна статусу запису', () => {

  test('booking status update: pending → confirmed оновлює БД', async ({ browser }) => {
    test.setTimeout(90_000); // navigation + mutation + DB polling
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!MASTER_ID,      'E2E_MASTER_ID не задано');

    // 1. Seed a pending booking directly in DB (bypasses RLS)
    const bookingId = await insertTestBooking({ status: 'pending' });

    // 2. Open master dashboard as authenticated master
    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();
    const bookingsPage = new BookingsPage(page);

    try {
      // 3. Navigate to the bookings page with this booking open in the modal
      await bookingsPage.openBookingById(bookingId);

      // 4. Click "Підтвердити" — мутація йде через Supabase client (realtime), не Server Action
      await expect(bookingsPage.confirmBtn).toBeVisible({ timeout: 8_000 });

      // Слухати PATCH-запит перед кліком
      const patchDone = page.waitForResponse(
        r => r.url().includes('/rest/v1/bookings') && r.request().method() === 'PATCH',
        { timeout: 15_000 }
      ).catch(() => null); // м'яко — якщо URL структура інша

      await bookingsPage.confirmBtn.click();
      await patchDone; // чекаємо на відповідь з БД

      // Чекаємо оновлення UI + додатковий буфер для запису в БД
      await expect(bookingsPage.confirmBtn).toBeHidden({ timeout: 10_000 })
        .catch(() => {});
      await page.waitForTimeout(2000);

      // 6. Assert DB row status changed to 'confirmed' (з polling на випадок затримки)
      let booking = await getBookingById(bookingId);
      for (let i = 0; i < 5 && booking.status !== 'confirmed'; i++) {
        await page.waitForTimeout(1000);
        booking = await getBookingById(bookingId);
      }
      expect(booking.status).toBe('confirmed');
    } finally {
      await context.close();
    }
  });

  test('booking status update: confirmed → completed тригер оновлює client_master_relations', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!MASTER_ID,      'E2E_MASTER_ID не задано');
    test.skip(!CLIENT_ID,      'E2E_CLIENT_ID не задано (потрібен для перевірки total_visits)');

    // 1. Capture current total_visits before the status change
    const relationBefore = await getClientMasterRelation(CLIENT_ID!, MASTER_ID!);
    const visitsBefore = relationBefore?.total_visits ?? 0;

    // 2. Seed a confirmed booking with a real client_id so the trigger fires
    const bookingId = await insertTestBooking({
      status:    'confirmed',
      client_id: CLIENT_ID,
    });

    // 3. Open as master
    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();
    const bookingsPage = new BookingsPage(page);

    try {
      await bookingsPage.openBookingById(bookingId);

      // 4. Click "Завершити" and wait for the Supabase PATCH to complete
      await expect(bookingsPage.completeBtn).toBeVisible({ timeout: 8_000 });
      const patchDone = page.waitForResponse(
        r => r.url().includes('supabase') && r.url().includes('bookings') && r.request().method() === 'PATCH',
        { timeout: 10_000 }
      );
      await bookingsPage.completeBtn.click();
      const patchResp = await patchDone;
      console.log('[CRM test] PATCH status:', patchResp.status(), await patchResp.text().catch(() => ''));

      // 5. Assert booking status = 'completed'
      const booking = await getBookingById(bookingId);
      expect(booking.status).toBe('completed');

      // 6. Assert trigger incremented total_visits
      const relationAfter = await getClientMasterRelation(CLIENT_ID!, MASTER_ID!);
      expect(relationAfter).not.toBeNull();
      expect(relationAfter!.total_visits).toBeGreaterThan(visitsBefore);
    } finally {
      await context.close();
    }
  });

});
