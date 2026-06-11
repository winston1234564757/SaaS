'use client';

import Link from 'next/link';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash',      Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',     Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',    Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',  Icon: TrendingUp },
] as const;

const DIVIDER = 'color-mix(in srgb, var(--accent-on) 10%, transparent)';

export function QuickActionsWidget() {
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
              className="flex flex-col items-center justify-center gap-1.5 h-[72px] active:bg-white/5 transition-colors duration-150"
              style={{
                borderRight:  isLeft ? `1px solid ${DIVIDER}` : undefined,
                borderBottom: isTop  ? `1px solid ${DIVIDER}` : undefined,
              }}
            >
              <Icon size={20} strokeWidth={1.6} style={{ color: 'var(--accent-on)' }} />
              <span
                className="text-[11px] font-semibold tracking-[0.04em]"
                style={{ color: 'color-mix(in srgb, var(--accent-on) 70%, transparent)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
