'use client';

import { useState, useMemo, type ElementType } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Image from 'next/image';
import { Search, Star, MapPin, Sparkles, ChevronDown, SlidersHorizontal, X, Scissors, Eye, Sparkle, Smile } from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';
import { pluralUk } from '@/lib/utils/pluralUk';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

type CatIconEntry = { icon: ElementType; fill?: string; rotate?: boolean };

const CATEGORY_ICONS: Record<string, CatIconEntry> = {
  nails:   { icon: Sparkles },
  hair:    { icon: Scissors },
  brows:   { icon: Eye },
  makeup:  { icon: Sparkle, fill: 'currentColor' },
  massage: { icon: Smile },
  barber:  { icon: Scissors, rotate: true },
};

function CategoryIcon({ id, size = 12 }: { id: string; size?: number }) {
  const cfg = CATEGORY_ICONS[id] ?? CATEGORY_ICONS.nails!;
  const { icon: Icon, fill, rotate } = cfg;
  return (
    <Icon
      size={size}
      className={rotate ? 'rotate-90' : undefined}
      {...(fill ? { fill } : {})}
    />
  );
}

interface Master {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  city: string | null;
  rating: number;
  ratingCount: number;
  avatarEmoji: string;
  avatarUrl: string | null;
  categories: string[];
  isPro: boolean;
  serviceCount: number;
  createdAt: string;
}

type SortMode = 'popular' | 'rating' | 'newest';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'popular', label: 'За популярністю' },
  { value: 'rating',  label: 'За рейтингом'   },
  { value: 'newest',  label: 'Нові спочатку'   },
];

interface Props {
  masters: Master[];
  cities: string[];
}

export function ExplorePage({ masters, cities }: Props) {
  const [search, setSearch]                     = useState('');
  const [activeCategory, setActiveCategory]     = useState<string | null>(null);
  const [activeCity, setActiveCity]             = useState<string | null>(null);
  const [sort, setSort]                         = useState<SortMode>('popular');
  const [showFilters, setShowFilters]           = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const filtered = useMemo(() => {
    let result = masters;

    if (activeCategory) {
      const cat = serviceCategories.find(c => c.id === activeCategory);
      result = result.filter(m =>
        m.categories.includes(activeCategory) || (cat && m.categories.includes(cat.label))
      );
    }
    if (activeCity) {
      result = result.filter(m => m.city === activeCity);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q) ||
        m.bio?.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    if (sort === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    } else if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sorted.sort((a, b) => {
        if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
        return b.ratingCount - a.ratingCount;
      });
    }

    return sorted;
  }, [masters, activeCategory, activeCity, search, sort]);

  const activeFiltersCount = [activeCategory, activeCity].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="mb-6 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-secondary/50 border border-border px-4 py-1.5 rounded-full mb-3">
            <Sparkles size={13} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Знайди свого майстра</span>
          </div>
          <h1 className="heading-serif text-3xl text-foreground leading-tight">Краса поруч</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {masters.length} {pluralUk(masters.length, 'майстер', 'майстри', 'майстрів')} у Bookit
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.06 }}
          className="relative mb-3"
        >
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ім'я, місто або спеціалізація..."
            aria-label="Пошук майстра"
            className="w-full pl-10 pr-10 py-3 rounded-md bg-secondary/70 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-150"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Очистити пошук"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/60 hover:text-muted-foreground"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* Filter bar + category chips */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.09 }}
          className="flex gap-2 mb-4"
        >
          <button
            type="button"
            aria-pressed={showFilters}
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-colors duration-150 flex-shrink-0 active:scale-[0.95] ${
              activeFiltersCount > 0 || showFilters
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 border border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            <SlidersHorizontal size={12} />
            Фільтри
            {activeFiltersCount > 0 && (
              <span className="size-4 rounded-full bg-secondary text-primary text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide flex-1">
            <LayoutGroup id="explore-cats">
              <button
                type="button"
                aria-pressed={!activeCategory}
                onClick={() => setActiveCategory(null)}
                className="relative flex-shrink-0 flex items-center px-3 py-2.5 rounded-full text-xs font-semibold transition-colors duration-150 active:scale-[0.95]"
              >
                {!activeCategory && (
                  <motion.div
                    layoutId="explore-cat-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={SPRING}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${!activeCategory ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  <Sparkles size={12} />
                  Всі
                </span>
              </button>

              {serviceCategories.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveCategory(active ? null : cat.id)}
                    className="relative flex-shrink-0 flex items-center px-3 py-2.5 rounded-full text-xs font-semibold transition-colors duration-150 active:scale-[0.95]"
                  >
                    {active && (
                      <motion.div
                        layoutId="explore-cat-pill"
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={SPRING}
                      />
                    )}
                    <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      <CategoryIcon id={cat.id} size={12} />
                      <span>{cat.label}</span>
                    </span>
                  </button>
                );
              })}
            </LayoutGroup>
          </div>
        </motion.div>

        {/* Expanded filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <div className="bento-card p-4 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">Місто</p>
                  <div className="relative">
                    <button
                      type="button"
                      aria-expanded={showCityDropdown}
                      aria-haspopup="listbox"
                      onClick={() => setShowCityDropdown(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-md border border-border bg-secondary/70 text-sm text-foreground hover:bg-secondary transition-colors duration-150"
                    >
                      <span className={activeCity ? 'text-foreground' : 'text-muted-foreground/60'}>
                        {activeCity ?? 'Будь-яке місто'}
                      </span>
                      <ChevronDown size={14} className={`text-muted-foreground/60 transition-transform duration-150 ${showCityDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showCityDropdown && (
                        <motion.div
                          role="listbox"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-full left-0 right-0 mt-1 bento-card rounded-md p-1 z-20 max-h-48 overflow-y-auto"
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={!activeCity}
                            onClick={() => { setActiveCity(null); setShowCityDropdown(false); }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 active:scale-[0.98] ${!activeCity ? 'bg-primary/12 text-primary/90 font-semibold' : 'text-muted-foreground hover:bg-secondary/60'}`}
                          >
                            Будь-яке місто
                          </button>
                          {cities.map(city => (
                            <button
                              key={city}
                              type="button"
                              role="option"
                              aria-selected={activeCity === city}
                              onClick={() => { setActiveCity(city); setShowCityDropdown(false); }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 active:scale-[0.98] ${activeCity === city ? 'bg-primary/12 text-primary/90 font-semibold' : 'text-muted-foreground hover:bg-secondary/60'}`}
                            >
                              {city}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">Сортування</p>
                  <div className="flex gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={sort === opt.value}
                        onClick={() => setSort(opt.value)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-[0.95] ${
                          sort === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setActiveCity(null); setActiveCategory(null); }}
                    className="text-xs text-destructive font-medium hover:underline text-center"
                  >
                    Скинути фільтри
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {(search || activeCategory || activeCity) && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground/60 mb-3">
            Знайдено: {filtered.length}
          </motion.p>
        )}

        {/* Masters grid */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Search size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">Нікого не знайдено</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Спробуй інший запит або змінити фільтри</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((master, i) => (
              <MasterCard key={master.id} master={master} index={i} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground/60">
            Ти майстер?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Приєднуйся безкоштовно
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

function MasterCard({ master, index }: { master: Master; index: number }) {
  const masterCategories = serviceCategories.filter(c =>
    master.categories.includes(c.id) || master.categories.includes(c.label)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ...SPRING }}
    >
      <Link href={`/${master.slug}`} className="block">
        <div className="bento-card overflow-hidden hover:-translate-y-0.5 transition-transform duration-150 active:scale-[0.97]">

          {/* Photo zone */}
          <div className="relative h-36 bg-accent/10">
            {master.avatarUrl ? (
              <Image
                src={master.avatarUrl}
                alt={master.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                {master.avatarEmoji}
              </div>
            )}
            {master.isPro && (
              <span className="absolute top-2 right-2 text-[9px] font-bold text-white bg-warning px-1.5 py-0.5 rounded-full leading-none">
                PRO
              </span>
            )}
            {master.ratingCount > 0 && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Star size={9} className="text-warning fill-warning" />
                <span className="text-[10px] font-semibold text-white">{master.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Text zone */}
          <div className="p-3">
            <p className="text-sm font-semibold text-foreground truncate">{master.name}</p>
            {master.city && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-muted-foreground/60 flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground/60 truncate">{master.city}</span>
              </div>
            )}
            {masterCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {masterCategories.slice(0, 2).map(cat => (
                  <span
                    key={cat.id}
                    className="text-[10px] font-medium text-muted-foreground/70 border border-border/60 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                  >
                    <CategoryIcon id={cat.id} size={9} />
                    <span>{cat.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
