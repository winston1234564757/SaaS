import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { PortfolioItemPage } from '@/components/master/portfolio/PortfolioItemPage';
import { getMasterReviews, getMasterClients } from '../actions';

export default async function EditPortfolioRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Verify item belongs to this master
  const { data: item } = await admin
    .from('portfolio_items')
    .select('id')
    .eq('id', id)
    .eq('master_id', user.id)
    .single();

  if (!item) redirect('/dashboard/portfolio');

  const [reviews, clients, { data: services }] = await Promise.all([
    getMasterReviews(user.id),
    getMasterClients(user.id),
    admin.from('services').select('id, name').eq('master_id', user.id).eq('is_active', true).order('sort_order'),
  ]);

  return (
    <div className="p-4 md:p-6">
      <PortfolioItemPage
        id={id}
        masterId={user.id}
        services={services ?? []}
        reviews={reviews}
        clients={clients}
      />
    </div>
  );
}
