import { createClient } from '@/lib/supabase/server';
import { MyLoyaltyPage } from '@/components/client/MyLoyaltyPage';
import { getOrGenerateProfileReferralCode } from '@/lib/actions/referrals';

export const metadata = { title: 'Лояльність — Bookit' };

export default async function LoyaltyRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get client's relations with masters (for loyalty)
  const { data: relations } = await supabase
    .from('client_master_relations')
    .select('master_id, total_visits, loyalty_points')
    .eq('client_id', user!.id);

  const masterIds = (relations ?? []).map((r: any) => r.master_id as string);

  // 2. Get active loyalty programs for those masters
  let programs: any[] = [];
  if (masterIds.length > 0) {
    const { data } = await supabase
      .from('loyalty_programs')
      .select(`
        id, name, target_visits, reward_type, reward_value, is_active,
        master_profiles!inner (
          id, slug, avatar_emoji,
          profiles!inner ( full_name )
        )
      `)
      .in('master_id', masterIds)
      .eq('is_active', true);
    programs = data ?? [];
  }

  // 3. Combine programs with client's visit data
  const items = programs.map((p: any) => {
    const rel = (relations ?? []).find((r: any) => r.master_id === p.master_profiles?.id);
    const visits = (rel?.total_visits as number) ?? 0;
    const mp = p.master_profiles;
    // Handle potential array from profiles join
    const profile = Array.isArray(mp?.profiles) ? mp.profiles[0] : mp?.profiles;
    
    return {
      id: p.id as string,
      name: p.name as string,
      targetVisits: p.target_visits as number,
      rewardType: p.reward_type as string,
      rewardValue: Number(p.reward_value ?? 0),
      currentVisits: visits,
      masterId: mp?.id as string,
      masterSlug: mp?.slug as string,
      masterName: profile?.full_name as string ?? 'Майстер',
      masterEmoji: (mp?.avatar_emoji as string) ?? '💅',
    };
  });

  // 4. Get/Generate client's referral data
  const { code: referralCode } = await getOrGenerateProfileReferralCode(user!.id, 'client');
  
  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('total_masters_invited')
    .eq('id', user!.id)
    .single();

  // 5. Get client's barter promocodes
  const { data: promocodes } = await supabase
    .from('client_promocodes')
    .select(`
      id, discount_percentage, is_used, created_at,
      master_profiles (
        id, slug, avatar_emoji,
        profiles ( full_name )
      )
    `)
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false });

  // Map promocodes for UI
  const promoItems = (promocodes ?? []).map((pc: any) => {
    const mp = Array.isArray(pc.master_profiles) ? pc.master_profiles[0] : pc.master_profiles;
    const profile = Array.isArray(mp?.profiles) ? mp.profiles[0] : mp?.profiles;
    return {
      id: pc.id,
      discount: pc.discount_percentage,
      isUsed: pc.is_used,
      masterName: profile?.full_name || 'Майстер',
      masterSlug: mp?.slug,
      masterEmoji: mp?.avatar_emoji || '💅',
      createdAt: pc.created_at,
    };
  });

  return (
    <MyLoyaltyPage 
      programs={items} 
      referralCode={referralCode || ''}
      totalMastersInvited={clientProfile?.total_masters_invited || 0}
      promocodes={promoItems}
    />
  );
}
