import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const userPhone = phone || (user.user_metadata?.phone as string | undefined);

  // Уpsert профілю клієнта
  await admin.from('profiles').upsert({
    id: user.id,
    role: 'client',
    email: user.email,
    ...(userPhone ? { phone: userPhone } : {}),
    ...(user.user_metadata?.full_name
      ? { full_name: user.user_metadata.full_name }
      : user.user_metadata?.name
      ? { full_name: user.user_metadata.name }
      : {}),
  }, { onConflict: 'id', ignoreDuplicates: false });

  await admin.from('client_profiles').upsert(
    { id: user.id },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  // Прив'язуємо всі записи за номером телефону (телефон = головний ідентифікатор)
  if (userPhone) {
    await admin.from('bookings')
      .update({ client_id: user.id })
      .eq('client_phone', userPhone)
      .is('client_id', null);
  }

  // Також прив'язуємо конкретний запис (на випадок розбіжності формату телефону)
  if (bookingId) {
    await admin.from('bookings')
      .update({ client_id: user.id })
      .eq('id', bookingId)
      .is('client_id', null);
  }

  console.log('[link-booking] uid:', user.id, '| phone:', userPhone, '| bookingId:', bookingId);
  return NextResponse.json({ success: true });
}
