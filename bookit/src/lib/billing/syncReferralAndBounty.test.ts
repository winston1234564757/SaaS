import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncReferralAndBounty } from './syncReferralAndBounty';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }));

type MockResult = { data?: unknown; error?: unknown; count?: number | null };

function makeChain(r: MockResult = {}): any {
  const resolved = {
    data:  r.data  !== undefined ? r.data  : null,
    error: r.error !== undefined ? r.error : null,
    count: r.count !== undefined ? r.count : null,
  };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'eq', 'lt'];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
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

const REFEREE_ID  = 'rrrrrrrr-0000-4000-8000-000000000001';
const REFERRER_ID = 'eeeeeeee-0000-4000-8000-000000000005';

describe('syncReferralAndBounty', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns early when no referral record found', async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({ master_referrals: [{ data: null }] }) as any,
    );
    await syncReferralAndBounty(REFEREE_ID);
    const admin = vi.mocked(createAdminClient).mock.results[0].value;
    // Only the select query ran — no updates
    expect(admin.from).toHaveBeenCalledTimes(1);
  });

  it('marks referral as active and pays first-payment bounty', async () => {
    const tables = {
      master_referrals: [
        { data: { referrer_id: REFERRER_ID, is_first_payment_made: false } },
        { error: null },               // update status → active
        { error: null, count: 5 },     // count active refs (head query)
      ],
      master_profiles: [{ error: null }],
    };
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(tables) as any);
    await syncReferralAndBounty(REFEREE_ID);

    const admin = vi.mocked(createAdminClient).mock.results[0].value;
    expect(admin.from).toHaveBeenCalledWith('master_referrals');
    expect(admin.rpc).toHaveBeenCalledWith('increment_discount_reserve', {
      p_master_id: REFERRER_ID,
      p_amount: 0.10,
    });
  });

  it('skips first-payment bounty when already paid (idempotent)', async () => {
    const tables = {
      master_referrals: [
        { data: { referrer_id: REFERRER_ID, is_first_payment_made: true } },
        { error: null },               // update status
        { count: 3 },
      ],
      master_profiles: [{ error: null }],
    };
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(tables) as any);
    await syncReferralAndBounty(REFEREE_ID);

    const admin = vi.mocked(createAdminClient).mock.results[0].value;
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it('handles zero active referrals gracefully', async () => {
    const tables = {
      master_referrals: [
        { data: { referrer_id: REFERRER_ID, is_first_payment_made: false } },
        { error: null },
        { error: null, count: 0 },
      ],
      master_profiles: [{ error: null }],
    };
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(tables) as any);
    await expect(syncReferralAndBounty(REFEREE_ID)).resolves.toBeUndefined();
  });
});
