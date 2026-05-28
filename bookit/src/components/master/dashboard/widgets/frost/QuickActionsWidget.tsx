'use client';

import Link from 'next/link';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash',      Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',     Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',    Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',  Icon: TrendingUp },
] as const;

export function QuickActionsWidget() {
  return (
    <div
      className="rounded-[var(--card-radius)] overflow-hidden"
      style={{ background: 'var(--hero-card-bg)' }}
    >
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 gap-2">
          {ACTIONS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 h-14 px-4 rounded-[16px] active:scale-[0.97] hover:opacity-90 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1"
              style={{ background: 'var(--accent)' }}
            >
              <span style={{ color: 'var(--accent-on)', display: 'flex' }}>
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--accent-on)' }}
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
