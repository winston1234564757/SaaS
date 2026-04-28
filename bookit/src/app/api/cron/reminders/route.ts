import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPush } from '@/lib/push';
import { sendTurboSMS } from '@/lib/turbosms';

/**
 * Vercel Cron: щодня о 9:00 Kyiv (7:00 UTC)
 * Нагадування клієнтам про завтрашній запис.
 * Канали: Web Push (основний) → TurboSMS (резерв якщо немає підписки або пуш протух).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: bookings, error } = await admin
    .from('bookings')
    .select(`
      id, client_id, client_name, client_phone, date, start_time, end_time,
      booking_services ( service_name ),
      master_profiles!inner ( profiles!inner ( full_name ) )
    `)
    .eq('date', tomorrowStr)
    .in('status', ['pending', 'confirmed'])
    .not('client_phone', 'is', null);

  if (error) {
    console.error('[cron/reminders] DB error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = bookings ?? [];

  // Один запит для всіх push-підписок (тільки для авторизованих клієнтів)
  const clientIds = [...new Set(rows.map((b: any) => b.client_id).filter(Boolean))];

  const pushSubsMap = new Map<string, { endpoint: string; keys: { p256dh: string; auth: string } }[]>();

  if (clientIds.length > 0) {
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('user_id, subscription')
      .in('user_id', clientIds);

    for (const row of subs ?? []) {
      const arr = pushSubsMap.get(row.user_id) ?? [];
      arr.push(row.subscription);
      pushSubsMap.set(row.user_id, arr);
    }
  }

  let pushSent = 0;
  let smsSent = 0;
  let failed = 0;

  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await Promise.allSettled(
    rows.slice(i, i + BATCH_SIZE).map(async (b: any) => {
      const mp = b.master_profiles;
      const masterName: string = (mp?.profiles as any)?.full_name ?? 'Майстер';
      const startTime: string = (b.start_time as string | null)?.slice(0, 5) ?? '';
      const services: string = ((b.booking_services as any[]) ?? [])
        .map((s: any) => s.service_name as string)
        .join(', ') || 'Послуга';

      const messageText = `Нагадування: завтра о ${startTime} візит до ${masterName} (${services})`;

      // ── Спроба 1: Web Push ───────────────────────────────────────────────
      const subs = b.client_id ? (pushSubsMap.get(b.client_id) ?? []) : [];
      if (subs.length > 0) {
        const results = await Promise.allSettled(
          subs.map(sub => sendPush(sub, { title: 'BookIt 🗓️', body: messageText, url: `/my/bookings?bookingId=${b.id}` }))
        );
        const anyOk = results.some(r => r.status === 'fulfilled' && r.value.ok);
        if (anyOk) {
          pushSent++;
          return;
        }
      }

      // ── Спроба 2: TurboSMS fallback ──────────────────────────────────────
      const phone = b.client_phone as string;
      if (!phone) { failed++; return; }

      try {
        const { ok, code } = await sendTurboSMS(phone, messageText);
        if (ok) {
          smsSent++;
        } else {
          console.error('[cron/reminders] TurboSMS error for', phone, code);
          failed++;
        }
      } catch (e) {
        console.error('[cron/reminders] SMS fetch error for', phone, e);
        failed++;
      }
    })
    );
  }

  console.log(`[cron/reminders] date=${tomorrowStr} total=${rows.length} pushSent=${pushSent} smsSent=${smsSent} failed=${failed}`);

  return NextResponse.json({ date: tomorrowStr, total: rows.length, pushSent, smsSent, failed });
}
