import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyReferralRewards } from '@/lib/actions/referrals';
import { generateSecureToken } from '@/lib/utils/token';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // SEC-CRIT-1: Neutralise open-redirect via //attacker.com or /%2F%2F — extract pathname only
  const rawNext = searchParams.get('next') ?? '/my/bookings';
  const next = (() => {
    if (!rawNext.startsWith('/')) return '/my/bookings';
    try {
      const url = new URL(rawNext, 'https://x');
      return url.pathname + url.search;
    } catch {
      return '/my/bookings';
    }
  })();

  // SEC-HIGH-1: Role from URL param alone is forgeable via external links.
  // Actual assignment happens below after cookieStore is available.
  const roleFromParam = searchParams.get('role') ?? 'client';
  const bid = searchParams.get('bid');

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const cookieStore = await cookies();

  // SEC-HIGH-1: Only assign master role when BOTH the URL param AND the short-lived cookie agree.
  // The cookie (bookit_reg_role=master, max-age=300) is set by PhoneOtpForm.tsx right before
  // triggering Google OAuth — external crafted links cannot set same-origin cookies.
  const roleFromCookie = cookieStore.get('bookit_reg_role')?.value;
  const role = (roleFromParam === 'master' && roleFromCookie === 'master') ? 'master' : 'client';
  cookieStore.set('bookit_reg_role', '', { path: '/', maxAge: 0 });

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
    cookieStore.set('user_role', '', { path: '/', maxAge: 0 });

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Користувач';

    const isSmsUser = user.email?.endsWith('@bookit.app') ?? false;
    const assignedRole = (!isSmsUser && role === 'master') ? 'master' : 'client';

    // 1. Sync base profile
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    await admin.from('profiles').upsert(
      { 
        id: user.id, 
        role: assignedRole, 
        full_name: existingProfile?.full_name || displayName, 
        email: user.email 
      },
      { onConflict: 'id' }
    );

    if (assignedRole === 'master') {
      const { data: existingMaster } = await admin
        .from('master_profiles').select('id').eq('id', user.id).maybeSingle();
      const isNewMaster = !existingMaster;

      const suffix = generateSecureToken(6).toLowerCase();
      const baseName = (user.user_metadata?.name as string | undefined)
        ?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
        ?? '';
      const slug = baseName ? `${baseName}-${suffix}` : `master-${suffix}`;

      let referralCode: string;
      if (existingMaster) {
        const { data: mp } = await admin
          .from('master_profiles').select('referral_code').eq('id', user.id).single();
        referralCode = mp?.referral_code ?? generateSecureToken(6);
      } else {
        referralCode = generateSecureToken(6);
      }

      const refCodeFromCookie = cookieStore.get('bookit_ref')?.value || null;

      const bonus = (isNewMaster && refCodeFromCookie)
        ? await applyReferralRewards(user.id, refCodeFromCookie)
        : { subscriptionTier: 'starter' as const, subscriptionExpiresAt: null, finalReferredBy: null };

      await admin.from('master_profiles').upsert(
        {
          id: user.id,
          slug,
          referral_code: referralCode,
          referred_by: bonus.finalReferredBy,
          subscription_tier: bonus.subscriptionTier,
          subscription_expires_at: bonus.subscriptionExpiresAt,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );

      if (bonus.finalReferredBy) {
        cookieStore.set('bookit_ref', '', { path: '/', maxAge: 0 });
      }

      // V-06: Explicit ownership check before claiming booking.
      // Fetch first to ensure (1) booking exists, (2) still unclaimed, (3) email matches.
      if (bid && user.email) {
        const { data: targetBooking } = await admin
          .from('bookings')
          .select('id, client_id, client_email')
          .eq('id', bid)
          .maybeSingle();
        if (
          targetBooking &&
          targetBooking.client_id === null &&
          targetBooking.client_email === user.email
        ) {
          await admin.from('bookings')
            .update({ client_id: user.id })
            .eq('id', bid)
            .is('client_id', null); // atomic guard against race
        }
      }

      // V-10: allowlist plan param to prevent parameter pollution
      const ALLOWED_PLANS = ['pro', 'studio'] as const;
      const rawPlan = cookieStore.get('intended_plan')?.value || searchParams.get('plan') || null;
      const intendedPlan = ALLOWED_PLANS.includes(rawPlan as typeof ALLOWED_PLANS[number]) ? rawPlan : null;
      cookieStore.set('intended_plan', '', { path: '/', maxAge: 0 });

      if (intendedPlan === 'pro' || intendedPlan === 'studio') {
        return NextResponse.redirect(new URL(`/dashboard/billing?plan=${intendedPlan}`, origin));
      }
      if (isNewMaster && !next.startsWith('/dashboard/billing')) {
        return NextResponse.redirect(new URL('/dashboard/onboarding', origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    } else {
      const [, { data: clientProfile }] = await Promise.all([
        admin.from('client_profiles').upsert(
          { id: user.id },
          { onConflict: 'id', ignoreDuplicates: true }
        ),
        admin.from('profiles').select('phone').eq('id', user.id).single(),
      ]);

      const isSmsAuth = user.email?.endsWith('@bookit.app') || user.app_metadata?.provider === 'phone';
      const needsOnboarding = !clientProfile?.phone && !isSmsAuth;

      if (needsOnboarding) {
        return NextResponse.redirect(new URL('/my/setup/phone', origin));
      }
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}