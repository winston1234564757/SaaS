import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

/**
 * Прив'язує записи до авторизованого клієнта.
 * Викликається після SMS OTP авторизації в PostBookingAuth.
 * Body: { bookingId?: string, phone?: string }
 */
export async function POST(req: NextRequest) {
  const { bookingId, phone } = await req.json();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const userPhone = phone || (user.user_metadata?.phone as string | undefined);

  // Profiles must exist before booking foreign-key update
  await Promise.all([
    admin.from('profiles').upsert({
      id: user.id,
      role: 'client',
      email: user.email,
      ...(userPhone ? { phone: userPhone } : {}),
      ...(user.user_metadata?.full_name
        ? { full_name: user.user_metadata.full_name }
        : user.user_metadata?.name
        ? { full_name: user.user_metadata.name }
        : {}),
    }, { onConflict: 'id', ignoreDuplicates: false }),
    admin.from('client_profiles').upsert(
      { id: user.id },
      { onConflict: 'id', ignoreDuplicates: true }
    ),
  ]);

  // Прив'язуємо записи за телефоном і за конкретним bookingId паралельно
  await Promise.all([
    userPhone
      ? admin.from('bookings').update({ client_id: user.id }).eq('client_phone', userPhone).is('client_id', null)
      : Promise.resolve(),
    bookingId
      ? admin.from('bookings').update({ client_id: user.id }).eq('id', bookingId).is('client_id', null)
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true });
}
