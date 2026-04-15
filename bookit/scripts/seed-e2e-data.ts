/**
 * BookIT E2E Seeder — scripts/seed-e2e-data.ts
 *
 * Стратегія: Wipe + recreate ТІЛЬКИ для e2e_*@test.com акаунтів.
 * Ніяких global wipes. Ніяких торкань до prod/dev даних.
 *
 * Запуск: npx tsx scripts/seed-e2e-data.ts
 * (playwright.config.ts та package.json вже налаштовані)
 *
 * Що сідується:
 *   TimeTravelMaster — isolated client + deterministic time machine fixtures
 *   CrmMaster        — isolated client + 100 guest bookings for CRM/Analytics
 *   AuthMaster       — isolated client + minimal auth fixtures
 *   ReferralMaster   — isolated client + deterministic referral fixture
 *   StudioAdmin      — foundation (тести ще не написані)
 */

// ── dotenv MUST be first ────────────────────────────────────────────────────────
import { config } from 'dotenv';
config({ path: '.env.test', override: true });
config({ path: '.env.local' }); // fallback for NEXT_PUBLIC_* vars

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const ALLOW_REMOTE      = process.env.E2E_ALLOW_REMOTE === 'true';
const E2E_EMAIL_PATTERN = /^e2e_.+@test\.com$/;
const E2E_PASSWORD      = 'E2E_Bookit_Test_2026!'; // must pass Supabase password policy

// Realistic Ukrainian client names for CRM seeding
const UA_NAMES = [
  'Олена Мельник',      'Марія Ковальчук',   'Ірина Бондаренко',  'Наталія Шевченко',
  'Тетяна Коваленко',   'Юлія Петренко',     'Оксана Лисенко',    'Анна Кравченко',
  'Вікторія Мороз',     'Людмила Савченко',  'Марина Поліщук',    'Катерина Тимченко',
  'Світлана Гнатенко',  'Ольга Романенко',   'Галина Захарченко', 'Тамара Марченко',
  'Надія Гончаренко',   'Лариса Стець',      'Валентина Ткач',    'Жанна Власенко',
  'Євгенія Голубенко',  'Дарина Нечипоренко','Поліна Пономаренко','Аліна Панченко',
  'Крістіна Степаненко','Діана Яценко',      'Валерія Лазаренко', 'Наталія Омеляненко',
  'Ірина Литвиненко',   'Марія Лещенко',     'Ганна Головко',     'Тетяна Опанасенко',
  'Олена Клименко',     'Юлія Назаренко',    'Вікторія Василенко','Оксана Зінченко',
  'Олена Гриценко',     'Марина Кириченко',  'Катерина Хоменко',  'Ірина Лебедь',
  'Анна Сидоренко',     'Людмила Плющ',      'Наталія Куліш',     'Тетяна Гладченко',
  'Світлана Данченко',  'Олена Приходько',   'Марія Хижняк',      'Галина Кузьменко',
  'Вікторія Дмитренко', 'Ніна Прокопенко',
];

const MORNING_SLOTS   = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const DAYS_OF_WEEK    = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const SLUGS = {
  timeTravelMaster: 'e2e-timetravel-master',
  crmMaster:        'e2e-crm-master',
  authMaster:       'e2e-auth-master',
  referralMaster:   'e2e-referral-master',
  studioAdmin:      'e2e-studioadmin',
} as const;

const FIXTURE_CONTRACT = {
  referralCode: 'E2EREFREF001',
  services: {
    timeTravel: 'Манікюр E2E',
    crm: 'Манікюр CRM E2E',
    auth: 'Послуга AuthMaster E2E',
    referral: 'Послуга Referral E2E',
    studio: 'Studio Service E2E',
  },
} as const;

// ─── Safety guards ────────────────────────────────────────────────────────────

function assertSafeEnvironment(): void {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'SAFETY: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Create .env.test from .env.test.example and fill in your LOCAL Supabase values.',
    );
  }

  const isLocal =
    SUPABASE_URL.includes('127.0.0.1') ||
    SUPABASE_URL.includes('localhost');

  if (!isLocal && !ALLOW_REMOTE) {
    throw new Error(
      `SAFETY ABORT: SUPABASE_URL "${SUPABASE_URL}" looks remote.\n` +
      `This seeder only runs against a local Supabase instance to protect production data.\n` +
      `Set E2E_ALLOW_REMOTE=true in .env.test to override (use with extreme caution).`,
    );
  }
}

function assertE2EEmail(email: string, varName: string): void {
  if (!E2E_EMAIL_PATTERN.test(email)) {
    throw new Error(
      `SAFETY: ${varName}="${email}" does not match e2e_*@test.com pattern.\n` +
      `Refusing to seed non-test account. Update .env.test with correct test emails.`,
    );
  }
}

// ─── Admin client (bypasses RLS entirely) ────────────────────────────────────

assertSafeEnvironment();

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Account definitions ──────────────────────────────────────────────────────

const ACCOUNTS = {
  masterTimeTravel: process.env.E2E_MASTER_TIMETRAVEL_EMAIL ?? 'e2e_master_timetravel@test.com',
  masterCrm:        process.env.E2E_MASTER_CRM_EMAIL        ?? 'e2e_master_crm@test.com',
  masterAuth:       process.env.E2E_MASTER_AUTH_EMAIL        ?? 'e2e_master_auth@test.com',
  masterReferral:   process.env.E2E_MASTER_REFERRAL_EMAIL    ?? 'e2e_master_referral@test.com',
  clientTimeTravel: process.env.E2E_CLIENT_TIMETRAVEL_EMAIL  ?? 'e2e_client_timetravel@test.com',
  clientCrm:        process.env.E2E_CLIENT_CRM_EMAIL         ?? 'e2e_client_crm@test.com',
  clientAuth:       process.env.E2E_CLIENT_AUTH_EMAIL        ?? 'e2e_client_auth@test.com',
  clientReferral:   process.env.E2E_CLIENT_REFERRAL_EMAIL    ?? 'e2e_client_referral@test.com',
  studioAdmin:      process.env.E2E_STUDIO_ADMIN_EMAIL       ?? 'e2e_studioadmin@test.com',
} as const;

// Validate all emails upfront
Object.entries(ACCOUNTS).forEach(([key, email]) =>
  assertE2EEmail(email, `E2E_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}_EMAIL`),
);

// ─── Date/time helpers ────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtTime(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3_600_000);
}

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

/** Skip Sunday (day 0) — TestMaster doesn't work Sundays */
function skipSunday(d: Date): Date {
  const r = new Date(d);
  if (r.getUTCDay() === 0) r.setUTCDate(r.getUTCDate() + 1);
  return r;
}

function randomPhone(): string {
  const digits = Math.floor(Math.random() * 90_000_000) + 10_000_000;
  return `+38050${digits}`;
}

// ─── User resolution ──────────────────────────────────────────────────────────

/**
 * Returns the UUID of the Supabase auth user for the given email.
 * Creates the user if not found (idempotent — safe to re-run).
 */
async function getOrCreateUser(email: string, fullName: string): Promise<string> {
  // Check profiles table first (faster than listing all auth users)
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.id) {
    console.log(`  [user] exists  ${email}`);
    return existing.id;
  }

  // Create new Supabase auth user
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: E2E_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    // If user already exists in auth but not in profiles, resolve via auth lookup
    if (error.message?.includes('already been registered') || error.status === 422) {
      const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) throw new Error(`listUsers fallback failed: ${listErr.message}`);
      const found = listData?.users.find((u: { email?: string; id: string }) => u.email === email);
      if (found) {
        console.log(`  [user] found in auth  ${email}`);
        return found.id;
      }
    }
    throw new Error(`createUser(${email}): ${error.message}`);
  }

  console.log(`  [user] created  ${email} (${data.user.id})`);
  return data.user.id;
}

// ─── Profile upserts ──────────────────────────────────────────────────────────

async function upsertProfile(
  id: string,
  email: string,
  fullName: string,
  role: 'master' | 'client',
  phone: string | null = '+380500000001', // Default phone to bypass onboarding
): Promise<void> {
  const { error } = await admin.from('profiles').upsert(
    { id, email, full_name: fullName, phone, role, avatar_url: null, telegram_chat_id: null },
    { onConflict: 'id' },
  );
  if (error) throw new Error(`upsertProfile(${email}): ${error.message}`);
}

async function upsertMasterProfile(
  id: string,
  slug: string,
  businessName: string,
  tier: 'starter' | 'pro' | 'studio' = 'pro',
  extra: Record<string, unknown> = {},
): Promise<void> {
  // referral_code is NOT NULL in the DB — use slug as placeholder.
  // seedReferralMaster() overwrites it with the deterministic E2EREF code.
  const placeholderCode = `E2E${slug.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const { error } = await admin.from('master_profiles').upsert(
    {
      id,
      slug,
      business_name: businessName,
      bio: 'E2E тестовий майстер — не видаляти вручну',
      categories: ['nails'],
      mood_theme: 'default',
      accent_color: '#789A99',
      subscription_tier: tier,
      commission_rate: 0,
      rating: 4.9,
      rating_count: 5,
      is_published: true,
      has_seen_tour: true,
      seen_tours: {},
      avatar_emoji: '💅',
      timezone: 'Europe/Kyiv',
      referral_code: placeholderCode,
      ...extra,
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(`upsertMasterProfile(${slug}): ${error.message}`);
}

async function upsertClientProfile(id: string): Promise<void> {
  const { error } = await admin.from('client_profiles').upsert(
    { id, ambassador_level: 0, total_bookings: 0, total_masters_invited: 0 },
    { onConflict: 'id' },
  );
  // client_profiles might not exist yet — only warn, don't throw
  if (error) console.warn(`  [warn] upsertClientProfile(${id}): ${error.message}`);
}

// ─── Schedule templates ───────────────────────────────────────────────────────

async function upsertScheduleTemplates(masterId: string): Promise<void> {
  // Clean existing first
  await admin.from('schedule_templates').delete().eq('master_id', masterId);

  const rows = [
    ...DAYS_OF_WEEK.map(day => ({
      master_id:   masterId,
      day_of_week: day,
      start_time:  '09:00',
      end_time:    '19:00',
      break_start: '13:00',
      break_end:   '14:00',
      is_working:  true,
    })),
    {
      master_id:   masterId,
      day_of_week: 'sun',
      start_time:  '09:00',
      end_time:    '17:00',
      break_start: null,
      break_end:   null,
      is_working:  false, // Sunday off
    },
  ];

  const { error } = await admin.from('schedule_templates').insert(rows);
  if (error) throw new Error(`upsertScheduleTemplates(${masterId}): ${error.message}`);
}

// ─── Service helpers ──────────────────────────────────────────────────────────

async function ensureService(
  masterId: string,
  name: string,
  price: number,
  durationMinutes: number,
): Promise<string> {
  const { data: existing } = await admin
    .from('services')
    .select('id')
    .eq('master_id', masterId)
    .eq('name', name)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from('services')
    .insert({
      master_id:        masterId,
      name,
      price,
      duration_minutes: durationMinutes,
      buffer_minutes:   0,
      category_id:      null,
      is_active:        true,
      is_popular:       true,
      sort_order:       0,
    })
    .select('id')
    .single();

  if (error) throw new Error(`ensureService("${name}"): ${error.message}`);
  return data.id;
}

// ─── Booking helpers ──────────────────────────────────────────────────────────

async function insertBooking(params: {
  masterId:           string;
  serviceId:          string;
  serviceName:        string;
  servicePrice:       number;
  serviceDuration:    number;
  clientId:           string | null;
  clientName:         string;
  clientPhone:        string;
  date:               string;
  startTime:          string;
  endTime:            string;
  status:             'pending' | 'confirmed' | 'completed' | 'cancelled';
  dynamicLabel?:      string | null;
}): Promise<string> {
  const bookingId = crypto.randomUUID();

  const { error: bErr } = await admin.from('bookings').insert({
    id:                    bookingId,
    master_id:             params.masterId,
    client_id:             params.clientId,
    client_name:           params.clientName,
    client_phone:          params.clientPhone,
    client_email:          null,
    date:                  params.date,
    start_time:            params.startTime,
    end_time:              params.endTime,
    status:                params.status,
    total_services_price:  params.servicePrice,
    total_products_price:  0,
    total_price:           params.servicePrice,
    deposit_amount:        0,
    deposit_paid:          false,
    commission_amount:     0,
    notes:                 null,
    source:                'public_page',
    dynamic_pricing_label: params.dynamicLabel ?? null,
    dynamic_extra_kopecks: 0,
    referral_code_used:    null,
  });

  if (bErr) throw new Error(`insertBooking: ${bErr.message}`);

  const { error: sErr } = await admin.from('booking_services').insert({
    booking_id:       bookingId,
    service_id:       params.serviceId,
    service_name:     params.serviceName,
    service_price:    params.servicePrice,
    duration_minutes: params.serviceDuration,
  });

  if (sErr) {
    // Roll back booking so DB stays clean
    await admin.from('bookings').delete().eq('id', bookingId);
    throw new Error(`insertBooking → booking_services: ${sErr.message}`);
  }

  return bookingId;
}

// ─── Wipe helpers ─────────────────────────────────────────────────────────────

async function wipeMasterData(masterIds: string[], clientIds: string[]): Promise<void> {
  if (masterIds.length === 0) return;
  console.log(`\n[wipe] Cleaning data for ${masterIds.length} E2E master(s)...`);

  // Resolve booking IDs first (child tables reference them)
  const { data: bookingRows } = await admin
    .from('bookings')
    .select('id')
    .in('master_id', masterIds);

  const bookingIds = (bookingRows ?? []).map((b: { id: string }) => b.id);

  if (bookingIds.length > 0) {
    // Delete child records in FK-safe order
    await admin.from('booking_services').delete().in('booking_id', bookingIds);
    await admin.from('booking_products').delete().in('booking_id', bookingIds);
    console.log(`  [wipe] booking children — ${bookingIds.length} bookings cleaned`);
  }

  // Delete master-owned records
  await admin.from('bookings').delete().in('master_id', masterIds);
  await admin.from('loyalty_programs').delete().in('master_id', masterIds);
  await admin.from('client_master_relations').delete().in('master_id', masterIds);
  await admin.from('client_master_relations').delete().in('client_id', clientIds);
  await admin.from('reviews').delete().in('master_id', masterIds);
  await admin.from('reviews').delete().in('client_id', clientIds);
  await admin.from('master_client_notes').delete().in('master_id', masterIds);
  await admin.from('flash_deals').delete().in('master_id', masterIds);
  await admin.from('master_time_off').delete().in('master_id', masterIds);
  await admin.from('schedule_exceptions').delete().in('master_id', masterIds);
  await admin.from('notifications').delete().in('recipient_id', [...masterIds, ...clientIds]);

  // Services (bookings already gone, FK safe)
  await admin.from('services').delete().in('master_id', masterIds);
  await admin.from('products').delete().in('master_id', masterIds);
  await admin.from('schedule_templates').delete().in('master_id', masterIds);

  console.log(`  [wipe] ✓ Done`);
}

// ─── Domain seeders ───────────────────────────────────────────────────────────

/**
 * TimeTravelMaster
 *
 * Seeds:
 *   - 30 morning + 20 afternoon past completed bookings (6 months)
 *     → Smart Slots algorithm will score morning slots higher
 *   - 1 future confirmed booking at NOW + ~2.5h
 *     → last_minute pricing rule fires (< 3h threshold)
 *   - pricing_rules JSONB: last_minute, peak, quiet
 *   - 1 loyalty program (every 5th visit → 15% discount)
 *   - client_master_relations: 51 visits (triggers loyalty check)
 */
async function seedTimeTravelMaster(masterId: string, clientId: string): Promise<void> {
  console.log('\n[seed] TimeTravelMaster...');

  await upsertScheduleTemplates(masterId);
  const serviceId = await ensureService(masterId, FIXTURE_CONTRACT.services.timeTravel, 500, 60);

  // 1. pricing_rules stored as JSONB in master_profiles
  const { error: prErr } = await admin
    .from('master_profiles')
    .update({
      pricing_rules: {
        last_minute: { hours_ahead: 3, discount_pct: 15 },  // -15% if < 3h before slot
        peak:        { days: ['fri', 'sat'], hours: [17, 20] as [number, number], markup_pct: 20 }, // +20% Fri/Sat eve
        quiet:       { days: ['mon', 'tue'], hours: [10, 13] as [number, number], discount_pct: 10 }, // -10% Mon/Tue AM
      },
    })
    .eq('id', masterId);

  if (prErr) throw new Error(`pricing_rules update: ${prErr.message}`);

  // 2. Loyalty program
  const { error: loyaltyErr } = await admin.from('loyalty_programs').insert({
    master_id:     masterId,
    name:          'E2E Лояльність: кожен 5-й',
    target_visits: 5,
    reward_type:   'percent_discount',
    reward_value:  15,
    is_active:     true,
  });
  if (loyaltyErr) throw new Error(`loyalty insert: ${loyaltyErr.message}`);

  // 3. Historical bookings
  // Deterministic anchor: use env var if provided (CI), otherwise fallback to fixed May 1st 2026.
  const anchorDate = process.env.E2E_SEED_FIXED_DATE || '2026-05-01T11:00:00.000Z';
  const now = new Date(anchorDate);
  const inserts: Promise<string>[] = [];

  // 30 morning bookings → Smart Slots will prefer mornings
  for (let i = 0; i < 30; i++) {
    const daysBack  = Math.floor((i / 30) * 170) + 10;
    const date      = skipSunday(addDays(now, -daysBack));
    const startTime = MORNING_SLOTS[i % MORNING_SLOTS.length];
    const [hStr, mStr] = startTime.split(':');
    const endTime   = `${String(parseInt(hStr) + 1).padStart(2, '0')}:${mStr}`;

    inserts.push(insertBooking({
      masterId, serviceId, clientId,
      serviceName:    FIXTURE_CONTRACT.services.timeTravel,
      servicePrice:   500,
      serviceDuration: 60,
      clientName:     'E2E TestClient',
      clientPhone:    '+380501234567',
      date:           fmtDate(date),
      startTime, endTime,
      status:         'completed',
    }));
  }

  // 20 afternoon bookings (fewer → mornings score higher)
  for (let i = 0; i < 20; i++) {
    const daysBack  = Math.floor((i / 20) * 165) + 15;
    const date      = skipSunday(addDays(now, -daysBack));
    const startTime = AFTERNOON_SLOTS[i % AFTERNOON_SLOTS.length];
    const [hStr, mStr] = startTime.split(':');
    const endTime   = `${String(parseInt(hStr) + 1).padStart(2, '0')}:${mStr}`;

    inserts.push(insertBooking({
      masterId, serviceId, clientId,
      serviceName:    FIXTURE_CONTRACT.services.timeTravel,
      servicePrice:   500,
      serviceDuration: 60,
      clientName:     'E2E TestClient',
      clientPhone:    '+380501234567',
      date:           fmtDate(date),
      startTime, endTime,
      status:         'completed',
    }));
  }

  // Run in batches of 10 to avoid connection saturation
  for (let i = 0; i < inserts.length; i += 10) {
    await Promise.all(inserts.slice(i, i + 10));
  }
  console.log(`  [seed] 50 past bookings ✓`);

  // 4. Future booking at NOW + 2.5h (inside the 3h last_minute window)
  //    Tests will use page.clock.setFixedTime(now - 30min) to ensure hoursAhead ≈ 2h
  //    which is < 3h → dynamic pricing fires on the frontend.
  let futureSlot = addMinutes(now, 150); // +2h30m
  // Round up to next :00 or :30
  const mins = futureSlot.getUTCMinutes();
  if (mins > 0 && mins <= 30)       futureSlot.setUTCMinutes(30, 0, 0);
  else if (mins > 30)               { futureSlot.setUTCHours(futureSlot.getUTCHours() + 1, 0, 0, 0); }

  // If it's past 18:00 (would end after 19:00), push to 10:00 next working day
  if (futureSlot.getUTCHours() >= 18) {
    futureSlot = skipSunday(addDays(now, 1));
    futureSlot.setUTCHours(10, 0, 0, 0);
  }

  const futureStart = fmtTime(futureSlot);
  const futureEnd   = fmtTime(addHours(futureSlot, 1));

  await insertBooking({
    masterId, serviceId, clientId,
    serviceName:     FIXTURE_CONTRACT.services.timeTravel,
    servicePrice:    500,
    serviceDuration: 60,
    clientName:      'E2E TestClient',
    clientPhone:     '+380501234567',
    date:            fmtDate(futureSlot),
    startTime:       futureStart,
    endTime:         futureEnd,
    status:          'confirmed',
    dynamicLabel:    null, // label set by frontend when dynamic pricing kicks in
  });
  console.log(`  [seed] Future booking: ${fmtDate(futureSlot)} ${futureStart} (Dynamic Pricing window) ✓`);

  // 5. client_master_relations (total_visits used by Loyalty & Smart Slots)
  const { error: cmrErr } = await admin.from('client_master_relations').upsert(
    {
      client_id:          clientId,
      master_id:          masterId,
      total_visits:       51,
      total_spent:        51 * 500,
      average_check:      500,
      last_visit_at:      new Date().toISOString(),
      is_vip:             false,
      loyalty_points:     0,
    },
    { onConflict: 'client_id,master_id' },
  );
  if (cmrErr) throw new Error(`client_master_relations: ${cmrErr.message}`);

  console.log(`  [seed] TimeTravelMaster ✓`);
}

/**
 * CrmMaster
 *
 * Seeds 100 guest bookings (no client_id — simulates walk-in clients).
 * Mixed statuses: completed / confirmed / cancelled.
 * Pro tier → Analytics and CRM pages are unlocked.
 * Enough data to exercise pagination, scroll, and analytics calculations.
 */
async function seedCrmMaster(masterId: string, clientId: string): Promise<void> {
  console.log('\n[seed] CrmMaster...');

  await upsertScheduleTemplates(masterId);
  const serviceId = await ensureService(masterId, FIXTURE_CONTRACT.services.crm, 600, 60);

  const now       = new Date();
  const statuses  = ['completed', 'completed', 'completed', 'confirmed', 'cancelled'] as const;
  const inserts: Promise<string>[] = [];

  for (let i = 0; i < 100; i++) {
    // 80 past + 20 future
    const daysOffset = i < 80 ? -(i * 2 + 1) : (i - 79);
    const date       = skipSunday(addDays(now, daysOffset));

    // Spread across working hours 09:00–17:00 (9 slots per hour band)
    const hour      = 9 + (i % 9);
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime   = `${String(hour + 1).padStart(2, '0')}:00`;
    const status    = daysOffset < 0 ? statuses[i % statuses.length] : 'confirmed';

    inserts.push(insertBooking({
      masterId, serviceId,
      serviceName:     FIXTURE_CONTRACT.services.crm,
      servicePrice:    600,
      serviceDuration: 60,
      clientId:        null, // guest booking — no auth required for CRM smoke
      clientName:      UA_NAMES[i % UA_NAMES.length],
      clientPhone:     randomPhone(),
      date:            fmtDate(date),
      startTime, endTime, status,
    }));
  }

  // Batch insert (10 at a time)
  for (let i = 0; i < inserts.length; i += 10) {
    await Promise.all(inserts.slice(i, i + 10));
  }
  console.log(`  [seed] 100 guest bookings ✓`);

  // Loyalty program for CRM master (visible on Analytics page)
  await admin.from('loyalty_programs').insert({
    master_id:     masterId,
    name:          'CRM E2E: кожен 3-й',
    target_visits: 3,
    reward_type:   'percent_discount',
    reward_value:  10,
    is_active:     true,
  });

  // Domain-specific CRM relation (used by trigger/status-transition tests).
  await admin.from('client_master_relations').upsert(
    {
      client_id: clientId,
      master_id: masterId,
      total_visits: 3,
      total_spent: 1_800,
      average_check: 600,
      last_visit_at: new Date().toISOString(),
      is_vip: false,
      loyalty_points: 0,
    },
    { onConflict: 'client_id,master_id' },
  );

  console.log(`  [seed] CrmMaster ✓`);
}

/**
 * AuthMaster
 *
 * Minimal seed — auth guard tests only need a working master profile.
 * Tests verify redirect behaviour (no bookings needed).
 */
async function seedAuthMaster(masterId: string): Promise<void> {
  console.log('\n[seed] AuthMaster (minimal)...');
  await upsertScheduleTemplates(masterId);
  await ensureService(masterId, FIXTURE_CONTRACT.services.auth, 300, 45);
  console.log(`  [seed] AuthMaster ✓`);
}

/**
 * ReferralMaster
 *
 * Seeds a deterministic referral_code on the master profile.
 * Tests verify /invite/[code] → cookie capture → referral stored after auth.
 */
async function seedReferralMaster(masterId: string): Promise<string> {
  console.log('\n[seed] ReferralMaster...');

  // Canonical deterministic code required by e2e referral fixtures.
  const referralCode = FIXTURE_CONTRACT.referralCode;

  const { error } = await admin
    .from('master_profiles')
    .update({ referral_code: referralCode })
    .eq('id', masterId);

  if (error) throw new Error(`referral_code update: ${error.message}`);

  await upsertScheduleTemplates(masterId);
  await ensureService(masterId, FIXTURE_CONTRACT.services.referral, 400, 60);

  console.log(`  [seed] ReferralMaster ✓ (code: ${referralCode})`);
  return referralCode;
}

/**
 * StudioAdmin
 *
 * Foundation seed — Studio feature is WIP.
 * storageState is cached by global.setup.ts; no test specs yet.
 * Seeding here ensures the account is ready when Studio tests are written.
 */
async function seedStudioAdmin(masterId: string): Promise<void> {
  console.log('\n[seed] StudioAdmin (foundation)...');
  await upsertScheduleTemplates(masterId);
  await ensureService(masterId, FIXTURE_CONTRACT.services.studio, 1_000, 90);
  console.log(`  [seed] StudioAdmin ✓`);
}

// ─── Post-seed verification ───────────────────────────────────────────────────

async function verifySeedIntegrity(input: {
  timeTravelMasterId: string;
  crmMasterId: string;
  referralMasterId: string;
  referralCode: string;
  clientTimeTravelId: string;
  clientCrmId: string;
}): Promise<void> {
  console.log('\n[verify] Running post-seed integrity checks...');

  const [
    referralMaster,
    timeTravelPricing,
    timeTravelLoyalty,
    timeTravelRelation,
    crmRelation,
    crmBookings,
  ] = await Promise.all([
    admin
      .from('master_profiles')
      .select('id, slug, referral_code')
      .eq('id', input.referralMasterId)
      .single(),
    admin
      .from('master_profiles')
      .select('pricing_rules')
      .eq('id', input.timeTravelMasterId)
      .single(),
    admin
      .from('loyalty_programs')
      .select('id')
      .eq('master_id', input.timeTravelMasterId),
    admin
      .from('client_master_relations')
      .select('total_visits')
      .eq('master_id', input.timeTravelMasterId)
      .eq('client_id', input.clientTimeTravelId)
      .maybeSingle(),
    admin
      .from('client_master_relations')
      .select('total_visits')
      .eq('master_id', input.crmMasterId)
      .eq('client_id', input.clientCrmId)
      .maybeSingle(),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', input.crmMasterId),
  ]);

  if (referralMaster.error || !referralMaster.data) {
    throw new Error(`[verify] referral master missing: ${referralMaster.error?.message}`);
  }
  if (referralMaster.data.referral_code !== input.referralCode) {
    throw new Error(
      `[verify] referral code mismatch: got "${referralMaster.data.referral_code}", expected "${input.referralCode}"`,
    );
  }

  if (timeTravelPricing.error || !timeTravelPricing.data?.pricing_rules) {
    throw new Error(`[verify] missing pricing_rules for timetravel master`);
  }

  if (timeTravelLoyalty.error || (timeTravelLoyalty.data ?? []).length === 0) {
    throw new Error(`[verify] missing loyalty program for timetravel master`);
  }

  if (timeTravelRelation.error || !timeTravelRelation.data) {
    throw new Error(`[verify] missing client_master_relations for timetravel domain`);
  }

  if (crmRelation.error || !crmRelation.data) {
    throw new Error(`[verify] missing client_master_relations for CRM domain`);
  }

  if (crmBookings.error || (crmBookings.count ?? 0) < 100) {
    throw new Error(`[verify] CRM bookings count is too low: ${crmBookings.count ?? 0}`);
  }

  console.log('  [verify] ✓ Integrity checks passed');
}

// ─── Runtime ID export ────────────────────────────────────────────────────────

function writeRuntimeEnv(ids: Record<string, string>): void {
  const lines = [
    '# Auto-generated by scripts/seed-e2e-data.ts',
    `# Generated: ${new Date().toISOString()}`,
    '# DO NOT EDIT MANUALLY — re-run the seeder to regenerate',
    '',
    ...Object.entries(ids).map(([k, v]) => `${k}=${v}`),
    '',
  ];

  const outPath = path.join(process.cwd(), '.env.test.runtime');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\n[seed] Runtime IDs → ${outPath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('  BookIT E2E Seeder');
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log('══════════════════════════════════════════');

  // ── Step 1: Resolve/create auth users ──────────────────────────────────────
  console.log('\n[step 1] Resolving auth users...');
  const [
    timeTravelId,
    crmId,
    authId,
    referralId,
    clientTimeTravelId,
    clientCrmId,
    clientAuthId,
    clientReferralId,
    studioAdminId,
  ] =
    await Promise.all([
      getOrCreateUser(ACCOUNTS.masterTimeTravel, 'E2E TimeTravelMaster'),
      getOrCreateUser(ACCOUNTS.masterCrm,        'E2E CrmMaster'),
      getOrCreateUser(ACCOUNTS.masterAuth,        'E2E AuthMaster'),
      getOrCreateUser(ACCOUNTS.masterReferral,    'E2E ReferralMaster'),
      getOrCreateUser(ACCOUNTS.clientTimeTravel,  'E2E TimeTravelClient'),
      getOrCreateUser(ACCOUNTS.clientCrm,         'E2E CrmClient'),
      getOrCreateUser(ACCOUNTS.clientAuth,        'E2E AuthClient'),
      getOrCreateUser(ACCOUNTS.clientReferral,    'E2E ReferralClient'),
      getOrCreateUser(ACCOUNTS.studioAdmin,       'E2E StudioAdmin'),
    ]);

  // ── Step 2: Upsert profiles ────────────────────────────────────────────────
  console.log('\n[step 2] Upserting profiles...');
  await Promise.all([
    upsertProfile(timeTravelId,  ACCOUNTS.masterTimeTravel, 'E2E TimeTravelMaster', 'master', '+380501111111'),
    upsertProfile(crmId,         ACCOUNTS.masterCrm,        'E2E CrmMaster',        'master', '+380502222222'),
    upsertProfile(authId,        ACCOUNTS.masterAuth,       'E2E AuthMaster',       'master', '+380503333333'),
    upsertProfile(referralId,    ACCOUNTS.masterReferral,   'E2E ReferralMaster',   'master', '+380504444444'),
    upsertProfile(clientTimeTravelId, ACCOUNTS.clientTimeTravel, 'E2E TimeTravelClient', 'client', '+380991111111'),
    upsertProfile(clientCrmId,        ACCOUNTS.clientCrm,        'E2E CrmClient',        'client', '+380992222222'),
    upsertProfile(clientAuthId,       ACCOUNTS.clientAuth,       'E2E AuthClient',       'client', '+380993333333'),
    upsertProfile(clientReferralId,   ACCOUNTS.clientReferral,   'E2E ReferralClient',   'client', '+380994444444'),
    upsertProfile(studioAdminId, ACCOUNTS.studioAdmin,      'E2E StudioAdmin',      'master', '+380500000000'),
  ]);

  // ── Step 3: Upsert master_profiles ────────────────────────────────────────
  console.log('\n[step 3] Upserting master_profiles...');
  await Promise.all([
    upsertMasterProfile(timeTravelId,  SLUGS.timeTravelMaster, 'E2E TimeTravel Studio', 'pro'),
    upsertMasterProfile(crmId,         SLUGS.crmMaster,        'E2E CRM Studio',        'pro'),
    upsertMasterProfile(authId,        SLUGS.authMaster,       'E2E Auth Studio',       'starter'),
    upsertMasterProfile(referralId,    SLUGS.referralMaster,   'E2E Referral Studio',   'pro'),
    upsertMasterProfile(studioAdminId, SLUGS.studioAdmin,      'E2E Studio Admin',      'studio'),
  ]);

  // Client profile (separate table from master_profiles)
  await Promise.all([
    upsertClientProfile(clientTimeTravelId),
    upsertClientProfile(clientCrmId),
    upsertClientProfile(clientAuthId),
    upsertClientProfile(clientReferralId),
  ]);

  // ── Step 4: Wipe existing E2E transactional data ───────────────────────────
  console.log('\n[step 4] Wiping stale E2E data...');
  await wipeMasterData(
    [timeTravelId, crmId, authId, referralId, studioAdminId],
    [clientTimeTravelId, clientCrmId, clientAuthId, clientReferralId],
  );

  // ── Step 5: Seed per domain ────────────────────────────────────────────────
  console.log('\n[step 5] Seeding domain data...');
  // TimeTravelMaster has the most work — run first, sequentially
  await seedTimeTravelMaster(timeTravelId, clientTimeTravelId);

  // Remaining domains are independent — run in parallel
  const [referralCode] = await Promise.all([
    seedReferralMaster(referralId),
    seedCrmMaster(crmId, clientCrmId),
    seedAuthMaster(authId),
    seedStudioAdmin(studioAdminId),
  ]);

  await verifySeedIntegrity({
    timeTravelMasterId: timeTravelId,
    crmMasterId: crmId,
    referralMasterId: referralId,
    referralCode,
    clientTimeTravelId,
    clientCrmId,
  });

  // ── Step 6: Write runtime IDs ──────────────────────────────────────────────
  writeRuntimeEnv({
    E2E_MASTER_TIMETRAVEL_ID:   timeTravelId,
    E2E_MASTER_TIMETRAVEL_SLUG: SLUGS.timeTravelMaster,
    E2E_MASTER_CRM_ID:          crmId,
    E2E_MASTER_CRM_SLUG:        SLUGS.crmMaster,
    E2E_MASTER_AUTH_ID:         authId,
    E2E_MASTER_AUTH_SLUG:       SLUGS.authMaster,
    E2E_MASTER_REFERRAL_ID:     referralId,
    E2E_MASTER_REFERRAL_SLUG:   SLUGS.referralMaster,
    E2E_MASTER_REFERRAL_CODE:   referralCode,
    E2E_CLIENT_TIMETRAVEL_ID:   clientTimeTravelId,
    E2E_CLIENT_CRM_ID:          clientCrmId,
    E2E_CLIENT_AUTH_ID:         clientAuthId,
    E2E_CLIENT_REFERRAL_ID:     clientReferralId,
    E2E_STUDIO_ADMIN_ID:        studioAdminId,
    E2E_STUDIO_ADMIN_SLUG:      SLUGS.studioAdmin,
    // Backward-compatible aliases used by older specs (kept deterministic).
    E2E_MASTER_ID:              crmId,
    E2E_MASTER_SLUG:            SLUGS.crmMaster,
    // Fix: point E2E_CLIENT_ID to the Time Travel client to match E2E_CLIENT_EMAIL in CI.
    E2E_CLIENT_ID:              clientTimeTravelId,
  });

  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('  ✓ Seeding complete!');
  console.log('  Run: npx playwright test');
  console.log('══════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n[seeder] FATAL:', err.message);
  process.exit(1);
});
