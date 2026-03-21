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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? null;

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
      return NextResponse.redirect(
        new URL(role === 'master' ? '/dashboard' : '/my/bookings', request.url)
      );
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
