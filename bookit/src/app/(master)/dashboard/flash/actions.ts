'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastPush } from '@/lib/push';
import { sendTelegramMessage, escHtml } from '@/lib/telegram';
import { getMonthStart, calcDiscountedPrice } from '@/lib/utils/flashDeal';

import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { pluralUk } from '@/lib/utils/pluralUk';

export interface CreateFlashDealParams {
  serviceId: string;
  slotDate: string;
  slotTime: string;
  originalPrice: number;
  discountPct: number;
  expiresInHours: number;
}

export interface CreateFlashDealInternalParams {
  serviceId:      string;
  serviceName:    string;
  slotDate:       string;
  slotTime:       string;
  originalPrice:  number;
  discountPct:    number;
  expiresInHours: number;
  slug:           string;
  masterName:     string;
}

const STARTER_LIMIT = 5;

// Shared insert + notify logic. No auth check — called from auto-trigger and createFlashDeal.
// FR-5: Starter limit is a silent no-op (returns { error: null, sentTo: 0 }).
export async function createFlashDealInternal(
  masterId: string,
  tier: string,
  params: CreateFlashDealInternalParams,
): Promise<{ error: string | null; sentTo: number }> {
  const admin = createAdminClient();

  if (tier === 'starter') {
    const monthStart = getMonthStart(new Date());
    const { count } = await admin
      .from('flash_deals')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', masterId)
      .gte('created_at', monthStart.toISOString());
    if ((count ?? 0) >= STARTER_LIMIT) return { error: null, sentTo: 0 };
  }

  const expiresAt = new Date(Date.now() + params.expiresInHours * 3600 * 1000).toISOString();

  const { error: dealErr } = await admin
    .from('flash_deals')
    .insert({
      master_id:      masterId,
      service_id:     params.serviceId,
      service_name:   params.serviceName,
      slot_date:      params.slotDate,
      slot_time:      params.slotTime,
      original_price: params.originalPrice * 100,
      discount_pct:   params.discountPct,
      expires_at:     expiresAt,
      status:         'active',
    });

  if (dealErr) return { error: dealErr.message, sentTo: 0 };

  const discountedPrice = calcDiscountedPrice(params.originalPrice, params.discountPct);
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${params.slug}`;
  const dateStr    = format(new Date(params.slotDate + 'T00:00:00'), 'd MMMM', { locale: uk });

  const notifTitle = `⚡ Флеш-акція від ${params.masterName}!`;
  const notifBody  = `${params.serviceName} ${dateStr} о ${params.slotTime} — ${discountedPrice} ₴ замість ${params.originalPrice} ₴ (-${params.discountPct}%). Акція діє ${pluralUk(params.expiresInHours, 'годину', 'години', 'годин')}!`;

  // FR-8: both params required by the RPC
  const slotTimestamp = new Date(`${params.slotDate}T${params.slotTime}:00`).toISOString();
  const { data: eligibleRows, error: eligibleErr } = await admin
    .rpc('get_eligible_flash_deal_clients', {
      p_master_id:      masterId,
      p_service_id:     params.serviceId,
      p_slot_timestamp: slotTimestamp,
    });
  if (eligibleErr) console.error('[flash] eligible clients RPC failed (auto):', eligibleErr.message);

  const notifClients = (eligibleRows ?? []) as { client_id: string; client_name: string }[];
  const clientIds    = notifClients.map(r => r.client_id);
  let sentCount = 0;

  if (clientIds.length > 0) {
    await admin.from('notifications').insert(
      clientIds.map((clientId: string) => ({
        recipient_id:      clientId,
        title:             notifTitle,
        body:              notifBody,
        type:              'flash_deal',
        channel:           'in_app',
        related_master_id: masterId,
      }))
    );

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

    const { data: clientsWithTg } = await admin
      .from('profiles')
      .select('telegram_chat_id')
      .in('id', clientIds)
      .not('telegram_chat_id', 'is', null);

    if (clientsWithTg && clientsWithTg.length > 0) {
      const tgMsg = `⚡ <b>Флеш-акція від ${escHtml(params.masterName)}!</b>\n\n💅 ${escHtml(params.serviceName)}\n🗓 ${escHtml(dateStr)} о ${escHtml(params.slotTime)}\n💰 <s>${params.originalPrice} ₴</s> → <b>${discountedPrice} ₴</b> (-${params.discountPct}%)\n⏰ Акція діє ${pluralUk(params.expiresInHours, 'годину', 'години', 'годин')}\n\n<a href="${escHtml(bookingUrl)}">Записатися зараз →</a>`;
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

  return { error: null, sentTo: sentCount > 0 ? sentCount : clientIds.length };
}

export async function createFlashDeal(
  params: CreateFlashDealParams
): Promise<{ error: string | null; sentTo: number; clients: { id: string; name: string }[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований', sentTo: 0, clients: [] };

  const admin = createAdminClient();

  const [{ data: mp }, { data: service }, { data: profile }] = await Promise.all([
    admin.from('master_profiles').select('subscription_tier, slug').eq('id', user.id).single(),
    admin.from('services').select('name').eq('id', params.serviceId).eq('master_id', user.id).single(),
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
  ]);

  if (!service) return { error: 'Послугу не знайдено або немає доступу', sentTo: 0, clients: [] };

  // Manual creation: show error when Starter limit is reached
  if (mp?.subscription_tier === 'starter') {
    const monthStart = getMonthStart(new Date());
    const { count } = await admin
      .from('flash_deals')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .gte('created_at', monthStart.toISOString());
    if ((count ?? 0) >= STARTER_LIMIT) {
      return {
        error: `На Starter тарифі — ${STARTER_LIMIT} флеш-акцій на місяць. Перейдіть на Pro.`,
        sentTo: 0,
        clients: [],
      };
    }
  }

  const serviceName = service.name;
  const masterName  = profile?.full_name ?? 'Майстер';
  const expiresAt   = new Date(Date.now() + params.expiresInHours * 3600 * 1000).toISOString();

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

  if (dealErr) return { error: dealErr.message, sentTo: 0, clients: [] };

  const discountedPrice = calcDiscountedPrice(params.originalPrice, params.discountPct);
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${mp?.slug}`;
  const dateStr    = format(new Date(params.slotDate + 'T00:00:00'), 'd MMMM', { locale: uk });

  const notifTitle = `⚡ Флеш-акція від ${masterName}!`;
  const notifBody  = `${serviceName} ${dateStr} о ${params.slotTime} — ${discountedPrice} ₴ замість ${params.originalPrice} ₴ (-${params.discountPct}%). Акція діє ${pluralUk(params.expiresInHours, 'годину', 'години', 'годин')}!`;

  // FR-8: both params required by the RPC
  const slotTimestamp = new Date(`${params.slotDate}T${params.slotTime}:00`).toISOString();
  const { data: eligibleRows, error: eligibleErr } = await admin
    .rpc('get_eligible_flash_deal_clients', {
      p_master_id:      user.id,
      p_service_id:     params.serviceId,
      p_slot_timestamp: slotTimestamp,
    });
  if (eligibleErr) console.error('[flash] eligible clients RPC failed:', eligibleErr.message);

  const notifClients = (eligibleRows ?? []) as { client_id: string; client_name: string }[];
  const clientIds    = notifClients.map(r => r.client_id);
  let sentCount = 0;

  if (clientIds.length > 0) {
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

    const { data: clientsWithTg } = await admin
      .from('profiles')
      .select('telegram_chat_id')
      .in('id', clientIds)
      .not('telegram_chat_id', 'is', null);

    if (clientsWithTg && clientsWithTg.length > 0) {
      const tgMsg = `⚡ <b>Флеш-акція від ${escHtml(masterName)}!</b>\n\n💅 ${escHtml(serviceName)}\n🗓 ${escHtml(dateStr)} о ${escHtml(params.slotTime)}\n💰 <s>${params.originalPrice} ₴</s> → <b>${discountedPrice} ₴</b> (-${params.discountPct}%)\n⏰ Акція діє ${pluralUk(params.expiresInHours, 'годину', 'години', 'годин')}\n\n<a href="${escHtml(bookingUrl)}">Записатися зараз →</a>`;
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

  const clients = notifClients.map(r => ({ id: r.client_id, name: r.client_name }));
  return { error: null, sentTo: sentCount > 0 ? sentCount : clientIds.length, clients };
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

export async function updateAutoFlashSettings(settings: {
  autoFlashOnCancel:    boolean;
  autoFlashDiscountPct: number;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };
  const admin = createAdminClient();
  const { error } = await admin
    .from('master_profiles')
    .update({
      auto_flash_on_cancel:    settings.autoFlashOnCancel,
      auto_flash_discount_pct: settings.autoFlashDiscountPct,
    })
    .eq('id', user.id);
  return { error: error?.message ?? null };
}
