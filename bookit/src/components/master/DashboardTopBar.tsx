'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  BarChart2, GalleryVerticalEnd, Bell, Settings, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useMasterContext } from '@/lib/supabase/context';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useNotifications } from '@/lib/supabase/hooks/useNotifications';

const NAV_ITEMS = [
  { href: '/dashboard',            icon: LayoutDashboard,    label: 'Огляд'     },
  { href: '/dashboard/bookings',   icon: CalendarDays,       label: 'Записи'    },
  { href: '/dashboard/clients',    icon: Users,              label: 'Клієнти'   },
  { href: '/dashboard/services',   icon: Scissors,           label: 'Послуги'   },
  { href: '/dashboard/analytics',  icon: BarChart2,          label: 'Аналітика' },
  { href: '/dashboard/portfolio',  icon: GalleryVerticalEnd, label: 'Портфоліо' },
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
  const emoji = masterProfile?.avatar_emoji ?? '💅';
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
                  : <span>{emoji}</span>}
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
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const name  = masterProfile?.business_name || profile?.full_name || '';
  const emoji = masterProfile?.avatar_emoji ?? '💅';
  const src   = profile?.avatar_url ?? null;

  return (
    <header className="dashboard-topbar w-full px-4 lg:px-8">
      <div className="max-w-[1400px] mx-auto w-full flex items-center gap-4 h-full">

        {/* Logo */}
        <Link href="/dashboard" className="shrink-0 flex items-center gap-0.5 mr-2">
          <span className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            bookit
          </span>
          <span className="text-[18px] font-bold" style={{ color: 'var(--accent)' }}>.</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href);
            const badge = href === '/dashboard/bookings' && todayPending > 0;

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200',
                  active
                    ? 'text-white'
                    : 'hover:bg-[var(--background-deep)]'
                )}
                style={active
                  ? { background: 'var(--accent)', color: 'white' }
                  : { color: 'var(--text-secondary)' }
                }
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
                {badge && !active && (
                  <span
                    className="min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                    style={{ background: 'var(--warning)', color: '#fff' }}
                  >
                    {todayPending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Notifications */}
          <Link
            href="/dashboard"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-deep)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Bell size={17} strokeWidth={1.8} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
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
                  : <span className="text-[15px] leading-none">{emoji}</span>}
              </div>
              <span
                className="hidden xl:block text-[13px] font-medium max-w-[96px] truncate"
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
