import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage } from '@/lib/telegram';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message?.text || !message?.chat?.id) return NextResponse.json({ ok: true });

    const text: string = message.text;
    const chatId: number = message.chat.id;

    if (text.startsWith('/start')) {
      const param = text.split(' ')[1]?.trim();
      if (!param) return NextResponse.json({ ok: true });

      const admin = createAdminClient();

      if (UUID_RE.test(param)) {
        // Клієнт: param = profiles.id (UUID)
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
      } else {
        // Майстер: param = master_profiles.slug
        const { error } = await admin
          .from('master_profiles')
          .update({ telegram_chat_id: String(chatId) })
          .eq('slug', param);

        if (!error) {
          await sendTelegramMessage(
            String(chatId),
            '✅ Ваш акаунт майстра успішно підключено до bookit! Тепер ви будете отримувати тут сповіщення про нові записи.',
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Ніколи не повертаємо 500 — щоб Telegram не спамив retry
    return NextResponse.json({ ok: true });
  }
}
