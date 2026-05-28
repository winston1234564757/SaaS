import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortfolioPage } from '@/components/master/portfolio/PortfolioPage';
import { getPortfolioItems } from './actions';

export default async function PortfolioRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = (await import('@/lib/supabase/admin')).createAdminClient();

  const [{ data: mp }, items] = await Promise.all([
    admin.from('master_profiles').select('subscription_tier, slug').eq('id', user.id).single(),
    getPortfolioItems(),
  ]);

  return (
    <div className="p-4 md:p-6">
      <PortfolioPage
        initialItems={items}
        tier={mp?.subscription_tier ?? 'starter'}
        masterSlug={mp?.slug ?? ''}
      />
    </div>
  );
}
