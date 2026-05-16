/**
 * Public API для системи сповіщень BookIT.
 * Всі функції делегують до NotificationOrchestrator — єдиної точки каскаду.
 *
 * Cascade: In-App + Push (паралельно) → Telegram → SMS (тільки critical events)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { escHtml, buildBookingMessage, UA_MONTHS } from '@/lib/telegram';
import { NotificationOrchestrator } from '@/lib/notifications/NotificationOrchestrator';

export type { NotifEventType, NotifData, OrchestratorParams, ChannelResult } from '@/lib/notifications/NotificationOrchestrator';

// ── Re-export Orchestrator for direct use in cron routes ─────────────────────
export { NotificationOrchestrator };

// ─────────────────────────────────────────────────────────────────────────────
// MASTER: Новий запис
// ─────────────────────────────────────────────────────────────────────────────

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

export async function notifyMasterNewBooking(params: BookingNotifParams): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: 'booking_created',
    recipientId: params.masterId,
    recipientRole: 'master',
    masterId: params.masterId,
    relatedBookingId: params.bookingId ?? undefined,
    data: {
      bookingId: params.bookingId ?? undefined,
      clientName: params.clientName,
      date: params.date,
      startTime: params.startTime,
      services: params.services,
      totalPrice: params.totalPrice,
      notes: params.notes ?? undefined,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: Зміна статусу запису
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientStatusNotifParams {
  clientId: string;
  masterId: string;
  masterName: string;
  bookingId: string;
  date: string;
  startTime: string;
  services: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export async function notifyClientOnStatusChange(params: ClientStatusNotifParams): Promise<void> {
  const eventMap = {
    confirmed:  'booking_confirmed',
    cancelled:  'booking_cancelled',
    completed:  'booking_completed',
  } as const;

  await NotificationOrchestrator.send({
    eventType: eventMap[params.status],
    recipientId: params.clientId,
    recipientRole: 'client',
    masterId: params.masterId,
    relatedBookingId: params.bookingId,
    data: {
      bookingId: params.bookingId,
      masterName: params.masterName,
      date: params.date,
      startTime: params.startTime,
      services: params.services,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER: Скасування клієнтом
// ─────────────────────────────────────────────────────────────────────────────

export interface MasterCancelNotifParams {
  masterId: string;
  clientName: string;
  bookingId: string;
  date: string;
  startTime: string;
  services: string;
}

export async function notifyMasterBookingCancelled(params: MasterCancelNotifParams): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: 'booking_cancelled',
    recipientId: params.masterId,
    recipientRole: 'master',
    masterId: params.masterId,
    relatedBookingId: params.bookingId,
    data: {
      bookingId: params.bookingId,
      clientName: params.clientName,
      date: params.date,
      startTime: params.startTime,
      services: params.services,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: Portfolio consent request
// ─────────────────────────────────────────────────────────────────────────────

export interface PortfolioConsentParams {
  clientId: string;
  masterName: string;
  masterSlug: string;
  masterId: string;
  portfolioItemId: string;
  portfolioItemTitle: string;
}

export async function notifyClientPortfolioConsent(params: PortfolioConsentParams): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: 'portfolio_consent_request',
    recipientId: params.clientId,
    recipientRole: 'client',
    masterId: params.masterId,
    data: {
      masterName: params.masterName,
      masterSlug: params.masterSlug,
      portfolioItemId: params.portfolioItemId,
      portfolioItemTitle: params.portfolioItemTitle,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER: Новий відгук
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewNotifParams {
  masterId: string;
  clientName: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
}

export async function notifyMasterNewReview(params: ReviewNotifParams): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: 'new_review',
    recipientId: params.masterId,
    recipientRole: 'master',
    masterId: params.masterId,
    relatedBookingId: params.bookingId,
    data: {
      clientName: params.clientName,
      bookingId: params.bookingId,
      rating: params.rating,
      comment: params.comment ?? undefined,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER: Нове замовлення з магазину
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderNotifParams {
  masterId: string;
  orderId: string;
  orderItems: string;
}

export async function notifyMasterNewOrder(params: OrderNotifParams): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: 'order_new',
    recipientId: params.masterId,
    recipientRole: 'master',
    masterId: params.masterId,
    data: {
      orderId: params.orderId,
      orderItems: params.orderItems,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: Статус замовлення
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyClientOrderStatus(
  clientId: string,
  masterId: string,
  status: 'shipped' | 'completed',
  orderId: string,
): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: status === 'shipped' ? 'order_shipped' : 'order_completed',
    recipientId: clientId,
    recipientRole: 'client',
    masterId,
    data: { orderId },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER: Stock Alert
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyMasterStockAlert(
  masterId: string,
  productName: string,
  stockCount: number,
): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: 'stock_alert',
    recipientId: masterId,
    recipientRole: 'master',
    masterId,
    data: { productName, stockCount },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER: Billing events
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyMasterBilling(
  masterId: string,
  event: 'subscription_paid' | 'subscription_expiring' | 'subscription_failed' | 'subscription_downgraded',
  tier?: string,
  expiresAt?: string,
): Promise<void> {
  await NotificationOrchestrator.send({
    eventType: event,
    recipientId: masterId,
    recipientRole: 'master',
    masterId,
    data: { tier, expiresAt },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST — залишається окремою функцією (власна логіка channel-selection)
// ─────────────────────────────────────────────────────────────────────────────

import { sendPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendTurboSMS } from '@/lib/turbosms';

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

export async function notifyClientBroadcast(
  params: BroadcastNotifParams,
): Promise<BroadcastDelivery> {
  const admin = createAdminClient();

  const [profileRes, pushSubsRes] = await Promise.all([
    admin.from('profiles').select('phone, telegram_chat_id').eq('id', params.clientId).maybeSingle(),
    admin.from('push_subscriptions').select('endpoint, subscription').eq('user_id', params.clientId),
  ]);

  const profile = profileRes.data;
  const subs = pushSubsRes.data ?? [];

  let pushDelivered = false;
  let telegramSent = false;
  let smsSent = false;

  // In-app (always)
  if (profile) {
    void admin.from('notifications').insert({
      recipient_id: params.clientId,
      type: 'broadcast',
      title: `Повідомлення від ${params.masterName}`,
      body: `${params.pushBody}\n${params.shortUrl}`,
      related_master_id: null,
      related_booking_id: null,
      is_read: false,
    });
  }

  // Push
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
        if (r.value.gone) expiredEndpoints.push((subs[i] as { endpoint: string }).endpoint);
      }
    });
    if (expiredEndpoints.length > 0) {
      void admin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }
  }

  // Telegram
  if (params.channels.includes('telegram') && profile?.telegram_chat_id) {
    telegramSent = await sendTelegramMessage(profile.telegram_chat_id, params.telegramText).catch(() => false);
  }

  // SMS fallback
  if (params.channels.includes('sms') && !pushDelivered) {
    const targetPhone = profile?.phone ?? params.phone;
    if (targetPhone) {
      const res = await sendTurboSMS(targetPhone, params.smsText).catch(() => ({ ok: false }));
      smsSent = res.ok;
    }
  }

  return { pushDelivered, telegramSent, smsSent };
}
