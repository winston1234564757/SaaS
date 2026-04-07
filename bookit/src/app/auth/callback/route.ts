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
  // bookingId — used only in the master branch for email-based bid linking.
  // Client booking linkage is handled server-side by trg_link_bookings_on_phone trigger.
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

    // CRITICAL: Clear stale user_role cookie so proxy.ts re-reads role from DB.
    // Without this, a browser that previously had user_role=master will route a
    // new client session into /dashboard, causing redirect loops.
    cookieStore.set('user_role', '', { path: '/', maxAge: 0 });

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Користувач';

    // SMS-authenticated users always have email ending in @bookit.app.
    // NEVER trust the ?role= URL param for them — it can be stale/crafted.
    // Only Google OAuth users can legitimately become masters via callback.
    const isSmsUser = user.email?.endsWith('@bookit.app') ?? false;
    const assignedRole = (!isSmsUser && role === 'master') ? 'master' : 'client';

    // 1. Sync base profile — role explicitly set from URL param (user's choice in toggle)
    await admin.from('profiles').upsert(
      { id: user.id, role: assignedRole, full_name: displayName, email: user.email },
      { onConflict: 'id' }
    );

    // 2. Guarantee the matching sub-profile exists
    if (assignedRole === 'master') {
      const { data: existingMaster } = await admin
        .from('master_profiles').select('id').eq('id', user.id).maybeSingle();
      const isNewMaster = !existingMaster;

      const bytes = crypto.getRandomValues(new Uint8Array(4));
      const suffix = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, 6);
      const baseName = (user.user_metadata?.name as string | undefined)
        ?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
        ?? '';
      const slug = baseName ? `${baseName}-${suffix}` : `master-${suffix}`;

      // referral_code ЗАВЖДИ в payload: PostgreSQL перевіряє NOT NULL до ON CONFLICT DO NOTHING.
      // Якщо рядок вже існує — existingMaster != null, тому читаємо його referral_code.
      // Якщо рядок новий — генеруємо код тут.
      let referralCode: string;
      if (existingMaster) {
        const { data: mp } = await admin
          .from('master_profiles').select('referral_code').eq('id', user.id).single();
        referralCode = mp?.referral_code ?? crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      } else {
        referralCode = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      }

      await admin.from('master_profiles').upsert(
        { id: user.id, slug, referral_code: referralCode },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      // 3. Link a pending booking to the newly authenticated user
      // Verify email ownership to prevent IDOR via crafted ?bid= URL param
      if (bid && user.email) {
        await admin.from('bookings')
          .update({ client_id: user.id })
          .eq('id', bid)
          .eq('client_email', user.email)
          .is('client_id', null);
      }

      // Redirect: any master with a paid plan intent → billing; new masters → onboarding; others → dashboard
      // Cookie may be lost during Google OAuth redirect chain (SameSite=Lax), so also read from URL param as fallback
      const intendedPlan = cookieStore.get('intended_plan')?.value || searchParams.get('plan') || null;
      cookieStore.set('intended_plan', '', { path: '/', maxAge: 0 });

      if (intendedPlan === 'pro' || intendedPlan === 'studio') {
        return NextResponse.redirect(new URL(`/dashboard/billing?plan=${intendedPlan}`, origin));
      }
      // `next` may already point to /dashboard/billing (embedded by handleGoogleLogin as fallback)
      if (isNewMaster && !next.startsWith('/dashboard/billing')) {
        return NextResponse.redirect(new URL('/dashboard/onboarding', origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    } else {
      await admin.from('client_profiles').upsert(
        { id: user.id },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      // Clients without a confirmed phone → mandatory onboarding.
      // trg_link_bookings_on_phone will auto-link any guest bookings after setup.
      const { data: clientProfile, error: profileFetchError } = await admin
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();
      if (profileFetchError) {
        console.error('[auth/callback] profiles phone fetch error:', profileFetchError.message);
      }

      const isSmsAuth = user.email?.endsWith('@bookit.app') || user.app_metadata?.provider === 'phone';
      const needsOnboarding = !clientProfile?.phone && !isSmsAuth;

      if (needsOnboarding) {
        return NextResponse.redirect(new URL('/my/setup/phone', origin));
      }
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
