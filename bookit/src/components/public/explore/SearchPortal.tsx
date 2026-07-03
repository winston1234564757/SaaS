'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';
import { pluralUk } from '@/lib/utils/pluralUk';
import { SPRING } from './shared';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export function SearchPortal({
  searchQuery, onSearchChange, activeCategory, onSelectCategory, categoryCounts, totalCount,
}: Props) {
  // Visible categories (count > 0), ordered by popularity — uniform size.
  const words = useMemo(() =>
    serviceCategories
      .map(c => ({ id: c.id, label: c.label, count: categoryCounts[c.id] ?? 0 }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count),
    [categoryCounts]);

  return (
    <div className="bg-accent text-accent-foreground rounded-b-[2rem] shadow-lg shadow-accent/15">
      <div
        className="max-w-2xl mx-auto px-5 pb-7"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.25rem)' }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="text-[3rem] leading-[0.92] text-accent-foreground/95"
          style={{ fontFamily: 'var(--font-great-vibes, cursive)' }}
        >
          Знайди свого майстра
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06, duration: 0.3 }}
          className="text-[11px] text-accent-foreground/50 mt-1.5"
        >
          {totalCount} {pluralUk(totalCount, 'майстер', 'майстри', 'майстрів')} поруч
        </motion.p>

        {/* Search — the hero act */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="mt-5 relative"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-foreground/50 pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Ім'я, послуга або місто…"
            aria-label="Пошук майстрів за іменем, послугою або містом"
            className="w-full min-h-[56px] pl-12 pr-11 rounded-2xl bg-white/[0.08] border border-white/15 text-[15px] text-accent-foreground placeholder:text-accent-foreground/40 focus:outline-none focus:border-white/35 focus:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-white/30 transition-all duration-150"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Очистити пошук"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 size-6 rounded-full bg-white/15 flex items-center justify-center text-accent-foreground/80 hover:bg-white/25 transition-colors duration-150 active:scale-90"
            >
              <X size={12} />
            </button>
          )}
        </motion.div>

        {/* Categories as typography — size = share of masters (asymmetric) */}
        {words.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1"
            role="group"
            aria-label="Категорії"
          >
            <button
              type="button"
              aria-pressed={!activeCategory}
              onClick={() => onSelectCategory(null)}
              className={`py-1.5 min-h-[44px] font-medium transition-colors duration-150 active:scale-95 text-xl leading-none ${
                !activeCategory
                  ? 'text-accent-foreground underline decoration-2 underline-offset-[6px]'
                  : 'text-accent-foreground/45 hover:text-accent-foreground/75'
              }`}
            >
              Усі
            </button>
            {words.map(w => {
              const active = activeCategory === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectCategory(active ? null : w.id)}
                  className={`py-1.5 min-h-[44px] font-medium transition-colors duration-150 active:scale-95 text-xl leading-none ${
                    active
                      ? 'text-accent-foreground underline decoration-2 underline-offset-[6px]'
                      : 'text-accent-foreground/55 hover:text-accent-foreground/80'
                  }`}
                >
                  {w.label}
                  <span className="text-accent-foreground/35 text-[11px] align-super ml-0.5">{w.count}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
