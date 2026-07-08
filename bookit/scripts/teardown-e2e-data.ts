/**
 * BookIT E2E Teardown — scripts/teardown-e2e-data.ts
 *
 * Deletes ALL e2e_*@test.com accounts and their owned data. Use to remove the
 * test footprint after a run (esp. after an authorized one-off prod run, SEC-01).
 *
 * Scope: strictly the e2e_*@test.com auth users (E2E_EMAIL_PATTERN) and rows
 * keyed by their IDs. Never touches real accounts.
 *
 * Run:  E2E_SEED_CONFIRM_PROD_REF=<ref> npx tsx scripts/teardown-e2e-data.ts   (prod)
 *   or  npx tsx scripts/teardown-e2e-data.ts                                    (local)
 */

import { config } from 'dotenv';
config({ path: '.env.test', override: true });
config({ path: '.env.local' });

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { findProdRef } from '../src/lib/testing/e2eSeedGuard';

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const ALLOW_REMOTE     = process.env.E2E_ALLOW_REMOTE === 'true';
const E2E_EMAIL_PATTERN = /^e2e_.+@test\.com$/;

function assertSafe(): void {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('SAFETY: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  const prodRef = findProdRef(SUPABASE_URL);
  if (prodRef && process.env.E2E_SEED_CONFIRM_PROD_REF !== prodRef) {
    throw new Error(
      `SAFETY ABORT (HARD): "${SUPABASE_URL}" targets PRODUCTION ref "${prodRef}".\n` +
      `To deliberately clean e2e_* data on prod, set E2E_SEED_CONFIRM_PROD_REF="${prodRef}".`,
    );
  }
  if (prodRef) {
    console.warn(`\n⚠️  DELIBERATE PROD TEARDOWN — removing e2e_*@test.com accounts on "${prodRef}".\n`);
  }
  const isLocal = SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost');
  if (!isLocal && !prodRef && !ALLOW_REMOTE) {
    throw new Error(`SAFETY ABORT: "${SUPABASE_URL}" looks remote. Set E2E_ALLOW_REMOTE=true to override.`);
  }
}

assertSafe();

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function listE2EUsers(): Promise<{ id: string; email: string }[]> {
  const out: { id: string; email: string }[] = [];
  let page = 1;
  // Paginate through auth users; filter e2e_*@test.com only.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const users = data.users ?? [];
    for (const u of users) {
      if (u.email && E2E_EMAIL_PATTERN.test(u.email)) out.push({ id: u.id, email: u.email });
    }
    if (users.length < 1000) break;
    page += 1;
  }
  return out;
}

async function main(): Promise<void> {
  console.log('[teardown] Enumerating e2e_*@test.com accounts...');
  const users = await listE2EUsers();
  if (users.length === 0) {
    console.log('[teardown] No e2e_* accounts found — nothing to do.');
    return;
  }
  const ids = users.map((u) => u.id);
  console.log(`[teardown] Found ${users.length} e2e accounts:`);
  users.forEach((u) => console.log(`   • ${u.email}  (${u.id})`));

  // 1. Collect bookings owned by these accounts (as master OR client) → delete children first.
  const { data: bMaster } = await admin.from('bookings').select('id').in('master_id', ids);
  const { data: bClient } = await admin.from('bookings').select('id').in('client_id', ids);
  const bookingIds = [...new Set([...(bMaster ?? []), ...(bClient ?? [])].map((b) => b.id))];
  if (bookingIds.length > 0) {
    await admin.from('booking_services').delete().in('booking_id', bookingIds);
    await admin.from('booking_products').delete().in('booking_id', bookingIds);
    console.log(`[teardown] booking children cleaned for ${bookingIds.length} bookings`);
  }

  // 2. Delete rows keyed by these account IDs across all owned tables.
  const byMaster = [
    'bookings', 'loyalty_programs', 'client_master_relations', 'reviews',
    'master_client_notes', 'flash_deals', 'master_time_off', 'schedule_exceptions',
    'services', 'products', 'schedule_templates',
  ];
  for (const t of byMaster) {
    const { error } = await admin.from(t).delete().in('master_id', ids);
    if (error && !/column .* does not exist/i.test(error.message)) {
      console.warn(`   [warn] ${t} by master_id: ${error.message}`);
    }
  }
  const byClient = ['client_master_relations', 'reviews'];
  for (const t of byClient) {
    await admin.from(t).delete().in('client_id', ids);
  }
  await admin.from('notifications').delete().in('recipient_id', ids);
  console.log('[teardown] owned rows deleted');

  // 3. Delete profile rows, then the auth users (cascades anything with ON DELETE CASCADE).
  await admin.from('master_profiles').delete().in('id', ids);
  await admin.from('client_profiles').delete().in('id', ids);
  await admin.from('profiles').delete().in('id', ids);

  let deleted = 0;
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.warn(`   [warn] deleteUser ${u.email}: ${error.message}`);
    else deleted += 1;
  }
  console.log(`[teardown] ✓ Deleted ${deleted}/${users.length} auth users + their data.`);
}

main().catch((e) => {
  console.error('[teardown] FAILED:', e);
  process.exit(1);
});
