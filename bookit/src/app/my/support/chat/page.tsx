import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SupportChatPage } from '@/components/shared/support/SupportChatPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Чат підтримки — BookIT',
};

export default async function ClientSupportChatRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if client user has an existing active chat ticket
  const { data: existingChats } = await supabase
    .from('support_tickets')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'chat')
    .in('status', ['open', 'active'])
    .order('created_at', { ascending: false })
    .limit(1);

  const initialTicketId = existingChats?.[0]?.id || null;

  return (
    <SupportChatPage 
      user={{ id: user.id }} 
      userRole="client" 
      initialTicketId={initialTicketId} 
    />
  );
}
