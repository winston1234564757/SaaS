import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationOrchestrator } from '@/lib/notifications/NotificationOrchestrator';
import { verifyCronSecret } from '@/lib/utils/verifyCronSecret';

/**
 * Vercel Cron: щогодини.
 * Надсилає нагадування клієнтам і майстрам у 3 строгих часових вікнах:
 *   - 24 год до сесії  → клієнт (NO SMS — non-critical)
 *   -  2 год до сесії  → клієнт (SMS allowed — critical) + майстер (NO SMS)
 *   - 30 хв до сесії  → клієнт (NO SMS — non-critical)
 *
 * Ранковий огляд (master_day_briefing) надсилається майстру о 8:00 за Kyiv.
 */

const KYIV_OFFSET_MS = 3 * 60 * 60 * 1000;

function kyivHour(): number {
  return new Date(Date.now() + KYIV_OFFSET_MS).getUTCHours();
}

type ReminderWindow = {
  label: string;
  minutesFromNow: number;
  toleranceMs: number;
  clientEvent: 'reminder_24h' | 'reminder_2h' | 'reminder_30m';
  notifyMaster: boolean;
};

const WINDOWS: ReminderWindow[] = [
  { label: '24h',  minutesFromNow: 24 * 60, toleranceMs: 29 * 60 * 1000, clientEvent: 'reminder_24h', notifyMaster: false },
  { label: '2h',   minutesFromNow: 2 * 60,  toleranceMs: 29 * 60 * 1000, clientEvent: 'reminder_2h',  notifyMaster: true  },
  { label: '30m',  minutesFromNow: 30,       toleranceMs: 14 * 60 * 1000, clientEvent: 'reminder_30m', notifyMaster: false },
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const results: Record<string, { client: number; master: number; failed: number }> = {};

  // ── Morning master briefing (08:00 Kyiv) ─────────────────────────────────
  if (kyivHour() === 8) {
    await sendMorningBriefings(admin, now);
  }

  // ── Time-window reminders ─────────────────────────────────────────────────
  for (const window of WINDOWS) {
    const windowResult = await processWindow(admin, now, window);
    results[window.label] = windowResult;
  }

  console.log('[cron/reminders]', JSON.stringify({ now: now.toISOString(), results }));
  return NextResponse.json({ now: now.toISOString(), results });
}

async function processWindow(
  admin: ReturnType<typeof createAdminClient>,
  now: Date,
  window: ReminderWindow,
): Promise<{ client: number; master: number; failed: number }> {
  const targetTime = new Date(now.getTime() + window.minutesFromNow * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - window.toleranceMs);
  const windowEnd = new Date(targetTime.getTime() + window.toleranceMs);

  // Only look at bookings on the dates covered by this window
  const minDate = windowStart.toISOString().slice(0, 10);
  const maxDate = windowEnd.toISOString().slice(0, 10);

  const { data: bookings, error } = await admin
    .from('bookings')
    .select(`
      id, client_id, client_name, client_phone, date, start_time,
      master_id,
      booking_services ( service_name ),
      master_profiles!inner ( profiles!inner ( full_name ), business_name )
    `)
    .in('status', ['pending', 'confirmed'])
    .gte('date', minDate)
    .lte('date', maxDate);

  if (error) {
    console.error(`[cron/reminders/${window.label}] DB error:`, error.message);
    return { client: 0, master: 0, failed: 0 };
  }

  // Filter by exact time window
  const due = (bookings ?? []).filter(b => {
    const [h, m] = ((b.start_time as string) ?? '00:00').split(':').map(Number);
    const startDt = new Date(b.date + 'T00:00:00');
    startDt.setHours(h, m, 0, 0);
    return startDt >= windowStart && startDt <= windowEnd;
  });

  if (due.length === 0) return { client: 0, master: 0, failed: 0 };

  let clientSent = 0;
  let masterSent = 0;
  let failed = 0;

  const BATCH = 30;
  for (let i = 0; i < due.length; i += BATCH) {
    await Promise.allSettled(
      due.slice(i, i + BATCH).map(async b => {
        const mp = b.master_profiles as unknown as { profiles: { full_name: string }; business_name: string | null } | null;
        const masterName = mp?.business_name ?? mp?.profiles?.full_name ?? 'Майстер';
        const services = ((b.booking_services as { service_name: string }[]) ?? [])
          .map(s => s.service_name)
          .join(', ') || 'Послуга';
        const startTime = (b.start_time as string | null)?.slice(0, 5) ?? '';

        const sharedData = {
          bookingId: b.id as string,
          masterName,
          date: b.date as string,
          startTime,
          services,
        };

        // ── Client reminder ─────────────────────────────────────────────────
        if (b.client_id) {
          try {
            await NotificationOrchestrator.send({
              eventType: window.clientEvent,
              recipientId: b.client_id as string,
              recipientRole: 'client',
              masterId: b.master_id as string,
              relatedBookingId: b.id as string,
              data: sharedData,
            });
            clientSent++;
          } catch {
            failed++;
          }
        }

        // ── Master reminder (2h window only) ────────────────────────────────
        if (window.notifyMaster) {
          try {
            await NotificationOrchestrator.send({
              eventType: 'reminder_2h',
              recipientId: b.master_id as string,
              recipientRole: 'master',
              masterId: b.master_id as string,
              relatedBookingId: b.id as string,
              data: {
                ...sharedData,
                clientName: b.client_name as string,
                masterName: undefined,
              },
            });
            masterSent++;
          } catch {
            failed++;
          }
        }
      })
    );
  }

  return { client: clientSent, master: masterSent, failed };
}

async function sendMorningBriefings(
  admin: ReturnType<typeof createAdminClient>,
  now: Date,
): Promise<void> {
  const todayStr = now.toISOString().slice(0, 10);

  const { data: bookings } = await admin
    .from('bookings')
    .select('master_id, start_time, client_name, booking_services(service_name)')
    .eq('date', todayStr)
    .in('status', ['pending', 'confirmed'])
    .order('start_time', { ascending: true });

  if (!bookings || bookings.length === 0) return;

  const byMaster = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const arr = byMaster.get(b.master_id as string) ?? [];
    arr.push(b);
    byMaster.set(b.master_id as string, arr);
  }

  await Promise.allSettled(
    [...byMaster.entries()].map(async ([masterId, items]) => {
      const bookingItems = items
        .map(b => {
          const svc = ((b.booking_services as { service_name: string }[]) ?? [])
            .map(s => s.service_name).join(', ') || 'Послуга';
          const time = (b.start_time as string | null)?.slice(0, 5) ?? '';
          return `  • ${time} — <b>${b.client_name}</b> (${svc})`;
        })
        .join('\n');

      await NotificationOrchestrator.send({
        eventType: 'master_day_briefing',
        recipientId: masterId,
        recipientRole: 'master',
        masterId,
        data: { count: items.length, bookingItems },
      });
    })
  );
}
