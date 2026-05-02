import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureTelegramClientIdentity } from '@/lib/telegram/ensureTelegramClientIdentity';
import { sendTelegramMessage } from '@/lib/telegram';
import { isValidUkrainianPhone } from '@/lib/telegram/phone';
import { normalizeToE164 } from '@/lib/utils/phone';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Z2-9]{8}$/;
const CONTACT_START_PARAM = 'share_phone';
const RAW_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';
const BOT_NAME = RAW_BOT_NAME.replace('@', '').trim();

async function logWebhookEvent(
  admin: ReturnType<typeof createAdminClient>,
  event: {
    event_type: string;
    phone?: string | null;
    telegram_user_id?: number | null;
    telegram_chat_id: number;
    profile_id?: string | null;
    status: 'success' | 'error' | 'skipped';
    error_message?: string | null;
    request_data?: unknown;
  }
) {
  try {
    await admin.from('telegram_webhook_logs').insert({
      event_type: event.event_type,
      phone: event.phone || null,
      telegram_user_id: event.telegram_user_id || null,
      telegram_chat_id: event.telegram_chat_id,
      profile_id: event.profile_id || null,
      status: event.status,
      error_message: event.error_message || null,
      request_data: event.request_data || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown logging error';
    console.error('[TG-WEBHOOK] Failed to log event:', message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;

    // Support both text messages and contact sharing
    if (!message?.chat?.id || (!message?.text && !message?.contact)) {
      return NextResponse.json({ ok: true });
    }

    const chatId: number = message.chat.id;
    const admin = createAdminClient();

    // ── HANDLE CONTACT SHARING ──
    if (message.contact) {
      const contact = message.contact;
      const rawPhone = contact.phone_number;
      const e164Phone = normalizeToE164(rawPhone);

      console.log(
        `[TG-WEBHOOK] Received contact: raw="${rawPhone}" → normalized="${e164Phone}", chatId=${chatId}`
      );

      // Validate phone format
      if (!isValidUkrainianPhone(rawPhone) || !e164Phone) {
        console.warn(`[TG-WEBHOOK] Invalid phone format: ${rawPhone}`);
        await logWebhookEvent(admin, {
          event_type: 'contact_received',
          phone: e164Phone,
          telegram_chat_id: chatId,
          status: 'skipped',
          error_message: 'Invalid phone format',
          request_data: { raw_phone: rawPhone, contact },
        });

        await sendTelegramMessage(
          String(chatId),
          '⚠️ Помилка: номер телефону має невірний формат. Спробуйте ще раз.',
        );
        return NextResponse.json({ ok: true });
      }

      const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');

      try {
        const identity = await ensureTelegramClientIdentity({
          phone: e164Phone,
          telegramChatId: String(chatId),
          fullName: fullName || undefined,
        });

        console.log(
          `[TG-WEBHOOK] Contact linked via ${identity.status}: profile=${identity.userId}, chat_id=${chatId}`
        );
        await logWebhookEvent(admin, {
          event_type: 'profile_updated',
          phone: e164Phone,
          telegram_chat_id: chatId,
          profile_id: identity.userId,
          status: 'success',
          request_data: { raw_phone: rawPhone, sync_status: identity.status },
        });

        await sendTelegramMessage(
          String(chatId),
          '✅ Ваш номер підтверджено! Тепер можна повернутися в BookIT.',
          {
            inline_keyboard: [[
              { 
                text: 'Відкрити BookIT', 
                web_app: { url: 'https://bookit-five-psi.vercel.app/' } 
              },
            ]],
          },
        );
      } catch (identityError: unknown) {
        const message =
          identityError instanceof Error ? identityError.message : 'Unknown identity sync error';
        console.error('[TG-WEBHOOK] Identity sync error:', message);
        await logWebhookEvent(admin, {
          event_type: 'profile_updated',
          phone: e164Phone,
          telegram_chat_id: chatId,
          status: 'error',
          error_message: message,
          request_data: {
            raw_phone: rawPhone,
            first_name: contact.first_name,
            last_name: contact.last_name,
          },
        });

        await sendTelegramMessage(
          String(chatId),
          '❌ Помилка при підтвердженні номера. Спробуйте ще раз трохи пізніше.',
        );
      }

      return NextResponse.json({ ok: true });
    }

    // ── HANDLE TEXT MESSAGES (/start ...) ──
    const text: string = message.text || '';
    if (!text.startsWith('/start')) return NextResponse.json({ ok: true });

    const param = text.split(' ')[1]?.trim();
    if (!param) return NextResponse.json({ ok: true });

    if (param === CONTACT_START_PARAM) {
      await sendTelegramMessage(
        String(chatId),
        'Щоб підтвердити номер, натисніть кнопку нижче. Telegram надішле ваш контакт боту напряму.',
        {
          keyboard: [[{ text: 'Поділитися номером', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
          input_field_placeholder: 'Натисніть кнопку для підтвердження номера',
        },
      );
    } else if (UUID_RE.test(param)) {
      const { error } = await admin
        .from('profiles')
        .update({ telegram_chat_id: String(chatId) })
        .eq('id', param);

      if (!error) {
        await sendTelegramMessage(
          String(chatId),
          '✅ Ваш акаунт успішно підключено до bookit! Тепер ви будете отримувати тут сповіщення.',
        );
      }
    } else if (TOKEN_RE.test(param)) {
      const { data: master, error } = await admin
        .from('master_profiles')
        .update({ telegram_chat_id: String(chatId), telegram_connect_token: null })
        .eq('telegram_connect_token', param)
        .select('id')
        .single();

      if (!error && master) {
        await sendTelegramMessage(
          String(chatId),
          '✅ Ваш акаунт майстра успішно підключено до bookit! Тепер ви будете отримувати тут сповіщення про нові записи.',
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[TG-WEBHOOK] Fatal error:', err);
    return NextResponse.json({ ok: true });
  }
}
