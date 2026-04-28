'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, buildCancellationMessage, buildReviewMessage } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';
export async function cancelBooking(bookingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancellation_reason: 'client_requested' })
    .eq('id', bookingId)
    .eq('client_id', user.id)
    .in('status', ['pending', 'confirmed']);

  if (error) throw error;
  // MEDIUM-PERF: targeted invalidation — don't bust entire app layout cache on client actions
  revalidatePath('/my/bookings');

  // Notify master via Telegram
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      date, start_time,
      booking_services ( service_name ),
      master_profiles!inner (
        telegram_chat_id,
        profiles!inner ( full_name )
      )
    `)
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const mp = booking.master_profiles as any;
  const chatId = mp?.telegram_chat_id as string | null;
  if (!chatId) return;

  const clientProfile = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const clientName = clientProfile.data?.full_name ?? 'Клієнт';

  const services = ((booking.booking_services as any[]) ?? [])
    .map((s: any) => s.service_name as string)
    .join(', ');

  const text = buildCancellationMessage({
    clientName,
    date: booking.date as string,
    startTime: (booking.start_time as string | null)?.slice(0, 5) ?? '',
    services: services || 'Послуга',
  });

  await sendTelegramMessage(chatId, text);
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
    await sendTelegramMessage(
      chatId,
      buildReviewMessage({ 
        clientName, 
        rating: params.rating, 
        comment: `${params.orderId ? '[Замовлення] ' : ''}${params.comment || ''}`.trim() 
      }),
    ).catch(() => {});
  }
}
