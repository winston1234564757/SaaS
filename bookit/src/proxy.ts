import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Server Actions мають заголовок Next-Action — не чіпаємо їх
  if (request.headers.has('next-action')) {
    return NextResponse.next({ request });
  }

  // Clone request headers so we can forward x-pathname to server layouts
  const requestHeaders = new Headers(request.headers);
  const { pathname } = request.nextUrl;
  requestHeaders.set('x-pathname', pathname);

  // 1. FAST PATH: Skip everything for public assets and static paths
  if (
    pathname.includes('.') ||
    pathname.startsWith('/api/telegram/webhook') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 2. CHECK SESSION COOKIE: Minimal check WITHOUT network calls
  const hasSession = request.cookies.getAll().some(c => c.name.includes('-auth-token'));

  if (!hasSession) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/my') || pathname === '/onboarding') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    supabaseResponse.headers.set('x-is-auth', 'false');
    return supabaseResponse;
  }

  // 3. GET ROLE: Try cookie first (Zero-Network path)
  let role = request.cookies.get('user_role')?.value ?? null;
  const roleUid = request.cookies.get('user_role_uid')?.value ?? null;

  // If session exists but role is missing in cookies, we MUST fetch it once from DB
  // to initialize the role-based routing and cache it in a cookie.
  if (!role) {
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
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
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        const userRole = profile.role as string;
        const isProduction = process.env.NODE_ENV === 'production';
        supabaseResponse.cookies.set('user_role', userRole, {
          path: '/', maxAge: 60 * 60 * 24, httpOnly: true, sameSite: 'lax', secure: isProduction,
        });
        supabaseResponse.cookies.set('user_role_uid', user.id, {
          path: '/', maxAge: 60 * 60 * 24, httpOnly: true, sameSite: 'lax', secure: isProduction,
        });
      }
    }
  }
  if (pathname.startsWith('/dashboard') && role !== null && role !== 'master') {
    return NextResponse.redirect(new URL('/my/bookings', request.url));
  }

  // my — clients only (unless in master client-mode)
  if (pathname.startsWith('/my') && role === 'master') {
    const viewMode = request.cookies.get('view_mode')?.value;
    if (viewMode !== 'client') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Guest pages logic
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

  // Set auth status header for layout to avoid duplicate DB hits
  supabaseResponse.headers.set('x-is-auth', 'true');
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|sw\\.js|manifest\\.json|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
