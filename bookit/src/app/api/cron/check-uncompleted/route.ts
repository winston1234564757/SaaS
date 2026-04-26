import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, escHtml } from '@/lib/telegram';

/**
 * Vercel Cron: щогодини.
 * Знаходить записи зі статусом 'confirmed', час завершення яких вже минув (від 15 хв до 24 год тому).
 * Для кожного майстра надсилає Telegram-повідомлення ОДИН РАЗ на годину (idempotency через notifications).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // ── 1. Fetch candidates: confirmed bookings from last 2 days ──────────────
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const todayStr = now.toISOString().slice(0, 10);
  const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, master_id, client_name, date, start_time, end_time, booking_services(service_name)')
    .eq('status', 'confirmed')
    .gte('date', twoDaysAgoStr)
    .lte('date', todayStr);

  if (error) {
    console.error('[cron/check-uncompleted] DB error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── 2. JS-side filter: end_datetime in [now-24h, now-15min] ──────────────
  const cutoffMax = new Date(now.getTime() - 15 * 60 * 1000);   // 15 min ago
  const cutoffMin = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 h ago

  const pastDue = (bookings ?? []).filter((b: any) => {
    const [h, m] = ((b.end_time as string) ?? '00:00').split(':').map(Number);
    const endDt = new Date(b.date + 'T00:00:00');
    endDt.setHours(h, m, 0, 0);
    return endDt >= cutoffMin && endDt <= cutoffMax;
  });

  if (pastDue.length === 0) {
    console.log('[cron/check-uncompleted] No past-due confirmed bookings.');
    return NextResponse.json({ processed: 0, skipped: 0 });
  }

  // ── 3. Group by master_id ──────────────────────────────────────────────────
  const byMaster = new Map<string, typeof pastDue>();
  for (const b of pastDue) {
    const arr = byMaster.get(b.master_id) ?? [];
    arr.push(b);
    byMaster.set(b.master_id, arr);
  }

  const masterIds = [...byMaster.keys()];

  // ── 4. Idempotency check — skip masters already nudged in last 55 min ──────
  const idempotencyWindow = new Date(now.getTime() - 55 * 60 * 1000).toISOString();
  const { data: recentNudges } = await admin
    .from('notifications')
    .select('recipient_id')
    .in('recipient_id', masterIds)
    .eq('type', 'unhandled_booking')
    .gte('created_at', idempotencyWindow);

  const alreadyNudged = new Set((recentNudges ?? []).map((n: any) => n.recipient_id as string));

  // ── 5. Fetch master telegram_chat_id for eligible masters ────────────────
  const eligibleIds = masterIds.filter(id => !alreadyNudged.has(id));
  if (eligibleIds.length === 0) {
    console.log('[cron/check-uncompleted] All masters already nudged this hour.');
    return NextResponse.json({ processed: 0, skipped: masterIds.length });
  }

  const { data: profiles } = await admin
    .from('master_profiles')
    .select('id, telegram_chat_id')
    .in('id', eligibleIds);

  const profileMap = new Map<string, string | null>(
    (profiles ?? []).map((p: any) => [p.id as string, p.telegram_chat_id as string | null])
  );

  // ── 6. Send notifications ──────────────────────────────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit-five-psi.vercel.app';
  const dashboardUrl = `${siteUrl}/dashboard/bookings`;

  let processed = 0;
  let skipped = 0;
  const notificationsToInsert: {
    recipient_id: string;
    title: string;
    body: string;
    type: string;
  }[] = [];

  await Promise.allSettled(
    eligibleIds.map(async masterId => {
      const items = byMaster.get(masterId) ?? [];
      const count = items.length;
      const chatId = profileMap.get(masterId);

      const bodyText = `У вас ${count} незавершен${count === 1 ? 'ий' : count < 5 ? 'их' : 'их'} ${count === 1 ? 'запис' : 'записи'}. Відмітьте їх як завершені, щоб клієнти могли залишити відгук.`;

      // Telegram
      if (chatId) {
        const lines = items.map((b: any) => {
          const svc = ((b.booking_services as any[]) ?? []).map((s: any) => s.service_name as string).join(', ') || 'Послуга';
          return `  • ${escHtml(b.start_time?.slice(0, 5))} — <b>${escHtml(b.client_name)}</b> (${escHtml(svc)})`;
        }).join('\n');

        const msg =
          `⚠️ <b>Незавершені записи (${count})</b>\n\n` +
          `${lines}\n\n` +
          `Будь ласка, відмітьте їх як завершені, щоб клієнти могли залишити відгук та вони потрапили у вашу статистику.\n\n` +
          `👉 <a href="${escHtml(dashboardUrl)}">Відкрити записи</a>`;

        await sendTelegramMessage(chatId, msg);
      }

      // In-app notification (also serves as idempotency record)
      notificationsToInsert.push({
        recipient_id: masterId,
        title: `Незавершені записи (${count})`,
        body: bodyText,
        type: 'unhandled_booking',
      });

      processed++;
    })
  );

  // Batch insert in-app notifications
  if (notificationsToInsert.length > 0) {
    const { error: insertErr } = await admin.from('notifications').insert(notificationsToInsert);
    if (insertErr) {
      console.error('[cron/check-uncompleted] notifications insert error:', insertErr.message);
    }
  }

  console.log(`[cron/check-uncompleted] pastDue=${pastDue.length} processed=${processed} skipped=${skipped + alreadyNudged.size}`);

  return NextResponse.json({
    pastDue: pastDue.length,
    processed,
    skipped: alreadyNudged.size,
  });
}
