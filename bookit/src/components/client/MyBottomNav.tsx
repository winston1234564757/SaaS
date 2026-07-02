'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, MessageCircle, User, Search, LogIn, Bell, ShoppingBag, Gift, Home, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { NavLoginSheet } from '@/components/public/NavLoginSheet';
import { useUnreadDMCount } from '@/lib/hooks/useUnreadDMCount';
import { useActiveCart } from '@/components/public/shop/useActiveCart';
import { NavSpeedDial, type SpeedDialAction } from './NavSpeedDial';

const SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const;

function isPublicB2CRoute(pathname: string): boolean {
  if (pathname.startsWith('/my') || pathname.startsWith('/dashboard')) return false;
  if (pathname === '/' || pathname === '/studio/join') return false;
  const excluded = ['/login', '/register', '/auth', '/invite', '/legal'];
  if (excluded.some((p) => pathname.startsWith(p))) return false;
  return true;
}

interface NavItemProps {
  href?: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

/** A single quiet nav slot. Owns its shared active-pill via layoutId. */
function NavItem({ href, icon: Icon, label, active = false, badge = 0, onClick }: NavItemProps) {
  const tone = active ? 'text-foreground' : 'text-muted-foreground/50';
  const inner = (
    <>
      {active && (
        <motion.div
          layoutId="client-nav-active"
          className="absolute inset-0 rounded-xl"
          style={{ background: 'color-mix(in srgb, var(--foreground) 8%, transparent)' }}
          transition={SPRING}
        />
      )}
      <div className="relative z-10">
        <Icon size={22} strokeWidth={active ? 2.5 : 2} className={tone} />
        {badge > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold leading-none text-accent-foreground">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className={`relative z-10 truncate text-[10px] font-medium transition-colors duration-150 ${tone}`}>
        {label}
      </span>
    </>
  );

  const cls = 'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2.5 py-1.5';
  return href ? (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

interface Props {
  initialIsAuth?: boolean;
}

export function MyBottomNav({ initialIsAuth }: Props) {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(initialIsAuth ?? false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const isMyRoute = pathname.startsWith('/my');
  const isPublic = isPublicB2CRoute(pathname);
  // Full-screen chat surfaces (DM thread, support chat) own the whole viewport
  // via ChatShell; the fixed bottom nav would sit on top of the composer.
  const isFullscreenChat =
    pathname === '/my/support/chat' || /^\/my\/messages\/[^/]+$/.test(pathname);

  const unreadDM = useUnreadDMCount(userId);
  const cart = useActiveCart();
  const onShopRoute = /\/shop(\/|$)/.test(pathname);
  const showCart = !!cart && !onShopRoute;

  useEffect(() => {
    if (!isMyRoute) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => setUserId(user?.id ?? null));
  }, [isMyRoute]);

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

  if (isFullscreenChat) return null;
  if (!isMyRoute && !isPublic) return null;

  function isActive(href: string): boolean {
    if (href === '/explore') return pathname.startsWith('/explore');
    return pathname.startsWith(href);
  }

  // /my: Каталог is a permanent slot; the dial holds Бонуси + Сповіщення.
  const myDialActions: SpeedDialAction[] = [
    { key: 'loyalty', label: 'Бонуси', icon: Gift, href: '/my/loyalty' },
    { key: 'notifications', label: 'Сповіщення', icon: Bell, href: '/my/notifications' },
  ];
  // public: Каталог stays the prominent discovery action in the dial.
  const publicDialActions: SpeedDialAction[] = [
    { key: 'explore', label: 'Каталог', icon: Search, href: '/explore' },
    { key: 'notifications', label: 'Сповіщення', icon: Bell, href: '/my/notifications' },
  ];

  return (
    <>
      <nav
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label="Навігація"
      >
        {/* Floating cart pill — above the bar, never steals a slot. */}
        <AnimatePresence>
          {showCart && cart && (
            <motion.div
              className="pointer-events-auto absolute bottom-full right-4 mb-3"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
              transition={SPRING}
            >
              <Link
                href={`/${cart.slug}/shop`}
                aria-label={`Кошик: ${cart.count} товарів`}
                className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-accent-foreground shadow-xl"
              >
                <div className="relative">
                  <ShoppingBag size={18} strokeWidth={2.5} />
                  <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-background px-0.5 text-[8px] font-bold leading-none tabular-nums text-foreground">
                    {cart.count > 9 ? '9+' : cart.count}
                  </span>
                </div>
                <span className="text-xs font-semibold">Кошик</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-auto flex items-center justify-around border-t border-border bg-secondary/45 pt-1.5 shadow-lg backdrop-blur-3xl pb-[max(env(safe-area-inset-bottom),12px)]">

          {/* ── /my (authed): Записи | Бонуси | [FAB] | Чат | Профіль ── */}
          {isMyRoute && (
            <LayoutGroup id="client-nav">
              <NavItem href="/my/bookings" icon={CalendarDays} label="Записи" active={isActive('/my/bookings')} />
              <NavItem href="/explore" icon={Search} label="Каталог" active={isActive('/explore')} />
              <NavSpeedDial actions={myDialActions} />
              <NavItem href="/my/messages" icon={MessageCircle} label="Чат" active={isActive('/my/messages')} badge={unreadDM} />
              <NavItem href="/my/profile" icon={User} label="Профіль" active={isActive('/my/profile')} />
            </LayoutGroup>
          )}

          {/* ── public authed: Записи | [FAB] | Профіль ── */}
          {!isMyRoute && isPublic && isAuth && (
            <LayoutGroup id="public-nav">
              <NavItem href="/my/bookings" icon={CalendarDays} label="Записи" active={isActive('/my/bookings')} />
              <NavSpeedDial actions={publicDialActions} />
              <NavItem href="/my/profile" icon={User} label="Профіль" active={isActive('/my/profile')} />
            </LayoutGroup>
          )}

          {/* ── public guest: Головна | [FAB Каталог] | Увійти ── */}
          {!isMyRoute && isPublic && !isAuth && (
            <>
              <NavItem href="/" icon={Home} label="Головна" active={pathname === '/'} />
              <NavSpeedDial direct={{ key: 'explore', label: 'Каталог', icon: Search, href: '/explore' }} />
              <NavItem icon={LogIn} label="Увійти" onClick={() => setLoginOpen(true)} />
            </>
          )}

        </div>
      </nav>

      <NavLoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
