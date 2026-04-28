import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, buildBookingMessage, UA_MONTHS } from '@/lib/telegram';
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

  if (pushDelivered) return;

  // ── 2. Telegram ──────────────────────────────────────────────────────────────
  if (telegramChatId) {
    const sent = await sendTelegramMessage(telegramChatId, buildBookingMessage(params));
    if (sent) return;
  }

  // ── 3. SMS ───────────────────────────────────────────────────────────────────
  if (masterPhone) {
    const d = new Date(params.date + 'T00:00:00');
    const dateStr = `${d.getDate()}-го ${UA_MONTHS[d.getMonth()]} о ${params.startTime.slice(0, 5)}`;
    const text = `BookIT: Новий запис! ${params.clientName}, ${dateStr} на «${params.services}». ${params.totalPrice} грн`;
    await sendTurboSMS(masterPhone, text).catch(() => {});
  }
}
