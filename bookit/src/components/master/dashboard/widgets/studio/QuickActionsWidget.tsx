'use client';

import Link from 'next/link';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash',    Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',   Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',  Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналіт.',  Icon: TrendingUp },
] as const;

export function QuickActionsWidget() {
  return (
    <div
      className="rounded-[var(--card-radius)] overflow-hidden"
      style={{ background: 'rgba(8,20,24,0.95)' }}
    >
      <div className="px-5 py-5">
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
          style={{ color: 'var(--accent)', opacity: 0.7 }}
        >
          Швидкі дії
        </p>

        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-2 py-5 rounded-[12px] active:scale-[0.95] transition-transform duration-100 cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border:     '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ color: 'var(--accent)' }}>
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <span
                className="font-mono text-[11px] font-bold tracking-[0.06em] text-center leading-tight"
                style={{ color: 'var(--text-secondary)' }}
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
