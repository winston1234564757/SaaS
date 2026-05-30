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

export interface ClientAlert {
  type: 'no_review' | 'long_absence';
  clientName: string;
  clientPhone: string;
  daysAgo: number;
  bookingId?: string;
}

export async function getClientAlerts(): Promise<ClientAlert[]> {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date();
  const cutoffReview   = new Date(now.getTime() - 7  * 86_400_000).toISOString().slice(0, 10);
  const cutoffAbsence  = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const sinceReview    = new Date(now.getTime() - 14 * 86_400_000).toISOString().slice(0, 10);

  const [bookingsRes, relationsRes] = await Promise.all([
    // Completed bookings 7-14 days ago with no review
    supabase
      .from('bookings')
      .select('id, client_name, client_phone, date')
      .eq('master_id', user.id)
      .eq('status', 'completed')
      .gte('date', sinceReview)
      .lte('date', cutoffReview)
      .limit(5),

    // Clients who haven't visited in 30+ days
    supabase
      .from('client_master_relations')
      .select('client_name, client_phone, last_visit_at')
      .eq('master_id', user.id)
      .eq('is_archived', false)
      .lte('last_visit_at', cutoffAbsence)
      .order('last_visit_at', { ascending: true })
      .limit(5),
  ]);

  const alerts: ClientAlert[] = [];

  for (const b of (bookingsRes.data ?? [])) {
    if (!b.client_name) continue;
    const days = Math.round((now.getTime() - new Date(b.date).getTime()) / 86_400_000);
    alerts.push({
      type: 'no_review',
      clientName: b.client_name,
      clientPhone: b.client_phone ?? '',
      daysAgo: days,
      bookingId: b.id,
    });
  }

  for (const r of (relationsRes.data ?? [])) {
    if (!r.client_name || !r.last_visit_at) continue;
    const days = Math.round((now.getTime() - new Date(r.last_visit_at).getTime()) / 86_400_000);
    alerts.push({
      type: 'long_absence',
      clientName: r.client_name,
      clientPhone: r.client_phone ?? '',
      daysAgo: days,
    });
  }

  // Interleave: max 4 alerts total, prioritize no_review first
  return alerts.slice(0, 4);
}

export async function getActiveReferralCount(): Promise<number> {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const admin = createAdminClient();
  const { count } = await admin
    .from('master_referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('status', 'active');

  return count ?? 0;
}
