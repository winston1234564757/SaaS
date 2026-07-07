// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDMChat } from './useDMChat';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

/** Regression: distinct channel topic per hook instance (no supabase-js collision). */

const CONVERSATION_ID = 'conv-1';

function makeRecordingClient(topics: string[]) {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => Promise.resolve({ data: [], error: null }),
  };
  return {
    from: () => query,
    channel: (topic: string) => {
      topics.push(topic);
      const ch: any = { on: () => ch, subscribe: () => ch };
      return ch;
    },
    removeChannel: vi.fn(),
  };
}

describe('useDMChat', () => {
  let topics: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    topics = [];
    vi.mocked(createClient).mockImplementation(() => makeRecordingClient(topics) as any);
  });

  it('scopes the channel topic to the conversationId', async () => {
    renderHook(() => useDMChat(CONVERSATION_ID));
    await waitFor(() => expect(topics.length).toBe(1));
    expect(topics[0]).toMatch(new RegExp(`^dm:${CONVERSATION_ID}:`));
  });

  it('gives two simultaneous consumers DISTINCT topics', async () => {
    renderHook(() => useDMChat(CONVERSATION_ID));
    renderHook(() => useDMChat(CONVERSATION_ID));
    await waitFor(() => expect(topics.length).toBe(2));
    expect(topics[0]).not.toBe(topics[1]);
  });

  it('opens no channel when conversationId is null', () => {
    renderHook(() => useDMChat(null));
    expect(topics.length).toBe(0);
  });
});
