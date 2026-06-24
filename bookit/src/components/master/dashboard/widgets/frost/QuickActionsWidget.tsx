'use client';

import { useRouter } from 'next/navigation';
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
// whileTap lives on the button; these variants propagate to the inner content
// so only the content scales (box stays static → dividers/hero-bg intact).
const contentVariants = { rest: { scale: 1 }, tap: { scale: 0.92 } };
const iconVariants    = { rest: { y: 0 },     tap: { y: -2 } };
// Hold navigation briefly so the tap pop reads before the route changes.
const REDIRECT_DELAY = 160;

export function QuickActionsWidget() {
  const router = useRouter();
  const reduce = useReducedMotion();

  function go(href: string) {
    if (reduce) { router.push(href); return; }
    window.setTimeout(() => router.push(href), REDIRECT_DELAY);
  }

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
            <motion.button
              key={href}
              type="button"
              onClick={() => go(href)}
              initial="rest"
              animate="rest"
              whileTap={reduce ? undefined : 'tap'}
              className="flex h-[72px] w-full border-0 bg-transparent p-0 cursor-pointer appearance-none active:bg-white/5 transition-colors duration-150"
              style={{
                borderRight:  isLeft ? `1px solid ${DIVIDER}` : undefined,
                borderBottom: isTop  ? `1px solid ${DIVIDER}` : undefined,
              }}
            >
              <motion.span
                className="flex-1 flex flex-col items-center justify-center gap-1.5"
                variants={contentVariants}
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
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
