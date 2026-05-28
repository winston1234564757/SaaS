'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      
      setActiveId(id);
      
      // Highlight effect
      el.classList.add('tour-glow');
      setTimeout(() => el.classList.remove('tour-glow'), 1500);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Find the section that is most prominent in the viewport
      let mostVisibleId = ITEMS[0].id;
      let maxVisibleHeight = 0;

      const viewportHeight = window.innerHeight;
      const threshold = 150; // Offset for the sticky header

      for (const item of ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        
        // Calculate how much of the section is visible in the 'active' area
        const visibleTop = Math.max(rect.top, threshold);
        const visibleBottom = Math.min(rect.bottom, viewportHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          mostVisibleId = item.id;
        }
      }

      if (mostVisibleId !== activeId) {
        setActiveId(mostVisibleId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial active state
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeId]);

  return (
    <div className="sticky top-4 z-[100] px-4 w-full max-w-2xl mx-auto group/nav">
      <div className="relative h-14 w-full bg-surface/40 backdrop-blur-xl border border-border/60 rounded-full shadow-lg shadow-black/5 overflow-hidden">
        {/* Mobile Left Hint */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface/40 to-transparent z-10 pointer-events-none lg:hidden" />
        
        <div className="flex items-center gap-6 h-full overflow-x-auto scrollbar-hide px-6 justify-start lg:justify-center">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "relative text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors py-1 shrink-0 active:scale-[0.88] cursor-pointer",
                activeId === item.id ? "text-accent" : "text-text-mute hover:text-text-sub"
              )}
            >
              {item.label}
              {activeId === item.id && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Mobile Right Hint */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface/40 to-transparent z-10 pointer-events-none lg:hidden" />
      </div>
    </div>
  );
}
