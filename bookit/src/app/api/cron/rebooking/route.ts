import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';

const DAYS_BEFORE = 3;

function addDays(date: Date, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const targetDate = addDays(new Date(), DAYS_BEFORE);

  // Find booking IDs that already have reminders sent
  const { data: sentReminders } = await admin
    .from('rebooking_reminders')
    .select('booking_id');
  const sentIds = (sentReminders ?? []).map((r: any) => r.booking_id as string);

  // Find bookings with next_visit_suggestion = 3 days from today
  // that haven't had a reminder sent yet
  let query = admin
    .from('bookings')
    .select(`
      id,
      client_id,
      client_name,
      master_id,
      master_profiles!inner(slug, subscription_tier),
      profiles!master_id(full_name)
    `)
    .eq('next_visit_suggestion', targetDate)
    .not('client_id', 'is', null);

  if (sentIds.length > 0) {
    query = query.not('id', 'in', `(${sentIds.join(',')})`);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error('[rebooking cron] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const booking of bookings ?? []) {
    const clientId = booking.client_id as string;
    const mp = (booking as any).master_profiles;
    const masterProfile = (booking as any).profiles;
    const masterName = masterProfile?.full_name ?? 'Ваш майстер';
    const slug = mp?.slug;
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${slug}`;

    const title = `${masterName} чекає на вас!`;
    const body = `Час для наступного візиту — запишіться на ${targetDate} або інший зручний день.`;
    const tgMsg = `💅 <b>${masterName}</b> нагадує про ваш наступний візит!\n\nРекомендована дата: <b>${targetDate}</b>\n\n<a href="${bookingUrl}">Записатися →</a>`;

    let wasSent = false;

    // Push notification
    const { data: pushSubs } = await admin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', clientId);

    if (pushSubs && pushSubs.length > 0) {
      const count = await broadcastPush(pushSubs as any, { title, body, url: bookingUrl });
      if (count > 0) wasSent = true;
    }

    // Telegram
    const { data: tgProfile } = await admin
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', clientId)
      .single();

    if (tgProfile?.telegram_chat_id) {
      await sendTelegramMessage(tgProfile.telegram_chat_id, tgMsg);
      wasSent = true;
    }

    if (wasSent) {
      await admin.from('rebooking_reminders').insert({ booking_id: booking.id });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, processed: bookings?.length ?? 0, sent });
}
