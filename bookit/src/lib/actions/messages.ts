'use server';

import { createClient } from '@/lib/supabase/server';

export type ConversationWithParticipant = {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  participant: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

type ProfileMini = { id: string; full_name: string | null; avatar_url: string | null };
type ConvRow = {
  id: string;
  last_message: string | null;
  last_message_at: string | null;
  client_unread: number;
  master_unread: number;
  client_id: string;
  master_id: string;
  client: ProfileMini | null;
  master: ProfileMini | null;
};

export type MessageableContact = {
  /** Account user id — present when a DM can be opened. Null = invite-only. */
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
};

export type MessageableContacts = {
  role: 'master' | 'client';
  /** Master: clients with a BookIT account. Client: masters they interacted with. */
  contacts: MessageableContact[];
  /** Master only: known clients without an account → invite candidates. */
  invitable: MessageableContact[];
};

/**
 * People the current user can start a conversation with.
 * Master → CRM clients (split by account) . Client → masters they booked.
 */
export async function getMessageableContacts(): Promise<MessageableContacts> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: 'client', contacts: [], invitable: [] };

  // Role is the source of truth (profiles.role), not "has a master_profiles row".
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const isMasterRole = profile?.role === 'master';

  // ── Master: CRM client base via get_master_clients RPC (same source as the
  // Clients page — bookings aggregated by phone), split by account vs invite. ──
  if (isMasterRole) {
    const { data: rows } = await supabase
      .rpc('get_master_clients', { p_master_id: user.id });

    type ClientRpcRow = { client_id: string | null; client_name: string | null; client_phone: string | null };
    const clientRows = (rows ?? []) as ClientRpcRow[];

    // Enrich account-holders with profile avatar.
    const accountIds = clientRows.map(r => r.client_id).filter((id): id is string => !!id);
    const avatarById = new Map<string, string | null>();
    if (accountIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', accountIds);
      for (const p of profs ?? []) avatarById.set(p.id, p.avatar_url);
    }

    const contacts: MessageableContact[] = [];
    const invitable: MessageableContact[] = [];
    for (const r of clientRows) {
      // Skip the master's own self-bookings (can't DM yourself).
      if (r.client_id === user.id) continue;
      const c: MessageableContact = {
        userId: r.client_id ?? null,
        name: r.client_name ?? 'Клієнт',
        avatarUrl: r.client_id ? avatarById.get(r.client_id) ?? null : null,
        phone: r.client_phone ?? null,
      };
      if (r.client_id) contacts.push(c);
      else if (r.client_phone) invitable.push(c);
    }
    contacts.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    invitable.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    return { role: 'master', contacts, invitable };
  }

  // ── Client: masters they have interacted with (booking history), newest first ──
  const { data: bookings } = await supabase
    .from('bookings')
    .select('master_id, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false });

  const seen = new Set<string>();
  const orderedMasterIds: string[] = [];
  for (const b of bookings ?? []) {
    if (b.master_id && !seen.has(b.master_id)) {
      seen.add(b.master_id);
      orderedMasterIds.push(b.master_id);
    }
  }

  if (!orderedMasterIds.length) return { role: 'client', contacts: [], invitable: [] };

  // master_profiles PK `id` == profiles.id == auth user id. Business name from
  // master_profiles, avatar from profiles (keyed by the same id).
  const [{ data: masters }, { data: masterProfs }] = await Promise.all([
    supabase.from('master_profiles').select('id, business_name').in('id', orderedMasterIds),
    supabase.from('profiles').select('id, avatar_url, full_name').in('id', orderedMasterIds),
  ]);

  const bizById = new Map((masters ?? []).map(m => [m.id, m.business_name]));
  const profById = new Map((masterProfs ?? []).map(p => [p.id, p]));
  const contacts: MessageableContact[] = orderedMasterIds
    .filter(id => bizById.has(id) || profById.has(id))
    .map(id => ({
      userId: id,
      name: bizById.get(id) ?? profById.get(id)?.full_name ?? 'Майстер',
      avatarUrl: profById.get(id)?.avatar_url ?? null,
      phone: null,
    }));

  return { role: 'client', contacts, invitable: [] };
}

export async function getOrCreateConversation(otherUserId: string): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // master_profiles PK is `id` (== user id); role is the reliable discriminator.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const isMaster = profile?.role === 'master';

  const clientId = isMaster ? otherUserId : user.id;
  const masterId = isMaster ? user.id : otherUserId;

  // maybeSingle: 0-or-1 is expected here. `.single()` treats "no row yet" as a
  // PGRST116 error (logged noise) — wrong for a get-or-create lookup.
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .eq('master_id', masterId)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data: created } = await supabase
    .from('conversations')
    .insert({ client_id: clientId, master_id: masterId })
    .select('id')
    .single();

  if (created) return { id: created.id };

  // No row returned — either a UNIQUE(client_id, master_id) race with a
  // concurrent ?to= open (23505), or an RLS-filtered returning clause. The row
  // exists either way, so re-fetch instead of returning null (a null return
  // silently drops the caller's redirect and dumps the user on the inbox).
  const { data: refetched } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .eq('master_id', masterId)
    .maybeSingle();

  return refetched ? { id: refetched.id } : null;
}

/**
 * Aggregate unread badge for the unified inbox nav button (all roles).
 * DM unread (per-role side of each conversation) + support reply (0/1).
 */
export async function getInboxSummary(): Promise<{ dmUnread: number; supportUnread: number; total: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { dmUnread: 0, supportUnread: 0, total: 0 };

  const { data: convs } = await supabase
    .from('conversations')
    .select('client_id, client_unread, master_unread');

  let dmUnread = 0;
  for (const c of (convs ?? []) as { client_id: string; client_unread: number; master_unread: number }[]) {
    dmUnread += c.client_id === user.id ? (c.client_unread ?? 0) : (c.master_unread ?? 0);
  }

  let supportUnread = 0;
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'chat')
    .in('status', ['open', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ticket) {
    const { data: lastMsg } = await supabase
      .from('support_messages')
      .select('sender_id')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastMsg && lastMsg.sender_id !== user.id) supportUnread = 1;
  }

  return { dmUnread, supportUnread, total: dmUnread + supportUnread };
}

export async function getConversations(): Promise<ConversationWithParticipant[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('conversations')
    .select(`
      id,
      last_message,
      last_message_at,
      client_unread,
      master_unread,
      client_id,
      master_id,
      client:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
      master:profiles!conversations_master_id_fkey(id, full_name, avatar_url)
    `)
    .order('last_message_at', { ascending: false });

  if (!data) return [];

  return (data as unknown as ConvRow[]).map(conv => {
    const isClient = conv.client_id === user.id;
    const participant = isClient ? conv.master : conv.client;
    return {
      id: conv.id,
      lastMessage: conv.last_message,
      lastMessageAt: conv.last_message_at,
      unreadCount: isClient ? conv.client_unread : conv.master_unread,
      participant: {
        id: participant?.id ?? '',
        name: participant?.full_name ?? 'Невідомий',
        avatarUrl: participant?.avatar_url ?? null,
      },
    };
  });
}

export async function sendDirectMessage(
  conversationId: string,
  message: string,
  attachmentUrl?: string,
): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: msg } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message: message || null,
      attachment_url: attachmentUrl ?? null,
    })
    .select('id')
    .single();

  if (!msg) return null;

  const { data: conv } = await supabase
    .from('conversations')
    .select('client_id, master_id, client_unread, master_unread')
    .eq('id', conversationId)
    .single();

  if (conv) {
    const isClient = conv.client_id === user.id;
    await supabase
      .from('conversations')
      .update({
        last_message: message || 'Фото',
        last_message_at: new Date().toISOString(),
        ...(isClient
          ? { master_unread: (conv.master_unread ?? 0) + 1 }
          : { client_unread: (conv.client_unread ?? 0) + 1 }),
      })
      .eq('id', conversationId);
  }

  return { id: msg.id };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: conv } = await supabase
    .from('conversations')
    .select('client_id, master_id')
    .eq('id', conversationId)
    .single();

  if (!conv) return;

  const isClient = conv.client_id === user.id;

  await Promise.all([
    supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null),
    supabase
      .from('conversations')
      .update(isClient ? { client_unread: 0 } : { master_unread: 0 })
      .eq('id', conversationId),
  ]);
}
