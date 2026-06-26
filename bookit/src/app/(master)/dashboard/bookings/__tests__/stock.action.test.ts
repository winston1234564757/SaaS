/**
 * Stock-integrity tests for booking server actions.
 *   completeBooking  — idempotency + atomic consumable deduction (P1 #4 / P2 #6, #8)
 *   cancelBooking    — restock retail booking_products on cancel (P1 #3)
 *   updateBookingStatus — restock when the status change is a cancellation (P1 #3)
 *
 * Uses a recording admin mock: per-table result queues + captured insert/update
 * payloads and rpc calls, so we can assert exactly what hit the DB.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeBooking, cancelBooking, updateBookingStatus } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/admin',  () => ({ createAdminClient: vi.fn() }));
vi.mock('next/cache',            () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/notifications', () => ({
  notifyClientOnStatusChange: vi.fn(() => Promise.resolve()),
  notifyClientOnReschedule:   vi.fn(() => Promise.resolve()),
  notifyMasterStockAlert:     vi.fn(() => Promise.resolve()),
}));
vi.mock('@/app/(master)/dashboard/flash/actions', () => ({
  createFlashDealInternal: vi.fn(() => Promise.resolve()),
}));

// ── Recording Supabase mock ─────────────────────────────────────────────────────

type MockResult = { data?: unknown; error?: unknown; count?: number | null };

function makeChain(r: MockResult, rec: { insert: (p: unknown) => void; update: (p: unknown) => void }): any {
  const resolved = { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  for (const m of ['select', 'eq', 'neq', 'in', 'gte', 'gt', 'is', 'not', 'limit', 'order', 'or']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.insert = vi.fn((payload: unknown) => { rec.insert(payload); return chain; });
  chain.update = vi.fn((payload: unknown) => { rec.update(payload); return chain; });
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);
  chain.then = p.then.bind(p);
  chain.catch = p.catch.bind(p);
  chain.finally = p.finally.bind(p);
  return chain;
}

interface AdminMock {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  _inserts: Record<string, unknown[]>;
  _rpcCalls: { name: string; args: unknown }[];
}

function makeAdmin(
  tables: Record<string, MockResult[]> = {},
  rpc: MockResult | ((name: string, args: unknown) => MockResult) = {},
): AdminMock {
  const idx: Record<string, number> = {};
  const inserts: Record<string, unknown[]> = {};
  const rpcCalls: { name: string; args: unknown }[] = [];
  return {
    _inserts: inserts,
    _rpcCalls: rpcCalls,
    from: vi.fn((t: string) => {
      const q = tables[t] ?? [{}];
      const i = idx[t] ?? 0;
      idx[t] = i + 1;
      return makeChain(q[Math.min(i, q.length - 1)], {
        insert: (p) => { (inserts[t] ??= []).push(p); },
        update: () => {},
      });
    }),
    rpc: vi.fn((name: string, args: unknown) => {
      rpcCalls.push({ name, args });
      const r = typeof rpc === 'function' ? rpc(name, args) : rpc;
      return Promise.resolve({ data: r.data ?? null, error: r.error ?? null });
    }),
  };
}

const MASTER_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const OTHER_ID  = 'ffffffff-0000-4000-8000-000000000099';
const PROD_ID   = 'dddddddd-0000-4000-8000-000000000004';

function mockUser(id: string | null): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: id ? { id } : null } }) },
  } as any);
}

const BASE_BOOKING = {
  master_id: MASTER_ID,
  client_id: null,
  date: '2026-01-15',
  start_time: '10:00',
  booking_services: [],
  master_profiles: null,
};

beforeEach(() => vi.clearAllMocks());

// ── completeBooking ─────────────────────────────────────────────────────────────

describe('completeBooking — idempotency + atomic deduction', () => {
  it('rejects an unauthenticated caller', async () => {
    mockUser(null);
    const res = await completeBooking('b1', []);
    expect(res.error).toBe('Не авторизовано');
  });

  it('rejects a caller who is not the booking master', async () => {
    mockUser(OTHER_ID);
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({ bookings: [{ data: { ...BASE_BOOKING, status: 'confirmed' } }] }) as any,
    );
    const res = await completeBooking('b1', []);
    expect(res.error).toBe('Немає доступу');
  });

  it('is a no-op for stock when the booking is already completed (no double deduction)', async () => {
    mockUser(MASTER_ID);
    const admin = makeAdmin({ bookings: [{ data: { ...BASE_BOOKING, status: 'completed' } }] });
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const res = await completeBooking('b1', [{ product_id: PROD_ID, qty_used: 3 }]);

    expect(res.error).toBeNull();
    expect(admin._rpcCalls).toHaveLength(0);            // deduct RPC never called
    expect(admin._inserts['product_transactions']).toBeUndefined();
  });

  it('deducts consumables atomically and writes a deduction-typed ledger row matching the actual amount', async () => {
    mockUser(MASTER_ID);
    const admin = makeAdmin(
      {
        bookings: [{ data: { ...BASE_BOOKING, status: 'confirmed' } }, { error: null }],
        products: [{ data: { name: 'Гель', stock_alert_threshold: 3 } }],
      },
      { data: [{ deducted: 3, new_stock: 1 }] }, // atomic RPC result
    );
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const res = await completeBooking('b1', [{ product_id: PROD_ID, qty_used: 3 }]);

    expect(res.error).toBeNull();
    // atomic RPC used (not read-modify-write)
    expect(admin._rpcCalls).toContainEqual({
      name: 'deduct_consumable_stock',
      args: { p_product_id: PROD_ID, p_qty: 3 },
    });
    // ledger row uses the actual deducted amount + dedicated type
    expect(admin._inserts['product_transactions']?.[0]).toMatchObject({
      product_id: PROD_ID,
      type: 'deduction',
      qty_delta: -3,
    });
  });

  it('skips deduction entirely when the master explicitly passes an empty list', async () => {
    mockUser(MASTER_ID);
    const admin = makeAdmin({
      bookings: [{ data: { ...BASE_BOOKING, status: 'confirmed' } }, { error: null }],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const res = await completeBooking('b1', []);

    expect(res.error).toBeNull();
    expect(admin._rpcCalls).toHaveLength(0);
  });
});

// ── cancelBooking ───────────────────────────────────────────────────────────────

describe('cancelBooking — restock retail products', () => {
  it('returns each booking_product to stock and writes a return ledger row', async () => {
    mockUser(MASTER_ID);
    const admin = makeAdmin({
      bookings: [{ data: { ...BASE_BOOKING, status: 'confirmed' } }, { error: null }],
      master_profiles: [{ data: { subscription_tier: 'pro', slug: 's', auto_flash_on_cancel: false, auto_flash_discount_pct: 0 } }],
      booking_products: [{ data: [{ product_id: PROD_ID, quantity: 2 }] }],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const res = await cancelBooking('b1');

    expect(res.error).toBeNull();
    expect(admin._rpcCalls).toContainEqual({
      name: 'increment_stock',
      args: { p_product_id: PROD_ID, p_qty: 2 },
    });
    expect(admin._inserts['product_transactions']?.[0]).toMatchObject({
      product_id: PROD_ID,
      type: 'return',
      qty_delta: 2,
    });
  });

  it('does not restock when the booking is not in a cancellable status', async () => {
    mockUser(MASTER_ID);
    const admin = makeAdmin({
      bookings: [{ data: { ...BASE_BOOKING, status: 'completed' } }],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const res = await cancelBooking('b1');

    expect(res.error).toBe('Запис вже завершено або скасовано.');
    expect(admin._rpcCalls).toHaveLength(0);
  });
});

// ── updateBookingStatus ─────────────────────────────────────────────────────────

describe('updateBookingStatus — restock only on cancellation', () => {
  it('restocks retail products when the new status is cancelled', async () => {
    mockUser(MASTER_ID);
    const admin = makeAdmin({
      bookings: [{ data: { ...BASE_BOOKING, status: 'confirmed' } }, { error: null }],
      booking_products: [{ data: [{ product_id: PROD_ID, quantity: 1 }] }],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const res = await updateBookingStatus('b1', 'cancelled');

    expect(res.error).toBeNull();
    expect(admin._rpcCalls).toContainEqual({
      name: 'increment_stock',
      args: { p_product_id: PROD_ID, p_qty: 1 },
    });
  });

  it('does not restock for a non-cancel status change', async () => {
    mockUser(MASTER_ID);
    const admin = makeAdmin({
      bookings: [{ data: { ...BASE_BOOKING, status: 'pending' } }, { error: null }],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const res = await updateBookingStatus('b1', 'confirmed');

    expect(res.error).toBeNull();
    expect(admin.from).not.toHaveBeenCalledWith('booking_products');
    expect(admin._rpcCalls).toHaveLength(0);
  });
});
