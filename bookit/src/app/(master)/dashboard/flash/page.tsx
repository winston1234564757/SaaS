import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { FlashDealPage } from '@/components/master/flash/FlashDealPage';

export interface FlashDealRow {
  id: string;
  service_name: string;
  slot_date: string;
  slot_time: string;
  original_price: number;
  discount_pct: number;
  expires_at: string;
  status: string;
}

export default async function FlashPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [{ data: mp }, { data: deals }] = await Promise.all([
    admin.from('master_profiles').select('subscription_tier').eq('id', user.id).single(),
    admin
      .from('flash_deals')
      .select('id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at, status')
      .eq('master_id', user.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="p-6">
      <FlashDealPage
        activeDeals={(deals ?? []) as FlashDealRow[]}
        tier={mp?.subscription_tier ?? 'starter'}
      />
    </div>
  );
}
