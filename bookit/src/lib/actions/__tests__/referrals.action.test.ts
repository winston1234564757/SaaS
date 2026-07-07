/**
 * Integration tests for referrals.ts server actions.
 * Tests the real exported functions with mocked Supabase clients.
 *
 * Covered functions:
 *   getOrGenerateProfileReferralCode — 5 tests
 *   getOrCreateReferralLink          — 3 tests
 *   applyReferralRewards             — 5 tests
 *   checkC2cEligibility              — 4 tests
 *   checkAmbassadorStatus            — 2 tests
 *                                    = 19 total
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrGenerateProfileReferralCode,
  getOrCreateReferralLink,
  applyReferralRewards,
  checkC2cEligibility,
  checkAmbassadorStatus,
} from '../referrals';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Module mocks ───────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/admin',  () => ({ createAdminClient: vi.fn() }));

// ── Supabase chain mock ────────────────────────────────────────────────────────
//
// Same architecture as createBooking.action.test.ts:
//   makeChain(result) — chainable + directly awaitable query builder
//   makeAdmin(tables) — per-table call-queue admin mock

type MockResult = { data?: unknown; error?: unknown; count?: number | null };

function makeChain(r: MockResult = {}): any {
  const resolved = {
    data:  r.data  !== undefined ? r.data  : null,
    error: r.error !== undefined ? r.error : null,
    count: r.count !== undefined ? r.count : null,
  };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gte', 'gt', 'is', 'not', 'limit', 'order', 'or',
  ];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  chain.single      = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);
  chain.then        = p.then.bind(p);
  chain.catch       = p.catch.bind(p);
  chain.finally     = p.finally.bind(p);
  return chain;
}

function makeAdmin(tables: Record<string, MockResult[]> = {}): any {
  const idx: Record<string, number> = {};
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const queue = tables[table] ?? [{}];
      const i     = idx[table] ?? 0;
      idx[table]  = i + 1;
      return makeChain(queue[Math.min(i, queue.length - 1)]);
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

const MASTER_ID   = 'aaaaaaaa-0000-4000-8000-000000000001';
const CLIENT_ID   = 'cccccccc-0000-4000-8000-000000000003';
const REFERRER_ID = 'eeeeeeee-0000-4000-8000-000000000005';

function mockAuthUser(userId: string): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
  } as any);
}

function mockNoUser(): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  } as any);
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('referrals — server action integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getOrGenerateProfileReferralCode ─────────────────────────────────────────

  describe('getOrGenerateProfileReferralCode', () => {
    it('returns Unauthorized when no active session exists', async () => {
      mockNoUser();
      vi.mocked(createAdminClient).mockReturnValue(makeAdmin() as any);
      const result = await getOrGenerateProfileReferralCode(MASTER_ID, 'master');
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns Unauthorized when authenticated user ID does not match the requested profile ID', async () => {
      mockAuthUser('some-other-user-id');
      vi.mocked(createAdminClient).mockReturnValue(makeAdmin() as any);
      const result = await getOrGenerateProfileReferralCode(MASTER_ID, 'master');
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns the existing code without generating a new one when referral_code is already set', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ master_profiles: [{ data: { referral_code: 'EXIST1' } }] }) as any,
      );
      const result = await getOrGenerateProfileReferralCode(MASTER_ID, 'master');
      expect(result).toEqual({ success: true, code: 'EXIST1' });
    });

    it('generates and returns a new 6-character alphanumeric code when no code exists', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [
            { data: { referral_code: null } },  // select: no existing code
            { error: null },                    // update attempt 1: success
          ],
        }) as any,
      );
      const result = await getOrGenerateProfileReferralCode(MASTER_ID, 'master');
      expect(result.success).toBe(true);
      expect(result.code).toMatch(/^[a-zA-Z0-9]{6}$/);
    });

    it('retries generation on 23505 unique violation and succeeds on the next attempt', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [
            { data: { referral_code: null } },   // select: no existing code
            { error: { code: '23505' } },        // update attempt 1: collision
            { error: null },                     // update attempt 2: success
          ],
        }) as any,
      );
      const result = await getOrGenerateProfileReferralCode(MASTER_ID, 'master');
      expect(result.success).toBe(true);
      expect(result.code).toMatch(/^[a-zA-Z0-9]{6}$/);
    });
  });

  // ── getOrCreateReferralLink ──────────────────────────────────────────────────

  describe('getOrCreateReferralLink', () => {
    it('returns a B2B invite link using the master referral code from the profile', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ master_profiles: [{ data: { referral_code: 'MSTR01' } }] }) as any,
      );
      const result = await getOrCreateReferralLink(MASTER_ID, 'master', 'B2B');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.code).toBe('MSTR01');
        expect(result.link).toContain('/invite/MSTR01');
      }
    });

    it('returns a C2C booking link composed of master slug and client referral code', async () => {
      mockAuthUser(CLIENT_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          // client_profiles for getOrGenerateProfileReferralCode(CLIENT_ID, 'client').
          // C2C reads the c2c_referral_code column (not referral_code) — an existing
          // code is reused verbatim in the link.
          client_profiles: [{ data: { c2c_referral_code: 'CLI001' } }],
          // master_profiles for the slug lookup
          master_profiles: [{ data: { slug: 'master-anna' } }],
        }) as any,
      );
      const result = await getOrCreateReferralLink(CLIENT_ID, 'client', 'C2C', MASTER_ID);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.link).toContain('master-anna');
        expect(result.link).toContain('ref=CLI001');
      }
    });

    it('returns an error for C2C when targetMasterId is omitted', async () => {
      mockAuthUser(CLIENT_ID);
      vi.mocked(createAdminClient).mockReturnValue(makeAdmin() as any);
      const result = await getOrCreateReferralLink(CLIENT_ID, 'client', 'C2C');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('masterId');
      }
    });
  });

  // ── applyReferralRewards ─────────────────────────────────────────────────────

  describe('applyReferralRewards', () => {
    it('returns starter bonus immediately when the code is shorter than 3 characters (regex reject)', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(makeAdmin() as any);
      const result = await applyReferralRewards(MASTER_ID, 'AB'); // 2 chars → fails /^[a-zA-Z0-9]{3,16}$/
      expect(result.subscriptionTier).toBe('starter');
      expect(result.finalReferredBy).toBeNull();
    });

    it('returns starter bonus when the code matches no master or client profile', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          referral_grants: [{ data: null }],  // no existing grant
          master_profiles: [{ data: null }],  // no master referrer (Promise.all[0])
          client_profiles: [{ data: null }],  // no client referrer (Promise.all[1])
        }) as any,
      );
      const result = await applyReferralRewards(MASTER_ID, 'NOBODY');
      expect(result.subscriptionTier).toBe('starter');
      expect(result.subscriptionExpiresAt).toBeNull();
      expect(result.finalReferredBy).toBeNull();
    });

    it('awards M2M: gives the new master a 14-day Pro trial and extends the referrer +30 days', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          referral_grants:  [{ data: null }, { error: null }],
          // master_profiles[0] = Promise.all select (referrer found)
          // master_profiles[1] = Promise.all update (referrer +30d subscription)
          master_profiles:  [
            { data: { id: REFERRER_ID, subscription_expires_at: null } },
            { error: null },
          ],
          client_profiles:    [{ data: null }],  // no client referrer
          master_connections: [{ error: null }],  // M-GROW-02: alliance тепер тут
          master_referrals:   [{ error: null }],
        }) as any,
      );
      const result = await applyReferralRewards(MASTER_ID, 'M2MREF');
      expect(result.subscriptionTier).toBe('pro');
      expect(result.finalReferredBy).toBe('M2MREF');
      // subscriptionExpiresAt should be roughly 14 days from now
      const expiresAt    = new Date(result.subscriptionExpiresAt!);
      const daysFromNow  = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysFromNow).toBeGreaterThan(12);
      expect(daysFromNow).toBeLessThan(16);
    });

    it('awards C2B: gives the new master a 21-day Pro trial and creates a client promo', async () => {
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          referral_grants:   [{ data: null }, { error: null }],
          master_profiles:   [{ data: null }],               // no master referrer
          client_profiles:   [{ data: { id: REFERRER_ID } }],// client referrer found
          client_promocodes: [{ error: null }],              // promo insert
        }) as any,
      );
      const result = await applyReferralRewards(MASTER_ID, 'C2BREF');
      expect(result.subscriptionTier).toBe('pro');
      expect(result.finalReferredBy).toBe('C2BREF');
      // subscriptionExpiresAt should be roughly 21 days from now (C2B trial, founder-confirmed)
      const expiresAt   = new Date(result.subscriptionExpiresAt!);
      const daysFromNow = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysFromNow).toBeGreaterThan(18);
      expect(daysFromNow).toBeLessThan(24);
    });

    it('returns the existing Pro bonus without re-awarding when referral_grants row already exists (idempotent)', async () => {
      const grantedAt = new Date().toISOString();
      mockAuthUser(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          // existing grant found → idempotent path
          referral_grants: [{ data: { id: 'grant-1', ref_code: 'EXISTR', granted_at: grantedAt } }],
          // Promise.all: determine referrer type
          master_profiles: [{ data: { id: REFERRER_ID } }], // M2M referrer
          client_profiles: [{ data: null }],
          // check if relationships already exist → both exist → no insert
          master_referrals:  [{ data: { id: 'mr-1' } }],
          master_connections:[{ data: { id: 'ma-1' } }],  // M-GROW-02: alliance check тепер тут
        }) as any,
      );
      const result = await applyReferralRewards(MASTER_ID, 'EXISTR');
      expect(result.subscriptionTier).toBe('pro');
      expect(result.finalReferredBy).toBe('EXISTR');
    });
  });

  // ── checkC2cEligibility ──────────────────────────────────────────────────────

  describe('checkC2cEligibility', () => {
    it('returns already_used when no client_profiles row matches the referral code', async () => {
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ client_profiles: [{ data: null }] }) as any,
      );
      const result = await checkC2cEligibility('+380501234567', MASTER_ID, 'NOREF');
      expect(result).toEqual({ eligible: false, reason: 'already_used' });
    });

    it('returns self_referral when the client phone matches the referrer phone on the profiles table', async () => {
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          client_profiles: [{ data: { id: REFERRER_ID } }],
          profiles:        [{ data: { phone: '+380501234567' } }],  // same phone as caller
        }) as any,
      );
      const result = await checkC2cEligibility('+380501234567', MASTER_ID, 'SELF1');
      expect(result).toEqual({ eligible: false, reason: 'self_referral' });
    });

    it('returns already_used when the client has prior bookings with this master', async () => {
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          client_profiles: [{ data: { id: REFERRER_ID } }],
          profiles:        [{ data: { phone: '+380509999999' } }],  // different phone → not self
          bookings:        [{ count: 2 }],                          // 2 prior bookings
        }) as any,
      );
      const result = await checkC2cEligibility('+380501234567', MASTER_ID, 'REF1');
      expect(result).toEqual({ eligible: false, reason: 'already_used' });
    });

    it('returns eligible: true when all conditions pass (new client, not self, no prior referral)', async () => {
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          client_profiles: [{ data: { id: REFERRER_ID } }],
          profiles:        [{ data: { phone: '+380509999999' } }],  // different phone
          bookings:        [{ count: 0 }],                          // no prior bookings
          c2c_referrals:   [{ data: [] }],                          // empty → no existing referral
        }) as any,
      );
      const result = await checkC2cEligibility('+380501234567', MASTER_ID, 'REF1');
      expect(result).toEqual({ eligible: true });
    });
  });

  // ── checkAmbassadorStatus ────────────────────────────────────────────────────

  describe('checkAmbassadorStatus', () => {
    it('returns isAmbassador: false when no profile matches the phone number', async () => {
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ profiles: [{ data: null }] }) as any,
      );
      const result = await checkAmbassadorStatus('+380501234567', MASTER_ID);
      expect(result).toEqual({ isAmbassador: false });
    });

    it('returns isAmbassador: true when the client has an active C2B promo for the master', async () => {
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          profiles:          [{ data: { id: CLIENT_ID } }],
          client_promocodes: [{ data: { id: 'promo-1' } }],
        }) as any,
      );
      const result = await checkAmbassadorStatus('+380501234567', MASTER_ID);
      expect(result).toEqual({ isAmbassador: true });
    });
  });
});
