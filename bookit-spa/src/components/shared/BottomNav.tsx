import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, BarChart2, MoreHorizontal,
  Scissors, Zap, TrendingUp, Gift,
  MessageSquare, Share2, Building2, CreditCard, Settings, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { motion, AnimatePresence } from 'framer-motion';

const PRIMARY = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Головна' },
  { href: '/dashboard/bookings', icon: CalendarDays,    label: 'Записи'  },
  { href: '/dashboard/clients',  icon: Users,           label: 'Клієнти' },
  { href: '/dashboard/analytics',icon: BarChart2,       label: 'Аналітика' },
];

const MORE_ITEMS = [
  { href: '/dashboard/services',  icon: Scissors,       label: 'Послуги'        },
  { href: '/dashboard/flash',     icon: Zap,            label: 'Флеш-акції'    },
  { href: '/dashboard/pricing',   icon: TrendingUp,     label: 'Ціноутворення' },
  { href: '/dashboard/loyalty',   icon: Gift,           label: 'Лояльність'    },
  { href: '/dashboard/reviews',   icon: MessageSquare,  label: 'Відгуки'       },
  { href: '/dashboard/referral',  icon: Share2,         label: 'Запроси друга' },
  { href: '/dashboard/studio',    icon: Building2,      label: 'Студія',       soon: true },
  { href: '/dashboard/billing',   icon: CreditCard,     label: 'Тариф'         },
  { href: '/dashboard/settings',  icon: Settings,       label: 'Налаштування'  },
];

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { todayPending } = useDashboardStats();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href));

  return (
    <>
      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-safe-bottom pb-2">
        <div className="bento-card flex items-center justify-around py-1.5">
          {PRIMARY.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            const showBadge = href === '/dashboard/bookings' && todayPending > 0;
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl flex-1 transition-all duration-150',
                  isActive ? 'text-[#789A99]' : 'text-[#A8928D]'
                )}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4935A] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {todayPending > 9 ? '9+' : todayPending}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl flex-1 transition-all duration-150',
              isMoreActive || moreOpen ? 'text-[#789A99]' : 'text-[#A8928D]'
            )}
          >
            <MoreHorizontal size={22} strokeWidth={isMoreActive || moreOpen ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Ще</span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] overflow-hidden"
              style={{
                background: 'rgba(255,248,244,0.97)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 -8px 40px rgba(44,26,20,0.14)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-[#D4C5BE]" />
              </div>

              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-bold text-[#2C1A14]">Розділи</p>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[#F5E8E3] flex items-center justify-center text-[#A8928D]"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 px-3 pb-10 pb-safe-bottom">
                {MORE_ITEMS.map(({ href, icon: Icon, label, soon }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      to={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all',
                        isActive
                          ? 'bg-[#789A99]/12 text-[#5C7E7D]'
                          : 'text-[#6B5750] active:bg-[#F5E8E3]'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center relative',
                        isActive ? 'bg-[#789A99]/15' : 'bg-[#F5E8E3]'
                      )}>
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        {soon && (
                          <span className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-[#789A99] px-1 py-px rounded-full leading-none">
                            Скоро
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
