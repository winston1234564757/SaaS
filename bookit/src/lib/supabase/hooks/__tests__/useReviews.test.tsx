// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReviews } from '../useReviews';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { makeBrowserClient, createWrapper, MASTER_ID, makeDbError } from './hookTestUtils';

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const mockShowToast      = vi.hoisted(() => vi.fn());
const mockApproveReview  = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));

vi.mock('@/lib/supabase/context', () => ({ useMasterContext: vi.fn() }));
vi.mock('@/lib/supabase/client',  () => ({ createClient:     vi.fn() }));
vi.mock('@/lib/toast/context',    () => ({ useToast: () => ({ showToast: mockShowToast }) }));
vi.mock('@/app/(master)/dashboard/bookings/actions', () => ({
  approveReview: mockApproveReview,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const RAW_REVIEW = {
  id:           'r-01',
  rating:       5,
  comment:      'Excellent!',
  client_name:  'Наталя',
  is_published: false,
  created_at:   '2026-01-10T00:00:00Z',
  bookings:     { date: '2026-01-10' },
};

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

describe('useReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaster();
    mockApproveReview.mockResolvedValue({ error: null });
  });

  it('is disabled when masterId is null', () => {
    mockNullMaster();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.reviews).toEqual([]);
    expect(result.current.pendingReviews).toEqual([]);
  });

  it('mapRow — booking_date from nested bookings.date', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ reviews: [{ data: [RAW_REVIEW] }, { data: [] }] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    const r = result.current.reviews[0];
    expect(r.id).toBe('r-01');
    expect(r.rating).toBe(5);
    expect(r.booking_date).toBe('2026-01-10');
    expect(r.is_published).toBe(false);
  });

  it('mapRow — client_name defaults to "Клієнт" when DB returns null', async () => {
    const row = { ...RAW_REVIEW, client_name: null };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ reviews: [{ data: [row] }, { data: [] }] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(result.current.reviews[0].client_name).toBe('Клієнт');
  });

  it('mapRow — booking_date is null when bookings relation is null', async () => {
    const row = { ...RAW_REVIEW, bookings: null };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({ reviews: [{ data: [row] }, { data: [] }] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(result.current.reviews[0].booking_date).toBeNull();
  });

  it('populates both reviews and pendingReviews from two sequential DB calls', async () => {
    const published = { ...RAW_REVIEW, id: 'r-02', is_published: true };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        reviews: [
          { data: [RAW_REVIEW, published] }, // [0] all reviews
          { data: [RAW_REVIEW] },             // [1] pending only
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.reviews).toHaveLength(2));
    await waitFor(() => expect(result.current.pendingReviews).toHaveLength(1));
    expect(result.current.pendingReviews[0].id).toBe('r-01');
  });

  it('sets error when reviews query returns a DB error', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        reviews: [
          { data: null, error: makeDbError('reviews fail') },
          { data: [] },
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  // ── togglePublish ────────────────────────────────────────────────────────────

  it('togglePublish — optimistically flips is_published before server responds', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        reviews: [
          { data: [RAW_REVIEW] },                             // [0] initial all
          { data: [] },                                        // [1] initial pending
          { error: null },                                     // [2] mutation update (success)
          { data: [{ ...RAW_REVIEW, is_published: true }] },  // [3] re-fetch all
          { data: [] },                                        // [4] re-fetch pending
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(result.current.reviews[0].is_published).toBe(false);

    act(() => { result.current.togglePublish('r-01', false); });

    await waitFor(() =>
      expect(result.current.reviews[0]?.is_published).toBe(true),
    );
  });

  it('togglePublish — rolls back and calls showToast on mutation error', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        reviews: [
          { data: [RAW_REVIEW] },               // [0] initial all
          { data: [] },                          // [1] initial pending
          { data: null, error: makeDbError() }, // [2] mutation update (fails)
          { data: [RAW_REVIEW] },               // [3] re-fetch all (onSettled)
          { data: [] },                          // [4] re-fetch pending (onSettled)
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));

    act(() => { result.current.togglePublish('r-01', false); });

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
    // Cache restored to original after rollback
    expect(result.current.reviews[0]?.is_published).toBe(false);
  });

  // ── approveReview ────────────────────────────────────────────────────────────

  it('approveReview — optimistically removes review from pending list', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        reviews: [
          { data: [] },            // [0] initial all
          { data: [RAW_REVIEW] },  // [1] initial pending (1 item)
          { data: [] },            // [2] re-fetch all (onSuccess invalidation)
          { data: [] },            // [3] re-fetch pending (onSuccess invalidation)
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.pendingReviews).toHaveLength(1));

    act(() => { result.current.approveReview('r-01', true); });

    await waitFor(() => expect(result.current.pendingReviews).toHaveLength(0));
  });

  it('approveReview — calls showToast with success on approval', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        reviews: [
          { data: [] },
          { data: [RAW_REVIEW] },
          { data: [] },
          { data: [] },
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.pendingReviews).toHaveLength(1));

    act(() => { result.current.approveReview('r-01', true); });

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'Відгук опубліковано' }),
      ),
    );
  });

  it('approveReview — rolls back pending list and shows error toast on failure', async () => {
    mockApproveReview.mockResolvedValueOnce({ error: 'Server error' });
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({
        reviews: [
          { data: [] },            // [0] initial all
          { data: [RAW_REVIEW] },  // [1] initial pending (1 item)
          // No re-fetches: approveMutation.onError doesn't invalidate
        ],
      }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReviews(), { wrapper });
    await waitFor(() => expect(result.current.pendingReviews).toHaveLength(1));

    act(() => { result.current.approveReview('r-01', true); });

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
    // Pending list restored after rollback
    expect(result.current.pendingReviews).toHaveLength(1);
  });
});
