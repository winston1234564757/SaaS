import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Server Actions мають заголовок Next-Action — не чіпаємо їх
  if (request.headers.has('next-action')) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const needsRoleCheck =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/my') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register';

  if (user && needsRoleCheck) {
    // Role is immutable after onboarding — cache in cookie to avoid a DB hit on every navigation.
    // Cookie is set on first visit and cleared on sign-out.
    let role = request.cookies.get('user_role')?.value ?? null;

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
      }
    }

    // /dashboard — masters only
    if (pathname.startsWith('/dashboard') && role !== 'master') {
      return NextResponse.redirect(new URL('/my/bookings', request.url));
    }

    // /my — clients only (masters with view_mode=client cookie can pass through)
    if (pathname.startsWith('/my') && role === 'master') {
      const viewMode = request.cookies.get('view_mode')?.value;
      if (viewMode !== 'client') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Guest-only pages — redirect to home
    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
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

  // Expose pathname to server layouts via request header
  supabaseResponse.headers.set('x-pathname', pathname);

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|sw\\.js|manifest\\.json|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
