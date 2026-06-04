import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GrowthHubClient } from '@/components/master/growth/GrowthHubClient';
import { getGrowthPageData } from './actions';

export default async function GrowthHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await getGrowthPageData();
  if (!data) redirect('/login');

  return (
    <div className="p-4 md:p-6 lg:p-0">
      <GrowthHubClient
        loyaltyData={data.loyaltyData}
        referralData={data.referralData}
        partnersData={data.partnersData}
      />
    </div>
  );
}
