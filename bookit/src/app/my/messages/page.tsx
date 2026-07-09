import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getConversations, getOrCreateConversation } from '@/lib/actions/messages';
import { getSupportChatState } from '@/lib/actions/support';
import { getMyMasters } from '@/lib/actions/myMasters';
import { MessagesListPage } from '@/components/shared/messages/MessagesListPage';
import { MyMessagesDesktop } from '@/components/client/MyMessagesDesktop';

export const metadata: Metadata = { title: 'Повідомлення' };

export default async function MyMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Legacy/soft-navigation fallback for /my/messages?to=<id>. The reliable entry
  // is the /my/messages/start route handler (a page-level redirect() streams and
  // is dropped on hard navigation — see BUG-1). Kept for client-side nav links.
  const { to } = await searchParams;
  if (to) {
    const conv = await getOrCreateConversation(to);
    if (conv) redirect(`/my/messages/${conv.id}`);
  }

  const [conversations, supportRow, myMasters, supportTicket] = await Promise.all([
    getConversations(),
    getSupportChatState(),
    getMyMasters(),
    // Active support chat ticket id - the desktop pane opens it directly.
    supabase
      .from('support_tickets')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'chat')
      .in('status', ['open', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const supportInitialTicketId = supportTicket.data?.id ?? null;

  // Rail = masters without an existing conversation (bridge to a new chat).
  // master.id (= master_profiles.id = user id) matches the conversation
  // participant id, so the dedupe is exact.
  const convParticipantIds = new Set(conversations.map(c => c.participant.id));
  const railMasters = myMasters
    .filter(m => !convParticipantIds.has(m.id))
    .map(m => ({ id: m.id, slug: m.slug, name: m.name, avatarUrl: m.avatarUrl }));

  return (
    <>
      {/* Mobile / tablet - list → route (unchanged) */}
      <div className="lg:hidden">
        <MessagesListPage
          conversations={conversations}
          userRole="client"
          basePath="/my/messages"
          supportRow={supportRow}
          supportHref="/my/support/chat"
          masters={railMasters}
        />
      </div>

      {/* Desktop (lg+) - two-pane messenger */}
      <MyMessagesDesktop
        userId={user.id}
        conversations={conversations}
        supportRow={supportRow}
        supportInitialTicketId={supportInitialTicketId}
        masters={railMasters}
      />
    </>
  );
}
