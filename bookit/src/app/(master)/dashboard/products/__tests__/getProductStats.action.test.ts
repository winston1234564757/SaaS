/**
 * getProductStats — per-product sales analytics (M-SHOP-01 + audit fix #5).
 * Verifies BOTH sales channels are counted: shop orders (order_items) AND
 * products sold during a booking (booking_products), plus profit/margin math
 * and the ownership guard.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProductStats } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/admin',  () => ({ createAdminClient: vi.fn() }));
vi.mock('next/cache',            () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/notifications', () => ({
  notifyMasterNewOrder:    vi.fn(() => Promise.resolve()),
  notifyMasterStockAlert:  vi.fn(() => Promise.resolve()),
  notifyClientOrderStatus: vi.fn(() => Promise.resolve()),
}));

type MockResult = { data?: unknown; error?: unknown };

function makeChain(r: MockResult): any {
  const resolved = { data: r.data ?? null, error: r.error ?? null };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  for (const m of ['select', 'eq', 'neq', 'in', 'gte', 'gt', 'is', 'not', 'limit', 'order']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);
  chain.then = p.then.bind(p);
  chain.catch = p.catch.bind(p);
  chain.finally = p.finally.bind(p);
  return chain;
}

function makeAdmin(tables: Record<string, MockResult[]>): any {
  const idx: Record<string, number> = {};
  return {
    from: vi.fn((t: string) => {
      const q = tables[t] ?? [{}];
      const i = idx[t] ?? 0;
      idx[t] = i + 1;
      return makeChain(q[Math.min(i, q.length - 1)]);
    }),
  };
}

const MASTER_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const PROD_ID   = 'dddddddd-0000-4000-8000-000000000004';

function mockUser(id: string | null): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: id ? { id } : null } }) },
  } as any);
}

beforeEach(() => vi.clearAllMocks());

describe('getProductStats — two sales channels', () => {
  it('rejects when the caller is unauthenticated', async () => {
    mockUser(null);
    const { data, error } = await getProductStats(PROD_ID);
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('returns an error when the product does not belong to the master', async () => {
    mockUser(MASTER_ID);
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({ products: [{ data: null }] }) as any,
    );
    const { data, error } = await getProductStats(PROD_ID);
    expect(data).toBeNull();
    expect(error).toBe('Товар не знайдено');
  });

  it('combines order_items and booking_products into one set of figures', async () => {
    mockUser(MASTER_ID);
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        products: [{ data: { id: PROD_ID, cost_kopecks: 10000 } }],
        order_items: [{
          data: [{ qty: 2, price_kopecks: 20000, orders: { created_at: '2026-01-10T09:00:00Z', master_id: MASTER_ID, status: 'new' } }],
        }],
        booking_products: [{
          data: [{ quantity: 1, product_price: 250, bookings: { created_at: '2026-01-12T09:00:00Z', master_id: MASTER_ID, status: 'completed' } }],
        }],
      }) as any,
    );

    const { data, error } = await getProductStats(PROD_ID);

    expect(error).toBeNull();
    // shop: 2 units @ 200₴ = 40000 kop; booking: 1 unit @ 250₴ = 25000 kop
    expect(data).toEqual({
      soldQty: 3,
      revenue: 650,                 // (40000 + 25000) / 100
      profit: 350,                  // (65000 - 10000*3) / 100
      marginPct: 54,                // round(35000 / 65000 * 100)
      lastSaleAt: '2026-01-12T09:00:00Z', // latest of the two channels
    });
  });

  it('reports zero sales (and a null last-sale) when neither channel has rows', async () => {
    mockUser(MASTER_ID);
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        products: [{ data: { id: PROD_ID, cost_kopecks: 5000 } }],
        order_items: [{ data: [] }],
        booking_products: [{ data: [] }],
      }) as any,
    );

    const { data, error } = await getProductStats(PROD_ID);

    expect(error).toBeNull();
    expect(data).toEqual({ soldQty: 0, revenue: 0, profit: 0, marginPct: 0, lastSaleAt: null });
  });
});
