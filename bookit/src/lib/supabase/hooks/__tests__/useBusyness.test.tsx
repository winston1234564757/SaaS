// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBusyness } from '../useBusyness';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { makeBrowserClient, createWrapper, MASTER_ID } from './hookTestUtils';

vi.mock('@/lib/supabase/context', () => ({ useMasterContext: vi.fn() }));
vi.mock('@/lib/supabase/client',  () => ({ createClient:     vi.fn() }));
vi.mock('@/lib/utils/now', () => ({
  getNow: vi.fn(() => new Date(2026, 0, 15, 12, 0, 0)), // Thursday Jan 15, 2026 (local time)
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockMaster() {
  vi.mocked(useMasterContext).mockReturnValue({
    user: null, profile: null,
    masterProfile: { id: MASTER_ID, subscription_tier: 'pro' } as any,
    subscription: null, isLoading: false, refresh: vi.fn(),
  });
}

function mockNullMaster() {
  vi.mocked(useMasterContext).mockReturnValue({
    user: null, profile: null, masterProfile: null,
    subscription: null, isLoading: false, refresh: vi.fn(),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useBusyness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaster();
  });

  it('is disabled when masterId is null — no fetch fires, isLoading false', () => {
    mockNullMaster();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBusyness(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    // Query is disabled: fetchStatus is 'idle' (no request made)
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('today entry present for a working day with correct rate', async () => {
    // Jan 15 (Thu). No templates → default Mon–Fri 09:00–18:00.
    // One booking 10:00–11:00 (60 min).
    // totalWorkingMinutes=540, total=9 slots, booked=1 slot, rate=11%.
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings: {
          data: [{
            date:       '2026-01-15',
            status:     'confirmed',
            start_time: '10:00:00',
            end_time:   '11:00:00',
          }],
        },
        schedule_templates:  { data: [] },
        schedule_exceptions: { data: [] },
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBusyness(), { wrapper });
    await waitFor(() => expect(result.current.data?.today).not.toBeNull());

    const today = result.current.data!.today!;
    expect(today.date).toBe('2026-01-15');
    expect(today.total).toBe(9);   // round(540 / 60) = 9
    expect(today.booked).toBe(1);  // round(60 / 60) = 1
    expect(today.rate).toBe(11);   // round(60 / 540 * 100) = 11
  });

  it('break deduction reduces total slots', async () => {
    // Template: Thu 09:00–18:00 with 13:00–14:00 break (60 min).
    // totalWorkingMinutes = 540 - 60 = 480 → total = round(480/60) = 8 slots.
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings: { data: [] },
        schedule_templates: {
          data: [{
            day_of_week: 'thu',
            is_working:  true,
            start_time:  '09:00',
            end_time:    '18:00',
            break_start: '13:00',
            break_end:   '14:00',
          }],
        },
        schedule_exceptions: { data: [] },
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBusyness(), { wrapper });
    await waitFor(() => expect(result.current.data?.today).not.toBeNull());
    expect(result.current.data!.today!.total).toBe(8);
    expect(result.current.data!.today!.booked).toBe(0);
    expect(result.current.data!.today!.rate).toBe(0);
  });

  it('day-off exception — today is null and not in days[]', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings: { data: [] },
        schedule_templates:  { data: [] },
        schedule_exceptions: {
          data: [{ date: '2026-01-15', is_day_off: true, start_time: null, end_time: null }],
        },
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBusyness(), { wrapper });
    // Placeholder also has today=null; wait for real data via days[] being populated
    // Jan 16(Fri)+ are still working days so days[] is non-empty in real result
    await waitFor(() => expect(result.current.data!.days.length).toBeGreaterThan(0));
    expect(result.current.data!.today).toBeNull();
    expect(result.current.data!.days.find(d => d.date === '2026-01-15')).toBeUndefined();
  });

  it('week aggregate sums all working days in the next 7 days', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings:            { data: [] },
        schedule_templates:  { data: [] },
        schedule_exceptions: { data: [] },
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBusyness(), { wrapper });
    // Use expect() inside waitFor so it throws and retries until real data arrives
    // Jan 15(Thu), 16(Fri), 19(Mon), 20(Tue), 21(Wed), 22(Thu) = 6 days × 9 slots = 54
    await waitFor(() => expect(result.current.data!.week.total).toBe(54));
    expect(result.current.data!.week.booked).toBe(0);
    expect(result.current.data!.week.rate).toBe(0);
  });

  it('non-working template day — is_working=false skips that day', async () => {
    // Thu template explicitly set to not working.
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings: { data: [] },
        schedule_templates: {
          data: [{
            day_of_week: 'thu',
            is_working:  false,
            start_time:  '09:00',
            end_time:    '18:00',
            break_start: null,
            break_end:   null,
          }],
        },
        schedule_exceptions: { data: [] },
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBusyness(), { wrapper });
    await waitFor(() => expect(result.current.data!.days.length).toBeGreaterThan(0));
    expect(result.current.data!.today).toBeNull();
  });

  it('sets error when bookings query fails', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        bookings:            { data: null, error: { message: 'DB fail', code: '500', details: '', hint: '' } },
        schedule_templates:  { data: [] },
        schedule_exceptions: { data: [] },
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBusyness(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
