import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPartnerInviteLink,
  acceptPartnerInvitation,
  toggleAllianceVisibility,
  removePartner,
} from '../partners';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/admin',  () => ({ createAdminClient: vi.fn() }));
vi.mock('next/cache',            () => ({ revalidatePath: vi.fn() }));

type MockResult = { data?: unknown; error?: unknown; count?: number | null };

function makeChain(r: MockResult = {}): any {
  const resolved = {
    data:  r.data  !== undefined ? r.data  : null,
    error: r.error !== undefined ? r.error : null,
    count: r.count !== undefined ? r.count : null,
  };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'match', 'or', 'limit', 'order', 'single', 'maybeSingle'];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  chain.single      = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);
  chain.then        = p.then.bind(p);
  chain.catch       = p.catch.bind(p);
  chain.finally     = p.finally.bind(p);
  return chain;
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

function mockNoUser(): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  } as any);
}

const MASTER_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const OTHER_ID  = 'bbbbbbbb-0000-4000-8000-000000000002';

describe('partners — server action integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPartnerInviteLink', () => {
    it('returns Unauthorized when no active session', async () => {
      mockNoUser();
      const r = await getPartnerInviteLink();
      expect(r).toEqual({ link: null, error: 'Не авторизований' });
    });

    it('returns link when master has referral_code', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
        from: vi.fn().mockReturnValue(makeChain({ data: { slug: 'master-anna', referral_code: 'ANNA01' } })),
      } as any);
      const r = await getPartnerInviteLink();
      expect(r.error).toBeNull();
      expect(r.link).toContain('dashboard/partners/join?token=ANNA01');
    });

    it('returns error when master profile not found', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
        from: vi.fn().mockReturnValue(makeChain({ data: null })),
      } as any);
      const r = await getPartnerInviteLink();
      expect(r).toEqual({ link: null, error: 'Профіль майстра не знайдено' });
    });

    it('catches and returns generic error on supabase failure', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockRejectedValue(new Error('Network')) },
      } as any);
      const r = await getPartnerInviteLink();
      expect(r.error).toBe('Не вдалося згенерувати посилання.');
    });
  });

  describe('acceptPartnerInvitation', () => {
    it('rejects unauthenticated', async () => {
      mockNoUser();
      const r = await acceptPartnerInvitation('TOKEN');
      expect(r).toEqual({ success: false, error: 'Не авторизований' });
    });

    it('rejects invalid token (no matching master)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ master_profiles: [{ data: null }] }) as any,
      );
      const r = await acceptPartnerInvitation('BADTOKEN');
      expect(r).toEqual({ success: false, error: 'Недійсне або прострочене запрошення' });
    });

    it('rejects self-invitation', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ master_profiles: [{ data: { id: MASTER_ID } }] }) as any,
      );
      const r = await acceptPartnerInvitation('SELF');
      expect(r).toEqual({ success: false, error: 'Ви не можете стати партнером самого себе' });
    });

    it('creates bidirectional partner records', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles:  [{ data: { id: OTHER_ID } }],
          master_partners:  [{ data: null }, { error: null }],
        }) as any,
      );
      const r = await acceptPartnerInvitation('INVITER');
      expect(r.success).toBe(true);
      expect(r.error).toBeNull();
    });

    it('updates existing partner record to accepted', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: { id: OTHER_ID } }],
          master_partners: [{ data: { id: 'existing-1' } }],
        }) as any,
      );
      const r = await acceptPartnerInvitation('EXIST');
      expect(r.success).toBe(true);
    });
  });

  describe('toggleAllianceVisibility', () => {
    it('rejects unauthenticated', async () => {
      mockNoUser();
      const r = await toggleAllianceVisibility('alliance-1', true);
      expect(r).toEqual({ success: false, error: 'Не авторизований' });
    });

    it('rejects when alliance not found', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ master_alliances: [{ data: null }] }) as any,
      );
      const r = await toggleAllianceVisibility('nonexistent', true);
      expect(r).toEqual({ success: false, error: 'Альянс не знайдено' });
    });

    it('rejects when user is neither inviter nor invitee', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_alliances: [{ data: { id: 'a-1', inviter_id: 'other-1', invitee_id: 'other-2' } }],
        }) as any,
      );
      const r = await toggleAllianceVisibility('a-1', true);
      expect(r).toEqual({ success: false, error: 'Доступ заборонено' });
    });

    it('allows inviter to toggle', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_alliances: [{ data: { id: 'a-1', inviter_id: MASTER_ID, invitee_id: OTHER_ID } }],
        }) as any,
      );
      const r = await toggleAllianceVisibility('a-1', true);
      expect(r.success).toBe(true);
    });

    it('allows invitee to toggle', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_alliances: [{ data: { id: 'a-1', inviter_id: OTHER_ID, invitee_id: MASTER_ID } }],
        }) as any,
      );
      const r = await toggleAllianceVisibility('a-1', false);
      expect(r.success).toBe(true);
    });
  });

  describe('removePartner', () => {
    it('rejects unauthenticated', async () => {
      mockNoUser();
      const r = await removePartner(OTHER_ID);
      expect(r).toEqual({ success: false, error: 'Не авторизований' });
    });

    it('deletes both-direction partner records', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MASTER_ID } } }) },
      } as any);
      vi.mocked(createAdminClient).mockReturnValue(makeAdmin() as any);
      const r = await removePartner(OTHER_ID);
      expect(r.success).toBe(true);
    });
  });
});
