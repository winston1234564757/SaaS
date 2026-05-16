import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationOrchestrator } from '@/lib/notifications/NotificationOrchestrator';
import { escHtml } from '@/lib/telegram';
import { pluralUk } from '@/lib/utils/pluralUk';

const DEFAULT_BUFFER_MINUTES = 20;

/**
 * Vercel Cron: щогодини (`0 * * * *`).
 * Знаходить `confirmed` записи, що вийшли за межі scheduled_end_time + (buffer/2).
 * Buffer читається з master_profiles.buffer_minutes; fallback — 20 хв.
 * Надсилає сповіщення майстру через Orchestrator (In-App + Push → TG).
 * Idempotency: не надсилає повторно в межах 55 хвилин.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // ── 1. Fetch confirmed bookings from last 2 days ────────────────────────────
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, master_id, client_name, date, start_time, end_time, booking_services(service_name)')
    .eq('status', 'confirmed')
    .gte('date', twoDaysAgo.toISOString().slice(0, 10))
    .lte('date', now.toISOString().slice(0, 10));

  if (error) {
    console.error('[cron/check-uncompleted] DB error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ processed: 0, skipped: 0 });
  }

  // ── 2. Fetch master buffer settings ────────────────────────────────────────
  const masterIds = [...new Set(bookings.map(b => b.master_id as string))];

  const { data: masterProfiles } = await admin
    .from('master_profiles')
    .select('id, buffer_minutes')
    .in('id', masterIds);

  const bufferMap = new Map<string, number>(
    (masterProfiles ?? []).map(p => [
      p.id as string,
      (p.buffer_minutes as number | null) || DEFAULT_BUFFER_MINUTES,
    ])
  );

  // ── 3. Filter: end_time + (buffer/2) < now ─────────────────────────────────
  const pastDue = bookings.filter(b => {
    const [h, m] = ((b.end_time as string) ?? '00:00').split(':').map(Number);
    const endDt = new Date(b.date + 'T00:00:00');
    endDt.setHours(h, m, 0, 0);

    const buffer = bufferMap.get(b.master_id as string) ?? DEFAULT_BUFFER_MINUTES;
    const cutoff = new Date(endDt.getTime() + (buffer / 2) * 60 * 1000);

    // Only process if cutoff has passed and booking is not older than 24h
    const maxAge = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return cutoff <= now && endDt >= maxAge;
  });

  if (pastDue.length === 0) {
    console.log('[cron/check-uncompleted] No past-due confirmed bookings.');
    return NextResponse.json({ processed: 0, skipped: 0 });
  }

  // ── 4. Group by master ─────────────────────────────────────────────────────
  const byMaster = new Map<string, typeof pastDue>();
  for (const b of pastDue) {
    const arr = byMaster.get(b.master_id as string) ?? [];
    arr.push(b);
    byMaster.set(b.master_id as string, arr);
  }

  const eligibleMasterIds = [...byMaster.keys()];

  // ── 5. Idempotency: skip masters nudged in last 55 min ─────────────────────
  const idempotencyWindow = new Date(now.getTime() - 55 * 60 * 1000).toISOString();
  const { data: recentNudges } = await admin
    .from('notifications')
    .select('recipient_id')
    .in('recipient_id', eligibleMasterIds)
    .eq('type', 'unhandled_booking')
    .gte('created_at', idempotencyWindow);

  const alreadyNudged = new Set((recentNudges ?? []).map(n => n.recipient_id as string));
  const toProcess = eligibleMasterIds.filter(id => !alreadyNudged.has(id));

  if (toProcess.length === 0) {
    console.log('[cron/check-uncompleted] All masters already nudged this hour.');
    return NextResponse.json({ processed: 0, skipped: alreadyNudged.size });
  }

  // ── 6. Send via Orchestrator ───────────────────────────────────────────────
  let processed = 0;

  await Promise.allSettled(
    toProcess.map(async masterId => {
      const items = byMaster.get(masterId) ?? [];
      const count = items.length;

      const bookingItems = items
        .map(b => {
          const svc = ((b.booking_services as { service_name: string }[]) ?? [])
            .map(s => s.service_name)
            .join(', ') || 'Послуга';
          const time = (b.start_time as string | null)?.slice(0, 5) ?? '';
          return `  • ${escHtml(time)} — <b>${escHtml(b.client_name as string)}</b> (${escHtml(svc)})`;
        })
        .join('\n');

      await NotificationOrchestrator.send({
        eventType: 'unhandled_booking',
        recipientId: masterId,
        recipientRole: 'master',
        masterId,
        data: {
          count,
          bookingItems,
        },
      });

      processed++;
    })
  );

  console.log(
    `[cron/check-uncompleted] pastDue=${pastDue.length} processed=${processed} skipped=${alreadyNudged.size}`
  );

  return NextResponse.json({ pastDue: pastDue.length, processed, skipped: alreadyNudged.size });
}
