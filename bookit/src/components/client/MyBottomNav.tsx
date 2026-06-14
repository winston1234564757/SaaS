'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Gift, User, Search, LogIn, Bell } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { NavLoginSheet } from '@/components/public/NavLoginSheet';

const SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const;

const MY_NAV = [
  { href: '/my/bookings',       icon: CalendarDays, label: 'Записи'      },
  { href: '/explore',           icon: Search,       label: 'Каталог'     },
  { href: '/my/loyalty',        icon: Gift,         label: 'Бонуси'      },
  { href: '/my/notifications',  icon: Bell,         label: 'Сповіщення'  },
  { href: '/my/profile',        icon: User,         label: 'Профіль'     },
];

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

  function isActive(href: string): boolean {
    if (href === '/explore') return pathname.startsWith('/explore');
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none md:hidden"
        aria-label="Навігація"
      >
        <div className="bg-secondary/45 backdrop-blur-3xl border-t border-border flex items-center justify-around pt-1.5 pointer-events-auto shadow-lg pb-[max(env(safe-area-inset-bottom),12px)]">

          {isMyRoute && (
            <LayoutGroup id="client-nav">
              {MY_NAV.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className="relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 min-w-0 flex-1"
                  >
                    {active && (
                      <motion.div
                        layoutId="client-nav-active"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'color-mix(in srgb, var(--foreground) 8%, transparent)' }}
                        transition={SPRING}
                      />
                    )}
                    <div className="relative z-10">
                      <Icon
                        size={22}
                        strokeWidth={active ? 2.5 : 2}
                        className={active ? 'text-foreground' : 'text-muted-foreground/50'}
                      />
                    </div>
                    <span className={`relative z-10 text-[10px] font-medium truncate transition-colors duration-150 ${
                      active ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </LayoutGroup>
          )}

          {!isMyRoute && isAuth && PUBLIC_AUTH_NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 min-w-0 flex-1"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className={`transition-colors duration-150 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}
                />
                <span className={`text-[10px] font-medium truncate transition-colors duration-150 ${
                  active ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {!isMyRoute && !isAuth && (
            <>
              <Link
                href="/explore"
                aria-current={pathname.startsWith('/explore') ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 min-w-0 flex-1"
              >
                <Search
                  size={22}
                  strokeWidth={2}
                  className={`transition-colors duration-150 ${pathname.startsWith('/explore') ? 'text-foreground' : 'text-muted-foreground/50'}`}
                />
                <span className={`text-[10px] font-medium transition-colors duration-150 ${
                  pathname.startsWith('/explore') ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  Каталог
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 min-w-0 flex-1 text-muted-foreground/50"
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
