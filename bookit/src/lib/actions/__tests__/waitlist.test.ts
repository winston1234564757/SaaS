import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

function mockAuthUser(userId: string): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
  } as any);
}

function mockNoUser(): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  } as any);
}

const MASTER_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

describe('joinWaitlist', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rejects unauthenticated', async () => {
    mockNoUser();
    const r = await joinWaitlist('feature-analytics');
    expect(r).toEqual({ error: 'Не авторизований' });
  });

  it('inserts and returns success', async () => {
    mockAuthUser(MASTER_ID);
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);
    const r = await joinWaitlist('feature-analytics');
    expect(r).toEqual({ error: null });
  });

  it('handles duplicate (23505) as alreadyJoined', async () => {
    mockAuthUser(MASTER_ID);
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }),
    } as any);
    const r = await joinWaitlist('feature-analytics');
    expect(r).toEqual({ error: null, alreadyJoined: true });
  });

  it('returns generic error for other DB errors', async () => {
    mockAuthUser(MASTER_ID);
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: { code: '23503', message: 'FK violation' } }),
    } as any);
    const r = await joinWaitlist('feature-analytics');
    expect(r).toEqual({ error: 'FK violation' });
  });
});
