'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  BarChart2, GalleryVerticalEnd, Bell, Settings, ChevronDown, User,
  Sparkles, ShoppingBag, Wallet, MessageSquare, Rocket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useMasterContext } from '@/lib/supabase/context';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useNotifications } from '@/lib/supabase/hooks/useNotifications';

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

function NavGroup({ label, items, pathname, todayPending }: { 
  label: string; items: any[]; pathname: string; todayPending: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = items.some(item => pathname.startsWith(item.href));

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl text-[14px] font-semibold transition-all active:scale-95",
          isActive ? "bg-[var(--accent)] text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-white/60"
        )}
      >
        <span>{label}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 8,  scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute left-0 top-full mt-3 w-56 z-[110] overflow-hidden p-1.5"
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
            }}
          >
            {items.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              const badge = href === '/dashboard/bookings' && todayPending > 0;
              
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95",
                    active ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-white/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} strokeWidth={2} />
                    {label}
                  </div>
                  {badge && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-[var(--warning)] text-white text-[9px] flex items-center justify-center font-bold">
                      {todayPending}
                    </span>
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DashboardTopBar() {
  const pathname  = usePathname();
  const { todayPending } = useDashboardStats();
  const { profile, masterProfile } = useMasterContext();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const name  = masterProfile?.business_name || profile?.full_name || '';
  const hasEmoji = !!masterProfile?.avatar_emoji;
  const emoji = masterProfile?.avatar_emoji;
  const src   = profile?.avatar_url ?? null;

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-7xl px-0 pointer-events-none">
      <div 
        className={cn(
          "w-full flex items-center gap-2 h-16 px-6 rounded-[32px] transition-all duration-300 pointer-events-auto",
          "bg-white/80 backdrop-blur-3xl border border-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
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
        <nav className="hidden lg:flex items-center gap-2 flex-1 ml-4">
          {PRIMARY_NAV.map(({ href, icon: Icon, label }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[14px] font-semibold transition-all active:scale-95 shrink-0',
                  active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-white/60'
                )}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="w-px h-6 bg-white/20 mx-1 shrink-0" />

          {/* Group: Activity */}
          <NavGroup 
            label="Діяльність" 
            items={ACTIVITY} 
            pathname={pathname} 
            todayPending={0} 
          />

          {/* Group: Growth */}
          <NavGroup 
            label="Розвиток" 
            items={GROWTH} 
            pathname={pathname} 
            todayPending={0} 
          />
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Notifications */}
          <Link
            href="/dashboard"
            className="relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 bg-white/60 border border-white/40 shadow-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            <Bell size={20} strokeWidth={2} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

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
