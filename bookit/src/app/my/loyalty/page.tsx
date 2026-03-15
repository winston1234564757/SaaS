import { createClient } from '@/lib/supabase/server';
import { MyLoyaltyPage } from '@/components/client/MyLoyaltyPage';

export const metadata = { title: 'Лояльність — Bookit' };

export default async function LoyaltyRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get client's relations with masters
  const { data: relations } = await supabase
    .from('client_master_relations')
    .select('master_id, total_visits, loyalty_points')
    .eq('client_id', user!.id);

  const masterIds = (relations ?? []).map((r: any) => r.master_id as string);

  // Get active loyalty programs for those masters
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

  // Combine programs with client's visit data
  const items = programs.map((p: any) => {
    const rel = (relations ?? []).find((r: any) => r.master_id === p.master_profiles?.id);
    const visits = (rel?.total_visits as number) ?? 0;
    const mp = p.master_profiles;
    return {
      id: p.id as string,
      name: p.name as string,
      targetVisits: p.target_visits as number,
      rewardType: p.reward_type as string,
      rewardValue: Number(p.reward_value ?? 0),
      currentVisits: visits,
      masterId: mp?.id as string,
      masterSlug: mp?.slug as string,
      masterName: (mp?.profiles as any)?.full_name as string ?? 'Майстер',
      masterEmoji: (mp?.avatar_emoji as string) ?? '💅',
    };
  });

  return <MyLoyaltyPage programs={items} />;
}
