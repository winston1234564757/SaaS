import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { PortfolioPage } from '@/components/master/portfolio/PortfolioPage';
import { getPortfolioItems, getMasterReviews, getMasterClients } from './actions';

export default async function PortfolioRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: mp }, items, reviews, clients, { data: services }] = await Promise.all([
    admin.from('master_profiles').select('subscription_tier, slug').eq('id', user.id).single(),
    getPortfolioItems(),
    getMasterReviews(),
    getMasterClients(),
    admin.from('services').select('id, name').eq('master_id', user.id).eq('is_active', true).order('sort_order'),
  ]);

  return (
    <div className="p-4 md:p-6">
      <PortfolioPage
        initialItems={items}
        tier={mp?.subscription_tier ?? 'starter'}
        masterSlug={mp?.slug ?? ''}
        masterId={user.id}
        services={services ?? []}
        reviews={reviews}
        clients={clients}
      />
    </div>
  );
}
