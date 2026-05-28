'use client';

import Link from 'next/link';
import {
  Zap, Sparkles, Users, TrendingUp,
  User, Gift,
} from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                      label: 'Flash Sale',  Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots',  label: 'Сторіс',      Icon: Sparkles   },
  { href: '/dashboard/clients',                    label: 'Клієнти',     Icon: Users      },
  { href: '/dashboard/analytics',                  label: 'Аналітика',   Icon: TrendingUp },
  { href: '/my/profile',                           label: 'Профіль',     Icon: User       },
  { href: '/dashboard/referral',                   label: 'Реферал',     Icon: Gift       },
] as const;

export function QuickActionsWidget() {
  return (
    <div
      className="rounded-[var(--card-radius)] overflow-hidden relative glow-warm"
      style={{ background: 'var(--hero-card-bg)' }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      />

      <div className="p-5">
        <p
          className="heading-serif text-[14px] tracking-[0.12em] uppercase mb-4"
          style={{ color: 'var(--accent-on)', opacity: 0.42 }}
        >
          Швидкі дії
        </p>

        <div className="grid grid-cols-3 gap-1.5">
          {ACTIONS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col items-center gap-2 py-3 px-2 rounded-[14px] overflow-hidden cursor-pointer transition-transform duration-150 active:scale-[0.95]"
              style={{ background: 'color-mix(in srgb, var(--accent-on) 10%, transparent)' }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                style={{ background: 'color-mix(in srgb, var(--accent-on) 8%, transparent)' }}
              />
              <span
                className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--accent-on) 18%, transparent)' }}
              >
                <span style={{ color: 'var(--accent-on)' }}>
                  <Icon size={17} strokeWidth={1.5} />
                </span>
              </span>
              <span
                className="relative z-10 text-[12px] font-medium text-center leading-tight"
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
