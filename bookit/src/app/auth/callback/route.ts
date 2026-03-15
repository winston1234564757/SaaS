import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createMasterProfileAfterSignup } from '@/app/(auth)/register/actions';
import { generateSlug } from '@/lib/utils/slug';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') ?? 'client'; // 'master' | 'client'
  const referredBy = searchParams.get('ref') ?? null;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;

  // Check if profile already exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    // Existing user — redirect by role
    return NextResponse.redirect(
      `${origin}${profile.role === 'master' ? '/dashboard' : '/my/bookings'}`
    );
  }

  // New user via Google OAuth
  const fullName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Користувач';
  const email = user.email ?? undefined;

  if (role === 'master') {
    // Master: needs categories + slug — redirect to onboarding
    const slug = generateSlug(fullName);
    await createMasterProfileAfterSignup({
      userId: user.id,
      fullName,
      email,
      slug,
      categories: [],
      referredBy,
    });
    return NextResponse.redirect(`${origin}/onboarding/profile`);
  } else {
    // Client: create minimal profile
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await admin.from('profiles').upsert(
      { id: user.id, role: 'client', full_name: fullName, email },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    return NextResponse.redirect(`${origin}/my/bookings`);
  }
}
