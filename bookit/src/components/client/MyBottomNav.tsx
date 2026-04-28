'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, Gift, User, Search, LogIn, Bell } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { NavLoginSheet } from '@/components/public/NavLoginSheet';

// ── Client portal nav (/my/* — always authenticated) ─────────────────────────
const MY_NAV = [
  { href: '/my/bookings',       icon: CalendarDays, label: 'Записи'      },
  { href: '/my/masters',        icon: Users,        label: 'Майстри'     },
  { href: '/my/loyalty',        icon: Gift,         label: 'Бонуси'      },
  { href: '/my/notifications',  icon: Bell,         label: 'Сповіщення'  },
  { href: '/my/profile',        icon: User,         label: 'Профіль'     },
];

// ── Public nav – authenticated ────────────────────────────────────────────────
const PUBLIC_AUTH_NAV = [
  { href: '/explore',     icon: Search,       label: 'Каталог' },
  { href: '/my/bookings', icon: CalendarDays, label: 'Записи'  },
  { href: '/my/profile',  icon: User,         label: 'Профіль' },
];

function isPublicB2CRoute(pathname: string): boolean {
  if (pathname.startsWith('/my') || pathname.startsWith('/dashboard')) return false;
  if (pathname === '/' || pathname === '/studio/join') return false;
  const excluded = ['/login', '/register', '/auth', '/invite', '/legal'];
  if (excluded.some(p => pathname.startsWith(p))) return false;
  return true;
}

interface Props {
  initialIsAuth?: boolean;
}

export function MyBottomNav({ initialIsAuth }: Props) {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(initialIsAuth ?? false);
  const [loginOpen, setLoginOpen] = useState(false);

  const isMyRoute = pathname.startsWith('/my');
  const isPublic = isPublicB2CRoute(pathname);

  // Subscribe to auth changes only on public B2C routes
  // (/my is protected by B2CRouteGuard; dashboard has its own auth)
  useEffect(() => {
    if (!isPublic) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setIsAuth(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setIsAuth(!!session?.user);
      if (session?.user) setLoginOpen(false);
    });
    return () => subscription.unsubscribe();
  }, [isPublic]);

  if (!isMyRoute && !isPublic) return null;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none md:hidden"
        aria-label="Навігація"
      >
        <div
          className="bg-white/45 backdrop-blur-3xl border-t border-white/40 shadow-[0_-8px_32px_rgba(44,26,20,0.12)] flex items-center justify-around pt-2 pointer-events-auto"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
        >

          {/* /my/* — full client portal nav */}
          {isMyRoute && MY_NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-0 flex-1 transition-all duration-150',
                  active ? 'text-[#789A99]' : 'text-[#A8928D]',
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium truncate">{label}</span>
              </Link>
            );
          })}

          {/* Public — authenticated */}
          {!isMyRoute && isAuth && PUBLIC_AUTH_NAV.map(({ href, icon: Icon, label }) => {
            const active = href === '/explore'
              ? pathname.startsWith('/explore')
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-0 flex-1 transition-all duration-150',
                  active ? 'text-[#789A99]' : 'text-[#A8928D]',
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium truncate">{label}</span>
              </Link>
            );
          })}

          {/* Public — guest */}
          {!isMyRoute && !isAuth && (
            <>
              <Link
                href="/explore"
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-0 flex-1 transition-all duration-150',
                  pathname.startsWith('/explore') ? 'text-[#789A99]' : 'text-[#A8928D]',
                )}
              >
                <Search size={22} strokeWidth={pathname.startsWith('/explore') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Каталог</span>
              </Link>
              <button
                onClick={() => setLoginOpen(true)}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-0 flex-1 text-[#A8928D] transition-all duration-150"
              >
                <LogIn size={22} strokeWidth={2} />
                <span className="text-[10px] font-medium">Увійти</span>
              </button>
            </>
          )}

        </div>
      </nav>

      <NavLoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
