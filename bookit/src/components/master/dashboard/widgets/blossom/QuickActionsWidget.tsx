'use client';

import Link from 'next/link';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash Sale',  Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',      Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',     Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',   Icon: TrendingUp },
] as const;

export function QuickActionsWidget() {
  return (
    <div
      className="rounded-[var(--card-radius)] overflow-hidden relative"
      style={{ background: 'var(--hero-card-bg)' }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      />

      <div className="px-5 py-5">
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
          style={{ color: 'var(--accent-on)', opacity: 0.4 }}
        >
          Швидкі дії
        </p>

        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-[12px] active:scale-[0.95] transition-transform duration-100 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span style={{ color: 'var(--accent-on)', opacity: 0.9 }}>
                <Icon size={18} strokeWidth={1.5} />
              </span>
              <span
                className="font-service text-[13px] text-center leading-tight"
                style={{ color: 'var(--accent-on)', opacity: 0.85 }}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
