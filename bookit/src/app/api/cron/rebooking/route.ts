import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, escHtml } from '@/lib/telegram';

/**
 * Vercel Cron: щодня о 10:00 Kyiv (8:00 UTC)
 * Нагадує клієнтам перезаписатись, якщо минув стандартний цикл візиту майстра.
 * Anti-spam: пропускає клієнтів з майбутніми записами.
 * Idempotency: RPC перевіряє чи вже надсилали сьогодні.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // 1. Знаходимо всіх клієнтів що мають бути нагадані сьогодні
  const { data: dueRows, error: rpcError } = await admin
    .rpc('get_rebooking_due_clients', { p_today: today });

  if (rpcError) {
    console.error('[cron/rebooking] RPC error:', rpcError.message);
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  const due = dueRows ?? [];
  if (due.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, notified: 0 });
  }

  // 2. Batch-fetch client profiles (telegram_chat_id)
  const clientIds = [...new Set(due.map((r: any) => r.client_id as string))];
  const masterIds = [...new Set(due.map((r: any) => r.master_id as string))];

  const [{ data: clientProfiles }, { data: masterProfiles }] = await Promise.all([
    admin.from('profiles').select('id, telegram_chat_id').in('id', clientIds),
    admin.from('master_profiles').select('id, slug, business_name, profiles!inner(full_name)').in('id', masterIds),
  ]);

  const clientTgMap = new Map<string, string>();
  for (const p of clientProfiles ?? []) {
    if (p.telegram_chat_id) clientTgMap.set(p.id, p.telegram_chat_id);
  }

  const masterSlugMap = new Map<string, { slug: string; name: string }>();
  for (const m of masterProfiles ?? []) {
    const name = (m as any).business_name ?? (m as any).profiles?.full_name ?? 'Ваш майстер';
    masterSlugMap.set(m.id, { slug: m.slug, name });
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua';

  // 3. Обробляємо кожного клієнта
  const notifications: { recipient_id: string; title: string; body: string; type: string; related_master_id: string }[] = [];
  let telegramSent = 0;

  await Promise.allSettled(
    due.map(async (row: any) => {
      const clientId  = row.client_id  as string;
      const masterId  = row.master_id  as string;
      const masterInfo = masterSlugMap.get(masterId);
      const masterName = masterInfo?.name ?? 'Ваш майстер';
      const bookingUrl = masterInfo ? `${APP_URL}/${masterInfo.slug}` : APP_URL;

      // In-app notification (вставляємо батчем нижче)
      notifications.push({
        recipient_id:      clientId,
        title:             `${masterName} чекає на вас!`,
        body:              'Минув час вашого стандартного візиту. Запишіться зараз, щоб обрати найкращий час!',
        type:              'rebooking_reminder',
        related_master_id: masterId,
      });

      // Telegram до клієнта (якщо є особистий chat_id)
      const clientTg = clientTgMap.get(clientId);
      if (clientTg) {
        try {
          await sendTelegramMessage(
            clientTg,
            `💅 <b>${escHtml(masterName)}</b> нагадує про ваш наступний візит!\n\n` +
            `Запишіться зараз, щоб обрати найкращий час.\n\n` +
            `<a href="${escHtml(bookingUrl)}">Записатися →</a>`,
          );
          telegramSent++;
        } catch (e) {
          console.warn('[cron/rebooking] Telegram error for client', clientId, e);
        }
      }
    }),
  );

  // 4. Batch insert in-app notifications
  if (notifications.length > 0) {
    const { error: insertError } = await admin.from('notifications').insert(notifications);
    if (insertError) {
      console.error('[cron/rebooking] notifications insert error:', insertError.message);
    }
  }

  console.log(`[cron/rebooking] date=${today} processed=${due.length} notifications=${notifications.length} telegramSent=${telegramSent}`);

  return NextResponse.json({
    ok:            true,
    date:          today,
    processed:     due.length,
    notified:      notifications.length,
    telegramSent,
  });
}
