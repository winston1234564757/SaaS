import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getConversations, getOrCreateConversation } from '@/lib/actions/messages';
import { getSupportChatState } from '@/lib/actions/support';
import { MessagesListPage } from '@/components/shared/messages/MessagesListPage';

export const metadata: Metadata = { title: 'Повідомлення' };

export default async function DashboardMessagesPage({
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
    if (conv) redirect(`/dashboard/messages/${conv.id}`);
  }

  const [conversations, supportRow] = await Promise.all([
    getConversations(),
    getSupportChatState(),
  ]);

  return (
    <MessagesListPage
      conversations={conversations}
      userRole="master"
      basePath="/dashboard/messages"
      supportRow={supportRow}
      supportHref="/dashboard/support/chat"
    />
  );
}
