import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/my/bookings';
  // role passed via redirectTo from the auth toggle UI
  const role = searchParams.get('role') ?? 'client';
  // bookingId passed via redirectTo to link a booking after Google OAuth
  const bid = searchParams.get('bid');

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

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const admin = createAdminClient();

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Користувач';

    const assignedRole = role === 'master' ? 'master' : 'client';

    // 1. Sync base profile — role explicitly set from URL param (user's choice in toggle)
    await admin.from('profiles').upsert(
      { id: user.id, role: assignedRole, full_name: displayName, email: user.email },
      { onConflict: 'id' }
    );

    // 2. Guarantee the matching sub-profile exists
    if (assignedRole === 'master') {
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      const suffix = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, 6);
      const baseName = (user.user_metadata?.name as string | undefined)
        ?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
        ?? '';
      const slug = baseName ? `${baseName}-${suffix}` : `master-${suffix}`;

      await admin.from('master_profiles').upsert(
        { id: user.id, slug },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    } else {
      await admin.from('client_profiles').upsert(
        { id: user.id },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }

    // 3. Link a pending booking to the newly authenticated user
    if (bid) {
      await admin.from('bookings')
        .update({ client_id: user.id })
        .eq('id', bid)
        .is('client_id', null);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
