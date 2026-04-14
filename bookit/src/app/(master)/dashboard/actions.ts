'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function markTourSeen(tourName: string = 'dashboard'): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();

  // Fetch current seen_tours to merge — avoids overwriting previously completed tours
  const { data: current } = await admin
    .from('master_profiles')
    .select('seen_tours')
    .eq('id', user.id)
    .single();

  const currentTours = (current?.seen_tours as Record<string, boolean> | null) ?? {};

  const { error } = await admin
    .from('master_profiles')
    .update({
      seen_tours: { ...currentTours, [tourName]: true },
      // Keep legacy has_seen_tour in sync for dashboard tour
      ...(tourName === 'dashboard' ? { has_seen_tour: true } : {}),
    })
    .eq('id', user.id);

  return { error: error?.message ?? null };
}
