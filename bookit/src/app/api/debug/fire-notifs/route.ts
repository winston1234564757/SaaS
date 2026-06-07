import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationOrchestrator } from '@/lib/notifications/NotificationOrchestrator';
import type { NotifEventType, NotifData } from '@/lib/notifications/constants/notifMap';

const TODAY = new Date().toISOString().split('T')[0];

const TEST_DATA: NotifData = {
  bookingId:          'test-booking-id-001',
  clientName:         'Вітос Тест',
  masterName:         'BookIT Test Studio',
  masterSlug:         'test-studio',
  date:               TODAY,
  startTime:          '14:00',
  services:           'Стрижка + укладка',
  totalPrice:         650,
  count:              3,
  bookingItems:       '— 10:00 Стрижка\n— 12:00 Укладка\n— 14:00 Фарбування',
  rating:             5,
  comment:            'Чудовий майстер, рекомендую!',
  portfolioItemTitle: 'Тестова робота',
  orderItems:         'x1 Шампунь Professional\nx2 Маска для волосся',
  productName:        'Шампунь Professional',
  stockCount:         2,
  tier:               'Pro',
  expiresAt:          '2026-07-07',
  ticketId:           'ticket-test-001',
  userRole:           'master',
};

// Master-facing events
const MASTER_EVENTS: NotifEventType[] = [
  'booking_created',
  'booking_cancelled',
  'booking_rescheduled',
  'unhandled_booking',
  'reminder_24h',
  'reminder_2h',
  'reminder_30m',
  'master_day_briefing',
  'new_review',
  'order_new',
  'stock_alert',
  'subscription_paid',
  'subscription_expiring',
  'subscription_failed',
  'subscription_downgraded',
  'support_user_reply',
];

// Client-facing events (same user, different role)
const CLIENT_EVENTS: NotifEventType[] = [
  'booking_confirmed',
  'booking_completed',
  'rebooking_reminder',
  'portfolio_consent_request',
  'order_shipped',
  'order_completed',
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { userId?: string; eventsFilter?: string[] };
    const userId = body.userId ?? '551c7a11-a02b-4944-9b34-594c41ccb951';

    const admin = createAdminClient();

    const { data: masterProf, error: mErr } = await admin
      .from('master_profiles')
      .select('id, business_name, slug, telegram_chat_id')
      .eq('id', userId)
      .maybeSingle();

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
    if (!masterProf) return NextResponse.json({ error: `master_profiles row not found for id=${userId}` }, { status: 404 });

    const { data: pushSubs } = await admin
      .from('push_subscriptions')
      .select('endpoint')
      .eq('user_id', userId);

    const masterId    = masterProf.id;
    const recipientId = userId;

    const results: { event: string; role: string; result: { inApp: boolean; push: boolean; telegram: boolean; sms: boolean } }[] = [];
    const filterSet = body.eventsFilter ? new Set(body.eventsFilter) : null;

    const run = async (event: NotifEventType, role: 'master' | 'client') => {
      if (filterSet && !filterSet.has(event)) return;
      const res = await NotificationOrchestrator.send({
        eventType: event,
        recipientId,
        recipientRole: role,
        masterId,
        data: TEST_DATA,
      });
      results.push({ event, role, result: res });
    };

    for (const ev of MASTER_EVENTS) await run(ev, 'master');
    for (const ev of CLIENT_EVENTS)  await run(ev, 'client');

    return NextResponse.json({
      userId,
      masterProfileId: masterId,
      businessName:    masterProf.business_name,
      telegramChatId:  masterProf.telegram_chat_id,
      pushSubsCount:   pushSubs?.length ?? 0,
      pushEndpoints:   pushSubs?.map(s => s.endpoint.slice(0, 60) + '…') ?? [],
      eventsFired:     results.length,
      results,
    });

  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
