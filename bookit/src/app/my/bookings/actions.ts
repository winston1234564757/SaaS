'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, buildCancellationMessage, buildReviewMessage } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { createFlashDealInternal } from '@/app/(master)/dashboard/flash/actions';

type PushSubscriptionData = { endpoint: string; keys: { p256dh: string; auth: string } };
type CancelMasterProfile = {
  id: string;
  telegram_chat_id: string | null;
  profiles: { full_name: string } | null;
} | null;
type CancelBookingService = { service_name: string };

export async function cancelBooking(bookingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: cancelled, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancellation_reason: 'client_requested' })
    .eq('id', bookingId)
    .eq('client_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .select('id');

  if (error) throw error;
  // MEDIUM-PERF: targeted invalidation — don't bust entire app layout cache on client actions
  revalidatePath('/my/bookings');

  // Nothing was actually cancelled (already cancelled/completed) → no notify, no flash.
  if (!cancelled || cancelled.length === 0) return;

  // M-REV-02 (B): client-initiated cancel ALWAYS triggers the auto flash deal
  // when the master opted in. Runs after the response flushes so the detached
  // work survives on serverless; the cancelling client is excluded from targeting.
  const cancellingClientId = user.id;
  after(async () => {
    try {
      const fdAdmin = createAdminClient();
      const { data: b } = await fdAdmin
        .from('bookings')
        .select('master_id, date, start_time, booking_services(service_id, service_name, service_price), master_profiles(slug, subscription_tier, auto_flash_on_cancel, auto_flash_discount_pct, profiles(full_name))')
        .eq('id', bookingId)
        .single();
      if (!b) return;
      const mp = b.master_profiles as unknown as {
        slug: string | null;
        subscription_tier: string;
        auto_flash_on_cancel: boolean;
        auto_flash_discount_pct: number;
        profiles: { full_name: string } | null;
      } | null;
      if (!mp?.auto_flash_on_cancel) return;
      const first = (b.booking_services as { service_id: string | null; service_name: string; service_price: number }[])[0];
      if (!first?.service_id || Number(first.service_price) <= 0) return;
      await createFlashDealInternal(b.master_id as string, mp.subscription_tier, {
        serviceId:       first.service_id,
        serviceName:     first.service_name,
        slotDate:        b.date as string,
        slotTime:        String(b.start_time).slice(0, 5),
        originalPrice:   Number(first.service_price),
        discountPct:     mp.auto_flash_discount_pct,
        expiresInHours:  2,
        slug:            mp.slug ?? '',
        masterName:      mp.profiles?.full_name ?? 'Майстер',
        excludeClientId: cancellingClientId,
        bookingId,
      });
    } catch (e) {
      console.error('[my/cancelBooking] auto-flash failed:', e);
    }
  });

  // Notify master via Telegram
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      master_id,
      date, start_time,
      booking_services ( service_name ),
      master_profiles!inner (
        id,
        telegram_chat_id,
        profiles!inner ( full_name )
      )
    `)
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const mp = booking.master_profiles as unknown as CancelMasterProfile;
  const chatId = mp?.telegram_chat_id ?? null;
  if (!chatId) return;

  const clientProfile = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const clientName = clientProfile.data?.full_name ?? 'Клієнт';

  const services = (booking.booking_services as CancelBookingService[])
    .map(s => s.service_name)
    .join(', ');

  const text = buildCancellationMessage({
    clientName,
    date: booking.date as string,
    startTime: (booking.start_time as string | null)?.slice(0, 5) ?? '',
    services: services || 'Послуга',
  });

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
  const replyMarkup = { inline_keyboard: [[{ text: 'Відкрити запис', url: `${SITE_URL}/dashboard/bookings?bookingId=${bookingId}` }]] };
  await sendTelegramMessage(chatId, text, replyMarkup);

  const admin = createAdminClient();
  const { data: pushSubs } = await admin
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', booking.master_id);

  if (pushSubs && pushSubs.length > 0) {
    const { sendPush } = await import('@/lib/push');
    await Promise.allSettled(
      pushSubs.map(sub => sendPush(sub.subscription as unknown as PushSubscriptionData, {
        title: 'Запис скасовано ❌',
        body: `Клієнт ${clientName} скасував свій запис на ${booking.date}`,
        url: `/dashboard/bookings?bookingId=${bookingId}`,
      }))
    );
  }
}

export async function submitReview(params: {
  bookingId?: string;
  orderId?: string;
  masterId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let finalMasterId = params.masterId;

  if (params.bookingId) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('master_id')
      .eq('id', params.bookingId)
      .eq('client_id', user.id)
      .eq('status', 'completed')
      .single();
    if (!booking) throw new Error('Booking not found or not eligible for review');
    finalMasterId = booking.master_id;
  } else if (params.orderId) {
    const { data: order } = await supabase
      .from('orders')
      .select('master_id')
      .eq('id', params.orderId)
      .eq('client_id', user.id)
      .in('status', ['completed', 'shipped'])
      .single();
    if (!order) throw new Error('Order not found or not eligible for review');
    finalMasterId = order.master_id;
  } else {
    throw new Error('Target for review missing');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const clientName = profile?.full_name ?? 'Клієнт';

  await supabase
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  const { error } = await supabase
    .from('reviews')
    .insert({
      booking_id: params.bookingId || null,
      order_id:   params.orderId || null,
      master_id:  finalMasterId,
      client_id:  user.id,
      client_name: clientName,
      rating:     params.rating,
      comment:    params.comment || null,
      is_published: false,
    });

  if (error) throw error;
  revalidatePath('/my/bookings');

  const notifBody = `${clientName} · ${params.rating}/5 ${params.orderId ? '(Товар)' : '(Запис)'}`;
  const admin = createAdminClient();
  const [masterResult] = await Promise.allSettled([
    supabase.from('master_profiles').select('telegram_chat_id').eq('id', finalMasterId).single(),
    admin.from('notifications').insert({
      recipient_id: finalMasterId,
      title: 'Новий відгук',
      body: notifBody,
      type: 'new_review',
      related_master_id: finalMasterId,
    }),
  ]);

  const chatId = masterResult.status === 'fulfilled'
    ? (masterResult.value.data?.telegram_chat_id as string | null)
    : null;
  if (chatId) {
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
    const replyMarkup = { inline_keyboard: [[{ text: 'Переглянути', url: `${SITE_URL}/dashboard/reviews` }]] };
    await sendTelegramMessage(
      chatId,
      buildReviewMessage({
        clientName,
        rating: params.rating,
        comment: `${params.orderId ? '[Замовлення] ' : ''}${params.comment || ''}`.trim()
      }),
      replyMarkup
    ).catch(() => {});
  }

  const { data: pushSubs } = await admin
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', finalMasterId);

  if (pushSubs && pushSubs.length > 0) {
    const { sendPush } = await import('@/lib/push');
    await Promise.allSettled(
      pushSubs.map(sub => sendPush(sub.subscription as unknown as PushSubscriptionData, {
        title: 'Новий відгук ⭐',
        body: `${clientName} залишив відгук: ${params.rating}/5`,
        url: `/dashboard/reviews`,
      }))
    );
  }
}
