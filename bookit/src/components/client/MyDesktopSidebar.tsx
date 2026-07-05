'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CalendarDays, Search, MessageCircle, Gift, Bell, User, LifeBuoy, LogOut, ArrowRight, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useUnreadDMCount } from '@/lib/hooks/useUnreadDMCount';
import { useClientNotifications } from '@/lib/supabase/hooks/useClientNotifications';
import { pluralUk } from '@/lib/utils/pluralUk';
import { cn } from '@/lib/utils/cn';

const SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const;

/** Full-screen chat surfaces own the whole viewport — no shell there. */
function isFullscreenChat(p: string): boolean {
  return p === '/my/support/chat' || /^\/my\/messages\/[^/]+$/.test(p);
}

/** Where the client desktop shell (sidebar) shows. Mirrors the server gate in root layout. */
function isClientShellRoute(p: string): boolean {
  if (isFullscreenChat(p)) return false;
  if (p.startsWith('/my')) return true;
  if (p === '/explore' || p.startsWith('/explore')) return true;
  if (/^\/[^/]+\/shop(\/|$)/.test(p)) return true; // client shop under /[slug]/shop
  return false;
}

interface NavDest {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

export function MyDesktopSidebar({ initialIsAuth }: { initialIsAuth?: boolean }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const [isAuth, setIsAuth] = useState(initialIsAuth ?? false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [rewardsReady, setRewardsReady] = useState(0);

  const onRoute = isClientShellRoute(pathname);
  const show = isAuth && onRoute;
  // Gate the realtime hooks off non-client routes by nulling the id.
  const activeUserId = show ? userId : null;

  const unreadDM = useUnreadDMCount(activeUserId);
  const { unreadCount: notifUnread } = useClientNotifications(activeUserId);

  // Auth — one listener for the app lifetime (shell is mounted in the root layout).
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      setUserId(user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: string, session: Session | null) => {
      setIsAuth(!!session?.user);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Identity + rewards-ready loyalty signal — only when the shell is visible.
  // Rewards ready = active loyalty programs where the client's visits with that
  // master already reached the target. Real, live signal (unlike the dead
  // `loyalty_points` column, which is never incremented).
  useEffect(() => {
    if (!show || !userId) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const [profRes, relRes] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single(),
        supabase.from('client_master_relations').select('master_id, total_visits').eq('client_id', userId),
      ]);
      if (cancelled) return;
      const prof = profRes.data as { full_name?: string | null; avatar_url?: string | null } | null;
      setName(prof?.full_name ?? '');
      setAvatarUrl(prof?.avatar_url ?? null);

      const rels = (relRes.data ?? []) as { master_id: string; total_visits: number | null }[];
      const masterIds = rels.map((r) => r.master_id);
      let ready = 0;
      if (masterIds.length > 0) {
        const { data: progs } = await supabase
          .from('loyalty_programs')
          .select('master_id, target_visits')
          .in('master_id', masterIds)
          .eq('is_active', true);
        const visitsByMaster = new Map(rels.map((r) => [r.master_id, r.total_visits ?? 0]));
        ready = ((progs ?? []) as { master_id: string; target_visits: number }[])
          .filter((p) => (visitsByMaster.get(p.master_id) ?? 0) >= p.target_visits).length;
      }
      if (!cancelled) setRewardsReady(ready);
    })();
    return () => { cancelled = true; };
  }, [show, userId]);

  if (!show) return null;

  const dests: NavDest[] = [
    { href: '/my/bookings',      icon: CalendarDays,  label: 'Записи' },
    { href: '/explore',          icon: Search,        label: 'Каталог' },
    { href: '/my/messages',      icon: MessageCircle, label: 'Чат',        badge: unreadDM },
    { href: '/my/loyalty',       icon: Gift,          label: 'Бонуси' },
    { href: '/my/notifications', icon: Bell,          label: 'Сповіщення', badge: notifUnread },
    { href: '/my/profile',       icon: User,          label: 'Профіль' },
  ];

  const isActive = (href: string): boolean =>
    href === '/explore' ? pathname.startsWith('/explore') : pathname.startsWith(href);

  const displayName = name.trim() || 'Клієнт';
  const hasRewards = rewardsReady > 0;
  const rewardsLabel = `${rewardsReady} ${pluralUk(rewardsReady, 'нагорода готова', 'нагороди готові', 'нагород готові')}`;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'user_role=; path=/; max-age=0';
    window.location.href = '/login';
  }

  return (
    <aside
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[264px] flex-col border-r border-border bg-secondary/45 backdrop-blur-2xl px-4 pt-[max(env(safe-area-inset-top),22px)] pb-5 shadow-[1px_0_24px_-12px_rgba(15,23,42,0.18)]"
      aria-label="Навігація кабінету"
    >
      {/* Wordmark — same serif identity as the public navbar */}
      <Link
        href="/my/bookings"
        className="heading-serif self-start px-2 py-1 text-[20px] leading-none text-foreground rounded-lg hover:bg-secondary/50 transition-colors select-none"
      >
        Bookit<span className="text-primary">.</span>
      </Link>

      {/* Identity */}
      <div className="mt-5 flex items-center gap-3 px-1">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <div className="size-11 rounded-full bg-primary/15 text-primary ring-1 ring-border flex items-center justify-center heading-serif text-xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="heading-serif text-[17px] leading-tight text-foreground truncate">{displayName}</p>
          {hasRewards ? (
            <p className="text-xs font-medium text-accent mt-0.5 truncate">{rewardsLabel}</p>
          ) : (
            <Link
              href="/my/loyalty"
              className="group mt-0.5 inline-flex items-center gap-1 text-xs text-text-sub hover:text-foreground transition-colors"
            >
              Переглянути бонуси
              <ArrowRight size={11} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Primary navigation */}
      <nav className="mt-7 flex flex-col gap-1" aria-label="Основне меню">
        {dests.map(({ href, icon: Icon, label, badge = 0 }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150',
                active ? 'font-semibold text-foreground' : 'font-medium text-text-sub hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : 'desk-nav-active'}
                  className="absolute inset-0 -z-10 rounded-xl"
                  style={{
                    background: 'color-mix(in srgb, var(--foreground) 11%, transparent)',
                    boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--foreground) 8%, transparent)',
                  }}
                  transition={SPRING}
                />
              )}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold leading-none text-accent-foreground tabular-nums">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-border/60 pt-3">
        <Link
          href="/my/support/chat"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-sub hover:text-foreground transition-colors duration-150"
        >
          <LifeBuoy size={18} strokeWidth={2} className="flex-shrink-0" />
          <span className="flex-1 truncate">Підтримка</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-sub hover:text-destructive transition-colors duration-150"
        >
          <LogOut size={18} strokeWidth={2} className="flex-shrink-0" />
          <span className="flex-1 truncate text-left">Вийти</span>
        </button>
      </div>
    </aside>
  );
}
