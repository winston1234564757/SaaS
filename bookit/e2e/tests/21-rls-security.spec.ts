import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * RLS / cross-tenant isolation — Milestone 2 (Database Security, DOMAIN_MAP 14).
 *
 * These run as REAL authenticated users via the anon key + signInWithPassword —
 * never the service-role key (which bypasses RLS). They assert the crown-jewel
 * isolations whose breach would be catastrophic for a multi-tenant SaaS:
 * a master must never read another master's data; an anonymous visitor must never
 * read private tables. Verified green against the seeded accounts on 2026-07-07.
 *
 * Requires seeded e2e accounts (npm run test:e2e:seed) + env from .env.test(.runtime).
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const PASSWORD = process.env.E2E_SEED_PASSWORD ?? 'E2E_Bookit_Test_2026!';

const MASTER_CRM_EMAIL = process.env.E2E_MASTER_CRM_EMAIL ?? 'e2e_master_crm@test.com';
const MASTER_CRM_ID = process.env.E2E_MASTER_CRM_ID ?? '';
const MASTER_AUTH_ID = process.env.E2E_MASTER_AUTH_ID ?? '';

const envReady = Boolean(URL && ANON && MASTER_CRM_ID && MASTER_AUTH_ID);

function anonClient(): SupabaseClient {
  return createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signIn(email: string): Promise<SupabaseClient | null> {
  const sb = anonClient();
  const { error } = await sb.auth.signInWithPassword({ email, password: PASSWORD });
  return error ? null : sb;
}

test.describe('RLS — cross-tenant isolation', () => {
  test.skip(!envReady, 'Seeded RLS env (.env.test.runtime IDs) not present');

  let crm: SupabaseClient | null;

  test.beforeAll(async () => {
    crm = await signIn(MASTER_CRM_EMAIL);
  });

  test('master cannot read another master bookings', async () => {
    test.skip(!crm, 'master_crm sign-in failed (accounts not seeded)');
    const { data } = await crm!.from('bookings').select('id').eq('master_id', MASTER_AUTH_ID).limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  test('master cannot read another master client relations', async () => {
    test.skip(!crm, 'master_crm sign-in failed');
    const { data } = await crm!.from('client_master_relations').select('id').eq('master_id', MASTER_AUTH_ID).limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  test('master cannot read another master broadcasts', async () => {
    test.skip(!crm, 'master_crm sign-in failed');
    const { data } = await crm!.from('broadcasts').select('id').eq('master_id', MASTER_AUTH_ID).limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  test('master cannot read foreign payments', async () => {
    test.skip(!crm, 'master_crm sign-in failed');
    const { data } = await crm!.from('payments').select('id').neq('master_id', MASTER_CRM_ID).limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  test('master CAN read own bookings (RLS not over-blocking)', async () => {
    test.skip(!crm, 'master_crm sign-in failed');
    const { error } = await crm!.from('bookings').select('id').eq('master_id', MASTER_CRM_ID).limit(5);
    expect(error).toBeNull();
  });
});

test.describe('RLS — anonymous visitor', () => {
  test.skip(!envReady, 'Seeded RLS env not present');

  test('anon cannot read bookings', async () => {
    const { data } = await anonClient().from('bookings').select('id').limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  test('anon cannot read notification_logs', async () => {
    const { data } = await anonClient().from('notification_logs').select('id').limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  test('anon CAN read public services (catalog sanity)', async () => {
    const { error } = await anonClient().from('services').select('id').limit(5);
    expect(error).toBeNull();
  });
});
