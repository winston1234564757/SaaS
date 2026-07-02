'use client';

import { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, type LucideIcon } from 'lucide-react';

// One motion language across the app: reuse the QuickActions tap-pop so the
// nav FAB presses with the same weighty overshoot the dashboard tiles use.
const TAP_POP = { type: 'spring', stiffness: 520, damping: 16, mass: 0.8 } as const;
const DIAL_SPRING = { type: 'spring', stiffness: 420, damping: 28 } as const;

export interface SpeedDialAction {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

interface NavSpeedDialProps {
  /** Dial mode: FAB toggles a spring-out column of these actions. */
  actions?: SpeedDialAction[];
  /** Direct mode: FAB is a single prominent action (no dial). Wins over `actions`. */
  direct?: SpeedDialAction;
  /** aria-label for the trigger in dial mode. */
  label?: string;
}

function NavSpeedDialImpl({ actions = [], direct, label = 'Швидкі дії' }: NavSpeedDialProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // Any navigation closes the dial.
  useEffect(() => { setOpen(false); }, [pathname]);

  // ── Direct mode: FAB is one bold link, no dial ──────────────────────────
  if (direct) {
    const Icon = direct.icon;
    return (
      <div className="relative flex flex-1 items-center justify-center">
        <motion.div whileTap={{ scale: 0.9 }} transition={TAP_POP} className="relative z-50 -mt-8">
          <Link
            href={direct.href ?? '#'}
            aria-label={direct.label}
            className="flex size-14 items-center justify-center rounded-full shadow-xl"
            style={{ background: 'var(--hero-card-bg)', color: 'var(--accent-on)' }}
          >
            <Icon size={26} strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Dial mode ───────────────────────────────────────────────────────────
  const close = () => setOpen(false);

  return (
    <div className="relative flex flex-1 items-center justify-center">
      {/* Scrim: dims the page above the bar, tap anywhere to close. */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Закрити меню"
            onClick={close}
            className="fixed inset-0 z-40 bg-foreground/5 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>

      {/* Actions spring up from the FAB, nearest-first. mb clears the raised FAB. */}
      <div className="absolute bottom-full left-1/2 z-50 mb-16 flex -translate-x-1/2 flex-col items-center gap-3">
        <AnimatePresence>
          {open &&
            actions.map((action, i) => {
              const Icon = action.icon;
              const delay = reduce ? 0 : (actions.length - 1 - i) * 0.045;
              const motionProps = {
                initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.85 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.85 },
                transition: reduce ? { duration: 0.12 } : { ...DIAL_SPRING, delay },
              };
              const inner = (
                <>
                  <span className="relative flex size-12 items-center justify-center rounded-full border border-border bg-background shadow-lg">
                    <Icon size={22} strokeWidth={2} className="text-foreground" />
                    {!!action.badge && action.badge > 0 && (
                      <span className="pointer-events-none absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold leading-none text-accent-foreground">
                        {action.badge > 9 ? '9+' : action.badge}
                      </span>
                    )}
                  </span>
                  <span className="whitespace-nowrap text-[10px] font-medium text-foreground">{action.label}</span>
                </>
              );
              return action.href ? (
                <motion.div key={action.key} {...motionProps}>
                  <Link
                    href={action.href}
                    onClick={close}
                    aria-label={action.label}
                    className="flex flex-col items-center gap-1"
                  >
                    {inner}
                  </Link>
                </motion.div>
              ) : (
                <motion.button
                  key={action.key}
                  type="button"
                  onClick={() => { action.onClick?.(); close(); }}
                  aria-label={action.label}
                  className="flex flex-col items-center gap-1"
                  {...motionProps}
                >
                  {inner}
                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>

      {/* FAB trigger: Plus rotates to a close glyph while open. */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        whileTap={{ scale: 0.9 }}
        transition={TAP_POP}
        className="relative z-50 -mt-8 flex size-14 items-center justify-center rounded-full shadow-xl"
        style={{ background: 'var(--hero-card-bg)', color: 'var(--accent-on)' }}
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={reduce ? { duration: 0 } : DIAL_SPRING}
          className="flex"
        >
          <Plus size={26} strokeWidth={2.5} />
        </motion.span>
      </motion.button>
    </div>
  );
}

export const NavSpeedDial = memo(NavSpeedDialImpl);
