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
  /** M-REV-02: client whose cancelled booking freed this slot — never notify them. */
  excludeClientId?: string;
  /** M-REV-03: the cancelled booking that triggered this auto deal. Marks it as auto. */
  bookingId?: string;
}

const STARTER_LIMIT = 5;

type Admin = ReturnType<typeof createAdminClient>;

interface FlashNotifyContent {
  masterName:     string;
  serviceName:    string;
  slotDate:       string;
  slotTime:       string;
  originalPrice:  number;
  discountPct:    number;
  expiresInHours: number;
  slug:           string;
}

/**
 * M-REV-03: notify eligible clients about a flash deal AND record per-recipient
 * delivery into flash_deal_recipients (mirrors broadcast_recipients). Push goes
 * out via a bulk broadcast, so per-client channel flags are derived from whether
 * the client has an active push subscription / telegram chat — "reached", not a
 * confirmed per-device receipt. Returns the count for the caller's `sentTo`.
 */
async function notifyAndRecordFlashDeal(
  admin: Admin,
  dealId: string,
  masterId: string,
  clientIds: string[],
  content: FlashNotifyContent,
): Promise<number> {
  if (clientIds.length === 0) return 0;

  const discountedPrice = calcDiscountedPrice(content.originalPrice, content.discountPct);
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${content.slug}`;
  const dateStr    = format(new Date(content.slotDate + 'T00:00:00'), 'd MMMM', { locale: uk });

  const notifTitle = `⚡ Флеш-акція від ${content.masterName}!`;
  const notifBody  = `${content.serviceName} ${dateStr} о ${content.slotTime} — ${discountedPrice} ₴ замість ${content.originalPrice} ₴ (-${content.discountPct}%). Акція діє ${pluralUk(content.expiresInHours, 'годину', 'години', 'годин')}!`;

  // In-app: one row per eligible client.
  await admin.from('notifications').insert(
    clientIds.map((clientId) => ({
      recipient_id:      clientId,
      title:             notifTitle,
      body:              notifBody,
      type:              'flash_deal',
      channel:           'in_app',
      related_master_id: masterId,
    }))
  );

  // Push: bulk broadcast. Track which clients have a subscription (→ were pushed).
  const { data: pushSubs } = await admin
    .from('push_subscriptions')
    .select('user_id, subscription')
    .in('user_id', clientIds);

  const pushClientIds = new Set((pushSubs ?? []).map((s) => s.user_id as string));
  let sentCount = 0;

  if (pushSubs && pushSubs.length > 0) {
    sentCount = await broadcastPush(
      pushSubs.map((s) => s.subscription) as any,
      { title: notifTitle, body: notifBody, url: bookingUrl }
    );
  }

  // Telegram: per-client send. Track which clients have a chat id.
  const { data: clientsWithTg } = await admin
    .from('profiles')
    .select('id, telegram_chat_id')
    .in('id', clientIds)
    .not('telegram_chat_id', 'is', null);

  const tgClientIds = new Set<string>();
  if (clientsWithTg && clientsWithTg.length > 0) {
    const tgMsg = `⚡ <b>Флеш-акція від ${escHtml(content.masterName)}!</b>\n\n💅 ${escHtml(content.serviceName)}\n🗓 ${escHtml(dateStr)} о ${escHtml(content.slotTime)}\n💰 <s>${content.originalPrice} ₴</s> → <b>${discountedPrice} ₴</b> (-${content.discountPct}%)\n⏰ Акція діє ${pluralUk(content.expiresInHours, 'годину', 'години', 'годин')}\n\n<a href="${escHtml(bookingUrl)}">Записатися зараз →</a>`;
    const tgResults = await Promise.allSettled(
      clientsWithTg.map(async (c) => {
        await sendTelegramMessage(c.telegram_chat_id!, tgMsg);
        return c.id as string;
      })
    );
    for (const r of tgResults) {
      if (r.status === 'fulfilled') { tgClientIds.add(r.value); sentCount += 1; }
    }
    const tgFailed = tgResults.filter((r) => r.status === 'rejected').length;
    if (tgFailed > 0) console.warn(`[flash] telegram: ${tgFailed}/${tgResults.length} failed`);
  }

  // M-REV-03: persist the delivery breakdown for the detail sheet.
  await admin.from('flash_deal_recipients').insert(
    clientIds.map((clientId) => ({
      deal_id:       dealId,
      client_id:     clientId,
      in_app_sent:   true,
      push_sent:     pushClientIds.has(clientId),
      telegram_sent: tgClientIds.has(clientId),
    }))
  );

  return sentCount;
}

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

  const { data: deal, error: dealErr } = await admin
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
      // M-REV-03: booking_id present → this is an AUTO deal (freed by a cancel).
      booking_id:     params.bookingId ?? null,
    })
    .select('id')
    .single();

  if (dealErr || !deal) return { error: dealErr?.message ?? 'Не вдалося створити акцію', sentTo: 0 };

  // M-REV-02: lenient 1-arg targeting (all clients free in the next 3 days),
  // minus the client whose booking was just cancelled (excludeClientId).
  const { data: eligibleRows, error: eligibleErr } = await admin
    .rpc('get_eligible_flash_deal_clients', { p_master_id: masterId });
  if (eligibleErr) console.error('[flash] eligible clients RPC failed (auto):', eligibleErr.message);

  const clientIds = ((eligibleRows ?? []) as { client_id: string }[])
    .map((r) => r.client_id)
    .filter((id) => id !== params.excludeClientId);

  const sentCount = await notifyAndRecordFlashDeal(admin, deal.id, masterId, clientIds, params);

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
      // M-REV-03: manual deal — booking_id stays null.
      booking_id:     null,
    })
    .select('id')
    .single();

  if (dealErr || !deal) return { error: dealErr?.message ?? 'Не вдалося створити акцію', sentTo: 0, clients: [] };

  // M-REV-02: lenient 1-arg targeting (all clients free in the next 3 days).
  const { data: eligibleRows, error: eligibleErr } = await admin
    .rpc('get_eligible_flash_deal_clients', { p_master_id: user.id });
  if (eligibleErr) console.error('[flash] eligible clients RPC failed:', eligibleErr.message);

  const notifClients = (eligibleRows ?? []) as { client_id: string; client_name: string }[];
  const clientIds    = notifClients.map((r) => r.client_id);

  const sentCount = await notifyAndRecordFlashDeal(admin, deal.id, user.id, clientIds, {
    masterName,
    serviceName,
    slotDate:       params.slotDate,
    slotTime:       params.slotTime,
    originalPrice:  params.originalPrice,
    discountPct:    params.discountPct,
    expiresInHours: params.expiresInHours,
    slug:           mp?.slug ?? '',
  });

  const clients = notifClients.map((r) => ({ id: r.client_id, name: r.client_name }));
  return { error: null, sentTo: sentCount > 0 ? sentCount : clientIds.length, clients };
}

export interface FlashDealRecipient {
  clientId:     string;
  name:         string;
  inAppSent:    boolean;
  pushSent:     boolean;
  telegramSent: boolean;
}

export interface FlashDealStats {
  origin:        'manual' | 'auto';
  status:        string;
  claimed:       boolean;
  claimedByName: string | null;
  notifiedCount: number;
  pushCount:     number;
  telegramCount: number;
  recipients:    FlashDealRecipient[];
}

/**
 * M-REV-03: detail stats for one flash deal — origin (manual/auto via booking_id),
 * claimed conversion, and the per-recipient channel breakdown. Mirrors
 * getBroadcastDeliveryResults. Old deals (created before this shipped) have no
 * recipient rows → empty list, surfaced as the "no data" state in the UI.
 */
export async function getFlashDealStats(dealId: string): Promise<FlashDealStats | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: deal } = await admin
    .from('flash_deals')
    .select('id, master_id, status, booking_id, claimed_by')
    .eq('id', dealId)
    .single();

  if (!deal || deal.master_id !== user.id) return null;

  const { data: rows } = await admin
    .from('flash_deal_recipients')
    .select('client_id, in_app_sent, push_sent, telegram_sent')
    .eq('deal_id', dealId)
    .order('created_at');

  const recipientRows = rows ?? [];
  const clientIds = recipientRows.map((r) => r.client_id as string);

  // Names for recipients + the claimer, resolved in one query.
  const lookupIds = [...new Set([...clientIds, deal.claimed_by].filter(Boolean) as string[])];
  const nameMap = new Map<string, string>();
  if (lookupIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', lookupIds);
    for (const p of profiles ?? []) nameMap.set(p.id as string, (p.full_name as string) ?? 'Клієнт');
  }

  const recipients: FlashDealRecipient[] = recipientRows.map((r) => ({
    clientId:     r.client_id as string,
    name:         nameMap.get(r.client_id as string) ?? 'Клієнт',
    inAppSent:    !!r.in_app_sent,
    pushSent:     !!r.push_sent,
    telegramSent: !!r.telegram_sent,
  }));

  return {
    origin:        deal.booking_id ? 'auto' : 'manual',
    status:        deal.status as string,
    claimed:       !!deal.claimed_by || deal.status === 'claimed',
    claimedByName: deal.claimed_by ? (nameMap.get(deal.claimed_by as string) ?? 'Клієнт') : null,
    notifiedCount: recipients.length,
    pushCount:     recipients.filter((r) => r.pushSent).length,
    telegramCount: recipients.filter((r) => r.telegramSent).length,
    recipients,
  };
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
