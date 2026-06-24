'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash',      Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',     Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',    Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',  Icon: TrendingUp },
] as const;

const DIVIDER = 'color-mix(in srgb, var(--accent-on) 10%, transparent)';
// Press feedback via pointer state + CSS transform (NOT framer whileTap — that
// captures the first tap on touch). Navigation stays on the native <Link> click,
// so it fires first-tap and Link auto-prefetches the route (no cold heavy nav).
const PRESS_EASE = 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)';

interface TileProps {
  href: string;
  label: string;
  Icon: React.ElementType;
  isLeft: boolean;
  isTop: boolean;
  reduce: boolean;
}

function QuickTile({ href, label, Icon, isLeft, isTop, reduce }: TileProps) {
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);

  return (
    <Link
      href={href}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className="flex h-[72px] active:bg-white/5 transition-colors duration-150"
      style={{
        borderRight:  isLeft ? `1px solid ${DIVIDER}` : undefined,
        borderBottom: isTop  ? `1px solid ${DIVIDER}` : undefined,
      }}
    >
      <span
        className="flex-1 flex flex-col items-center justify-center gap-1.5"
        style={{
          transform: pressed && !reduce ? 'scale(0.95)' : 'scale(1)',
          transition: reduce ? undefined : PRESS_EASE,
        }}
      >
        <span
          style={{
            display: 'flex',
            transform: pressed && !reduce ? 'translateY(-2px)' : 'translateY(0)',
            transition: reduce ? undefined : PRESS_EASE,
          }}
        >
          <Icon size={20} strokeWidth={1.6} style={{ color: 'var(--accent-on)' }} />
        </span>
        <span
          className="text-[11px] font-semibold tracking-[0.04em]"
          style={{ color: 'color-mix(in srgb, var(--accent-on) 70%, transparent)' }}
        >
          {label}
        </span>
      </span>
    </Link>
  );
}

export function QuickActionsWidget() {
  const reduce = useReducedMotion();

  return (
    <div
      className="rounded-[var(--card-radius)] overflow-hidden"
      style={{ background: 'var(--hero-card-bg)' }}
    >
      <div className="grid grid-cols-2">
        {ACTIONS.map(({ href, label, Icon }, i) => (
          <QuickTile
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            isLeft={i % 2 === 0}
            isTop={i < 2}
            reduce={!!reduce}
          />
        ))}
      </div>
    </div>
  );
}
