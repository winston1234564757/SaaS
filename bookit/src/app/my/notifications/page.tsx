import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { ClientNotificationsPage } from '@/components/client/ClientNotificationsPage';

export const metadata = { title: 'Сповіщення' };

export default async function MyNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: notifications }, { data: pendingItems }] = await Promise.all([
    admin
      .from('notifications')
      .select('id, type, title, body, is_read, related_booking_id, created_at')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),

    // All portfolio items awaiting this client's consent
    admin
      .from('portfolio_items')
      .select(`
        id, title,
        portfolio_item_photos ( url, display_order ),
        master_profiles!master_id ( slug, profiles!inner ( full_name ) )
      `)
      .eq('tagged_client_id', user.id)
      .eq('consent_status', 'pending'),
  ]);

  // Mark all as read
  await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  const portfolioConsents = (pendingItems ?? []).map((item: any) => {
    const photos = [...(item.portfolio_item_photos ?? [])].sort((a: any, b: any) => a.display_order - b.display_order);
    const mp = item.master_profiles as { slug: string; profiles: { full_name: string } } | null;
    return {
      id: item.id as string,
      title: item.title as string,
      master_name: mp?.profiles?.full_name ?? 'Майстер',
      master_slug: mp?.slug ?? '',
      cover_url: (photos[0]?.url as string) ?? null,
    };
  });

  return (
    <ClientNotificationsPage
      notifications={(notifications ?? []).map((n: any) => ({
        id: n.id as string,
        type: n.type as string,
        title: n.title as string,
        body: (n.body as string) ?? '',
        isRead: n.is_read as boolean,
        createdAt: n.created_at as string,
        relatedBookingId: n.related_booking_id as string | null,
      }))}
      portfolioConsents={portfolioConsents}
    />
  );
}
