import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastPush } from '@/lib/push';
import { sendTelegramMessage, escHtml } from '@/lib/telegram';

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

  // 1. Fetch candidate bookings for targetDate (naturally bounded — one specific date)
  const { data: candidates, error } = await admin
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

  if (error) {
    console.error('[rebooking cron] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidateList = candidates ?? [];

  // 2. Check which candidate IDs already have reminders (bounded by candidateList, not full table)
  let sentIdSet = new Set<string>();
  if (candidateList.length > 0) {
    const candidateIds = candidateList.map(b => b.id);
    const { data: sentReminders } = await admin
      .from('rebooking_reminders')
      .select('booking_id')
      .in('booking_id', candidateIds);
    sentIdSet = new Set((sentReminders ?? []).map((r: any) => r.booking_id as string));
  }

  // 3. Filter out already-reminded bookings in memory
  const bookings = candidateList.filter(b => !sentIdSet.has(b.id));

  if (bookings.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0 });
  }

  // Batch fetch push subscriptions and Telegram chat IDs for all clients at once
  const clientIds = [...new Set(bookings.map(b => b.client_id as string))];

  const [{ data: allPushSubs }, { data: allProfiles }] = await Promise.all([
    admin.from('push_subscriptions').select('user_id, subscription').in('user_id', clientIds),
    admin.from('profiles').select('id, telegram_chat_id').in('id', clientIds),
  ]);

  // Build O(1) lookup maps
  const pushSubsByUser = new Map<string, any[]>();
  for (const sub of allPushSubs ?? []) {
    const arr = pushSubsByUser.get(sub.user_id) ?? [];
    arr.push(sub);
    pushSubsByUser.set(sub.user_id, arr);
  }

  const tgChatByUser = new Map<string, string>();
  for (const p of allProfiles ?? []) {
    if (p.telegram_chat_id) tgChatByUser.set(p.id, p.telegram_chat_id);
  }

  let sent = 0;
  const sentBookingIds: string[] = [];

  for (const booking of bookings) {
    const clientId = booking.client_id as string;
    const mp = (booking as any).master_profiles;
    const masterProfile = (booking as any).profiles;
    const masterName = masterProfile?.full_name ?? 'Ваш майстер';
    const slug = mp?.slug;
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${slug}`;

    const title = `${masterName} чекає на вас!`;
    const body = `Час для наступного візиту — запишіться на ${targetDate} або інший зручний день.`;
    const tgMsg = `💅 <b>${escHtml(masterName)}</b> нагадує про ваш наступний візит!\n\nРекомендована дата: <b>${escHtml(targetDate)}</b>\n\n<a href="${escHtml(bookingUrl)}">Записатися →</a>`;

    const userPushSubs = pushSubsByUser.get(clientId) ?? [];
    const tgChatId = tgChatByUser.get(clientId);

    // PERF: run push + telegram in parallel — both are fire-and-forget notifications,
    // a failure in one must not block or cancel the other.
    const [pushResult, tgResult] = await Promise.allSettled([
      userPushSubs.length > 0
        ? broadcastPush(userPushSubs as any, { title, body, url: bookingUrl })
        : Promise.resolve(0),
      tgChatId
        ? sendTelegramMessage(tgChatId, tgMsg)
        : Promise.resolve(null),
    ]);
    const wasSent =
      (pushResult.status === 'fulfilled' && Number(pushResult.value) > 0) ||
      (tgResult.status === 'fulfilled' && !!tgChatId);

    if (wasSent) {
      sentBookingIds.push(booking.id);
      sent++;
    }
  }

  // Batch insert reminders instead of N individual inserts
  if (sentBookingIds.length > 0) {
    await admin
      .from('rebooking_reminders')
      .insert(sentBookingIds.map(id => ({ booking_id: id })));
  }

  return NextResponse.json({ ok: true, processed: bookings.length, sent });
}
