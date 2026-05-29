'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  BarChart2, GalleryVerticalEnd, Settings, ChevronDown, User,
  Sparkles, ShoppingBag, Wallet, MessageSquare, Rocket, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useMasterContext } from '@/lib/supabase/context';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { NotificationsBell } from '@/components/master/dashboard/NotificationsBell';

const PRIMARY_NAV = [
  { href: '/dashboard',            icon: LayoutDashboard,    label: 'Огляд'     },
  { href: '/dashboard/bookings',   icon: CalendarDays,       label: 'Записи'    },
  { href: '/dashboard/analytics',  icon: BarChart2,          label: 'Аналітика' },
  { href: '/dashboard/clients',    icon: Users,              label: 'CRM'       },
  { href: '/dashboard/services',   icon: Scissors,           label: 'Послуги'   },
];

const ACTIVITY = [
  { href: '/dashboard/products',   icon: ShoppingBag,         label: 'Магазин'   },
  { href: '/dashboard/portfolio',  icon: GalleryVerticalEnd, label: 'Портфоліо' },
];

const GROWTH = [
  { href: '/dashboard/marketing',  icon: Sparkles,           label: 'Маркетинг' },
  { href: '/dashboard/revenue',    icon: Wallet,              label: 'Дохід'     },
  { href: '/dashboard/growth',     icon: Rocket,              label: 'Ріст'      },
  { href: '/dashboard/reviews',    icon: MessageSquare,       label: 'Відгуки'   },
];

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', studio: 'Studio',
};

function ProfileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, masterProfile } = useMasterContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onClose]);

  const tier  = masterProfile?.subscription_tier ?? 'starter';
  const name  = masterProfile?.business_name || profile?.full_name || 'Кабінет';
  const hasEmoji = !!masterProfile?.avatar_emoji;
  const emoji = masterProfile?.avatar_emoji;
  const src   = profile?.avatar_url ?? null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{   opacity: 0, y: -6,  scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="absolute right-0 top-full mt-2 w-52 z-50 overflow-hidden"
          style={{
            borderRadius: 'var(--card-radius)',
            background: 'var(--surface)',
            backdropFilter: 'blur(24px)',
            border: '0.5px solid var(--border-strong)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          }}
        >
          {/* Profile header */}
          <div className="p-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center text-base shrink-0"
                style={{ background: 'var(--accent-light)' }}
              >
                {src
                  ? <Image src={src} alt={name} width={40} height={40} className="object-cover w-full h-full" />
                  : hasEmoji 
                    ? <span className="text-xl">{emoji}</span>
                    : <User size={20} className="text-accent" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  {TIER_LABELS[tier] ?? tier}
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="p-1.5">
            {[
              { href: '/dashboard/settings', icon: Settings,  label: 'Налаштування'   },
              { href: '/dashboard/billing',  icon: BarChart2, label: 'Тариф та оплата' },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


export function DashboardTopBar() {
  const pathname  = usePathname();
  const { todayPending } = useDashboardStats();
  const { profile, masterProfile } = useMasterContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<'none' | 'activity' | 'growth'>('none');
  const topbarRef = useRef<HTMLDivElement>(null);

  const name  = masterProfile?.business_name || profile?.full_name || '';
  const hasEmoji = !!masterProfile?.avatar_emoji;
  const emoji = masterProfile?.avatar_emoji;
  const src   = profile?.avatar_url ?? null;

  // Close sub-menu on navigation
  useEffect(() => {
    setActiveGroup('none');
  }, [pathname]);

  // Click outside to close sub-menu
  useEffect(() => {
    if (activeGroup === 'none') return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target as Node)) {
        setActiveGroup('none');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeGroup]);

  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-7xl px-0 pointer-events-none">
      <div 
        ref={topbarRef}
        className={cn(
          "w-full flex items-center gap-2 h-16 px-6 rounded-[32px] transition-all duration-300 pointer-events-auto",
          "bg-secondary/80 backdrop-blur-3xl border border-border shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        )}
      >
        {/* Logo */}
        <Link href="/dashboard" className="shrink-0 flex items-center gap-1 mr-4">
          <span className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            bookit
          </span>
          <span className="text-[20px] font-bold" style={{ color: 'var(--accent)' }}>.</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center flex-1 ml-4 h-full relative overflow-hidden">
          <AnimatePresence mode="popLayout">
            {activeGroup === 'none' ? (
              <motion.div
                key="main-nav"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="flex items-center gap-2 w-full"
              >
                {PRIMARY_NAV.map(({ href, icon: Icon, label }) => {
                  const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
                  const badge = href === '/dashboard/bookings' && todayPending > 0;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[14px] font-semibold transition-all active:scale-95 shrink-0 relative',
                        active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-secondary/60'
                      )}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                      {badge && (
                        <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-[var(--warning)] text-white text-[9px] flex items-center justify-center font-bold shadow-sm">
                          {todayPending}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="w-px h-6 bg-border/30 mx-1 shrink-0" />

                <button
                  onClick={() => setActiveGroup('activity')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl text-[14px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0",
                    pathname.startsWith('/dashboard/products') || pathname.startsWith('/dashboard/portfolio')
                      ? "bg-secondary/40 text-[var(--text-primary)] border border-[var(--accent-light)] shadow-[0_0_12px_var(--accent-light)]"
                      : "text-[var(--text-secondary)] hover:bg-secondary/60 border border-transparent"
                  )}
                >
                  <span>Діяльність</span>
                  <ChevronDown size={14} className="opacity-50" />
                </button>

                <button
                  onClick={() => setActiveGroup('growth')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl text-[14px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0",
                    pathname.startsWith('/dashboard/marketing') || pathname.startsWith('/dashboard/revenue') || pathname.startsWith('/dashboard/growth') || pathname.startsWith('/dashboard/reviews')
                      ? "bg-secondary/40 text-[var(--text-primary)] border border-[var(--accent-light)] shadow-[0_0_12px_var(--accent-light)]"
                      : "text-[var(--text-secondary)] hover:bg-secondary/60 border border-transparent"
                  )}
                >
                  <span>Розвиток</span>
                  <ChevronDown size={14} className="opacity-50" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="sub-nav"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="flex items-center gap-3 w-full"
              >
                {/* Back button */}
                <button
                  onClick={() => setActiveGroup('none')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-[0.9] transition-all cursor-pointer shrink-0"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>

                <div className="w-px h-6 bg-border/30 mx-1 shrink-0" />

                {/* Submenu category indicator */}
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent/60 mr-2 shrink-0">
                  {activeGroup === 'activity' ? 'Діяльність' : 'Розвиток'}
                </span>

                {/* Submenu items list */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                  {(activeGroup === 'activity' ? ACTIVITY : GROWTH).map(({ href, icon: Icon, label }) => {
                    const active = pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          'flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[14px] font-semibold transition-all active:scale-95 shrink-0 relative',
                          active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-secondary/60'
                        )}
                      >
                        <Icon size={16} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Notifications */}
          <NotificationsBell />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-deep)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-sm shrink-0"
                style={{ background: 'var(--accent-light)' }}
              >
                {src
                  ? <Image src={src} alt={name} width={28} height={28} className="object-cover w-full h-full" />
                  : hasEmoji
                    ? <span className="text-[15px] leading-none">{emoji}</span>
                    : <User size={14} className="text-accent" />}
              </div>
              <span
                className="hidden xl:block text-[14px] font-medium max-w-[180px] truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {name}
              </span>
              <ChevronDown
                size={12}
                className={cn('transition-transform duration-200', menuOpen && 'rotate-180')}
                style={{ color: 'var(--text-tertiary)' }}
              />
            </button>
            <ProfileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      </div>
    </header>
  );
}
