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
  let bookingId: string | undefined;
  try {
    const body = await req.json();
    bookingId = typeof body.bookingId === 'string' ? body.bookingId : undefined;
  } catch {
    return NextResponse.json({ error: 'Невірний формат запиту' }, { status: 400 });
  }

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

  // Only trust phone from auth token — never from client body to prevent IDOR
  const userPhone = user.user_metadata?.phone as string | undefined;

  // Profiles must exist before booking foreign-key update
  await Promise.all([
    admin.from('profiles').upsert({
      id: user.id,
      role: 'client',
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      ...(userPhone ? { phone: userPhone } : {}),
    }, { onConflict: 'id', ignoreDuplicates: false }),
    admin.from('client_profiles').upsert(
      { id: user.id },
      { onConflict: 'id', ignoreDuplicates: true }
    ),
  ]);

  // Link bookings by phone (auth-verified phone only)
  if (userPhone) {
    await admin
      .from('bookings')
      .update({ client_id: user.id })
      .eq('client_phone', userPhone)
      .is('client_id', null);
  }

  // Link specific booking by ID only if its client_phone matches the auth-verified phone
  if (bookingId && userPhone) {
    const { data: booking } = await admin
      .from('bookings')
      .select('client_phone')
      .eq('id', bookingId)
      .is('client_id', null)
      .single();

    if (booking?.client_phone === userPhone) {
      await admin
        .from('bookings')
        .update({ client_id: user.id })
        .eq('id', bookingId)
        .is('client_id', null);
    }
  }

  return NextResponse.json({ success: true });
}
