import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';

export function MyLoyaltyPage() {
  const { user } = useMasterContext();

  const { data, isLoading } = useQuery({
    queryKey: ['my-loyalty', user?.id],
    queryFn: async () => {

      const { data: relations } = await supabase
        .from('client_master_relations')
        .select('master_id, total_visits, loyalty_points')
        .eq('client_id', user!.id);

      const masterIds = (relations ?? []).map((r: any) => r.master_id as string);

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

      return programs.map((p: any) => {
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
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;

  // TODO: <MyLoyaltyPage programs={data ?? []} /> from @/components/client/MyLoyaltyPage
  return (
    <div className="p-6 text-sm text-[#A8928D]">
      MyLoyaltyPage ({data?.length ?? 0} програм) — TODO
    </div>
  );
}
