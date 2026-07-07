// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUnreadDMCount } from './useUnreadDMCount';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

/**
 * Regression for the client-login crash (commit d7971dad): two components
 * (MyBottomNav + MyDesktopSidebar) mount this hook with the same userId.
 * A userId-only channel topic collides in supabase-js and makes the second
 * consumer add postgres_changes callbacks after subscribe() → throw.
 * The fix appends useId() so each instance owns a distinct topic.
 */

const USER_ID = 'user-abc';

/** Records every channel topic the hook opens; emulates a chainable supabase client. */
function makeRecordingClient(topics: string[]) {
  return {
    from: () => ({
      select: () => ({
        or: () => Promise.resolve({ data: [] }),
      }),
    }),
    channel: (topic: string) => {
      topics.push(topic);
      const ch: any = { on: () => ch, subscribe: () => ch };
      return ch;
    },
    removeChannel: vi.fn(),
  };
}

describe('useUnreadDMCount', () => {
  let topics: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    topics = [];
    vi.mocked(createClient).mockImplementation(() => makeRecordingClient(topics) as any);
  });

  it('opens a channel topic scoped to the userId', async () => {
    renderHook(() => useUnreadDMCount(USER_ID));
    await waitFor(() => expect(topics.length).toBe(1));
    expect(topics[0]).toMatch(new RegExp(`^unread-dm:${USER_ID}:`));
  });

  it('gives two simultaneous consumers DISTINCT topics (no collision)', async () => {
    // Both nav surfaces mount the hook with the same userId at the same time.
    renderHook(() => useUnreadDMCount(USER_ID));
    renderHook(() => useUnreadDMCount(USER_ID));

    await waitFor(() => expect(topics.length).toBe(2));
    expect(topics[0]).not.toBe(topics[1]);
    for (const topic of topics) {
      expect(topic.startsWith(`unread-dm:${USER_ID}:`)).toBe(true);
    }
  });

  it('does not open a channel when userId is null', () => {
    renderHook(() => useUnreadDMCount(null));
    expect(topics.length).toBe(0);
  });
});
