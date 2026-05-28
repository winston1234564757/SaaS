import { createClient } from '@/lib/supabase/server';
import { MyMastersPage } from '@/components/client/MyMastersPage';

export const metadata = { title: 'Мої майстри' };

export default async function MyMastersPageRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      master_id, date, status,
      master_profiles (
        slug, avatar_emoji, categories, city,
        profiles ( full_name )
      )
    `)
    .eq('client_id', user!.id)
    .neq('status', 'cancelled')
    .order('date', { ascending: false });

  // Group by master_id
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

  const masters = Array.from(mastersMap.values());

  return <MyMastersPage masters={masters} />;
}
