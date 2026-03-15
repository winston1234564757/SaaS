'use server';

import { createClient } from '@/lib/supabase/server';
import { sendEmail, buildStatusChangeHtml } from '@/lib/email';

export async function notifyClientOnStatusChange(
  bookingId: string,
  status: 'confirmed' | 'cancelled',
): Promise<void> {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      date, start_time, client_name, client_email,
      booking_services ( service_name ),
      master_profiles!inner ( slug, profiles!inner ( full_name ) )
    `)
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const clientEmail = booking.client_email as string | null;
  if (!clientEmail) return;

  const mp = booking.master_profiles as any;
  const masterName = (mp?.profiles as any)?.full_name ?? 'Майстер';
  const masterSlug = (mp?.slug as string) ?? '';
  const services = ((booking.booking_services as any[]) ?? [])
    .map((s: any) => s.service_name as string)
    .join(', ');

  const html = buildStatusChangeHtml({
    clientName: booking.client_name as string,
    masterName,
    masterSlug,
    date: booking.date as string,
    startTime: (booking.start_time as string | null)?.slice(0, 5) ?? '',
    services,
    status,
  });

  const subjects = {
    confirmed: `Запис підтверджено — ${masterName}`,
    cancelled:  `Запис скасовано — ${masterName}`,
  };

  await sendEmail({
    to: clientEmail,
    subject: subjects[status],
    html,
  });
}
