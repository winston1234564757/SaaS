import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Telegram bot webhook handler.
 *
 * Flow for master to connect their Telegram:
 * 1. In Settings, master clicks the bot link: https://t.me/BOT_NAME?start=MASTER_SLUG
 * 2. Telegram sends /start MASTER_SLUG to this webhook
 * 3. We look up master_profiles by slug and save telegram_chat_id
 * 4. Master starts receiving booking notifications via Telegram
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
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(message.chat?.id ?? '');
  const text: string = message.text ?? '';
  const firstName: string = message.from?.first_name ?? 'Майстер';

  // Handle /start [slug] command
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

    if (error) {
      await sendMessage(chatId, botToken, `⚠️ Виникла помилка. Спробуйте ще раз.`);
    } else {
      await sendMessage(
        chatId,
        botToken,
        `✅ <b>Telegram підключено!</b>\n\nВідтепер ви отримуватимете сповіщення про нові записи та скасування прямо тут.\n\n💅 Bookit`
      );
    }
  }

  return NextResponse.json({ ok: true });
}

async function sendMessage(chatId: string, token: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {});
}
