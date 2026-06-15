import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getConversations, getOrCreateConversation } from '@/lib/actions/messages';
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

  const conversations = await getConversations();

  return <MessagesListPage conversations={conversations} userRole="client" basePath="/my/messages" />;
}
