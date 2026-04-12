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
  bookingId: string;
  masterId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify booking belongs to this user and is completed
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, master_id')
    .eq('id', params.bookingId)
    .eq('client_id', user.id)
    .eq('status', 'completed')
    .single();

  if (!booking) throw new Error('Booking not found or not eligible for review');

  // Get client name from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const clientName = profile?.full_name ?? 'Клієнт';

  // Ensure client_profiles entry exists
  await supabase
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  const { error } = await supabase
    .from('reviews')
    .insert({
      booking_id: params.bookingId,
      master_id: booking.master_id, // use DB value, not client-supplied
      client_id: user.id,
      client_name: clientName,
      rating: params.rating,
      comment: params.comment || null,
      is_published: true,
    });

  if (error) throw error;
  // MEDIUM-PERF: targeted invalidation — don't bust entire app layout cache on client actions
  revalidatePath('/my/bookings');

  // Notify master via all channels (fire-and-forget)
  const masterId = booking.master_id;
  const notifBody = `${clientName} · ${params.rating}/5`;

  const admin = createAdminClient();
  const [masterResult] = await Promise.allSettled([
    supabase
      .from('master_profiles')
      .select('telegram_chat_id')
      .eq('id', masterId)
      .single(),
    admin.from('notifications').insert({
      recipient_id: masterId,
      title: 'Новий відгук',
      body: notifBody,
      type: 'new_review',
      related_master_id: masterId,
    }),
  ]);

  const chatId = masterResult.status === 'fulfilled'
    ? (masterResult.value.data?.telegram_chat_id as string | null)
    : null;
  if (chatId) {
    await sendTelegramMessage(
      chatId,
      buildReviewMessage({ clientName, rating: params.rating, comment: params.comment || null }),
    ).catch(() => {});
  }
}
