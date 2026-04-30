'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, Bell, LayoutDashboard, CalendarDays, Users, Scissors, 
  ImagePlay, MoreHorizontal, Settings, HelpCircle, CreditCard, 
  Wallet, Rocket, MessageSquare, Building2, GalleryVerticalEnd, ShoppingBag, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useMasterContext } from '@/lib/supabase/context';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';

const NAV_ITEMS = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Головна' },
  { href: '/dashboard/bookings',  icon: CalendarDays,    label: 'Записи' },
  { href: '/dashboard/clients',   icon: Users,           label: 'Клієнти' },
  { href: '/dashboard/services',  icon: Scissors,        label: 'Послуги' },
  { href: '/dashboard/marketing',  icon: ImagePlay,       label: 'Маркетинг' },
];

const MORE_ITEMS = [
  { href: '/dashboard/products',   icon: ShoppingBag,     label: 'Магазин' },
  { href: '/dashboard/analytics', icon: BarChart2,        label: 'Аналітика' },
  { href: '/dashboard/portfolio', icon: GalleryVerticalEnd, label: 'Портфоліо' },
  { href: '/dashboard/revenue',    icon: Wallet,          label: 'Дохід' },
  { href: '/dashboard/growth',     icon: Rocket,          label: 'Ріст' },
  { href: '/dashboard/reviews',    icon: MessageSquare,   label: 'Відгуки' },
  { href: '/dashboard/studio',     icon: Building2,       label: 'Студія' },
  { href: '/dashboard/billing',    icon: CreditCard,      label: 'Тариф' },
  { href: '/dashboard/settings',   icon: Settings,        label: 'Налаштування' },
];

export function DesktopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, masterProfile } = useMasterContext();
  const { todayPending } = useDashboardStats();
  const [showMore, setShowMore] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const displayName = masterProfile?.business_name || profile?.full_name || 'Майстер';
  const avatarEmoji = masterProfile?.avatar_emoji ?? '💅';
  const avatarUrl   = profile?.avatar_url ?? null;

  // Global Search Shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#FFE8DC]/60 backdrop-blur-xl border-b border-white/40">
      <div className="max-w-[1440px] mx-auto px-6 h-18 flex items-center gap-8">
        
        {/* Logo */}
        <Link href="/dashboard" className="shrink-0 group">
          <span className="heading-serif text-2xl text-foreground transition-transform group-active:scale-95 block">
            Bookit<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Primary Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            const showBadge = href === '/dashboard/bookings' && todayPending > 0;
            
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all active:scale-95",
                  isActive ? "bg-white/80 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40 hover:text-foreground"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#FFE8DC]">
                    {todayPending}
                  </span>
                )}
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all active:scale-95",
                showMore ? "bg-white/80 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40 hover:text-foreground"
              )}
            >
              <MoreHorizontal size={18} />
              <span>Більше</span>
            </button>

            <AnimatePresence>
              {showMore && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/50 p-2 z-50 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {MORE_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMore(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                        >
                          <item.icon size={16} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-md relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors">
            <Search size={18} />
          </div>
          <input
            id="global-search"
            type="text"
            placeholder="Швидкий пошук (Cmd + K)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-white/40 border border-white/60 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none focus:bg-white/80 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/40 text-muted-foreground hover:bg-white/80 hover:text-foreground transition-all active:scale-95">
            <Bell size={20} />
          </button>
          
          <Link href="/dashboard/settings" className="flex items-center gap-3 pl-3 py-1.5 pr-1.5 rounded-2xl bg-white/40 hover:bg-white/80 transition-all active:scale-95 group">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-foreground leading-tight">{displayName}</span>
              <span className="text-[10px] text-muted-foreground/60">Налаштування</span>
            </div>
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-peach/60 text-sm border border-white/40 shadow-sm group-hover:shadow-md transition-all">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                avatarEmoji
              )}
            </div>
          </Link>
        </div>

      </div>
    </header>
  );
}
