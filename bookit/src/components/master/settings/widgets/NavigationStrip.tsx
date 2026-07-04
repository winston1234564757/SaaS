'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  id: string;
  label: string;
}

const ITEMS: NavItem[] = [
  { id: 'hero', label: 'Профіль' },
  { id: 'status', label: 'Публікація' },
  { id: 'stats', label: 'Аналітика' },
  { id: 'schedule', label: 'Графік' },
  { id: 'services', label: 'Послуги' },
  { id: 'location', label: 'Локація' },
  { id: 'identity', label: 'Дані' },
  { id: 'technical', label: 'Тема' },
  { id: 'vacations', label: 'Відпустки' },
];

export function NavigationStrip() {
  const [activeId, setActiveId] = useState('hero');
  const activeIdRef = useRef('hero');

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      activeIdRef.current = id;
      setActiveId(id);

      el.classList.add('tour-glow');
      setTimeout(() => el.classList.remove('tour-glow'), 1500);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      let mostVisibleId = ITEMS[0].id;
      let maxVisibleHeight = 0;

      const viewportHeight = window.innerHeight;
      const threshold = 150;

      for (const item of ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();

        const visibleTop = Math.max(rect.top, threshold);
        const visibleBottom = Math.min(rect.bottom, viewportHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          mostVisibleId = item.id;
        }
      }

      if (mostVisibleId !== activeIdRef.current) {
        activeIdRef.current = mostVisibleId;
        setActiveId(mostVisibleId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav role="navigation" aria-label="Навігація розділами" className="sticky top-4 z-[100] px-4 w-full max-w-2xl mx-auto group/nav">
      <div className="relative h-14 w-full bg-surface/40 backdrop-blur-xl border border-border/60 rounded-full shadow-lg shadow-black/5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface/40 to-transparent z-10 pointer-events-none lg:hidden" />

        <div className="flex items-center gap-1 h-full overflow-x-auto scrollbar-hide px-3 justify-start lg:justify-center">
          {ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => scrollTo(item.id)}
              aria-current={activeId === item.id ? 'location' : undefined}
              className={cn(
                'relative px-3 h-8 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 active:scale-[0.88] cursor-pointer',
                activeId === item.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-sub hover:text-text-sub hover:bg-secondary/60'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface/40 to-transparent z-10 pointer-events-none lg:hidden" />
      </div>
    </nav>
  );
}
