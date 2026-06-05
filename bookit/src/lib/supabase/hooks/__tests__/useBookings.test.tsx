// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookings, useMonthlyBookingCount } from '../useBookings';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { makeBrowserClient, createWrapper, MASTER_ID, makeDbError } from './hookTestUtils';

// ── Module mocks ───────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/context', () => ({ useMasterContext: vi.fn() }));
vi.mock('@/lib/supabase/client',  () => ({ createClient:     vi.fn() }));
vi.mock('@/lib/utils/now', () => ({
  getNow: vi.fn(() => new Date('2026-01-15T10:00:00Z')),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const RAW_BOOKING = {
  id:                    'bk-01',
  client_name:           'Аня',
  client_phone:          '380501234567',
  date:                  '2026-01-15',
  start_time:            '10:00:00',   // DB returns HH:MM:SS — hook slices to HH:MM
  end_time:              '11:00:00',
  status:                'confirmed' as const,
  total_price:           '500',        // DB often returns numeric-as-string
  notes:                 null,
  master_notes:          'ok',
  source:                'online',
  dynamic_pricing_label: null,
  dynamic_extra_kopecks: null,
  booking_services: [
    { service_name: 'Haircut', service_price: '500', duration_minutes: 60 },
  ],
};

function mockMaster(overrides: { id?: string; tier?: string } = {}) {
  vi.mocked(useMasterContext).mockReturnValue({
    user:          null,
    profile:       null,
    masterProfile: {
      id:                overrides.id   ?? MASTER_ID,
      subscription_tier: overrides.tier ?? 'pro',
    } as any,
    subscription: null,
    isLoading:    false,
    refresh:      vi.fn(),
  });
}

function mockNullMaster() {
  vi.mocked(useMasterContext).mockReturnValue({
    user: null, profile: null, masterProfile: null,
    subscription: null, isLoading: false, refresh: vi.fn(),
  });
}

// ── useBookings ────────────────────────────────────────────────────────────────

describe('useBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaster();
  });

  it('is disabled (no loading, empty array) when masterId is null', () => {
    mockNullMaster();
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.bookings).toEqual([]);
  });

  it('fetches and maps rows via rowToBooking', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { data: [RAW_BOOKING] } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bookings).toHaveLength(1));
    const bk = result.current.bookings[0];
    expect(bk.id).toBe('bk-01');
    expect(bk.client_name).toBe('Аня');
    expect(bk.total_price).toBe(500);   // string coerced to Number
    expect(bk.master_notes).toBe('ok');
    expect(bk.source).toBe('online');
  });

  it('slices start_time and end_time from HH:MM:SS to HH:MM', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { data: [RAW_BOOKING] } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bookings).toHaveLength(1));
    expect(result.current.bookings[0].start_time).toBe('10:00');
    expect(result.current.bookings[0].end_time).toBe('11:00');
  });

  it('maps booking_services correctly — name, price (coerced), duration', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { data: [RAW_BOOKING] } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bookings).toHaveLength(1));
    const svc = result.current.bookings[0].services[0];
    expect(svc.name).toBe('Haircut');
    expect(svc.price).toBe(500);      // string → Number
    expect(svc.duration).toBe(60);
  });

  it('null booking_services yields empty services array', async () => {
    const row = { ...RAW_BOOKING, booking_services: null };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { data: [row] } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bookings).toHaveLength(1));
    expect(result.current.bookings[0].services).toEqual([]);
  });

  it('null start_time / end_time produce empty strings', async () => {
    const row = { ...RAW_BOOKING, start_time: null, end_time: null };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { data: [row] } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bookings).toHaveLength(1));
    expect(result.current.bookings[0].start_time).toBe('');
    expect(result.current.bookings[0].end_time).toBe('');
  });

  it('sets error when safeQuery returns a DB error', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { data: null, error: makeDbError() } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it('empty DB result yields empty bookings array (no error)', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { data: [] } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => !result.current.isLoading);
    expect(result.current.bookings).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  // ── updateStatus mutation ────────────────────────────────────────────────────

  it('updateStatus — optimistically updates status before request completes', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings: [
          { data: [RAW_BOOKING] },                                     // [0] initial fetch
          { error: null },                                              // [1] mutation update (success)
          { data: [{ ...RAW_BOOKING, status: 'completed' }] },         // [2] re-fetch after onSettled
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bookings).toHaveLength(1));
    expect(result.current.bookings[0].status).toBe('confirmed');

    act(() => { result.current.updateStatus('bk-01', 'completed'); });

    // Optimistic update fires immediately in onMutate before the server responds
    await waitFor(() =>
      expect(result.current.bookings[0]?.status).toBe('completed'),
    );
  });

  it('updateStatus — rolls back to original status on mutation error', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings: [
          { data: [RAW_BOOKING] },              // [0] initial fetch
          { data: null, error: makeDbError() }, // [1] mutation update (fails)
          { data: [RAW_BOOKING] },              // [2] re-fetch after onSettled
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBookings('2026-01-01', '2026-01-31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bookings).toHaveLength(1));

    act(() => { result.current.updateStatus('bk-01', 'cancelled'); });

    // After onError rollback, status returns to original
    await waitFor(() =>
      expect(result.current.bookings[0]?.status).toBe('confirmed'),
    );
  });
});

// ── useMonthlyBookingCount ─────────────────────────────────────────────────────

describe('useMonthlyBookingCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaster();
  });

  it('is disabled when masterId is null', () => {
    mockNullMaster();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBookingCount(), { wrapper });
    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns count from DB query', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { count: 12 } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBookingCount(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(12));
  });

  it('isAtLimit = true when starter tier and count === 40', async () => {
    mockMaster({ tier: 'starter' });
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { count: 40 } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBookingCount(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(40));
    expect(result.current.isAtLimit).toBe(true);
    expect(result.current.remaining).toBe(0);
  });

  it('isAtLimit = false when starter tier and count < 40', async () => {
    mockMaster({ tier: 'starter' });
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { count: 25 } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBookingCount(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(25));
    expect(result.current.isAtLimit).toBe(false);
    expect(result.current.remaining).toBe(15);
  });

  it('remaining = null for pro tier regardless of count', async () => {
    mockMaster({ tier: 'pro' });
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { count: 100 } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBookingCount(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(100));
    expect(result.current.remaining).toBeNull();
    expect(result.current.isAtLimit).toBe(false);
  });

  it('count defaults to 0 when DB returns null count', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ bookings: { count: null } }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBookingCount(), { wrapper });
    await waitFor(() => !result.current.isLoading);
    expect(result.current.count).toBe(0);
  });
});
