'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar, Users, Scissors, BarChart2, Zap,
  Package, Star, Camera, Megaphone, Settings2,
  ArrowRight,
} from 'lucide-react';

type ActionDef = {
  href: string;
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number }>;
  accent: string;
  iconBg: string;
  col: string;
  row: string;
};

const ACTIONS: ActionDef[] = [
  {
    href: '/dashboard/bookings',
    label: 'Записи',
    description: 'Управління та статуси',
    Icon: Calendar,
    accent: 'var(--accent)',
    iconBg: 'var(--accent-light)',
    col: '1 / 3',
    row: '1',
  },
  {
    href: '/dashboard/clients',
    label: 'Клієнти',
    description: 'База та повторні візити',
    Icon: Users,
    accent: 'var(--info)',
    iconBg: 'rgba(80, 128, 160, 0.12)',
    col: '1',
    row: '2',
  },
  {
    href: '/dashboard/services',
    label: 'Послуги',
    description: 'Ціни і тривалість',
    Icon: Scissors,
    accent: 'var(--success)',
    iconBg: 'rgba(78, 152, 112, 0.12)',
    col: '2',
    row: '2',
  },
  {
    href: '/dashboard/analytics',
    label: 'Аналітика',
    description: 'Виручка та конверсія',
    Icon: BarChart2,
    accent: 'var(--warning)',
    iconBg: 'rgba(200, 120, 64, 0.12)',
    col: '1',
    row: '3 / 5',
  },
  {
    href: '/dashboard/flash',
    label: 'Flash-акції',
    description: 'Заповнення вільних слотів',
    Icon: Zap,
    accent: '#D3A376',
    iconBg: 'rgba(211, 163, 118, 0.15)',
    col: '2',
    row: '3',
  },
  {
    href: '/dashboard/products',
    label: 'Продукти',
    description: 'Товари та продажі',
    Icon: Package,
    accent: 'var(--text-secondary)',
    iconBg: 'rgba(106, 68, 82, 0.10)',
    col: '2',
    row: '4',
  },
  {
    href: '/dashboard/reviews',
    label: 'Відгуки',
    description: 'Репутація і рейтинг',
    Icon: Star,
    accent: 'var(--warning)',
    iconBg: 'rgba(200, 120, 64, 0.12)',
    col: '1 / 3',
    row: '5',
  },
  {
    href: '/dashboard/portfolio',
    label: 'Портфоліо',
    description: 'Фото та роботи',
    Icon: Camera,
    accent: 'var(--accent-dark)',
    iconBg: 'var(--accent-light)',
    col: '1',
    row: '6',
  },
  {
    href: '/dashboard/marketing',
    label: 'Маркетинг',
    description: 'Розсилки та залучення',
    Icon: Megaphone,
    accent: 'var(--accent)',
    iconBg: 'var(--accent-light)',
    col: '2',
    row: '6 / 8',
  },
  {
    href: '/dashboard/settings',
    label: 'Налаштування',
    description: 'Профіль і розклад',
    Icon: Settings2,
    accent: 'var(--text-tertiary)',
    iconBg: 'rgba(168, 128, 144, 0.12)',
    col: '1',
    row: '7',
  },
];

/* Icon container sizes by card type */
const ICON_SIZE = {
  wide: { container: 48, icon: 22 },
  tall: { container: 52, icon: 24 },
  half: { container: 38, icon: 17 },
};

function ActionTile({ item, index }: { item: ActionDef; index: number }) {
  const isTall = item.row.includes('/');
  const isWide = item.col.includes('/');
  const sz = isWide ? ICON_SIZE.wide : isTall ? ICON_SIZE.tall : ICON_SIZE.half;

  const IconBlock = (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{
        width: sz.container,
        height: sz.container,
        borderRadius: 14,
        background: item.iconBg,
      }}
    >
      <span style={{ color: item.accent }}>
        <item.Icon size={sz.icon} />
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: index * 0.06 }}
      style={{ gridColumn: item.col, gridRow: item.row }}
    >
      <Link href={item.href} className="block h-full">
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="h-full rounded-2xl overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border-strong)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
        >
          {isWide ? (
            /* ── Wide: icon left · label+desc center · arrow right ── */
            <div className="flex items-center gap-3.5 h-full px-4 py-3" style={{ minHeight: 82 }}>
              {IconBlock}
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {item.description}
                </p>
              </div>
              <span style={{ color: item.accent, opacity: 0.55, flexShrink: 0 }}>
                <ArrowRight size={15} />
              </span>
            </div>
          ) : isTall ? (
            /* ── Tall: icon top · label+desc · arrow bottom ── */
            <div className="flex flex-col h-full p-4 gap-3">
              {IconBlock}
              <div className="flex-1">
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: 'var(--text-primary)',
                    lineHeight: 1.25,
                  }}
                >
                  {item.label}
                </p>
                <p className="text-[11px] leading-relaxed mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  {item.description}
                </p>
              </div>
              <div className="flex items-center gap-1" style={{ color: item.accent }}>
                <span className="text-[11px] font-bold">Переглянути</span>
                <ArrowRight size={10} />
              </div>
            </div>
          ) : (
            /* ── Half-width: icon top · label below ── */
            <div className="flex flex-col items-start gap-2 h-full px-3.5 py-3" style={{ minHeight: 84 }}>
              {IconBlock}
              <p
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                  hyphens: 'none',
                }}
              >
                {item.label}
              </p>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function QuickActionsWidget() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 px-1">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.20em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Швидкий доступ
        </p>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        {ACTIONS.map((item, i) => (
          <ActionTile key={item.href} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}
