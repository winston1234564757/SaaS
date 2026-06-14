'use client';

import { useState, useMemo, type ElementType } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, Star, Sparkles, ChevronDown, X,
  Scissors, Eye, Sparkle, Smile, ArrowUpRight, MapPin,
  LayoutGrid, List, Maximize2,
} from 'lucide-react';
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

function AvatarFallback({ name, textClassName = 'text-4xl' }: { name: string; textClassName?: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
      <span className={`font-bold text-accent/30 select-none ${textClassName}`} aria-hidden="true">
        {name[0]?.toUpperCase()}
      </span>
    </div>
  );
}

interface TopService { name: string; price: number }

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
  minPrice: number | null;
  availableToday: boolean;
  topServices: TopService[];
  latestReview: string | null;
  serviceNames: string;
  portfolioPhotos: string[];
}

type SortMode = 'popular' | 'rating' | 'newest';
type ViewMode = 'grid' | 'list' | 'tiktok';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'popular', label: 'За популярністю' },
  { value: 'rating',  label: 'За рейтингом'   },
  { value: 'newest',  label: 'Нові спочатку'   },
];

const VIEW_MODES: { mode: ViewMode; icon: ElementType; label: string }[] = [
  { mode: 'grid',   icon: LayoutGrid, label: 'Сітка'   },
  { mode: 'list',   icon: List,       label: 'Список'  },
  { mode: 'tiktok', icon: Maximize2,  label: 'Стрічка' },
];

interface Props {
  masters: Master[];
  cities: string[];
}

function CityDropdown({ cities, activeCity, onChange }: {
  cities: string[]; activeCity: string | null; onChange: (city: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold transition-colors duration-150 min-h-[44px] whitespace-nowrap ${
          activeCity
            ? 'bg-accent text-accent-foreground'
            : 'bg-secondary/60 border border-border/60 text-muted-foreground hover:bg-secondary'
        }`}
      >
        <MapPin size={11} />
        {activeCity ?? 'Місто'}
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1.5 bento-card rounded-xl p-1 z-30 min-w-[160px] max-h-52 overflow-y-auto"
          >
            <button type="button" role="option" aria-selected={!activeCity}
              onClick={() => { onChange(null); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors duration-150 active:scale-[0.98] ${
                !activeCity ? 'bg-accent/12 text-accent font-semibold' : 'text-muted-foreground hover:bg-secondary/60'
              }`}>
              Всі міста
            </button>
            {cities.map(city => (
              <button key={city} type="button" role="option" aria-selected={activeCity === city}
                onClick={() => { onChange(city); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors duration-150 active:scale-[0.98] ${
                  activeCity === city ? 'bg-accent/12 text-accent font-semibold' : 'text-muted-foreground hover:bg-secondary/60'
                }`}>
                {city}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortDropdown({ sort, onChange }: { sort: SortMode; onChange: (s: SortMode) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.value === sort)!;
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold bg-secondary/60 border border-border/60 text-muted-foreground hover:bg-secondary transition-colors duration-150 min-h-[44px] whitespace-nowrap"
      >
        {current.label}
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1.5 bento-card rounded-xl p-1 z-30 min-w-[180px]"
          >
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} type="button" role="option" aria-selected={sort === opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors duration-150 active:scale-[0.98] ${
                  sort === opt.value ? 'bg-accent/12 text-accent font-semibold' : 'text-muted-foreground hover:bg-secondary/60'
                }`}>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ExplorePage({ masters, cities }: Props) {
  const [search, setSearch]           = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeCity, setActiveCity]   = useState<string | null>(null);
  const [sort, setSort]               = useState<SortMode>('popular');
  const [viewMode, setViewMode]       = useState<ViewMode>('grid');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of masters) {
      for (const rawCat of m.categories) {
        const def = serviceCategories.find(d => d.id === rawCat || d.label === rawCat);
        if (def) counts[def.id] = (counts[def.id] ?? 0) + 1;
      }
    }
    return counts;
  }, [masters]);

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
        m.bio?.toLowerCase().includes(q) ||
        m.serviceNames.toLowerCase().includes(q) ||
        m.categories.some(c => {
          const def = serviceCategories.find(d => d.id === c || d.label === c);
          return (def?.label.toLowerCase().includes(q) ?? false) || c.toLowerCase().includes(q);
        })
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

  return (
    <div className="min-h-screen bg-transparent">
      <div className={`max-w-2xl mx-auto px-4 pt-10 ${viewMode === 'tiktok' ? 'pb-4' : 'pb-24'}`}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="mb-5"
        >
          <h1 className="heading-serif text-4xl text-foreground leading-[1.1] tracking-tight">Краса поруч</h1>
          <p className="text-sm text-muted-foreground/60 mt-1.5">
            {masters.length} {pluralUk(masters.length, 'майстер', 'майстри', 'майстрів')} у Bookit
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="relative mb-2.5"
        >
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Яку послугу або майстра шукаєш?"
            aria-label="Пошук майстра або послуги"
            className="w-full pl-10 pr-10 py-3 rounded-full bg-secondary/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:bg-secondary focus:border-accent/40 focus:ring-2 focus:ring-accent/15 transition-all duration-150"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Очистити пошук"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/50 hover:text-muted-foreground">
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* Controls: City + Sort + View toggle */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.08 }}
          className="flex items-center gap-2 mb-5"
        >
          <CityDropdown cities={cities} activeCity={activeCity} onChange={setActiveCity} />
          <SortDropdown sort={sort} onChange={setSort} />
          <div className="ml-auto flex items-center gap-0.5 bg-secondary/60 border border-border/40 rounded-full p-1">
            {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                aria-pressed={viewMode === mode}
                className={`p-2 rounded-full transition-all duration-150 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  viewMode === mode
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Category tiles — hidden in tiktok mode */}
        {viewMode !== 'tiktok' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.11 }}
            className="flex gap-2 overflow-x-auto pb-1 pe-4 scrollbar-hide mb-5"
          >
            <button type="button" aria-pressed={!activeCategory} onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 w-[76px] min-h-[68px] rounded-2xl border transition-all duration-150 active:scale-[0.95] px-2 py-3 ${
                !activeCategory ? 'bg-accent/15 border-accent' : 'bg-secondary/50 border-border/40'
              }`}
            >
              <span className={!activeCategory ? 'text-accent' : 'text-muted-foreground'}><Sparkles size={20} /></span>
              <span className={`text-[10px] font-medium leading-tight text-center ${!activeCategory ? 'text-accent' : 'text-muted-foreground/80'}`}>Всі</span>
              <span className="text-[9px] text-muted-foreground/50">{masters.length}</span>
            </button>

            {serviceCategories.map(cat => {
              const active = activeCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button key={cat.id} type="button" aria-pressed={active}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 w-[76px] min-h-[68px] rounded-2xl border transition-all duration-150 active:scale-[0.95] px-2 py-3 ${
                    active ? 'bg-accent/15 border-accent' : 'bg-secondary/50 border-border/40'
                  }`}
                >
                  <span className={active ? 'text-accent' : 'text-muted-foreground'}><CategoryIcon id={cat.id} size={20} /></span>
                  <span className={`text-[10px] font-medium leading-tight text-center ${active ? 'text-accent' : 'text-muted-foreground/80'}`}>{cat.label}</span>
                  <span className="text-[9px] text-muted-foreground/50">{count}</span>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Results count */}
        {(search || activeCategory || activeCity) && viewMode !== 'tiktok' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground/60 mb-3">
            Знайдено: {filtered.length}
          </motion.p>
        )}

        {/* Masters zone */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <Search size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground">Нікого не знайдено</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Спробуй інший запит або змінити фільтри</p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
              {filtered.map((master, i) => <MasterCard key={master.id} master={master} index={i} />)}
            </motion.div>
          ) : viewMode === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {filtered.map((master, i) => <MasterListCard key={master.id} master={master} index={i} />)}
            </motion.div>
          ) : (
            <motion.div
              key="tiktok"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-y-auto snap-y snap-mandatory rounded-2xl"
              style={{ height: 'calc(100svh - 220px)' }}
            >
              {filtered.map((master, i) => (
                <div key={master.id} className="snap-start snap-always" style={{ height: 'calc(100svh - 220px)' }}>
                  <MasterTikTokCard master={master} index={i} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {viewMode !== 'tiktok' && (
          <div className="mt-10 text-center">
            <p className="text-xs text-muted-foreground/60">
              Ти майстер?{' '}
              <Link href="/register" className="text-accent font-semibold hover:underline">Приєднуйся безкоштовно</Link>
            </p>
          </div>
        )}
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
        <div className="bento-card overflow-hidden active:scale-[0.97] transition-transform duration-150">

          {/* Photo zone */}
          <div className="relative h-40">
            {master.avatarUrl ? (
              <Image src={master.avatarUrl} alt={master.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 336px" />
            ) : master.portfolioPhotos[0] ? (
              <Image src={master.portfolioPhotos[0]} alt={master.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 336px" />
            ) : (
              <AvatarFallback name={master.name} textClassName="text-4xl" />
            )}

            {master.isPro && (
              <span className="absolute top-2.5 left-2.5 text-[9px] font-bold text-white bg-warning px-1.5 py-0.5 rounded-full leading-none">PRO</span>
            )}
            <div className="absolute top-2.5 right-2.5 size-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" aria-hidden="true">
              <ArrowUpRight size={13} className="text-foreground/70" />
            </div>
            {master.availableToday && (
              <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-accent text-accent-foreground text-[9px] font-bold px-2 py-1 rounded-full leading-none">
                <span className="size-1.5 rounded-full bg-accent-foreground/70 flex-shrink-0" aria-hidden="true" />
                Приймає сьогодні
              </span>
            )}
          </div>

          {/* Info zone */}
          <div className="p-3 space-y-1.5">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{master.name}</p>

            {/* Top services */}
            {master.topServices.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] text-muted-foreground/70 truncate">{s.name}</span>
                <span className="text-[11px] font-medium text-foreground/80 flex-shrink-0">{s.price}₴</span>
              </div>
            ))}

            {/* Fallback: categories if no services */}
            {master.topServices.length === 0 && masterCategories.length > 0 && (
              <p className="text-[10px] text-muted-foreground/60 truncate">
                {masterCategories.slice(0, 2).map(c => c.label).join(' · ')}
              </p>
            )}

            {/* Latest review */}
            {master.latestReview && (
              <p className="text-[10px] text-muted-foreground/50 italic line-clamp-2 leading-snug">
                &quot;{master.latestReview}&quot;
              </p>
            )}

            {/* Bottom meta row */}
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                {master.ratingCount > 0 && (
                  <>
                    <Star size={10} className="text-warning fill-warning flex-shrink-0" />
                    <span className="text-[10px] font-semibold text-foreground">{master.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground/40">·</span>
                    <span className="text-[10px] text-muted-foreground/50">{master.ratingCount}</span>
                  </>
                )}
                {master.city && (
                  <>
                    {master.ratingCount > 0 && <span className="text-[10px] text-muted-foreground/40 flex-shrink-0">·</span>}
                    <span className="text-[10px] text-muted-foreground/60 truncate">{master.city}</span>
                  </>
                )}
              </div>
              {master.minPrice && (
                <span className="text-[10px] font-semibold text-foreground flex-shrink-0">від {master.minPrice}₴</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function MasterListCard({ master, index }: { master: Master; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25), ...SPRING }}
    >
      <Link href={`/${master.slug}`} className="block">
        <div className="bento-card overflow-hidden active:scale-[0.98] transition-transform duration-150 flex gap-3 p-3">

          {/* Photo — 80×80 */}
          <div className="relative size-20 flex-shrink-0 rounded-xl overflow-hidden">
            {master.avatarUrl ? (
              <Image src={master.avatarUrl} alt={master.name} fill className="object-cover" sizes="80px" />
            ) : master.portfolioPhotos[0] ? (
              <Image src={master.portfolioPhotos[0]} alt={master.name} fill className="object-cover" sizes="80px" />
            ) : (
              <AvatarFallback name={master.name} textClassName="text-2xl" />
            )}
            {master.isPro && (
              <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-warning px-1 py-0.5 rounded-full leading-none">PRO</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-semibold text-foreground truncate">{master.name}</p>
              <ArrowUpRight size={12} className="text-muted-foreground/40 flex-shrink-0 mt-0.5" />
            </div>

            {master.topServices.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground/70 truncate">{s.name}</span>
                <span className="text-[11px] font-medium text-foreground/80 flex-shrink-0">{s.price}₴</span>
              </div>
            ))}

            {master.latestReview && (
              <p className="text-[10px] text-muted-foreground/50 italic line-clamp-1 leading-snug">
                &quot;{master.latestReview}&quot;
              </p>
            )}

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {master.ratingCount > 0 && (
                <>
                  <Star size={9} className="text-warning fill-warning" />
                  <span className="text-[10px] font-semibold text-foreground">{master.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground/40">({master.ratingCount})</span>
                </>
              )}
              {master.city && <span className="text-[10px] text-muted-foreground/60">{master.city}</span>}
              {master.availableToday && (
                <span className="text-[9px] bg-accent/10 text-accent font-semibold px-1.5 py-0.5 rounded-full">Сьогодні</span>
              )}
              {master.minPrice && (
                <span className="text-[10px] font-semibold text-foreground ml-auto flex-shrink-0">від {master.minPrice}₴</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function MasterTikTokCard({ master, index }: { master: Master; index: number }) {
  const masterCategories = serviceCategories.filter(c =>
    master.categories.includes(c.id) || master.categories.includes(c.label)
  );

  return (
    <div className="bento-card overflow-hidden h-full flex flex-col">

      {/* Photo zone — 45% if has portfolio, else 50% */}
      <Link href={`/${master.slug}`} className={`relative block ${master.portfolioPhotos.length > 0 ? 'flex-[0_0_45%]' : 'flex-[0_0_50%]'}`}>
        {master.avatarUrl ? (
          <Image src={master.avatarUrl} alt={master.name} fill className="object-cover" sizes="(max-width: 672px) 100vw, 672px" />
        ) : (
          <AvatarFallback name={master.name} textClassName="text-6xl" />
        )}

        {master.isPro && (
          <span className="absolute top-3 left-3 text-[10px] font-bold text-white bg-warning px-2 py-1 rounded-full leading-none">PRO</span>
        )}
        {master.availableToday && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-1.5 rounded-full leading-none">
            <span className="size-1.5 rounded-full bg-accent-foreground/70 flex-shrink-0" aria-hidden="true" />
            Приймає сьогодні
          </span>
        )}
      </Link>

      {/* Portfolio strip */}
      {master.portfolioPhotos.length > 0 && (
        <div className="flex gap-px flex-none h-16 overflow-hidden">
          {master.portfolioPhotos.map((url, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              <Image src={url} alt="" fill className="object-cover" sizes="33vw" />
            </div>
          ))}
        </div>
      )}

      {/* Info zone */}
      <div className="flex flex-col flex-1 p-4 gap-2.5 overflow-y-auto min-h-0">
        <Link href={`/${master.slug}`} className="block">
          <h2 className="text-xl font-semibold text-foreground leading-tight">{master.name}</h2>
          {masterCategories.length > 0 && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {masterCategories.slice(0, 3).map(c => c.label).join(' · ')}
            </p>
          )}
        </Link>

        {/* Services */}
        {master.topServices.length > 0 && (
          <div className="space-y-1.5 py-2 border-t border-border/40">
            {master.topServices.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground/80 truncate">{s.name}</span>
                <span className="text-sm font-semibold text-foreground flex-shrink-0">{s.price}₴</span>
              </div>
            ))}
          </div>
        )}

        {/* Review */}
        {master.latestReview && (
          <p className="text-sm text-muted-foreground/60 italic line-clamp-2 leading-relaxed border-t border-border/40 pt-2">
            &quot;{master.latestReview}&quot;
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {master.ratingCount > 0 && (
            <>
              <Star size={12} className="text-warning fill-warning" />
              <span className="text-sm font-semibold text-foreground">{master.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground/50">({master.ratingCount} відг.)</span>
            </>
          )}
          {master.city && <span className="text-xs text-muted-foreground/60">{master.city}</span>}
          {master.minPrice && (
            <span className="text-sm font-semibold text-foreground ml-auto">від {master.minPrice}₴</span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/${master.slug}`}
          className="mt-auto block w-full bg-accent text-accent-foreground text-sm font-semibold py-3.5 rounded-2xl text-center transition-opacity duration-150 active:opacity-80 min-h-[44px]"
        >
          Записатись
        </Link>
      </div>
    </div>
  );
}
