import { createAdminClient } from '@/lib/supabase/admin';
import { sendPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendTurboSMS } from '@/lib/turbosms';
import { notifMap, NotifEventType, NotifData } from './constants/notifMap';

export type { NotifEventType, NotifData };

export interface OrchestratorParams {
  eventType: NotifEventType;
  recipientId: string;
  recipientRole: 'master' | 'client';
  masterId?: string;
  relatedBookingId?: string;
  data: NotifData;
}

export interface ChannelResult {
  inApp: boolean;
  push: boolean;
  telegram: boolean;
  sms: boolean;
}

type LogEntry = {
  event_type: string;
  channel: string;
  status: 'success' | 'failed' | 'skipped';
  error_text?: string;
  recipient_id: string;
  master_id?: string;
};

type PushSub = {
  endpoint: string;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
};

export class NotificationOrchestrator {
  static async send(params: OrchestratorParams): Promise<ChannelResult> {
    const { eventType, recipientId, recipientRole, masterId, relatedBookingId, data } = params;
    const def = notifMap[eventType];
    const admin = createAdminClient();
    const result: ChannelResult = { inApp: false, push: false, telegram: false, sms: false };
    const logs: LogEntry[] = [];

    const log = (channel: string, status: LogEntry['status'], error?: string) => {
      logs.push({
        event_type: eventType,
        channel,
        status,
        ...(error ? { error_text: error } : {}),
        recipient_id: recipientId,
        ...(masterId ? { master_id: masterId } : {}),
      });
    };

    // ── Fetch recipient channels in one round-trip ─────────────────────────────
    const [profileRes, masterProfileRes, pushSubsRes] = await Promise.all([
      admin.from('profiles').select('phone, telegram_chat_id').eq('id', recipientId).maybeSingle(),
      recipientRole === 'master'
        ? admin.from('master_profiles').select('telegram_chat_id').eq('id', recipientId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      admin.from('push_subscriptions').select('endpoint, subscription').eq('user_id', recipientId),
    ]);

    const phone: string | null = profileRes.data?.phone ?? null;
    const telegramChatId: string | null =
      recipientRole === 'master'
        ? (masterProfileRes.data?.telegram_chat_id ?? null)
        : (profileRes.data?.telegram_chat_id ?? null);
    const pushSubs = (pushSubsRes.data ?? []) as PushSub[];

    // ── 1. In-App + Push in parallel ──────────────────────────────────────────
    let pushDelivered = false;

    const inAppPromise: Promise<void> = (async () => {
      if (!def.inApp) return;
      const { title, body } = def.inApp(data);
      const { error } = await admin.from('notifications').insert({
        recipient_id: recipientId,
        title,
        body,
        type: eventType,
        related_booking_id: relatedBookingId ?? null,
        related_master_id: masterId ?? null,
        is_read: false,
      });
      if (error) {
        log('in_app', 'failed', error.message);
      } else {
        result.inApp = true;
        log('in_app', 'success');
      }
    })();

    const pushPromise: Promise<void> = (async () => {
      if (!def.push || pushSubs.length === 0) {
        if (def.push) log('push', 'skipped');
        return;
      }
      const { title, body, url } = def.push(data);
      const results = await Promise.allSettled(
        pushSubs.map(s =>
          sendPush(
            s.subscription as { endpoint: string; keys: { p256dh: string; auth: string } },
            { title, body, url },
          )
        )
      );

      const expiredEndpoints: string[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          if (r.value.ok) pushDelivered = true;
          if (r.value.gone) expiredEndpoints.push(pushSubs[i].endpoint);
        }
      });

      if (expiredEndpoints.length > 0) {
        await admin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
      }

      log('push', pushDelivered ? 'success' : 'failed');
      result.push = pushDelivered;
    })();

    await Promise.all([inAppPromise, pushPromise]);

    // ── 2. Telegram (if push didn't deliver or all subs are Apple APNs) ─────────
    // Apple APNs returns HTTP 201 even when the device doesn't receive the notification,
    // so pushDelivered=true can be a false positive when all subs are Safari Web Push.
    const hasApplePush = pushSubs.some(s => s.endpoint.includes('web.push.apple.com'));
    if (!pushDelivered || hasApplePush) {
      if (def.telegram && telegramChatId) {
        const { text, buttons } = def.telegram(data);
        const replyMarkup = buttons ? { inline_keyboard: buttons } : undefined;
        const sent = await sendTelegramMessage(telegramChatId, text, replyMarkup).catch(() => false);
        log('telegram', sent ? 'success' : 'failed');
        result.telegram = sent;
      } else if (def.telegram && !telegramChatId) {
        log('telegram', 'skipped');
      }
    }

    // ── 3. SMS — only critical + no free channel delivered ────────────────────
    const freeDelivered = pushDelivered || result.telegram;
    if (!freeDelivered && def.isCritical && def.sms && phone) {
      const text = def.sms(data);
      const smsResult = await sendTurboSMS(phone, text).catch(() => ({ ok: false }));
      log('sms', smsResult.ok ? 'success' : 'failed');
      result.sms = smsResult.ok;
    } else if (def.sms) {
      log('sms', 'skipped');
    }

    // ── 4. Persist delivery logs ─────────────────────────────────────────────
    if (logs.length > 0) {
      await admin.from('notification_logs').insert(logs);
    }

    return result;
  }
}
