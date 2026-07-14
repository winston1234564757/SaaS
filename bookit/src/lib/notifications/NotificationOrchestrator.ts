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

    // ── 2. Telegram (push fallback only) ─────────────────────────────────────
    // Trust pushDelivered: if any subscription returned 2xx, skip TG to avoid double delivery.
    // APNs 201 = accepted by Apple servers → device will receive it.
    if (!pushDelivered) {
      if (def.telegram && telegramChatId) {
        const { text, buttons } = def.telegram(data);
        const replyMarkup = buttons ? { inline_keyboard: buttons } : undefined;
        let tgError: string | undefined;
        const sent = await sendTelegramMessage(telegramChatId, text, replyMarkup).catch((e: unknown) => {
          tgError = e instanceof Error ? e.message : String(e);
          return false;
        });
        log('telegram', sent ? 'success' : 'failed', sent ? undefined : (tgError ?? 'Telegram API не підтвердив відправку'));
        result.telegram = sent;
      } else if (def.telegram && !telegramChatId) {
        log('telegram', 'skipped');
      }
    }

    // ── 3. SMS — only critical + no free channel delivered ────────────────────
    const freeDelivered = pushDelivered || result.telegram;
    if (!freeDelivered && def.isCritical && def.sms && phone) {
      const text = def.sms(data);
      let thrown: string | undefined;
      const smsResult = await sendTurboSMS(phone, text).catch((e: unknown) => {
        thrown = e instanceof Error ? e.message : String(e);
        return { ok: false, code: undefined as number | undefined };
      });
      // Без причини провал SMS не діагностується взагалі: код повертається, але раніше
      // губився, і в notification_logs лишався голий 'failed' з порожнім error_text.
      // Окремо розрізняємо збій провайдера і свідоме придушення за денним лімітом (-1).
      const smsError = smsResult.ok
        ? undefined
        : thrown ?? (smsResult.code === -1
            ? 'suppressed: вичерпано денний ліміт SMS'
            : `TurboSMS response_code=${smsResult.code ?? 'невідомий'}`);
      log('sms', smsResult.ok ? 'success' : 'failed', smsError);
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
