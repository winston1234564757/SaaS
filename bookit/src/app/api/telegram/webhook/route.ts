import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Telegram bot webhook handler.
 *
 * Flow A — Master notification connect:
 *   /start [slug] → save telegram_chat_id to master_profiles
 *
 * Flow B — Magic Link auth:
 *   /start login  → ask user to share phone number
 *   message.contact → create/find user, generate magic link, send inline button
 *
 * Always returns { ok: true } so Telegram never retries on our internal errors.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || botToken === 'your_bot_token') {
    return NextResponse.json({ ok: true });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = String(message.chat?.id ?? '');
    const text: string = message.text ?? '';
    const firstName: string = message.from?.first_name ?? 'Майстер';

    // ── Flow B: Contact received ───────────────────────────────────────────
    if (message.contact) {
      // Security: reject forwarded contacts from other users
      if (message.contact.user_id !== message.from?.id) {
        return NextResponse.json({ ok: true });
      }

      const cleanPhone = String(message.contact.phone_number)
        .replace(/[+\s()]/g, '');
      const virtualEmail = `${cleanPhone}@bookit.app`;
      const admin = getAdmin();

      // Try to generate magic link; if user doesn't exist — create first
      let { data, error } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: virtualEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (error) {
        await admin.auth.admin.createUser({
          email: virtualEmail,
          email_confirm: true,
          user_metadata: {
            phone: cleanPhone,
            telegram_id: message.from.id,
            name: message.contact.first_name,
          },
        });

        const second = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: virtualEmail,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          },
        });
        data = second.data;
        error = second.error;
      }

      if (error || !data?.properties?.action_link) {
        await sendMessage(chatId, botToken, '⚠️ Не вдалося створити посилання для входу. Спробуйте ще раз.');
        return NextResponse.json({ ok: true });
      }

      await sendMessageWithInlineKeyboard(
        chatId,
        botToken,
        '✅ Акаунт підтверджено. Натисніть кнопку нижче, щоб увійти.',
        [[{ text: 'Увійти в BookIt 🚀', url: data.properties.action_link }]]
      );

      return NextResponse.json({ ok: true });
    }

    // ── Flow B: /start login ───────────────────────────────────────────────
    if (text.startsWith('/start login')) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Для безпечного входу в BookIt натисніть кнопку нижче 📱',
          reply_markup: {
            keyboard: [[{ text: '📱 Надіслати номер', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }),
      }).catch(() => {});

      return NextResponse.json({ ok: true });
    }

    // ── Flow A: /start [slug] — master notification connect ────────────────
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const slug = parts[1]?.trim().toLowerCase();

      if (!slug) {
        await sendMessage(chatId, botToken, `Привіт, ${firstName}! 👋\n\nЩоб підключити сповіщення, відкрий посилання з налаштувань Bookit.`);
        return NextResponse.json({ ok: true });
      }

      const admin = getAdmin();
      const { data: master } = await admin
        .from('master_profiles')
        .select('id, slug')
        .eq('slug', slug)
        .single();

      if (!master) {
        await sendMessage(chatId, botToken, `❌ Майстра з адресою "${slug}" не знайдено.\n\nПереконайтесь, що ви перейшли за правильним посиланням з налаштувань Bookit.`);
        return NextResponse.json({ ok: true });
      }

      const { error } = await admin
        .from('master_profiles')
        .update({ telegram_chat_id: chatId })
        .eq('id', master.id);

      await sendMessage(
        chatId,
        botToken,
        error
          ? '⚠️ Виникла помилка. Спробуйте ще раз.'
          : `✅ <b>Telegram підключено!</b>\n\nВідтепер ви отримуватимете сповіщення про нові записи та скасування прямо тут.\n\n💅 Bookit`
      );
    }
  } catch (err) {
    console.error('[webhook] unhandled error:', err);
  }

  // Always 200 — prevents Telegram from retrying failed requests
  return NextResponse.json({ ok: true });
}

async function sendMessage(chatId: string, token: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {});
}

async function sendMessageWithInlineKeyboard(
  chatId: string,
  token: string,
  text: string,
  buttons: { text: string; url: string }[][]
) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    }),
  }).catch(() => {});
}
