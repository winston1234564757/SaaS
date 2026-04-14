import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Server Actions мають заголовок Next-Action — не чіпаємо їх
  if (request.headers.has('next-action')) {
    return NextResponse.next({ request });
  }

  // Clone request headers so we can forward x-pathname to server layouts
  const requestHeaders = new Headers(request.headers);
  const { pathname } = request.nextUrl;
  requestHeaders.set('x-pathname', pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated request: clear role cache cookies to prevent stale role
  // leaking into the next authenticated session in the same browser profile.
  if (!user) {
    supabaseResponse.cookies.set('user_role', '', { path: '/', maxAge: 0 });
    supabaseResponse.cookies.set('user_role_uid', '', { path: '/', maxAge: 0 });
  }

  const needsRoleCheck =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/my') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register';

  if (user && needsRoleCheck) {
    // Role is cached in a cookie to avoid a DB hit on every navigation.
    // IMPORTANT: We always re-fetch from DB if the cookie is absent to prevent
    // stale role leaks (e.g. a master cookie persisting into a new client session).
    const cachedRole = request.cookies.get('user_role')?.value ?? null;
    const cachedRoleUid = request.cookies.get('user_role_uid')?.value ?? null;
    // Reuse cached role only if it belongs to the same authenticated user.
    let role = cachedRoleUid === user.id ? cachedRole : null;

    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role ?? null;
      if (role) {
        supabaseResponse.cookies.set('user_role', role, {
          path: '/', maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: true, sameSite: 'lax',
        });
        supabaseResponse.cookies.set('user_role_uid', user.id, {
          path: '/', maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: true, sameSite: 'lax',
        });
      }
    }

    // /dashboard — masters only. If role is null (profile not yet created by trigger),
    // allow pass-through rather than redirect looping — the layout will handle it.
    if (pathname.startsWith('/dashboard') && role !== null && role !== 'master') {
      return NextResponse.redirect(new URL('/my/bookings', request.url));
    }

    // /my — clients only. Masters with view_mode=client cookie can pass through.
    // If role is null, treat as client (new user, profile may not exist yet).
    if (pathname.startsWith('/my') && role === 'master') {
      const viewMode = request.cookies.get('view_mode')?.value;
      if (viewMode !== 'client') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Guest-only pages — redirect authenticated users to their home.
    // Skip if role is null (race: profile not yet created) to avoid redirect loops.
    if (role && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
      if (role === 'master') {
        const intendedPlan = request.cookies.get('intended_plan')?.value;
        if (intendedPlan === 'pro' || intendedPlan === 'studio') {
          const res = NextResponse.redirect(new URL(`/dashboard/billing?plan=${intendedPlan}`, request.url));
          res.cookies.set('intended_plan', '', { path: '/', maxAge: 0 });
          return res;
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/my/bookings', request.url));
    }
  }

  // Unauthenticated access to protected routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/my') || pathname === '/onboarding')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|sw\\.js|manifest\\.json|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
