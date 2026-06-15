import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DirectChatPage } from '@/components/shared/messages/DirectChatPage';

type ProfileMini = { id: string; full_name: string | null; avatar_url: string | null };
type ConvRow = {
  id: string;
  client_id: string;
  master_id: string;
  client: ProfileMini | null;
  master: ProfileMini | null;
};

export default async function DashboardMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('conversations')
    .select(`
      id,
      client_id,
      master_id,
      client:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
      master:profiles!conversations_master_id_fkey(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (!data) notFound();

  const conv = data as unknown as ConvRow;
  const isClient = conv.client_id === user.id;
  const participant = isClient ? conv.master : conv.client;

  return (
    <DirectChatPage
      conversationId={id}
      userId={user.id}
      participantName={participant?.full_name ?? 'Невідомий'}
      participantAvatarUrl={participant?.avatar_url ?? null}
      userRole={isClient ? 'client' : 'master'}
      backHref="/dashboard/messages"
    />
  );
}
