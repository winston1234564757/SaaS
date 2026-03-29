'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastPush } from '@/lib/push';
import { sendTelegramMessage, escHtml } from '@/lib/telegram';

import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { pluralize } from '@/lib/utils/dates';

export interface CreateFlashDealParams {
  serviceId: string;     // UUID послуги
  slotDate: string;      // YYYY-MM-DD
  slotTime: string;      // HH:MM
  originalPrice: number; // грн (не копійки)
  discountPct: number;
  expiresInHours: number; // 2 | 4 | 8
}

const STARTER_LIMIT = 5;

export async function createFlashDeal(
  params: CreateFlashDealParams
): Promise<{ error: string | null; sentTo: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований', sentTo: 0 };

  const admin = createAdminClient();

  // Паралельно: майстер-профіль + назва послуги
  const [{ data: mp }, { data: service }] = await Promise.all([
    admin
      .from('master_profiles')
      .select('subscription_tier, slug')
      .eq('id', user.id)
      .single(),
    admin
      .from('services')
      .select('name')
      .eq('id', params.serviceId)
      .eq('master_id', user.id)
      .single(),
  ]);

  if (!service) return { error: 'Послугу не знайдено або немає доступу', sentTo: 0 };

  // Перевірка ліміту Starter
  if (mp?.subscription_tier === 'starter') {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await admin
      .from('flash_deals')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .gte('created_at', monthStart.toISOString());
    if ((count ?? 0) >= STARTER_LIMIT) {
      return {
        error: `На Starter тарифі — ${STARTER_LIMIT} флеш-акцій на місяць. Перейдіть на Pro.`,
        sentTo: 0,
      };
    }
  }

  const serviceName = service.name;
  const expiresAt = new Date(Date.now() + params.expiresInHours * 3600 * 1000).toISOString();

  const { data: deal, error: dealErr } = await admin
    .from('flash_deals')
    .insert({
      master_id:      user.id,
      service_id:     params.serviceId,
      service_name:   serviceName,
      slot_date:      params.slotDate,
      slot_time:      params.slotTime,
      original_price: params.originalPrice * 100,
      discount_pct:   params.discountPct,
      expires_at:     expiresAt,
      status:         'active',
    })
    .select('id')
    .single();

  if (dealErr) return { error: dealErr.message, sentTo: 0 };

  // Дані для сповіщень
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const masterName     = profile?.full_name ?? 'Майстер';
  const discountedPrice = Math.round(params.originalPrice * (1 - params.discountPct / 100));
  const bookingUrl     = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${mp?.slug}`;
  const dateStr        = format(new Date(params.slotDate + 'T00:00:00'), 'd MMMM', { locale: uk });

  const notifTitle = `⚡ Флеш-акція від ${masterName}!`;
  const notifBody  = `${serviceName} ${dateStr} о ${params.slotTime} — ${discountedPrice} ₴ замість ${params.originalPrice} ₴ (-${params.discountPct}%). Акція діє ${pluralize(params.expiresInHours, ['годину', 'години', 'годин'])}!`;

  // ── Смарт-таргетинг: виключно через SQL RPC (±48 год) ──
  // Слот у київський час (+03:00), PostgreSQL конвертує в UTC при порівнянні
  const slotTimestamp = `${params.slotDate}T${params.slotTime}:00+03:00`;
  const { data: eligibleRows } = await admin
    .rpc('get_eligible_flash_deal_clients', {
      p_master_id:      user.id,
      p_slot_timestamp: slotTimestamp,
    });

  const clientIds = (eligibleRows ?? []).map((r: { client_id: string }) => r.client_id);

  let sentCount = 0;

  if (clientIds.length > 0) {
    // In-app notifications
    await admin.from('notifications').insert(
      clientIds.map((clientId: string) => ({
        recipient_id:      clientId,
        title:             notifTitle,
        body:              notifBody,
        type:              'flash_deal',
        channel:           'in_app',
        related_master_id: user.id,
      }))
    );

    // Web Push
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

    // Telegram
    const { data: clientsWithTg } = await admin
      .from('profiles')
      .select('telegram_chat_id')
      .in('id', clientIds)
      .not('telegram_chat_id', 'is', null);

    if (clientsWithTg && clientsWithTg.length > 0) {
      const tgMsg = `⚡ <b>Флеш-акція від ${escHtml(masterName)}!</b>\n\n💅 ${escHtml(serviceName)}\n🗓 ${escHtml(dateStr)} о ${escHtml(params.slotTime)}\n💰 <s>${params.originalPrice} ₴</s> → <b>${discountedPrice} ₴</b> (-${params.discountPct}%)\n⏰ Акція діє ${pluralize(params.expiresInHours, ['годину', 'години', 'годин'])}\n\n<a href="${escHtml(bookingUrl)}">Записатися зараз →</a>`;
      const tgResults = await Promise.allSettled(
        clientsWithTg.map(c => sendTelegramMessage(c.telegram_chat_id!, tgMsg))
      );
      const tgFailed = tgResults.filter(r => r.status === 'rejected');
      sentCount += tgResults.length - tgFailed.length;
      if (tgFailed.length > 0) {
        console.warn(`[flash] telegram: ${tgFailed.length}/${tgResults.length} failed`);
      }
    }
  }

  return { error: null, sentTo: sentCount };
}

export async function cancelFlashDeal(dealId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };
  const admin = createAdminClient();
  const { error } = await admin
    .from('flash_deals')
    .update({ status: 'expired' })
    .eq('id', dealId)
    .eq('master_id', user.id);
  if (error) return { error: error.message };
  return { error: null };
}
