/**
 * 17 — Retention & Loyalty Engine
 *
 * Part 1 — LoyaltyWidget UI
 *   A. Unauth state  : public page без логіну → marketing teaser з першим тиром
 *   B. Max tier state: клієнт з 20 завершеними візитами (тир на 15) → "Ви досягли максимального рівня!"
 *
 * Part 2 — Smart Rebooking Cron API (GET /api/cron/rebooking)
 *   C. Valid rebooking : завершений запис 30 дн тому, немає майбутніх → notification inserted
 *   D. Anti-spam filter: завершений запис 30 дн тому + майбутній pending → notification skipped
 *
 * Required env:
 *   E2E_MASTER_ID        — UUID майстра
 *   E2E_CLIENT_EMAIL     — email клієнта (e2e_client@test.com)
 *   CRON_SECRET          — secret для /api/cron/*
 *   PLAYWRIGHT_BASE_URL  — default http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { supabaseAdmin } from '../utils/supabase';

// ─── Env ──────────────────────────────────────────────────────────────────────

const hasClientState = fs.existsSync('playwright/.auth/client.json');
const MASTER_ID      = process.env.E2E_MASTER_ID;
const CLIENT_EMAIL   = process.env.E2E_CLIENT_EMAIL;
const CRON_SECRET    = process.env.CRON_SECRET;
const BASE_URL       = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Resolve profiles.id from email. */
async function getProfileId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

/** Resolve master slug from master_profiles.id. */
async function getMasterSlug(masterId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('master_profiles')
    .select('slug')
    .eq('id', masterId)
    .maybeSingle();
  return data?.slug ?? null;
}

/** Insert a loyalty program; returns its id. */
async function insertLoyaltyProgram(masterId: string, targetVisits: number, rewardValue: number): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('loyalty_programs')
    .insert({
      master_id:      masterId,
      name:           `E2E Test Tier ${targetVisits}`,
      target_visits:  targetVisits,
      reward_type:    'percent_discount',
      reward_value:   rewardValue,
      is_active:      true,
    })
    .select('id')
    .single();
  if (error) throw new Error(`insertLoyaltyProgram: ${error.message}`);
  return data.id;
}

/** Insert a booking; returns its id. */
async function insertBooking(opts: {
  masterId: string;
  clientId?: string;
  status: string;
  date: string;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      master_id:    opts.masterId,
      client_id:    opts.clientId ?? null,
      client_name:  'E2E Retention Test Client',
      client_phone: '+380000000077',
      status:       opts.status,
      date:         opts.date,
      start_time:   '10:00',
      end_time:     '11:00',
      total_price:  0,
    })
    .select('id')
    .single();
  if (error) throw new Error(`insertBooking: ${error.message}`);
  return data.id;
}

// ─── Part 1: LoyaltyWidget UI ─────────────────────────────────────────────────

test.describe('Loyalty Widget — UI', () => {

  test('A. Unauth: public page shows marketing teaser for first tier', async ({ browser }) => {
    test.skip(!MASTER_ID, 'E2E_MASTER_ID не задано');

    const slug = await getMasterSlug(MASTER_ID!);
    test.skip(!slug, 'Не вдалось отримати slug майстра');

    const programId = await insertLoyaltyProgram(MASTER_ID!, 15, 20);

    try {
      // Fresh unauthenticated context
      const context = await browser.newContext();
      const page    = await context.newPage();

      await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });

      // Wait for LoyaltyWidget to render
      const widgetText = page.getByText(/Знижка.*на всі візити.*починаючи/i).first();
      await expect(widgetText).toBeVisible({ timeout: 10_000 });

      const visible = await widgetText.textContent();
      console.log(`[17-A] UI Evidence: Detected UNAUTH state — widget text: "${visible?.trim()}"`);

      await context.close();
    } finally {
      await supabaseAdmin.from('loyalty_programs').delete().eq('id', programId);
    }
  });

  test('B. Max tier: client with 20 visits sees "Ви досягли максимального рівня!"', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json');
    test.skip(!MASTER_ID,      'E2E_MASTER_ID не задано');
    test.skip(!CLIENT_EMAIL,   'E2E_CLIENT_EMAIL не задано');

    const clientId = await getProfileId(CLIENT_EMAIL!);
    test.skip(!clientId, `Профіль не знайдено для ${CLIENT_EMAIL}`);

    const slug = await getMasterSlug(MASTER_ID!);
    test.skip(!slug, 'Не вдалось отримати slug майстра');

    const programId = await insertLoyaltyProgram(MASTER_ID!, 15, 20);

    // Insert 20 completed bookings for this client (spread over past dates)
    const bookingIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const id = await insertBooking({
        masterId: MASTER_ID!,
        clientId: clientId!,
        status:   'completed',
        date:     daysAgo(90 - i * 3), // 20 visits spread in the past
      });
      bookingIds.push(id);
    }

    try {
      const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
      const page    = await context.newPage();

      await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });

      const maxText = page.getByText(/Ви досягли максимального рівня/i).first();
      await expect(maxText).toBeVisible({ timeout: 12_000 });

      const visible = await maxText.textContent();
      console.log(`[17-B] UI Evidence: Detected MAX TIER state for client with 20 visits — "${visible?.trim()}"`);

      await context.close();
    } finally {
      await supabaseAdmin.from('bookings').delete().in('id', bookingIds);
      await supabaseAdmin.from('loyalty_programs').delete().eq('id', programId);
    }
  });

});

// ─── Part 2: Smart Rebooking Cron ─────────────────────────────────────────────

test.describe('Smart Rebooking Cron — API', () => {

  test('C. Valid rebooking: completed booking 30d ago → notification inserted', async () => {
    test.skip(!MASTER_ID,    'E2E_MASTER_ID не задано');
    test.skip(!CLIENT_EMAIL, 'E2E_CLIENT_EMAIL не задано');
    test.skip(!CRON_SECRET,  'CRON_SECRET не задано');

    const clientId = await getProfileId(CLIENT_EMAIL!);
    test.skip(!clientId, `Профіль не знайдено для ${CLIENT_EMAIL}`);

    // Store original retention_cycle_days to restore later
    const { data: mp } = await supabaseAdmin
      .from('master_profiles')
      .select('retention_cycle_days')
      .eq('id', MASTER_ID!)
      .single();
    const originalCycle = mp?.retention_cycle_days ?? 30;

    // Set cycle to 30 for deterministic test
    await supabaseAdmin
      .from('master_profiles')
      .update({ retention_cycle_days: 30 })
      .eq('id', MASTER_ID!);

    const bookingId = await insertBooking({
      masterId: MASTER_ID!,
      clientId: clientId!,
      status:   'completed',
      date:     daysAgo(30),
    });

    try {
      // Cleanup any stale rebooking notifications for this client+master from today
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('recipient_id', clientId!)
        .eq('related_master_id', MASTER_ID!)
        .eq('type', 'rebooking_reminder');

      // Call cron
      const res = await fetch(`${BASE_URL}/api/cron/rebooking`, {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      expect(res.status).toBe(200);

      const body = await res.json();
      console.log('[17-C] Cron response:', JSON.stringify(body));

      // Verify notification was inserted in DB
      const { data: notifications } = await supabaseAdmin
        .from('notifications')
        .select('id, type, recipient_id')
        .eq('recipient_id', clientId!)
        .eq('related_master_id', MASTER_ID!)
        .eq('type', 'rebooking_reminder')
        .limit(1);

      const found = (notifications ?? []).length > 0;
      console.log(`[17-C] UI Evidence: Detected VALID REBOOKING — notification inserted: ${found}`);
      expect(found).toBe(true);
    } finally {
      await supabaseAdmin.from('bookings').delete().eq('id', bookingId);
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('recipient_id', clientId!)
        .eq('related_master_id', MASTER_ID!)
        .eq('type', 'rebooking_reminder');
      await supabaseAdmin
        .from('master_profiles')
        .update({ retention_cycle_days: originalCycle })
        .eq('id', MASTER_ID!);
    }
  });

  test('D. Anti-spam filter: future pending booking → notification skipped', async () => {
    test.skip(!MASTER_ID,    'E2E_MASTER_ID не задано');
    test.skip(!CLIENT_EMAIL, 'E2E_CLIENT_EMAIL не задано');
    test.skip(!CRON_SECRET,  'CRON_SECRET не задано');

    const clientId = await getProfileId(CLIENT_EMAIL!);
    test.skip(!clientId, `Профіль не знайдено для ${CLIENT_EMAIL}`);

    const { data: mp } = await supabaseAdmin
      .from('master_profiles')
      .select('retention_cycle_days')
      .eq('id', MASTER_ID!)
      .single();
    const originalCycle = mp?.retention_cycle_days ?? 30;

    await supabaseAdmin
      .from('master_profiles')
      .update({ retention_cycle_days: 30 })
      .eq('id', MASTER_ID!);

    const completedBookingId = await insertBooking({
      masterId: MASTER_ID!,
      clientId: clientId!,
      status:   'completed',
      date:     daysAgo(30),
    });
    const futureBookingId = await insertBooking({
      masterId: MASTER_ID!,
      clientId: clientId!,
      status:   'pending',
      date:     daysFromNow(2),
    });

    try {
      // Ensure no stale notifications (idempotency won't fire anyway due to future booking,
      // but clean slate makes the assertion unambiguous)
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('recipient_id', clientId!)
        .eq('related_master_id', MASTER_ID!)
        .eq('type', 'rebooking_reminder');

      const res = await fetch(`${BASE_URL}/api/cron/rebooking`, {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      expect(res.status).toBe(200);

      const body = await res.json();
      console.log('[17-D] Cron response:', JSON.stringify(body));

      // Verify NO notification was inserted (anti-spam blocked it)
      const { data: notifications } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('recipient_id', clientId!)
        .eq('related_master_id', MASTER_ID!)
        .eq('type', 'rebooking_reminder')
        .limit(1);

      const blocked = (notifications ?? []).length === 0;
      console.log(
        `[17-D] UI Evidence: Anti-Spam filter ${blocked ? 'BLOCKED' : 'FAILED to block'} ` +
        `notification for client with future pending booking.`,
      );
      expect(blocked).toBe(true);
    } finally {
      await supabaseAdmin.from('bookings').delete().in('id', [completedBookingId, futureBookingId]);
      await supabaseAdmin
        .from('master_profiles')
        .update({ retention_cycle_days: originalCycle })
        .eq('id', MASTER_ID!);
    }
  });

});
