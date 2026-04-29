import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, buildBookingMessage, UA_MONTHS, escHtml } from '@/lib/telegram';
import { sendPush } from '@/lib/push';
import { sendTurboSMS } from '@/lib/turbosms';

export interface BookingNotifParams {
  masterId: string;
  bookingId?: string | null;
  clientName: string;
  date: string;
  startTime: string;
  services: string;
  totalPrice: number;
  notes?: string | null;
  products?: { name: string; quantity: number }[];
}

/**
 * Надсилає сповіщення майстру про новий запис за пріоритетним каскадом:
 *   1. Web Push (PWA) — якщо є активні підписки і хоча б одна успішна
 *   2. Telegram     — якщо підписок нема або всі провалились
 *   3. SMS          — якщо Telegram не підключений
 *
 * Автоматично видаляє застарілі push-підписки (HTTP 410/404).
 */
export async function notifyMasterNewBooking(params: BookingNotifParams): Promise<void> {
  const admin = createAdminClient();

  const [pushResult, masterResult, profileResult] = await Promise.all([
    admin
      .from('push_subscriptions')
      .select('endpoint, subscription')
      .eq('user_id', params.masterId),
    admin
      .from('master_profiles')
      .select('telegram_chat_id')
      .eq('id', params.masterId)
      .single(),
    admin
      .from('profiles')
      .select('phone')
      .eq('id', params.masterId)
      .single(),
  ]);

  const subs = pushResult.data ?? [];
  const telegramChatId = masterResult.data?.telegram_chat_id ?? null;
  const masterPhone = profileResult.data?.phone ?? null;

  // ── 1. Web Push ─────────────────────────────────────────────────────────────
  let pushDelivered = false;

  if (subs.length > 0) {
    const d = new Date(params.date + 'T00:00:00');
    const dateStr = `${d.getDate()}-го ${UA_MONTHS[d.getMonth()]} о ${params.startTime.slice(0, 5)}`;
    const deepLink = params.bookingId
      ? `/dashboard/bookings?bookingId=${params.bookingId}`
      : '/dashboard/bookings';
    const pushPayload = {
      title: 'Новий запис!',
      body: `👤 ${params.clientName} · ${dateStr} · «${params.services}»`,
      url: deepLink,
    };

    const results = await Promise.allSettled(
      subs.map(sub =>
        sendPush(
          sub.subscription as { endpoint: string; keys: { p256dh: string; auth: string } },
          pushPayload,
        )
      )
    );

    const expiredEndpoints: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        if (r.value.ok) pushDelivered = true;
        if (r.value.gone) expiredEndpoints.push(subs[i].endpoint as string);
      }
    });

    if (expiredEndpoints.length > 0) {
      void admin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }
  }

  // ── 2. Telegram ──────────────────────────────────────────────────────────────
  let telegramSent = false;
  if (telegramChatId) {
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
    const link = params.bookingId ? `${SITE_URL}/dashboard/bookings?bookingId=${params.bookingId}` : `${SITE_URL}/dashboard/bookings`;
    const replyMarkup = { inline_keyboard: [[{ text: 'Деталі запису', url: link }]] };
    telegramSent = await sendTelegramMessage(telegramChatId, buildBookingMessage(params), replyMarkup);
  }

  // ── 3. SMS (Fallback) ────────────────────────────────────────────────────────
  if (pushDelivered || telegramSent) return;

  if (masterPhone) {
    const d = new Date(params.date + 'T00:00:00');
    const dateStr = `${d.getDate()}-го ${UA_MONTHS[d.getMonth()]} о ${params.startTime.slice(0, 5)}`;
    const text = `BookIT: Новий запис! ${params.clientName}, ${dateStr} на «${params.services}». ${params.totalPrice} грн`;
    await sendTurboSMS(masterPhone, text).catch(() => {});
  }
}

export interface BroadcastNotifParams {
  clientId: string;
  phone: string;
  channels: string[];
  pushTitle: string;
  pushBody: string;
  pushUrl: string;
  telegramText: string;
  smsText: string;
  masterName: string;
  shortUrl: string;
}

export interface BroadcastDelivery {
  pushDelivered: boolean;
  telegramSent: boolean;
  smsSent: boolean;
}

/**
 * Надсилає клієнту broadcast-повідомлення.
 * Cascade: Push → Telegram → SMS (fallback якщо push не доставлено).
 * Використовує profiles.phone та profiles.telegram_chat_id як джерело правди.
 */
export async function notifyClientBroadcast(
  params: BroadcastNotifParams,
): Promise<BroadcastDelivery> {
  const admin = createAdminClient();

  const [profileRes, pushSubsRes] = await Promise.all([
    admin
      .from('profiles')
      .select('phone, telegram_chat_id')
      .eq('id', params.clientId)
      .maybeSingle(),
    admin
      .from('push_subscriptions')
      .select('endpoint, subscription')
      .eq('user_id', params.clientId),
  ]);

  const profile = profileRes.data;
  const subs = pushSubsRes.data ?? [];

  let pushDelivered = false;
  let telegramSent = false;
  let smsSent = false;

  // ── In-app notification (always, if profile exists) ───────────────────────
  if (profile) {
    await admin.from('notifications').insert({
      recipient_id:      params.clientId,
      type:              'broadcast',
      title:             `Повідомлення від ${params.masterName}`,
      body:              `${params.pushBody}\n${params.shortUrl}`,
      related_master_id: null,
      related_booking_id: null,
      is_read:           false,
    }).then(() => {}, () => {});
  }

  // ── Push ──────────────────────────────────────────────────────────────────
  if (params.channels.includes('push') && subs.length > 0) {
    const results = await Promise.allSettled(
      subs.map(sub =>
        sendPush(
          sub.subscription as { endpoint: string; keys: { p256dh: string; auth: string } },
          { title: params.pushTitle, body: params.pushBody, url: params.pushUrl },
        )
      )
    );
    const expiredEndpoints: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        if (r.value.ok) pushDelivered = true;
        if (r.value.gone) expiredEndpoints.push(subs[i].endpoint as string);
      }
    });
    if (expiredEndpoints.length > 0) {
      void admin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }
  }

  // ── Telegram ──────────────────────────────────────────────────────────────
  if (params.channels.includes('telegram') && profile?.telegram_chat_id) {
    telegramSent = await sendTelegramMessage(profile.telegram_chat_id, params.telegramText)
      .catch(() => false);
  }

  // ── SMS — fallback if no push delivered ───────────────────────────────────
  if (params.channels.includes('sms') && !pushDelivered) {
    // prefer profiles.phone as source of truth; fall back to phone from RPC
    const targetPhone = profile?.phone ?? params.phone;
    if (targetPhone) {
      const result = await sendTurboSMS(targetPhone, params.smsText).catch(() => ({ ok: false }));
      smsSent = (result as { ok: boolean }).ok;
    }
  }

  return { pushDelivered, telegramSent, smsSent };
}

export interface PortfolioConsentParams {
  clientId: string;
  masterName: string;
  masterSlug: string;
  portfolioItemId: string;
  portfolioItemTitle: string;
}

/**
 * Надсилає клієнту сповіщення про тег у портфоліо майстра.
 * Cascade: in-app → Telegram → SMS
 */
export async function notifyClientPortfolioConsent(params: PortfolioConsentParams): Promise<void> {
  const admin = createAdminClient();

  const { data: clientProfile } = await admin
    .from('profiles')
    .select('phone, telegram_chat_id, full_name')
    .eq('id', params.clientId)
    .single();

  // 1. In-app notification (always)
  await admin.from('notifications').insert({
    recipient_id: params.clientId,
    type: 'portfolio_consent_request',
    title: `${params.masterName} відмітив вас у портфоліо`,
    body: `«${params.portfolioItemTitle}» — підтвердіть або відхиліть участь`,
    related_master_id: null,
    related_booking_id: null,
    is_read: false,
  });

  // 1.5 Push
  const { data: pushSubs } = await admin
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', params.clientId);

  if (pushSubs && pushSubs.length > 0) {
    const { sendPush } = await import('@/lib/push');
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
    await Promise.allSettled(
      pushSubs.map(sub => sendPush(sub.subscription as any, {
        title: `${params.masterName} відмітив вас у портфоліо`,
        body: `«${params.portfolioItemTitle}» — підтвердіть або відхиліть участь`,
        url: `${SITE_URL}/my/notifications`,
      }))
    );
  }

  // 2. Telegram
  if (clientProfile?.telegram_chat_id) {
    const text =
      `📸 <b>${escHtml(params.masterName)}</b> відмітив вас у роботі портфоліо:\n` +
      `«<b>${escHtml(params.portfolioItemTitle)}</b>»\n\n` +
      `Натисніть щоб підтвердити або відхилити участь.`;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
    const replyMarkup = { inline_keyboard: [[{ text: 'Переглянути', url: `${SITE_URL}/my/notifications` }]] };
    const sent = await sendTelegramMessage(clientProfile.telegram_chat_id, text, replyMarkup);
    if (sent) return;
  }

  // 3. SMS fallback
  if (clientProfile?.phone) {
    const text = `BookIT: ${params.masterName} відмітив вас у портфоліо «${params.portfolioItemTitle}». Підтвердьте на bookit.com.ua`;
    await sendTurboSMS(clientProfile.phone, text).catch(() => {});
  }
}
