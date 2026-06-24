'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash',      Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',     Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',    Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',  Icon: TrendingUp },
] as const;

const DIVIDER = 'color-mix(in srgb, var(--accent-on) 10%, transparent)';

// Pop-with-overshoot: bouncy spring so release settles past 1.0 (~1.03) then back.
const POP = { type: 'spring' as const, stiffness: 520, damping: 16, mass: 0.8 };
const contentVariants = { rest: { scale: 1 },   tap: { scale: 0.92 } };
const iconVariants    = { rest: { y: 0 },        tap: { y: -2 } };

export function QuickActionsWidget() {
  const reduce = useReducedMotion();

  return (
    <div
      className="rounded-[var(--card-radius)] overflow-hidden"
      style={{ background: 'var(--hero-card-bg)' }}
    >
      <div className="grid grid-cols-2">
        {ACTIONS.map(({ href, label, Icon }, i) => {
          const isLeft = i % 2 === 0;
          const isTop  = i < 2;
          return (
            <Link
              key={href}
              href={href}
              className="flex h-[72px] active:bg-white/5 transition-colors duration-150"
              style={{
                borderRight:  isLeft ? `1px solid ${DIVIDER}` : undefined,
                borderBottom: isTop  ? `1px solid ${DIVIDER}` : undefined,
              }}
            >
              <motion.span
                className="flex-1 flex flex-col items-center justify-center gap-1.5"
                variants={contentVariants}
                initial="rest"
                animate="rest"
                whileTap={reduce ? undefined : 'tap'}
                transition={POP}
              >
                <motion.span variants={iconVariants} transition={POP} style={{ display: 'flex' }}>
                  <Icon size={20} strokeWidth={1.6} style={{ color: 'var(--accent-on)' }} />
                </motion.span>
                <span
                  className="text-[11px] font-semibold tracking-[0.04em]"
                  style={{ color: 'color-mix(in srgb, var(--accent-on) 70%, transparent)' }}
                >
                  {label}
                </span>
              </motion.span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
