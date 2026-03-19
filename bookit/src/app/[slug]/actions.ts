'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, buildBookingMessage, UA_MONTHS } from '@/lib/telegram';
import { sendPush } from '@/lib/push';

/**
 * Links a booking to the currently authenticated client.
 * Uses service role to bypass RLS (no client UPDATE policy on bookings).
 */
export async function linkBookingToClient(bookingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  // Ensure client_profiles row exists
  await admin
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  // Link booking to client
  await admin
    .from('bookings')
    .update({ client_id: user.id })
    .eq('id', bookingId)
    .is('client_id', null); // only link if not already linked
}

/**
 * Ensures client_profiles row exists for the current user (needed for client_id FK).
 * Returns userId if user is logged in with role=client, otherwise null.
 */
export async function ensureClientProfile(): Promise<{ userId: string | null; name: string | null; phone: string | null; email: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null, name: null, phone: null, email: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'client') return { userId: null, name: null, phone: null, email: null };

  // Ensure client_profiles row exists (FK requirement)
  await supabase
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  return {
    userId: user.id,
    name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    email: user.email ?? null,
  };
}

export async function notifyMasterOnBooking(params: {
  masterId: string;
  clientName: string;
  date: string;
  startTime: string;
  services: string;
  totalPrice: number;
  notes?: string | null;
  products?: { name: string; quantity: number }[];
}): Promise<void> {
  const supabase = await createClient();
  const admin = createAdminClient();

  // ── Telegram ──────────────────────────────────────────────────────────
  try {
    const { data: mp } = await supabase
      .from('master_profiles')
      .select('telegram_chat_id')
      .eq('id', params.masterId)
      .single();
    if (mp?.telegram_chat_id) {
      await sendTelegramMessage(mp.telegram_chat_id, buildBookingMessage(params));
    }
  } catch (e) {
    console.error('[notifyMasterOnBooking] Telegram error:', e);
  }

  // ── Web Push ───────────────────────────────────────────────────────────
  try {
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', params.masterId);
    if (subs && subs.length > 0) {
      const d = new Date(params.date + 'T00:00:00');
      const day = d.getDate();
      const month = UA_MONTHS[d.getMonth()];
      const timeStr = params.startTime.slice(0, 5);
      const pushBody = `👤 ${params.clientName}\n📅 ${day}-го ${month} о ${timeStr} на «${params.services}»`;
      await Promise.allSettled(
        subs.map(sub =>
          sendPush(sub.subscription, { title: '🔥 Новий запис!', body: pushBody, url: '/dashboard/bookings' })
        )
      );
    }
  } catch (e) {
    console.error('[notifyMasterOnBooking] Push error:', e);
  }
}
