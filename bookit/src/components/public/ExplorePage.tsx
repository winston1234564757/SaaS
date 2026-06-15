'use client';

import { useState, useMemo, useEffect, useCallback, type ElementType } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Scissors, Eye, Smile, Hand, Flower2, Droplets,
  Zap, Circle, PenTool, MoreHorizontal, Star, MapPin,
  ChevronDown, Navigation, ArrowRight, Clock,
} from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';
import { pluralUk } from '@/lib/utils/pluralUk';
import { haversineKm, formatDistance } from '@/lib/utils/haversine';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;
const PAGE_SIZE = 12;

// Backwards-compat aliases for category labels that changed
const CATEGORY_ALIASES: Record<string, string[]> = {
  brows: ['Брови/Вії', 'Брови'],
};

type SortMode = 'popular' | 'rating' | 'newest' | 'smart';

export interface ExploreMaster {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  rating: number;
  ratingCount: number;
  avatarUrl: string | null;
  categories: string[];
  isPro: boolean;
  createdAt: string;
  minPrice: number | null;
  availableToday: boolean;
  availableTomorrow: boolean;
  topServices: { name: string; price: number }[];
  portfolioPhotos: string[];
  latitude: number | null;
  longitude: number | null;
}

type ProcessedMaster = ExploreMaster & { distance: number | null };

interface Props {
  masters: ExploreMaster[];
  categoryCounts: Record<string, number>;
  preferredCategories: string[];
}

// ─── Category icons ────────────────────────────────────────────────────────────

const CAT_ICONS: Record<string, ElementType> = {
  nails:       Sparkles,
  hair:        Scissors,
  brows:       Eye,
  makeup:      Smile,
  massage:     Hand,
  barber:      Scissors,
  cosmetology: Flower2,
  spa:         Droplets,
  waxing:      Zap,
  piercing:    Circle,
  tattoo:      PenTool,
  other:       MoreHorizontal,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryLabel(cats: string[]): string {
  if (!cats.length) return '';
  const first = cats[0]!;
  const def = serviceCategories.find(c => c.id === first || c.label === first);
  return def?.label ?? first;
}

function AvatarFallback({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
      <span className="text-5xl font-bold text-accent/20 select-none" aria-hidden="true">
        {name[0]?.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Category Pills ────────────────────────────────────────────────────────────

function CategoryPills({
  activeCategory,
  onSelect,
  categoryCounts,
  totalCount,
}: {
  activeCategory: string | null;
  onSelect: (id: string | null) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 pe-4 scrollbar-hide"
      role="group"
      aria-label="Фільтр за категорією"
    >
      <button
        type="button"
        aria-pressed={!activeCategory}
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap transition-all duration-150 active:scale-[0.95] ${
          !activeCategory
            ? 'bg-accent text-accent-foreground shadow-sm'
            : 'bg-white/60 border border-border/50 text-foreground/70 hover:border-accent/30'
        }`}
      >
        <Sparkles size={11} />
        Всі
        <span className={`text-[10px] ${!activeCategory ? 'text-accent-foreground/70' : 'text-muted-foreground/50'}`}>
          · {totalCount}
        </span>
      </button>

      {serviceCategories.map(cat => {
        const active = activeCategory === cat.id;
        const Icon   = CAT_ICONS[cat.id] ?? MoreHorizontal;
        const count  = categoryCounts[cat.id] ?? 0;

        return (
          <button
            key={cat.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? null : cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap transition-all duration-150 active:scale-[0.95] ${
              cat.id === 'barber' ? '[&_svg]:rotate-90' : ''
            } ${
              active
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-white/60 border border-border/50 text-foreground/70 hover:border-accent/30'
            }`}
          >
            <Icon size={11} />
            {cat.label}
            {count > 0 && (
              <span className={`text-[10px] ${active ? 'text-accent-foreground/70' : 'text-muted-foreground/50'}`}>
                · {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────

function SortDropdown({
  sort,
  onChange,
  hasPreferred,
}: {
  sort: SortMode;
  onChange: (s: SortMode) => void;
  hasPreferred: boolean;
}) {
  const [open, setOpen] = useState(false);

  const options: { value: SortMode; label: string }[] = [
    { value: 'popular', label: 'За популярністю' },
    { value: 'rating',  label: 'За рейтингом'   },
    { value: 'newest',  label: 'Новинки'         },
    ...(hasPreferred ? [{ value: 'smart' as SortMode, label: 'Для тебе' }] : []),
  ];

  const current = options.find(o => o.value === sort) ?? options[0]!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap bg-white/60 border border-border/50 text-foreground/70 hover:border-accent/30 transition-all duration-150"
      >
        {current.label}
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1.5 bento-card rounded-2xl p-1.5 z-30 min-w-[180px] shadow-lg"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={sort === opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors duration-150 active:scale-[0.98] ${
                  sort === opt.value
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Featured PRO Card ─────────────────────────────────────────────────────────

function FeaturedCard({ master }: { master: ExploreMaster }) {
  const photo = master.avatarUrl ?? master.portfolioPhotos[0] ?? null;
  return (
    <Link
      href={`/${master.slug}`}
      className="flex-shrink-0 block w-[116px] active:scale-[0.97] transition-transform duration-150"
    >
      <div className="bento-card overflow-hidden">
        <div className="relative h-[72px] overflow-hidden">
          {photo ? (
            <Image src={photo} alt={master.name} fill className="object-cover" sizes="116px" />
          ) : (
            <AvatarFallback name={master.name} />
          )}
          <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full leading-none">
            PRO
          </span>
        </div>
        <div className="p-2 space-y-0.5">
          <p className="text-[11px] font-semibold text-foreground truncate">{master.name}</p>
          <p className="text-[10px] text-muted-foreground/60 truncate">{getCategoryLabel(master.categories)}</p>
          {master.ratingCount > 0 && (
            <div className="flex items-center gap-0.5 pt-0.5">
              <Star size={8} className="text-warning fill-warning" />
              <span className="text-[10px] font-semibold text-foreground">{master.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton Grid ─────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bento-card overflow-hidden animate-pulse">
          <div className="aspect-[3/4] bg-muted/30" />
          <div className="h-10 bg-muted/20" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 bg-muted/30 rounded-full w-4/5" />
            <div className="h-3 bg-muted/20 rounded-full w-1/2" />
            <div className="h-3 bg-muted/15 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Master Card ───────────────────────────────────────────────────────────────

function MasterCard({
  master,
  index,
  showDistance,
}: {
  master: ProcessedMaster;
  index: number;
  showDistance: boolean;
}) {
  const mainPhoto = master.avatarUrl ?? master.portfolioPhotos[0] ?? null;
  // If avatar is used as main, show all portfolio in strip; else skip first (already in main)
  const strip = master.avatarUrl
    ? master.portfolioPhotos.slice(0, 3)
    : master.portfolioPhotos.slice(1, 4);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.04, 0.28), ...SPRING }}
      className="group"
    >
      <Link href={`/${master.slug}`} className="block">
        <div className="bento-card overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md active:scale-[0.97]">

          {/* Photo — 3:4 */}
          <div className="relative aspect-[3/4] overflow-hidden">
            {mainPhoto ? (
              <Image
                src={mainPhoto}
                alt={master.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, 280px"
              />
            ) : (
              <AvatarFallback name={master.name} />
            )}

            {/* Top row badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between pointer-events-none">
              {master.isPro ? (
                <span className="text-[9px] font-bold text-accent-foreground bg-accent px-2 py-0.5 rounded-full leading-none tracking-wide">
                  PRO
                </span>
              ) : <span />}
              {showDistance && master.distance !== null && (
                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-foreground/90 bg-white/90 px-2 py-0.5 rounded-full leading-none backdrop-blur-sm">
                  <MapPin size={8} />
                  {formatDistance(master.distance)}
                </span>
              )}
            </div>

            {/* Availability badge */}
            {(master.availableToday || master.availableTomorrow) && (
              <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
                <span className="flex items-center gap-1 bg-accent text-accent-foreground text-[9px] font-bold px-2 py-1 rounded-full leading-none">
                  <span className="size-1.5 rounded-full bg-accent-foreground/60 flex-shrink-0" aria-hidden="true" />
                  {master.availableToday ? 'Приймає сьогодні' : 'Вільно завтра'}
                </span>
              </div>
            )}
          </div>

          {/* Portfolio strip */}
          {strip.length > 0 && (
            <div className="flex gap-px overflow-hidden h-10">
              {strip.map((url, i) => (
                <div key={i} className="relative flex-1 h-full overflow-hidden">
                  <Image src={url} alt="" fill className="object-cover" sizes="33vw" aria-hidden="true" />
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="p-3 space-y-1">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{master.name}</p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-muted-foreground/60 truncate">
                {getCategoryLabel(master.categories)}
              </span>
              {master.ratingCount > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star size={9} className="text-warning fill-warning" />
                  <span className="text-[10px] font-semibold text-foreground">{master.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {master.minPrice !== null && (
              <p className="text-[10px] font-medium text-muted-foreground/60">
                від {master.minPrice}₴
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ExplorePage({ masters, categoryCounts, preferredCategories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [slotToday,      setSlotToday]      = useState(false);
  const [nearbyActive,   setNearbyActive]   = useState(false);
  const [geoLoading,     setGeoLoading]     = useState(false);
  const [userCoords,     setUserCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [sort,           setSort]           = useState<SortMode>('popular');
  const [page,           setPage]           = useState(1);

  const isFiltered = !!(activeCategory || slotToday || nearbyActive);

  useEffect(() => { setPage(1); }, [activeCategory, slotToday, nearbyActive, sort]);

  const resetFilters = useCallback(() => {
    setActiveCategory(null);
    setSlotToday(false);
    setNearbyActive(false);
  }, []);

  const toggleNearby = useCallback(() => {
    if (nearbyActive) { setNearbyActive(false); return; }
    if (userCoords)   { setNearbyActive(true);  return; }
    if (!('geolocation' in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearbyActive(true);
        setGeoLoading(false);
      },
      () => { setGeoLoading(false); }, // silent fail — no error shown
    );
  }, [nearbyActive, userCoords]);

  const proMasters   = useMemo(() => masters.filter(m => m.isPro), [masters]);
  const showFeatured = !isFiltered && proMasters.length >= 2;

  const processed = useMemo<ProcessedMaster[]>(() => {
    let result = masters;

    if (activeCategory) {
      const cat     = serviceCategories.find(c => c.id === activeCategory);
      const aliases = CATEGORY_ALIASES[activeCategory] ?? [];
      result = result.filter(m =>
        m.categories.includes(activeCategory) ||
        (cat && m.categories.includes(cat.label)) ||
        aliases.some(a => m.categories.includes(a))
      );
    }

    if (slotToday) result = result.filter(m => m.availableToday);

    const withDist: ProcessedMaster[] = result.map(m => ({
      ...m,
      distance:
        nearbyActive && userCoords && m.latitude !== null && m.longitude !== null
          ? haversineKm(userCoords.lat, userCoords.lng, m.latitude, m.longitude)
          : null,
    }));

    const sorted = [...withDist];

    if (nearbyActive && userCoords) {
      sorted.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sort === 'smart' && preferredCategories.length > 0) {
      sorted.sort((a, b) => {
        const sa = preferredCategories.filter(c => a.categories.includes(c)).length;
        const sb = preferredCategories.filter(c => b.categories.includes(c)).length;
        if (sa !== sb) return sb - sa;
        if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
        return b.ratingCount - a.ratingCount;
      });
    } else if (sort === 'rating') {
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
  }, [masters, activeCategory, slotToday, nearbyActive, userCoords, sort, preferredCategories]);

  const visible   = processed.slice(0, page * PAGE_SIZE);
  const hasMore   = visible.length < processed.length;
  const remaining = Math.min(processed.length - visible.length, PAGE_SIZE);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="mb-7"
        >
          <h1 className="heading-serif text-[3.25rem] leading-[0.88] font-medium uppercase tracking-wide text-foreground">
            Майстри<br />поруч
          </h1>
          <p className="text-[11px] text-muted-foreground/50 mt-3.5 tracking-widest uppercase font-medium">
            Нігті · Волосся · Брови · Краса
          </p>
        </motion.div>

        {/* ── Category pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.06 }}
          className="mb-4"
        >
          <CategoryPills
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            categoryCounts={categoryCounts}
            totalCount={masters.length}
          />
        </motion.div>

        {/* ── Filter bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.09 }}
          className="flex items-center gap-2 mb-6 flex-wrap"
        >
          <button
            type="button"
            onClick={toggleNearby}
            aria-pressed={nearbyActive}
            disabled={geoLoading}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap transition-all duration-150 ${
              nearbyActive
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-white/60 border border-border/50 text-foreground/70 hover:border-accent/30 disabled:opacity-60'
            }`}
          >
            {geoLoading ? (
              <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
            ) : (
              <Navigation size={12} />
            )}
            Поруч
          </button>

          <button
            type="button"
            onClick={() => setSlotToday(v => !v)}
            aria-pressed={slotToday}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap transition-all duration-150 ${
              slotToday
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-white/60 border border-border/50 text-foreground/70 hover:border-accent/30'
            }`}
          >
            <Clock size={12} />
            Є час сьогодні
          </button>

          <div className="ml-auto">
            <SortDropdown sort={sort} onChange={setSort} hasPreferred={preferredCategories.length > 0} />
          </div>
        </motion.div>

        {/* ── Result count ── */}
        <AnimatePresence>
          {isFiltered && (
            <motion.p
              key="count"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-muted-foreground/50 mb-3 font-medium"
            >
              {processed.length} {pluralUk(processed.length, 'майстер', 'майстри', 'майстрів')}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Featured PRO row ── */}
        <AnimatePresence>
          {showFeatured && (
            <motion.div
              key="featured"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ ...SPRING, delay: 0.12 }}
              className="mb-7"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Рекомендуємо</span>
                <span className="text-[10px] text-muted-foreground/40">
                  {proMasters.length} PRO {pluralUk(proMasters.length, 'майстер', 'майстри', 'майстрів')}
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
                {proMasters.slice(0, 8).map(m => <FeaturedCard key={m.id} master={m} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Smart sort label ── */}
        {sort === 'smart' && preferredCategories.length > 0 && !nearbyActive && processed.length > 0 && (
          <p className="text-[10px] font-bold text-accent/70 uppercase tracking-widest mb-3">
            Для тебе
          </p>
        )}

        {/* ── Masters grid ── */}
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <div className="size-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={20} className="text-accent/40" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1.5">Нікого не знайдено</p>
              <p className="text-xs text-muted-foreground/60 mb-5">Спробуй інші фільтри</p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-full bg-accent/10 text-accent text-xs font-semibold min-h-[44px] hover:bg-accent/20 transition-colors duration-150"
              >
                Скинути
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid grid-cols-2 gap-3"
            >
              {visible.map((master, i) => (
                <MasterCard key={master.id} master={master} index={i} showDistance={nearbyActive} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Load more ── */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex justify-center"
          >
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-3 rounded-full bg-white/70 border border-border/50 text-sm font-semibold text-foreground/70 hover:bg-white hover:border-accent/30 transition-all duration-150 min-h-[44px]"
            >
              Показати ще {remaining}
            </button>
          </motion.div>
        )}

        {/* ── Footer CTA ── */}
        {!hasMore && visible.length > 0 && (
          <div className="mt-12 text-center px-6 py-8 rounded-2xl bg-accent/5 border border-accent/10">
            <p className="text-sm font-semibold text-foreground mb-1.5">Ти майстер?</p>
            <p className="text-xs text-muted-foreground/60 mb-5 max-w-[260px] mx-auto leading-relaxed">
              Реєструйся — це безкоштовно. Перший запис можеш отримати вже сьогодні.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold min-h-[44px] hover:opacity-90 transition-opacity duration-150"
            >
              Приєднатись безкоштовно
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
