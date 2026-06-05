import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSupportTicketAction,
  sendSupportMessageAction,
  resolveSupportTicketAction,
} from '../support';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/admin',  () => ({ createAdminClient: vi.fn() }));

const mockOrchestratorSend = vi.fn();
vi.mock('@/lib/notifications/NotificationOrchestrator', () => ({
  NotificationOrchestrator: { send: (...args: any[]) => mockOrchestratorSend(...args) },
}));

type MockResult = { data?: unknown; error?: unknown; count?: number | null };

function makeChain(r: MockResult = {}): any {
  const resolved = {
    data:  r.data  !== undefined ? r.data  : null,
    error: r.error !== undefined ? r.error : null,
    count: r.count !== undefined ? r.count : null,
  };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'single', 'maybeSingle'];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  chain.single      = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);
  chain.then        = p.then.bind(p);
  chain.catch       = p.catch.bind(p);
  chain.finally     = p.finally.bind(p);
  return chain;
}

/** Queue-based from() — each call returns a new chain with the next result. */
function chainQueue(results: MockResult[]): any {
  const chains = results.map(r => makeChain(r));
  let i = 0;
  return () => chains[Math.min(i++, chains.length - 1)];
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
  };
}

const USER_ID  = 'uuuuuuuu-0000-4000-8000-000000000001';
const ADMIN_ID = 'aaaaaaaa-0000-4000-8000-000000000002';

describe('support — server action integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSupportTicketAction', () => {
    it('rejects unauthenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      } as any);
      const r = await createSupportTicketAction('feedback', 'Great service!');
      expect(r.error).toBe('Не авторизований');
    });

    it('creates ticket + message + dispatches admin alert', async () => {
      const from = chainQueue([
        { data: { id: 'ticket-1' } },      // support_tickets: insert + select('id').single()
        { error: null },                     // support_messages: insert
      ]);
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }) },
        from,
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          profiles: [
            { data: [{ id: ADMIN_ID }] },   // admin list
            { data: { full_name: 'Олександр' } },  // sender profile
          ],
        }) as any,
      );
      const r = await createSupportTicketAction('bug', 'Something broke');
      expect(r.error).toBeNull();
      expect(r.ticketId).toBe('ticket-1');
      expect(mockOrchestratorSend).toHaveBeenCalled();
    });

    it('returns error when ticket creation fails', async () => {
      const from = chainQueue([
        { error: { message: 'DB error' } }, // support_tickets insert fails
      ]);
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }) },
        from,
      } as any);
      const r = await createSupportTicketAction('idea', 'New feature');
      expect(r.error).toBe('DB error');
    });

    it('handles admin dispatch error gracefully (non-throwing)', async () => {
      const from = chainQueue([
        { data: { id: 'ticket-2' } },
        { error: null },
      ]);
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }) },
        from,
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(makeAdmin({
        profiles: [{ data: [] }],  // empty admin list — no dispatch
      }) as any);
      const r = await createSupportTicketAction('chat', 'Hello');
      expect(r.error).toBeNull();
      expect(r.ticketId).toBe('ticket-2');
    });
  });

  describe('sendSupportMessageAction', () => {
    it('rejects unauthenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      } as any);
      const r = await sendSupportMessageAction('ticket-1', 'Hello');
      expect(r.error).toBe('Не авторизований');
    });

    it('sends message and dispatches notifications (non-admin)', async () => {
      const from = chainQueue([
        { data: { id: 'ticket-1', user_id: 'client-1', status: 'open' } },  // ticket fetch
        { data: { id: 'msg-1', ticket_id: 'ticket-1', sender_id: USER_ID, message: 'Hello', attachment_url: null, created_at: '2025-01-01T00:00:00Z' }, error: null },  // insert message
        { data: { role: 'master', full_name: 'Олександр' }, error: null },   // profile fetch
        { error: null },                                                       // update ticket
      ]);
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }) },
        from,
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(makeAdmin({
        profiles: [{ data: [{ id: ADMIN_ID }] }],
      }) as any);
      const r = await sendSupportMessageAction('ticket-1', 'Hello');
      expect(r.error).toBeNull();
      expect(mockOrchestratorSend).toHaveBeenCalled();
    });

    it('returns error when ticket not found', async () => {
      const from = chainQueue([
        { error: { message: 'Тікет не знайдено' } },
      ]);
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }) },
        from,
      } as any);
      const r = await sendSupportMessageAction('nonexistent', 'Hi');
      expect(r.error).toBe('Тікет не знайдено');
    });
  });

  describe('resolveSupportTicketAction', () => {
    it('rejects unauthenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      } as any);
      const r = await resolveSupportTicketAction('ticket-1');
      expect(r.error).toBe('Не авторизований');
    });

    it('rejects non-admin user', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }) },
        from: vi.fn().mockReturnValue(makeChain({ data: { role: 'master' } })),
      } as any);
      const r = await resolveSupportTicketAction('ticket-1');
      expect(r.error).toBe('Недостатньо прав');
    });

    it('resolves ticket as admin', async () => {
      const from = chainQueue([
        { data: { role: 'admin' } },      // profile check
        { error: null },                    // update ticket
      ]);
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: ADMIN_ID } } }) },
        from,
      } as any);
      const r = await resolveSupportTicketAction('ticket-1');
      expect(r.error).toBeNull();
    });

    it('returns error when update fails', async () => {
      const from = chainQueue([
        { data: { role: 'admin' } },
        { error: { message: 'Update failed' } },
      ]);
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: ADMIN_ID } } }) },
        from,
      } as any);
      const r = await resolveSupportTicketAction('ticket-1');
      expect(r.error).toBe('Update failed');
    });
  });
});
