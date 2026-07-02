'use server';

import { createClient } from '@/lib/supabase/server';

export type MyMaster = {
  id: string;
  slug: string;
  name: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  categories: string[];
  city: string | null;
  visitCount: number;
  lastVisitDate: string;
};

/**
 * Masters the current client has booked (non-cancelled), grouped by master with
 * a visit count and last-visit date. Single source for /my/masters and the
 * "Написати майстру" rail on /my/messages.
 */
export async function getMyMasters(): Promise<MyMaster[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      master_id, date, status,
      master_profiles (
        slug, avatar_emoji, categories, city,
        profiles ( full_name, avatar_url )
      )
    `)
    .eq('client_id', user.id)
    .neq('status', 'cancelled')
    .order('date', { ascending: false });

  const mastersMap = new Map<string, MyMaster>();

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
        avatarUrl: (mp.profiles as any)?.avatar_url ?? null,
        categories: (mp.categories as string[]) ?? [],
        city: mp.city ?? null,
        visitCount: 1,
        lastVisitDate: b.date,
      });
    }
  });

  return Array.from(mastersMap.values());
}
