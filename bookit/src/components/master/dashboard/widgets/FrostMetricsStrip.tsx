'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import Link from 'next/link';

function fmtRevenue(hrn: number): string {
  if (hrn >= 1000) {
    const k = hrn / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k ₴`;
  }
  return `${hrn} ₴`;
}

function fmtPct(n: number, d: number) {
  if (!d) return '—';
  return `${Math.round((n / d) * 100)}%`;
}

function AnimatedCount({ target, loaded }: { target: number; loaded: boolean }) {
  const [display, setDisplay] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!loaded || animatedRef.current) return;
    animatedRef.current = true;

    if (target === 0) { setDisplay(0); return; }

    const duration = 950;
    const start = performance.now();
    let rafId: number;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) rafId = requestAnimationFrame(tick);
      else setDisplay(target);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, loaded]);

  return <>{display}</>;
}

interface TickerItemDef {
  label: string;
  value: string;
  rawCount?: number;
  href: string;
}

const SEP = (
  <span
    aria-hidden
    style={{
      display: 'inline-block',
      width: 20,
      height: 1,
      background: 'var(--border)',
      flexShrink: 0,
      marginLeft: 12,
      marginRight: -12,
      verticalAlign: 'middle',
    }}
  />
);

const DOT = (
  <span
    aria-hidden
    style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', opacity: 0.3, flexShrink: 0, display: 'inline-block' }}
  />
);

const TICKER_DURATION = 28;

export function FrostMetricsStrip() {
  const {
    todayCount,
    todayRevenue,
    todayConfirmed,
    todayPending,
    weekClients,
    weekNewClients,
    monthCompleted,
    isLoading,
  } = useDashboardStats();

  const loaded = !isLoading;
  const convRate = fmtPct(weekNewClients, weekClients);

  const items: TickerItemDef[] = [
    { label: 'Записів сьогодні',    value: isLoading ? '—' : String(todayCount),      rawCount: isLoading ? undefined : todayCount,      href: '/dashboard/bookings'  },
    { label: 'Виручка',             value: isLoading ? '—' : fmtRevenue(todayRevenue),                                                    href: '/dashboard/analytics' },
    { label: 'Підтверджено',        value: isLoading ? '—' : String(todayConfirmed),   rawCount: isLoading ? undefined : todayConfirmed,  href: '/dashboard/bookings'  },
    { label: 'Очікує',              value: isLoading ? '—' : String(todayPending),     rawCount: isLoading ? undefined : todayPending,    href: '/dashboard/bookings'  },
    { label: 'Клієнтів тиждень',    value: isLoading ? '—' : String(weekClients),      rawCount: isLoading ? undefined : weekClients,     href: '/dashboard/clients'   },
    { label: 'Нових',               value: isLoading ? '—' : String(weekNewClients),   rawCount: isLoading ? undefined : weekNewClients,  href: '/dashboard/clients'   },
    { label: 'Завершено за місяць', value: isLoading ? '—' : String(monthCompleted),   rawCount: isLoading ? undefined : monthCompleted,  href: '/dashboard/analytics' },
    { label: 'Конверсія',           value: isLoading ? '—' : convRate,                                                                    href: '/dashboard/analytics' },
  ];

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let touchStartX = 0;
    let animStartX  = 0;
    let dragging    = false;

    function getAnimX(): number {
      const m = new DOMMatrix(getComputedStyle(track!).transform);
      return m.m41;
    }

    function onTouchStart(e: TouchEvent) {
      dragging    = true;
      touchStartX = e.touches[0].clientX;
      animStartX  = getAnimX();
      track!.style.animationPlayState = 'paused';
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragging) return;
      const dx = e.touches[0].clientX - touchStartX;
      track!.style.transform = `translateX(${animStartX + dx}px)`;
    }

    function onTouchEnd() {
      if (!dragging) return;
      dragging = false;

      const halfW  = track!.scrollWidth / 2;
      const currX  = new DOMMatrix(getComputedStyle(track!).transform).m41;
      let   normX  = currX % halfW;
      if (normX > 0) normX -= halfW;

      const progress = Math.abs(normX) / halfW;
      track!.style.transform         = '';
      track!.style.animationDelay    = `${-(progress * TICKER_DURATION)}s`;
      track!.style.animationPlayState = 'running';
    }

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove',  onTouchMove,  { passive: true });
    track.addEventListener('touchend',   onTouchEnd,   { passive: true });

    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove',  onTouchMove);
      track.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  const doubled = [...items, ...items];

  return (
    <div
      className="ticker-outer py-2.5"
      style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
    >
      <div ref={trackRef} className="ticker-track">
        {doubled.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="ticker-item"
            tabIndex={i >= items.length ? -1 : 0}
            aria-hidden={i >= items.length}
          >
            <span
              className="text-[10px] font-bold tracking-[0.16em] uppercase"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {item.label}
            </span>
            {DOT}
            <span
              className="metric-value text-[13px] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.rawCount !== undefined && loaded
                ? <AnimatedCount target={item.rawCount} loaded={loaded} />
                : item.value
              }
            </span>
            {SEP}
          </Link>
        ))}
      </div>
    </div>
  );
}
