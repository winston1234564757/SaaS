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

export async function getOrCreateConversation(otherUserId: string): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: currentMaster } = await supabase
    .from('master_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  const clientId = currentMaster ? otherUserId : user.id;
  const masterId = currentMaster ? user.id : otherUserId;

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .eq('master_id', masterId)
    .single();

  if (existing) return { id: existing.id };

  const { data: created } = await supabase
    .from('conversations')
    .insert({ client_id: clientId, master_id: masterId })
    .select('id')
    .single();

  return created ? { id: created.id } : null;
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
