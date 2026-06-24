'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { Zap, Sparkles, Users, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash',      Icon: Zap        },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',     Icon: Sparkles   },
  { href: '/dashboard/clients',                   label: 'Клієнти',    Icon: Users      },
  { href: '/dashboard/analytics',                 label: 'Аналітика',  Icon: TrendingUp },
] as const;

const DIVIDER = 'color-mix(in srgb, var(--accent-on) 10%, transparent)';
// Pop-with-overshoot via pure CSS transition (bouncy ease). Press driven by
// pointer state, NOT framer whileTap — framer's gesture captures the first tap
// on touch and the click is lost (two-tap bug). Plain onClick always fires.
const PRESS_EASE = 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)';
// Hold navigation briefly so the release pop reads before the route changes.
const REDIRECT_DELAY = 160;

interface TileProps {
  href: string;
  label: string;
  Icon: React.ElementType;
  isLeft: boolean;
  isTop: boolean;
  reduce: boolean;
  onGo: (href: string) => void;
}

function QuickTile({ href, label, Icon, isLeft, isTop, reduce, onGo }: TileProps) {
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);

  return (
    <button
      type="button"
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={() => onGo(href)}
      className="flex h-[72px] w-full border-0 bg-transparent p-0 cursor-pointer appearance-none active:bg-white/5 transition-colors duration-150"
      style={{
        borderRight:  isLeft ? `1px solid ${DIVIDER}` : undefined,
        borderBottom: isTop  ? `1px solid ${DIVIDER}` : undefined,
      }}
    >
      <span
        className="flex-1 flex flex-col items-center justify-center gap-1.5"
        style={{
          transform: pressed && !reduce ? 'scale(0.92)' : 'scale(1)',
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
    </button>
  );
}

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
        {ACTIONS.map(({ href, label, Icon }, i) => (
          <QuickTile
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            isLeft={i % 2 === 0}
            isTop={i < 2}
            reduce={!!reduce}
            onGo={go}
          />
        ))}
      </div>
    </div>
  );
}
