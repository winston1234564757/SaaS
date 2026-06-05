// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalytics, linearRegression } from '../useAnalytics';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { makeBrowserClient, createWrapper, MASTER_ID, makeDbError } from './hookTestUtils';

vi.mock('@/lib/supabase/context', () => ({ useMasterContext: vi.fn() }));
vi.mock('@/lib/supabase/client',  () => ({ createClient:     vi.fn() }));
vi.mock('@/lib/utils/now', () => ({
  getNow: vi.fn(() => new Date(2026, 0, 15, 12, 0, 0)), // Jan 15, 2026 (local)
}));
// getPrevPeriodRange returns null so isPro prev-period branch resolves immediately
vi.mock('@/lib/supabase/hooks/useDateRange', () => ({
  getPrevPeriodRange: vi.fn(() => null),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const COMPLETED_BOOKING = {
  date:                  '2026-01-15',
  status:                'completed',
  total_price:           500,
  total_services_price:  400,
  total_products_price:  100,
  client_id:             'cid-01',
  client_name:           'Аня',
  client_phone:          '380501234567',
  source:                'online',
  booking_services: [{ service_name: 'Haircut', service_price: 500, duration_minutes: 60 }],
  booking_products: [],
};

const CANCELLED_BOOKING = {
  ...COMPLETED_BOOKING,
  status:      'cancelled',
  client_phone: '380502222222',
  client_id:   'cid-02',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockMaster(tier = 'pro') {
  vi.mocked(useMasterContext).mockReturnValue({
    user: null, profile: null,
    masterProfile: { id: MASTER_ID, subscription_tier: tier } as any,
    subscription: null, isLoading: false, refresh: vi.fn(),
  });
}

function mockNullMaster() {
  vi.mocked(useMasterContext).mockReturnValue({
    user: null, profile: null, masterProfile: null,
    subscription: null, isLoading: false, refresh: vi.fn(),
  });
}

// isPro=false: 1× from('bookings') + 1× from('orders') + 1× rpc
function makeClient(
  bookingRows: unknown[],
  orderRows:   unknown[],
  rpcData:     unknown[],
) {
  return makeBrowserClient(
    { bookings: { data: bookingRows }, orders: { data: orderRows } },
    { data: rpcData },
  ) as any;
}

// isPro=true: 2× from('bookings') [main, trend] + 1× from('orders') + 1× rpc
function makeClientPro(
  mainRows:  unknown[],
  trendRows: unknown[],
  orderRows: unknown[],
  rpcData:   unknown[],
) {
  return makeBrowserClient(
    {
      bookings: [{ data: mainRows }, { data: trendRows }],
      orders:   { data: orderRows },
    },
    { data: rpcData },
  ) as any;
}

const EMPTY_RPC = [{ new_clients: 0, returning_clients: 0 }];
const DATE_ARGS = { startDate: '2026-01-01', endDate: '2026-01-31' } as const;

// ── linearRegression (pure function) ──────────────────────────────────────────

describe('linearRegression', () => {
  it('empty array → { forecast: 0, slope: 0, r2: 0 }', () => {
    expect(linearRegression([])).toEqual({ forecast: 0, slope: 0, r2: 0 });
  });

  it('single value → slope 0, forecast = that value, r2 = 0', () => {
    const { forecast, slope, r2 } = linearRegression([42]);
    expect(slope).toBe(0);
    expect(forecast).toBe(42);
    expect(r2).toBe(0);
  });

  it('flat series → slope ≈ 0, r2 = 1, forecast = same value', () => {
    const { slope, r2, forecast } = linearRegression([10, 10, 10, 10]);
    expect(slope).toBeCloseTo(0);
    expect(r2).toBe(1);
    expect(forecast).toBe(10);
  });

  it('strictly increasing series [0,1,2,3,4] → slope ≈ 1, forecast = 5', () => {
    const { slope, forecast } = linearRegression([0, 1, 2, 3, 4]);
    expect(slope).toBeCloseTo(1);
    expect(forecast).toBe(5);
  });

  it('declining series → forecast is never negative', () => {
    const { forecast } = linearRegression([100, 50, 10, 0]);
    expect(forecast).toBeGreaterThanOrEqual(0);
  });
});

// ── useAnalytics ──────────────────────────────────────────────────────────────

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaster();
  });

  it('is disabled when masterId is null — data undefined, isLoading false', () => {
    mockNullMaster();
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('revenue only counts completed bookings — cancelled bookings excluded', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeClient(
        [COMPLETED_BOOKING, CANCELLED_BOOKING],
        [],
        EMPTY_RPC,
      ),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.summary.bookings).toBe(1);   // only 'completed'
    expect(result.current.data!.summary.revenue).toBe(500);  // 500 + 0 (cancelled)
  });

  it('topServices sorted by revenue descending', async () => {
    const color = {
      ...COMPLETED_BOOKING,
      booking_services: [{ service_name: 'Color', service_price: 1000, duration_minutes: 90 }],
      total_price: 1000,
    };
    const haircut = {
      ...COMPLETED_BOOKING,
      client_phone: '380509999999',
      booking_services: [{ service_name: 'Haircut', service_price: 300, duration_minutes: 30 }],
      total_price: 300,
    };
    vi.mocked(createClient).mockReturnValue(
      makeClient([color, haircut], [], EMPTY_RPC),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    const svc = result.current.data!.topServices;
    expect(svc[0].name).toBe('Color');
    expect(svc[0].revenue).toBe(1000);
    expect(svc[1].name).toBe('Haircut');
    expect(svc[1].revenue).toBe(300);
  });

  it('bento = null when isPro = false', async () => {
    vi.mocked(createClient).mockReturnValue(makeClient([], [], []));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.bento).toBeNull();
  });

  it('bento is populated when isPro = true', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeClientPro([COMPLETED_BOOKING], [], [], EMPTY_RPC),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, true, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.bento).not.toBeNull();
  });

  it('retention maps newClients and returningClients from RPC result', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeClient([], [], [{ new_clients: 7, returning_clients: 3 }]),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.retention).toEqual({
      newClients:       7,
      returningClients: 3,
    });
    expect(result.current.data!.summary.newClients).toBe(7);
  });

  it('retention = null when RPC returns empty array', async () => {
    vi.mocked(createClient).mockReturnValue(makeClient([], [], []));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.retention).toBeNull();
  });

  it('topProducts merges booking_products and shop orders', async () => {
    const bookingWithProduct = {
      ...COMPLETED_BOOKING,
      booking_products: [{ product_name: 'Shampoo', product_price: 200, quantity: 1 }],
    };
    const shopOrder = {
      created_at: '2026-01-10T00:00:00Z',
      status: 'completed',
      total_kopecks: 30000,
      client_id: null,
      client_name: null,
      client_phone: '380503333333',
      order_items: [
        { qty: 2, products: { name: 'Conditioner', price_kopecks: 15000 } },
      ],
    };
    vi.mocked(createClient).mockReturnValue(
      makeClient([bookingWithProduct], [shopOrder], EMPTY_RPC),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    const prods = result.current.data!.topProducts;
    const names = prods.map(p => p.name);
    expect(names).toContain('Shampoo');
    expect(names).toContain('Conditioner');
  });

  it('sets error when main bookings query fails', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient(
        { bookings: { data: null, error: makeDbError('bookings fail') }, orders: { data: [] } },
        { data: [] },
      ) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAnalytics(DATE_ARGS, false, 'month', 0),
      { wrapper },
    );
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
