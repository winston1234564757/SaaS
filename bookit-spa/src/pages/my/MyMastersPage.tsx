import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { MyMastersPage as MyMastersComponent } from '@/components/client/MyMastersPage';

export function MyMastersPage() {
  const { user } = useMasterContext();

  const { data, isLoading } = useQuery({
    queryKey: ['my-masters', user?.id],
    queryFn: async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          master_id, date, status,
          master_profiles ( slug, avatar_emoji, categories, city, profiles ( full_name ) )
        `)
        .eq('client_id', user!.id)
        .neq('status', 'cancelled')
        .order('date', { ascending: false });

      const mastersMap = new Map<string, {
        id: string;
        slug: string;
        name: string;
        avatarEmoji: string;
        categories: string[];
        city: string | null;
        visitCount: number;
        lastVisitDate: string;
      }>();

      (bookings ?? []).forEach((b: any) => {
        const mp = b.master_profiles;
        if (!mp) return;
        const existing = mastersMap.get(b.master_id);
        if (existing) {
          existing.visitCount += 1;
          if (b.date > existing.lastVisitDate) existing.lastVisitDate = b.date;
        } else {
          mastersMap.set(b.master_id, {
            id: b.master_id,
            slug: mp.slug,
            name: (mp.profiles as any)?.full_name ?? 'Майстер',
            avatarEmoji: mp.avatar_emoji ?? '💅',
            categories: (mp.categories as string[]) ?? [],
            city: mp.city ?? null,
            visitCount: 1,
            lastVisitDate: b.date,
          });
        }
      });

      return Array.from(mastersMap.values());
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;

  return <MyMastersComponent masters={data ?? []} />;
}
