import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { claimMasterRole } from '@/app/(auth)/register/actions';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/my/bookings';
  // bookingId переданий через redirectTo для прив'язки запису після Google OAuth
  const bid = searchParams.get('bid');
  // source=master_register → Google OAuth from /register page
  const source = searchParams.get('source');

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url));
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] code exchange error:', error.message);
    return NextResponse.redirect(new URL('/login?error=callback_error', request.url));
  }

  // Master registration via Google OAuth — claim master role before dashboard redirect
  if (source === 'master_register') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await claimMasterRole(user.id, user.user_metadata?.phone ?? '');
    }
  }

  // Якщо прийшли з PostBookingAuth — прив'язуємо запис до щойно авторизованого юзера
  if (bid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();

      // Profile upserts in parallel, then link booking
      await Promise.all([
        admin.from('profiles').upsert({
          id: user.id,
          role: 'client',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          email: user.email,
        }, { onConflict: 'id', ignoreDuplicates: false }),
        admin.from('client_profiles').upsert(
          { id: user.id },
          { onConflict: 'id', ignoreDuplicates: true }
        ),
      ]);

      await admin.from('bookings')
        .update({ client_id: user.id })
        .eq('id', bid)
        .is('client_id', null);

    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
