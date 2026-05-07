'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Users, Settings,
  X, BarChart2, Scissors, ShoppingBag, Wallet,
  GalleryVerticalEnd, Rocket, Sparkles, MessageSquare,
  Building2, CreditCard, HelpCircle, Scale, Zap, TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useMasterContext } from '@/lib/supabase/context';

/* ─── Nav bar items ─────────────────────────────── */
const BAR_ITEMS = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Огляд'   },
  { href: '/dashboard/bookings',  icon: CalendarDays,    label: 'Записи'  },
  { href: '/dashboard/clients',   icon: Users,           label: 'Клієнти' },
  { href: '/dashboard/settings',  icon: Settings,        label: 'Профіль' },
];

/* ─── Hub sections ───────────────────────────────── */
const OPERATIONS = [
  { href: '/dashboard/analytics',  icon: BarChart2,           label: 'Аналітика',   desc: 'Виручка, топ-послуги'      },
  { href: '/dashboard/bookings',   icon: CalendarDays,        label: 'Всі записи',  desc: 'Пошук, статуси, CSV'       },
  { href: '/dashboard/services',   icon: Scissors,            label: 'Послуги',     desc: 'Каталог та ціни'           },
  { href: '/dashboard/products',   icon: ShoppingBag,         label: 'Магазин',     desc: 'Товари та замовлення'      },
  { href: '/dashboard/clients',    icon: Users,               label: 'CRM',         desc: 'База клієнтів та VIP'      },
  { href: '/dashboard/portfolio',  icon: GalleryVerticalEnd,  label: 'Портфоліо',   desc: 'Кейси та фотогалерея'      },
];

const MARKETING = [
  { href: '/dashboard/marketing',  icon: Sparkles,     label: 'Маркетинг',     desc: 'Сторіс та розсилки'  },
  { href: '/dashboard/revenue',    icon: Wallet,        label: 'Дохід',         desc: 'Флеш-акції та ціни'  },
  { href: '/dashboard/growth',     icon: Rocket,        label: 'Ріст',          desc: 'Лояльність, реферали' },
  { href: '/dashboard/reviews',    icon: MessageSquare, label: 'Відгуки',       desc: 'Керування фідбеком'  },
];

const SYSTEM = [
  { href: '/dashboard/billing',    icon: CreditCard,  label: 'Тариф'    },
  { href: '/dashboard/studio',     icon: Building2,   label: 'Студія'   },
  { href: '/dashboard/support',    icon: HelpCircle,  label: 'Підтримка'},
  { href: '/dashboard/documents',  icon: Scale,       label: 'Документи'},
];

/* ─── Animations ─────────────────────────────────── */
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden:  { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28, staggerChildren: 0.04 } as const,
  },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 28 } as const,
  },
};

/* ─── Sub-components ─────────────────────────────── */

function NavBar({
  pathname,
  todayPending,
  isOpen,
  onToggle,
}: {
  pathname: string;
  todayPending: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isSecondary = pathname.startsWith('/dashboard/') && !BAR_ITEMS.some(i => i.href === pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[75] px-4 pb-safe pb-4 pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto">
        <motion.div
          layout
          className="mobile-nav-bar rounded-[28px] px-2 py-2 flex items-center justify-between"
        >
          {/* Left pair */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {BAR_ITEMS.slice(0, 2).map(item => (
              <NavItem key={item.href} {...item} pathname={pathname} pending={item.href === '/dashboard/bookings' ? todayPending : 0} />
            ))}
          </div>

          {/* Center FAB */}
          <div className="relative -top-3 mx-2">
            <motion.button
              onClick={onToggle}
              whileTap={{ scale: 0.90 }}
              className={cn(
                'w-[58px] h-[58px] rounded-[20px] flex items-center justify-center transition-all duration-400 shadow-xl relative overflow-hidden',
                isOpen
                  ? 'bg-[var(--text-primary)]'
                  : isSecondary
                  ? 'bg-[var(--accent)]'
                  : 'bg-[var(--accent)] shadow-[0_8px_24px_rgba(0,0,0,0.2)]'
              )}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div key="x" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                    <X size={24} style={{ color: 'var(--accent-on)' }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="flex flex-col gap-[4px] items-center"
                  >
                    <div className="flex gap-[4px]">
                      <div className="w-[5px] h-[5px] rounded-full bg-white/90" />
                      <div className="w-[5px] h-[5px] rounded-full bg-white/90" />
                    </div>
                    <div className="flex gap-[4px]">
                      <div className="w-[5px] h-[5px] rounded-full bg-white/60" />
                      <div className="w-[5px] h-[5px] rounded-full bg-white/60" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Right pair */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {BAR_ITEMS.slice(2, 4).map(item => (
              <NavItem key={item.href} {...item} pathname={pathname} pending={0} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  pathname,
  pending,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  pathname: string;
  pending: number;
}) {
  const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 active:scale-90',
        isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
      )}
    >
      <div className="relative">
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        {pending > 0 && (
          <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[var(--warning)] text-white text-[9px] font-bold flex items-center justify-center">
            {pending > 9 ? '9+' : pending}
          </span>
        )}
      </div>
      <span className={cn('text-[10px] font-semibold', isActive ? 'opacity-100' : 'opacity-40')}>
        {label}
      </span>
    </Link>
  );
}

function HubSection({ title, align = 'left', children }: { title: string; align?: 'left' | 'right' | 'center'; children: React.ReactNode }) {
  return (
    <motion.section variants={itemVariants} className="mb-10">
      <h3
        className={cn(
          'text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50',
          align === 'right' && 'text-right',
          align === 'center' && 'text-center'
        )}
        style={{ color: 'var(--accent)' }}
      >
        {title}
      </h3>
      {children}
    </motion.section>
  );
}

function OperationTile({
  href,
  icon: Icon,
  label,
  desc,
  pathname,
  delay,
}: {
  href: string;
  icon: typeof BarChart2;
  label: string;
  desc: string;
  pathname: string;
  delay: number;
}) {
  const isActive = pathname.startsWith(href);
  return (
    <motion.div variants={itemVariants}>
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 rounded-[var(--card-radius)] border transition-all active:scale-95',
          isActive
            ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-on)]'
            : 'bg-[var(--surface)] border-[var(--border-strong)] hover:border-[var(--accent)]'
        )}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isActive ? 'bg-[var(--accent-on)]/15' : 'bg-[var(--accent-soft)]'
          )}
        >
          <Icon size={18} style={{ color: isActive ? 'var(--accent-on)' : 'var(--accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-none mb-0.5"
            style={{ color: isActive ? 'var(--accent-on)' : 'var(--text-primary)' }}
          >
            {label}
          </p>
          <p
            className="text-xs leading-tight truncate"
            style={{ color: isActive ? 'var(--accent-on)/70' : 'var(--text-tertiary)' }}
          >
            {desc}
          </p>
        </div>
        <ExternalLink size={13} style={{ color: isActive ? 'var(--accent-on)' : 'var(--text-tertiary)', opacity: 0.5 }} />
      </Link>
    </motion.div>
  );
}

function SystemPill({
  href,
  icon: Icon,
  label,
  pathname,
}: {
  href: string;
  icon: typeof CreditCard;
  label: string;
  pathname: string;
}) {
  const isActive = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-[var(--btn-radius)] border text-sm font-medium transition-all active:scale-95',
        isActive
          ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-on)]'
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
      )}
    >
      <Icon size={15} />
      {label}
    </Link>
  );
}

/* ─── Main Export ────────────────────────────────── */
export function MobileHub() {
  const pathname = usePathname();
  const { todayPending } = useDashboardStats();
  const { masterProfile } = useMasterContext();
  const [isOpen, setIsOpen] = useState(false);

  /* Close on navigation */
  useEffect(() => { setIsOpen(false); }, [pathname]);

  /* Lock scroll when hub open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const tier = masterProfile?.subscription_tier ?? 'starter';

  return (
    <>
      {/* ── Bottom Navigation Bar ── */}
      <NavBar
        pathname={pathname}
        todayPending={todayPending}
        isOpen={isOpen}
        onToggle={() => setIsOpen(v => !v)}
      />

      {/* ── Hub Overlay ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="hub"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] hub-overlay overflow-y-auto scrollbar-hide"
          >
            {/* Subtle top gradient */}
            <div
              className="fixed inset-x-0 top-0 h-40 pointer-events-none z-0"
              style={{ background: 'linear-gradient(to bottom, var(--accent-soft), transparent)' }}
            />

            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="relative z-10 max-w-lg mx-auto px-5 pt-10 pb-40"
            >
              {/* Header */}
              <motion.div variants={itemVariants} className="mb-10">
                <div className="flex items-center justify-between mb-1">
                  <div
                    className="text-[10px] font-black uppercase tracking-[0.3em]"
                    style={{ color: 'var(--accent)' }}
                  >
                    bookit
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-full"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {tier === 'pro' ? 'Pro' : tier === 'studio' ? 'Studio' : 'Starter'}
                  </span>
                </div>
                <h2
                  className="text-4xl font-bold leading-tight tracking-tight"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-playfair, serif)' }}
                >
                  Твій кабінет.
                </h2>
                <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: 'var(--accent)' }} />
              </motion.div>

              {/* Operations */}
              <HubSection title="Операції">
                <div className="flex flex-col gap-2">
                  {OPERATIONS.map((item) => (
                    <OperationTile key={item.href} {...item} pathname={pathname} delay={0} />
                  ))}
                </div>
              </HubSection>

              {/* Marketing */}
              <HubSection title="Маркетинг" align="right">
                <div className="flex flex-col gap-2">
                  {MARKETING.map((item) => (
                    <OperationTile key={item.href} {...item} pathname={pathname} delay={0} />
                  ))}
                </div>
              </HubSection>

              {/* System */}
              <HubSection title="Система" align="center">
                <div className="grid grid-cols-2 gap-2">
                  {SYSTEM.map((item) => (
                    <motion.div key={item.href} variants={itemVariants}>
                      <SystemPill {...item} pathname={pathname} />
                    </motion.div>
                  ))}
                </div>
              </HubSection>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
