'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Users, Settings,
  BarChart2, Scissors, ShoppingBag, Wallet,
  GalleryVerticalEnd, Rocket, Sparkles, MessageSquare,
  Building2, CreditCard, HelpCircle, Scale, X, Plus, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { motion, AnimatePresence } from 'framer-motion';

const PRIMARY_ITEMS = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Головна' },
  { href: '/dashboard/bookings', icon: CalendarDays,    label: 'Записи'  },
  { href: '/dashboard/clients',  icon: Users,           label: 'Клієнти' },
  { href: '/dashboard/settings', icon: Settings,        label: 'Профіль' },
];

export function BentoBottomNav() {
  const pathname = usePathname();
  const { todayPending } = useDashboardStats();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const isBentoActive = pathname.startsWith('/dashboard/') && !PRIMARY_ITEMS.some(i => i.href === pathname);

  return (
    <>
      {/* --- BOTTOM BAR --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-[75] px-4 pb-safe-bottom pb-4 pointer-events-none">
        <div className="mx-auto max-w-lg">
          <motion.div 
            layout
            className="bg-white/90 backdrop-blur-3xl border border-white/60 shadow-[0_15px_45px_rgba(44,26,20,0.2)] rounded-[32px] p-2 flex items-center justify-between pointer-events-auto relative"
          >
            <div className="flex items-center justify-around flex-1">
              {PRIMARY_ITEMS.slice(0, 2).map((item) => (
                <NavItem key={item.href} {...item} pathname={pathname} todayPending={todayPending} />
              ))}
            </div>

            <div className="px-2 relative -top-1.5">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "w-15 h-15 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-xl active:scale-90 relative overflow-hidden group",
                  isOpen 
                    ? "bg-text-main text-peach rotate-90" 
                    : isBentoActive 
                      ? "bg-sage text-white" 
                      : "bg-white text-text-main border-2 border-peach/15"
                )}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div key="close" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <X size={28} />
                    </motion.div>
                  ) : (
                    <motion.div key="hub" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
                      <ChevronUp size={22} className={cn("transition-transform duration-700", isBentoActive && "animate-bounce")} />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-[-2px]">Hub</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isOpen && isBentoActive && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-around flex-1">
              {PRIMARY_ITEMS.slice(2, 4).map((item) => (
                <NavItem key={item.href} {...item} pathname={pathname} />
              ))}
            </div>
          </motion.div>
        </div>
      </nav>

      {/* --- MOSAIC HUB --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[70] bg-gradient-to-br from-peach via-peach to-peach-deep backdrop-blur-3xl overflow-y-auto scrollbar-hide pt-16 pb-48 px-6"
          >
            <div className="max-w-xl mx-auto">
              <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <div className="flex items-center justify-between mb-2">
                  <Link 
                    href="/dashboard/changelog"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-xl active:scale-90 transition-all group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-main/80">v5.2.0 Vaul</span>
                    <ChevronUp size={10} className="rotate-90 opacity-40 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <span className="text-[10px] font-bold text-text-mute/40 uppercase tracking-widest">Квітень 2026</span>
                </div>
                <h2 className="font-display text-5xl text-text-main leading-tight mb-2">Все під контролем.</h2>
                <div className="w-16 h-1.5 bg-sage rounded-full" />
              </motion.header>

              {/* --- GROUP 1: OPERATIONS (Asymmetric Left) --- */}
              <section className="mb-14">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-sage mb-6 opacity-60">Операції</h3>
                <div className="grid grid-cols-5 grid-rows-3 gap-3.5 h-[420px]">
                  <BentoTile href="/dashboard/analytics" icon={BarChart2} label="Аналітика" size="2x2" className="row-span-2 col-span-3" pathname={pathname} delay={0.1} />
                  <BentoTile href="/dashboard/products" icon={ShoppingBag} label="Магазин" size="1x1" className="col-span-2" pathname={pathname} delay={0.2} />
                  <BentoTile href="/dashboard/revenue" icon={Wallet} label="Дохід" size="1x1" className="col-span-2" pathname={pathname} delay={0.3} />
                  <BentoTile href="/dashboard/services" icon={Scissors} label="Послуги" size="wide" className="col-span-5" pathname={pathname} delay={0.4} />
                </div>
              </section>

              {/* --- GROUP 2: MARKETING (Asymmetric Right) --- */}
              <section className="mb-14">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-sage mb-6 opacity-60 text-right">Маркетинг</h3>
                <div className="grid grid-cols-5 grid-rows-3 gap-3.5 h-[420px]">
                  <BentoTile href="/dashboard/marketing" icon={Sparkles} label="Маркетинг" size="1x1" className="col-span-2" pathname={pathname} delay={0.5} />
                  <BentoTile href="/dashboard/portfolio" icon={GalleryVerticalEnd} label="Портфоліо" size="2x2" className="row-span-2 col-span-3" pathname={pathname} delay={0.6} />
                  <BentoTile href="/dashboard/reviews" icon={MessageSquare} label="Відгуки" size="1x1" className="col-span-2" pathname={pathname} delay={0.7} />
                  <BentoTile href="/dashboard/growth" icon={Rocket} label="Ріст" size="wide" className="col-span-5" pathname={pathname} delay={0.8} />
                </div>
              </section>

              {/* --- GROUP 3: SYSTEM (Geometric Utility) --- */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-text-mute mb-6 text-center opacity-40">Система</h3>
                <div className="grid grid-cols-5 gap-3.5">
                  <BentoTile href="/dashboard/billing" icon={CreditCard} label="Тариф" size="wide" className="col-span-5" pathname={pathname} delay={0.9} />
                  <BentoTile href="/dashboard/studio" icon={Building2} label="Студія" size="1x1" className="col-span-3" pathname={pathname} delay={1.0} />
                  <BentoTile href="/dashboard/support" icon={HelpCircle} label="Підтримка" size="1x1" className="col-span-2" pathname={pathname} delay={1.1} />
                  <BentoTile href="/dashboard/documents" icon={Scale} label="Документи" size="wide" className="col-span-5" pathname={pathname} delay={1.2} />
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({ href, icon: Icon, label, pathname, todayPending }: any) {
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  const showBadge = href === '/dashboard/bookings' && todayPending > 0;

  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-1.5 py-2 px-1 transition-all duration-500 active:scale-90',
        isActive ? 'text-sage scale-110' : 'text-text-mute hover:text-text-sub'
      )}
    >
      <div className="relative">
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        {showBadge && (
          <span className="absolute -top-1.5 -right-2 w-5 h-5 rounded-full bg-warning border-2 border-white text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
            {todayPending > 9 ? '9+' : todayPending}
          </span>
        )}
      </div>
      <span className={cn("text-[10px] font-bold tracking-tight transition-all duration-500", isActive ? "opacity-100" : "opacity-40")}>
        {label}
      </span>
    </Link>
  );
}

function BentoTile({ href, icon: Icon, label, className, pathname, delay }: any) {
  const isActive = pathname.startsWith(href);
  const isWide = className.includes('col-span-4');

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 100, delay }}
      className={cn("relative group", className)}
    >
      <Link
        href={href}
        className={cn(
          "w-full h-full rounded-[32px] p-5 flex transition-all duration-500 active:scale-95 border relative overflow-hidden shadow-sm",
          isWide ? "flex-row items-center justify-center gap-4" : "flex-col justify-between",
          isActive 
            ? "bg-gradient-to-br from-sage via-sage to-sage-dark text-white border-white/30 shadow-xl shadow-sage/30" 
            : "bg-gradient-to-br from-white/95 via-white/80 to-peach/40 text-text-main border-white/60 hover:border-peach/60 shadow-[0_8px_20px_rgba(44,26,20,0.04)]"
        )}
      >
        {/* Decorative Inner Glow / Glass Reflection */}
        <div className={cn(
          "absolute inset-0 pointer-events-none opacity-50",
          isActive 
            ? "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent)]" 
            : "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent)]"
        )} />

        <div className={cn(
          "rounded-2xl flex items-center justify-center transition-all duration-700 relative z-10 flex-shrink-0",
          isWide ? "w-10 h-10" : "w-11 h-11",
          isActive 
            ? "bg-white/20 shadow-inner" 
            : "bg-gradient-to-br from-white to-peach/20 text-sage shadow-sm group-hover:scale-110"
        )}>
          <Icon size={isWide ? 22 : 24} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        
        <span className={cn(
          "font-bold tracking-tight leading-tight relative z-10",
          className.includes('row-span-2') ? "text-3xl" : "text-[15px]"
        )}>
          {label}
        </span>

        {isActive && (
          <motion.div 
            layoutId="glow" 
            className="absolute inset-0 bg-white/10 pointer-events-none z-0" 
            transition={{ duration: 0.8 }}
          />
        )}
      </Link>
    </motion.div>
  );
}


