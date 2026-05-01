import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage } from '@/lib/telegram';
import { standardizePhoneForDb, isValidUkrainianPhone } from '@/lib/telegram/phone';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Z2-9]{8}$/;

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
    request_data?: any;
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
  } catch (err: any) {
    console.error('[TG-WEBHOOK] Failed to log event:', err.message);
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
      const standardPhone = standardizePhoneForDb(rawPhone);

      console.log(
        `[TG-WEBHOOK] Received contact: raw="${rawPhone}" → normalized="${standardPhone}", chatId=${chatId}`
      );

      // Validate phone format
      if (!isValidUkrainianPhone(rawPhone)) {
        console.warn(`[TG-WEBHOOK] Invalid phone format: ${rawPhone}`);
        await logWebhookEvent(admin, {
          event_type: 'contact_received',
          phone: standardPhone,
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

      // Try to find existing profile by phone
      const { data: existingProfile, error: selectErr } = await admin
        .from('profiles')
        .select('id')
        .eq('phone', standardPhone)
        .maybeSingle();

      if (selectErr) {
        console.error(`[TG-WEBHOOK] Profile search error:`, selectErr);
        await logWebhookEvent(admin, {
          event_type: 'contact_received',
          phone: standardPhone,
          telegram_chat_id: chatId,
          status: 'error',
          error_message: selectErr.message,
          request_data: { raw_phone: rawPhone },
        });
        return NextResponse.json({ ok: true });
      }

      // Update or create profile
      if (existingProfile) {
        const { error: updateErr } = await admin
          .from('profiles')
          .update({ telegram_chat_id: String(chatId) })
          .eq('id', existingProfile.id);

        if (updateErr) {
          console.error(`[TG-WEBHOOK] Update error:`, updateErr);
          await logWebhookEvent(admin, {
            event_type: 'profile_updated',
            phone: standardPhone,
            telegram_chat_id: chatId,
            profile_id: existingProfile.id,
            status: 'error',
            error_message: updateErr.message,
          });

          await sendTelegramMessage(
            String(chatId),
            '❌ Помилка при оновленні профілю. Спробуйте пізніше.',
          );
        } else {
          console.log(`[TG-WEBHOOK] Profile ${existingProfile.id} updated with chat_id=${chatId}`);
          await logWebhookEvent(admin, {
            event_type: 'profile_updated',
            phone: standardPhone,
            telegram_chat_id: chatId,
            profile_id: existingProfile.id,
            status: 'success',
          });

          await sendTelegramMessage(
            String(chatId),
            '✅ Ваш номер підтверджено! Повертайтеся в додаток.',
          );
        }
      } else {
        // Create new profile
        const fullName = `${contact.first_name || ''}${
          contact.last_name ? ' ' + contact.last_name : ''
        }`.trim();

        const { data: newProfile, error: insertErr } = await admin
          .from('profiles')
          .insert({
            phone: standardPhone,
            telegram_chat_id: String(chatId),
            full_name: fullName || 'User',
            role: 'client',
          })
          .select('id')
          .single();

        if (insertErr) {
          console.error(`[TG-WEBHOOK] Insert error:`, insertErr);
          await logWebhookEvent(admin, {
            event_type: 'profile_created',
            phone: standardPhone,
            telegram_chat_id: chatId,
            status: 'error',
            error_message: insertErr.message,
            request_data: { raw_phone: rawPhone, contact },
          });

          await sendTelegramMessage(
            String(chatId),
            '❌ Помилка при створенні профілю. Спробуйте пізніше.',
          );
        } else {
          console.log(`[TG-WEBHOOK] New profile created: ${newProfile.id}`);
          await logWebhookEvent(admin, {
            event_type: 'profile_created',
            phone: standardPhone,
            telegram_chat_id: chatId,
            profile_id: newProfile.id,
            status: 'success',
            request_data: { full_name: fullName },
          });

          await sendTelegramMessage(
            String(chatId),
            '🎁 Вітаємо! Ваш профіль створено. Повертайтеся в додаток для завершення запису.',
          );
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ── HANDLE TEXT MESSAGES (/start ...) ──
    const text: string = message.text || '';
    if (!text.startsWith('/start')) return NextResponse.json({ ok: true });

    const param = text.split(' ')[1]?.trim();
    if (!param) return NextResponse.json({ ok: true });

    if (UUID_RE.test(param)) {
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
  } catch (err: any) {
    console.error('[TG-WEBHOOK] Fatal error:', err);
    return NextResponse.json({ ok: true });
  }
}
