import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, buildReminderHtml } from '@/lib/email';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Vercel Cron: щодня о 9:00 Kyiv (7:00 UTC)
 * Надсилає email-нагадування клієнтам, у яких запис завтра.
 *
 * Захищений токеном CRON_SECRET (встановлюється у Vercel env vars).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Перевірка авторизації cron запиту
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const admin = getAdmin();

  // Вираховуємо дату "завтра" в UTC
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Завантажуємо всі bookings на завтра зі статусом pending/confirmed та email клієнта
  const { data: bookings, error } = await admin
    .from('bookings')
    .select(`
      id, client_name, client_email, date, start_time, end_time,
      booking_services ( service_name ),
      master_profiles!inner (
        slug,
        profiles!inner ( full_name )
      )
    `)
    .eq('date', tomorrowStr)
    .in('status', ['pending', 'confirmed'])
    .not('client_email', 'is', null);

  if (error) {
    console.error('[cron/reminders] DB error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = bookings ?? [];
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    rows.map(async (b: any) => {
      const clientEmail = b.client_email as string;
      const clientName = b.client_name as string;
      const mp = b.master_profiles;
      const masterName = (mp?.profiles as any)?.full_name as string ?? 'Майстер';
      const masterSlug = (mp?.slug as string) ?? '';
      const services = ((b.booking_services as any[]) ?? [])
        .map((s: any) => s.service_name as string)
        .join(', ') || 'Послуга';

      const html = buildReminderHtml({
        clientName,
        masterName,
        masterSlug,
        date: b.date as string,
        startTime: (b.start_time as string | null)?.slice(0, 5) ?? '',
        endTime: (b.end_time as string | null)?.slice(0, 5) ?? '',
        services,
      });

      const ok = await sendEmail({
        to: clientEmail,
        subject: `Нагадування: завтра о ${(b.start_time as string | null)?.slice(0, 5) ?? ''} — ${masterName}`,
        html,
      });

      if (ok) sent++; else failed++;
    })
  );

  console.log(`[cron/reminders] date=${tomorrowStr} total=${rows.length} sent=${sent} failed=${failed}`);

  return NextResponse.json({ date: tomorrowStr, total: rows.length, sent, failed });
}
