import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getConversations, getOrCreateConversation } from '@/lib/actions/messages';
import { getSupportChatState } from '@/lib/actions/support';
import { getMyMasters } from '@/lib/actions/myMasters';
import { MessagesListPage } from '@/components/shared/messages/MessagesListPage';

export const metadata: Metadata = { title: 'Повідомлення' };

export default async function MyMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { to } = await searchParams;
  if (to) {
    const conv = await getOrCreateConversation(to);
    if (conv) redirect(`/my/messages/${conv.id}`);
  }

  const [conversations, supportRow, myMasters] = await Promise.all([
    getConversations(),
    getSupportChatState(),
    getMyMasters(),
  ]);

  // Rail = masters without an existing conversation (bridge to a new chat).
  // master.id (= master_profiles.id = user id) matches the conversation
  // participant id, so the dedupe is exact.
  const convParticipantIds = new Set(conversations.map(c => c.participant.id));
  const railMasters = myMasters
    .filter(m => !convParticipantIds.has(m.id))
    .map(m => ({ id: m.id, slug: m.slug, name: m.name, avatarUrl: m.avatarUrl }));

  return (
    <MessagesListPage
      conversations={conversations}
      userRole="client"
      basePath="/my/messages"
      supportRow={supportRow}
      supportHref="/my/support/chat"
      masters={railMasters}
    />
  );
}
