'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ChannelHealth {
  total: number;
  tg: number;
  push: number;
}

export async function getChannelHealth(): Promise<ChannelHealth> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, tg: 0, push: 0 };

  const admin = createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().split('T')[0];

  const { data: rows } = await admin
    .from('bookings')
    .select('client_id')
    .eq('master_id', user.id)
    .not('client_id', 'is', null)
    .gte('date', sinceStr)
    .limit(500);

  const clientIds = [...new Set((rows ?? []).map(r => r.client_id as string))];
  if (clientIds.length === 0) return { total: 0, tg: 0, push: 0 };

  const [{ count: tgCount }, { data: pushRows }] = await Promise.all([
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('id', clientIds)
      .not('telegram_chat_id', 'is', null),
    admin
      .from('push_subscriptions')
      .select('user_id')
      .in('user_id', clientIds),
  ]);

  const pushUnique = new Set((pushRows ?? []).map(r => r.user_id)).size;

  return { total: clientIds.length, tg: tgCount ?? 0, push: pushUnique };
}

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
