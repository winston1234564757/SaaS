'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { broadcastPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface CreateFlashDealParams {
  serviceName: string;
  slotDate: string;     // YYYY-MM-DD
  slotTime: string;     // HH:MM
  originalPrice: number; // UAH (not kopecks)
  discountPct: number;
  expiresInHours: number; // 2 | 4 | 8
}

export async function createFlashDeal(
  params: CreateFlashDealParams
): Promise<{ error: string | null; sentTo: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований', sentTo: 0 };

  const admin = getAdmin();

  // Check Pro/Studio tier
  const { data: mp } = await admin
    .from('master_profiles')
    .select('subscription_tier, slug')
    .eq('id', user.id)
    .single();

  // Count flash deals this month for Starter
  if (mp?.subscription_tier === 'starter') {
    const start = new Date();
    start.setDate(1);
    const { count } = await admin
      .from('flash_deals')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .gte('created_at', start.toISOString());
    if ((count ?? 0) >= 2) {
      return { error: 'На Starter тарифі — 2 флеш-акції на місяць. Перейдіть на Pro.', sentTo: 0 };
    }
  }

  const expiresAt = new Date(Date.now() + params.expiresInHours * 3600 * 1000).toISOString();
  const { data: deal, error: dealErr } = await admin
    .from('flash_deals')
    .insert({
      master_id: user.id,
      service_name: params.serviceName,
      slot_date: params.slotDate,
      slot_time: params.slotTime,
      original_price: params.originalPrice * 100,
      discount_pct: params.discountPct,
      expires_at: expiresAt,
      status: 'active',
    })
    .select('id')
    .single();

  if (dealErr) return { error: dealErr.message, sentTo: 0 };

  // Get master name
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const masterName = profile?.full_name ?? 'Майстер';
  const discountedPrice = Math.round(params.originalPrice * (1 - params.discountPct / 100));
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${mp?.slug}`;

  const d = new Date(params.slotDate + 'T00:00:00');
  const UA_MONTHS = ['січ','лют','бер','квіт','трав','черв','лип','серп','вер','жовт','лист','груд'];
  const dateStr = `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`;

  const notifTitle = `⚡ Флеш-акція від ${masterName}!`;
  const notifBody = `${params.serviceName} ${dateStr} о ${params.slotTime} — ${discountedPrice} ₴ замість ${params.originalPrice} ₴ (-${params.discountPct}%). Акція діє ${params.expiresInHours} год!`;

  // Fetch unique client IDs from completed bookings
  const { data: completedBookings } = await admin
    .from('bookings')
    .select('client_id')
    .eq('master_id', user.id)
    .eq('status', 'completed')
    .not('client_id', 'is', null);

  const clientIds = [...new Set((completedBookings ?? []).map((b: any) => b.client_id as string))];

  // Broadcast web push to all unique clients of this master
  let sentCount = 0;
  if (clientIds.length > 0) {
    const { data: pushSubs } = await admin
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', clientIds);

    if (pushSubs && pushSubs.length > 0) {
      sentCount = await broadcastPush(
        pushSubs as any,
        { title: notifTitle, body: notifBody, url: bookingUrl }
      );
    }
  }

  // Also notify via Telegram (clients who have telegram_chat_id)
  const { data: clientsWithTg } = clientIds.length > 0
    ? await admin
        .from('profiles')
        .select('telegram_chat_id')
        .in('id', clientIds)
        .not('telegram_chat_id', 'is', null)
    : { data: [] };

  if (clientsWithTg && clientsWithTg.length > 0) {
    const tgMsg = `⚡ <b>Флеш-акція від ${masterName}!</b>\n\n💅 ${params.serviceName}\n🗓 ${dateStr} о ${params.slotTime}\n💰 <s>${params.originalPrice} ₴</s> → <b>${discountedPrice} ₴</b> (-${params.discountPct}%)\n⏰ Акція діє ${params.expiresInHours} год\n\n<a href="${bookingUrl}">Записатися зараз →</a>`;
    await Promise.all(clientsWithTg.map(c => sendTelegramMessage(c.telegram_chat_id!, tgMsg)));
    sentCount += clientsWithTg.length;
  }

  revalidatePath('/dashboard/flash');
  return { error: null, sentTo: sentCount };
}

export async function cancelFlashDeal(dealId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
    .from('flash_deals')
    .update({ status: 'expired' })
    .eq('id', dealId)
    .eq('master_id', user.id);
  revalidatePath('/dashboard/flash');
}
