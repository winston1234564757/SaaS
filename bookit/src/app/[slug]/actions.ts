'use server';

import { createClient } from '@/lib/supabase/server';
import { sendTelegramMessage, buildBookingMessage } from '@/lib/telegram';
import { sendEmail, buildBookingConfirmationHtml } from '@/lib/email';

import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Links a booking to the currently authenticated client.
 * Uses service role to bypass RLS (no client UPDATE policy on bookings).
 */
export async function linkBookingToClient(bookingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = getAdminClient();

  // Ensure client_profiles row exists
  await admin
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  // Link booking to client
  await admin
    .from('bookings')
    .update({ client_id: user.id })
    .eq('id', bookingId)
    .is('client_id', null); // only link if not already linked
}

/**
 * Ensures client_profiles row exists for the current user (needed for client_id FK).
 * Returns userId if user is logged in with role=client, otherwise null.
 */
export async function ensureClientProfile(): Promise<{ userId: string | null; name: string | null; phone: string | null; email: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null, name: null, phone: null, email: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'client') return { userId: null, name: null, phone: null, email: null };

  // Ensure client_profiles row exists (FK requirement)
  await supabase
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  return {
    userId: user.id,
    name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    email: user.email ?? null,
  };
}

export async function notifyMasterOnBooking(params: {
  masterId: string;
  clientName: string;
  date: string;
  startTime: string;
  services: string;
  totalPrice: number;
  notes?: string | null;
  products?: { name: string; quantity: number }[];
}): Promise<void> {
  const supabase = await createClient();

  const { data: mp } = await supabase
    .from('master_profiles')
    .select('telegram_chat_id')
    .eq('id', params.masterId)
    .single();

  const chatId = mp?.telegram_chat_id;
  if (!chatId) return;

  const text = buildBookingMessage(params);
  await sendTelegramMessage(chatId, text);
}

export async function sendClientBookingConfirmation(params: {
  bookingId: string;
  clientEmail: string;
  clientName: string;
}): Promise<void> {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      date, start_time, end_time, total_price, notes,
      booking_services ( service_name, service_price ),
      master_profiles!inner ( slug, profiles!inner ( full_name ) )
    `)
    .eq('id', params.bookingId)
    .single();

  if (!booking) return;

  const mp = booking.master_profiles as any;
  const masterName = (mp?.profiles as any)?.full_name ?? 'Майстер';
  const masterSlug = (mp?.slug as string) ?? '';

  const services = ((booking.booking_services as any[]) ?? []).map((s: any) => ({
    name: s.service_name as string,
    price: Number(s.service_price),
  }));

  const html = buildBookingConfirmationHtml({
    clientName: params.clientName,
    masterName,
    masterSlug,
    date: booking.date as string,
    startTime: (booking.start_time as string | null)?.slice(0, 5) ?? '',
    endTime: (booking.end_time as string | null)?.slice(0, 5) ?? '',
    services,
    totalPrice: Number(booking.total_price),
    notes: booking.notes as string | null,
  });

  await sendEmail({
    to: params.clientEmail,
    subject: `Твій запис до ${masterName} — Bookit`,
    html,
  });
}
