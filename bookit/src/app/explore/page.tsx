import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ExplorePage } from '@/components/public/ExplorePage';
import { getExploreMasters } from './data';

export const metadata: Metadata = {
  title: 'Знайти майстра — Bookit',
  description: 'Знайди свого майстра краси: нігті, волосся, брови, макіяж та більше. Онлайн-запис одразу.',
  alternates: {
    canonical: '/explore',
  },
};

export default async function Explore() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Public catalog — shared across all visitors, served from the data cache.
  const { items, categoryCounts } = await getExploreMasters();

  // Smart sort: preferred categories from this user's booking history (live).
  let preferredCategories: string[] = [];
  if (user) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('master_profiles!inner(categories)')
      .eq('client_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(30);

    if (bookings?.length) {
      const counts: Record<string, number> = {};
      for (const b of bookings) {
        const cats = (b.master_profiles as any)?.categories as string[] | undefined;
        for (const c of cats ?? []) {
          counts[c] = (counts[c] ?? 0) + 1;
        }
      }
      preferredCategories = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([cat]) => cat)
        .slice(0, 5);
    }
  }

  // Client's C2B referral code for the inline "invite your master" CTA (read-only;
  // generation happens in /my/loyalty). Absent for anon/masters → CTA routes there.
  let inviteCode: string | null = null;
  if (user) {
    const { data: cp } = await supabase
      .from('client_profiles')
      .select('c2b_referral_code')
      .eq('id', user.id)
      .maybeSingle();
    inviteCode = (cp?.c2b_referral_code as string | null) ?? null;
  }

  return (
    <ExplorePage
      masters={items}
      categoryCounts={categoryCounts}
      preferredCategories={preferredCategories}
      inviteCode={inviteCode}
    />
  );
}
