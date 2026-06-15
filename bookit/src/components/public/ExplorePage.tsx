'use client';

import { useState, useMemo, useEffect, useCallback, useRef, type ElementType } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Sparkles, Scissors, Eye, Smile, Hand, Flower2, Droplets,
  Zap, Circle, PenTool, MoreHorizontal, Star, MapPin,
  ChevronDown, Navigation, ArrowRight, Clock, Search, X,
  Calendar, BadgeCheck,
} from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';
import { pluralUk } from '@/lib/utils/pluralUk';
import { haversineKm, formatDistance } from '@/lib/utils/haversine';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;
const PAGE_SIZE = 12;

// ─── Auto-scroll hook ─────────────────────────────────────────────────────────

function useAutoScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const pauseFor10s = useCallback(() => {
    isPausedRef.current = true;
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 10_000);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    tickRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 4;
      if (atEnd) {
        el.scrollLeft = 0;
      } else {
        const child = el.firstElementChild as HTMLElement | null;
        const step = child ? child.offsetWidth + 8 : 96;
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 1500);

    el.addEventListener('touchstart', pauseFor10s, { passive: true });
    el.addEventListener('pointerdown', pauseFor10s);

    return () => {
      clearInterval(tickRef.current);
      clearTimeout(resumeTimerRef.current);
      el.removeEventListener('touchstart', pauseFor10s);
      el.removeEventListener('pointerdown', pauseFor10s);
    };
  }, [pauseFor10s]);

  return ref;
}

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

// ─── Category Pills — single horizontal scroll row ─────────────────────────────

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
  const scrollRef = useAutoScroll();
  const pillCls = (active: boolean) =>
    `flex items-center gap-1 px-3.5 py-2.5 rounded-full text-xs font-semibold min-h-[44px] flex-shrink-0 whitespace-nowrap transition-colors duration-150 active:scale-[0.95] ${
      active
        ? 'bg-accent text-accent-foreground shadow-sm'
        : 'bg-transparent border border-border/60 text-foreground/60 hover:border-accent/40'
    }`;

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label="Фільтр за категорією"
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-4 px-4"
    >
      <button
        type="button"
        aria-pressed={!activeCategory}
        onClick={() => onSelect(null)}
        className={pillCls(!activeCategory)}
      >
        <Sparkles size={11} aria-hidden="true" />
        Всі
        <span className={`text-[10px] ml-0.5 ${!activeCategory ? 'text-accent-foreground/70' : 'text-muted-foreground/50'}`}>
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
            className={`${pillCls(active)} ${cat.id === 'barber' ? '[&_svg]:rotate-90' : ''}`}
          >
            <Icon size={11} className="flex-shrink-0" aria-hidden="true" />
            {cat.label}
            {count > 0 && (
              <span className={`text-[10px] ml-0.5 flex-shrink-0 ${active ? 'text-accent-foreground/70' : 'text-muted-foreground/50'}`}>
                ·{count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Active Filters Bar ────────────────────────────────────────────────────────

type ActiveFilterItem = { key: string; label: string; onRemove: () => void };

function ActiveFiltersBar({ filters }: { filters: ActiveFilterItem[] }) {
  if (!filters.length) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-4 px-4 mb-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {filters.map(f => (
          <motion.span
            key={f.key}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={SPRING}
            className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold flex-shrink-0 whitespace-nowrap min-h-[36px]"
          >
            {f.label}
            <button
              type="button"
              onClick={f.onRemove}
              aria-label={`Скасувати фільтр ${f.label}`}
              className="size-5 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors duration-100"
            >
              <X size={9} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────

function SortDropdown({
  sort,
  onChange,
  hasPreferred,
  fullWidth,
}: {
  sort: SortMode;
  onChange: (s: SortMode) => void;
  hasPreferred: boolean;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const options: { value: SortMode; label: string }[] = [
    { value: 'popular', label: 'За популярністю' },
    { value: 'rating',  label: 'За рейтингом'   },
    { value: 'newest',  label: 'Новинки'         },
    ...(hasPreferred ? [{ value: 'smart' as SortMode, label: 'Для тебе' }] : []),
  ];

  const current = options.find(o => o.value === sort) ?? options[0]!;

  return (
    <div ref={ref} className={`relative${fullWidth ? ' w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap bg-white/60 border border-border/50 text-foreground/70 hover:border-accent/30 transition-colors duration-150${fullWidth ? ' w-full justify-between' : ''}`}
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
            style={{ transformOrigin: 'top right' }}
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

// ─── Price Dropdown ────────────────────────────────────────────────────────────

const PRICE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Будь-яка ціна' },
  { value: 300,  label: 'До 300₴'       },
  { value: 500,  label: 'До 500₴'       },
  { value: 1000, label: 'До 1000₴'      },
];

function PriceDropdown({
  priceMax,
  onChange,
  fullWidth,
}: {
  priceMax: number | null;
  onChange: (v: number | null) => void;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = PRICE_OPTIONS.find(o => o.value === priceMax) ?? PRICE_OPTIONS[0]!;
  const isActive = priceMax !== null;

  return (
    <div ref={ref} className={`relative${fullWidth ? ' w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap transition-colors duration-150${fullWidth ? ' w-full justify-between' : ''} ${
          isActive
            ? 'bg-accent text-accent-foreground shadow-sm'
            : 'bg-transparent border border-border/60 text-foreground/60 hover:border-accent/40'
        }`}
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
            style={{ transformOrigin: 'top left' }}
            className="absolute top-full left-0 mt-1.5 bento-card rounded-2xl p-1.5 z-30 min-w-[150px] shadow-lg"
          >
            {PRICE_OPTIONS.map(opt => (
              <button
                key={opt.value ?? 'any'}
                type="button"
                role="option"
                aria-selected={priceMax === opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors duration-150 active:scale-[0.98] ${
                  priceMax === opt.value
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
  const [photoError, setPhotoError] = useState(false);
  const photo = !photoError ? (master.avatarUrl ?? master.portfolioPhotos[0] ?? null) : null;

  return (
    <Link
      href={`/${master.slug}`}
      className="flex-shrink-0 block w-[140px] active:scale-[0.97] transition-transform duration-150"
    >
      <div className="bento-card overflow-hidden">
        <div className="relative h-[90px] overflow-hidden">
          {photo ? (
            <Image
              src={photo}
              alt={master.name}
              fill
              className="object-cover"
              sizes="140px"
              onError={() => setPhotoError(true)}
            />
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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bento-card overflow-hidden animate-pulse">
          <div className="aspect-[3/4] bg-muted/30" />
          <div className="h-10 bg-muted/20" />
          <div className="p-3.5 space-y-2">
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
  const [mainPhotoError, setMainPhotoError] = useState(false);
  const [stripErrors, setStripErrors] = useState<Set<number>>(new Set());

  const mainPhoto = !mainPhotoError ? (master.avatarUrl ?? master.portfolioPhotos[0] ?? null) : null;
  const strip = (master.avatarUrl
    ? master.portfolioPhotos.slice(0, 3)
    : master.portfolioPhotos.slice(1, 4)
  ).filter(url => url.trim());

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
                onError={() => setMainPhotoError(true)}
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
              ) : <span aria-hidden="true" />}
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
            {/* Depth scrim */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
          </div>

          {/* Portfolio strip */}
          {strip.length > 0 && (
            <div className="flex gap-px overflow-hidden h-10">
              {strip.map((url, i) => (
                <div key={i} className="relative flex-1 h-full overflow-hidden bg-muted/20">
                  {!stripErrors.has(i) && (
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="33vw"
                      aria-hidden="true"
                      onError={() => setStripErrors(prev => new Set(prev).add(i))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="p-3.5 space-y-1.5">
            <p className="text-sm font-bold text-foreground truncate leading-tight">{master.name}</p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-muted-foreground/60 truncate">
                {getCategoryLabel(master.categories)}
              </span>
              {master.ratingCount > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star size={9} className="text-warning fill-warning" />
                  <span className="text-xs font-semibold text-foreground">{master.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {master.minPrice !== null && master.minPrice > 0 && (
              <p className="text-xs font-medium text-muted-foreground/60">
                від {master.minPrice}₴
              </p>
            )}

            {/* CTA signal */}
            <div className="pt-2 mt-0.5 border-t border-accent/15 flex items-center justify-between">
              <span className="text-xs font-semibold text-accent">Записатись</span>
              <ArrowRight size={11} className="text-accent/60 flex-shrink-0" />
            </div>
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
  const [slotTomorrow,   setSlotTomorrow]   = useState(false);
  const [nearbyActive,   setNearbyActive]   = useState(false);
  const [geoLoading,     setGeoLoading]     = useState(false);
  const [geoError,       setGeoError]       = useState(false);
  const [userCoords,     setUserCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [sort,           setSort]           = useState<SortMode>('popular');
  const [page,           setPage]           = useState(1);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [priceMax,       setPriceMax]       = useState<number | null>(null);
  const [proOnly,        setProOnly]        = useState(false);
  const [withReviews,    setWithReviews]    = useState(false);

  const filterRowRef = useAutoScroll();

  const isFiltered = !!(activeCategory || slotToday || slotTomorrow || nearbyActive || searchQuery || priceMax !== null || proOnly || withReviews);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, slotToday, slotTomorrow, nearbyActive, sort, searchQuery, priceMax, proOnly, withReviews]);

  const resetFilters = useCallback(() => {
    setActiveCategory(null);
    setSlotToday(false);
    setSlotTomorrow(false);
    setNearbyActive(false);
    setSearchQuery('');
    setPriceMax(null);
    setProOnly(false);
    setWithReviews(false);
    setGeoError(false);
  }, []);

  const toggleNearby = useCallback(() => {
    if (nearbyActive) { setNearbyActive(false); return; }
    if (userCoords)   { setNearbyActive(true); setGeoError(false); return; }
    if (!('geolocation' in navigator)) { setGeoError(true); return; }
    setGeoLoading(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearbyActive(true);
        setGeoLoading(false);
        setGeoError(false);
      },
      () => { setGeoLoading(false); setGeoError(true); },
    );
  }, [nearbyActive, userCoords]);

  const proMasters   = useMemo(() => masters.filter(m => m.isPro), [masters]);
  const showFeatured = !isFiltered && proMasters.length >= 2;

  const processed = useMemo<ProcessedMaster[]>(() => {
    let result = masters;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.city ?? '').toLowerCase().includes(q) ||
        m.topServices.some(s => s.name.toLowerCase().includes(q))
      );
    }

    if (activeCategory) {
      const cat     = serviceCategories.find(c => c.id === activeCategory);
      const aliases = CATEGORY_ALIASES[activeCategory] ?? [];
      result = result.filter(m =>
        m.categories.includes(activeCategory) ||
        (cat && m.categories.includes(cat.label)) ||
        aliases.some(a => m.categories.includes(a))
      );
    }

    if (slotToday)    result = result.filter(m => m.availableToday);
    if (slotTomorrow) result = result.filter(m => m.availableTomorrow);
    if (proOnly)      result = result.filter(m => m.isPro);
    if (withReviews)  result = result.filter(m => m.ratingCount > 0);
    if (priceMax !== null) {
      result = result.filter(m => m.minPrice === null || m.minPrice <= priceMax);
    }

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
      sorted.sort((a, b) =>
        (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)
      );
    } else {
      sorted.sort((a, b) => {
        if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
        return b.ratingCount - a.ratingCount;
      });
    }

    return sorted;
  }, [masters, searchQuery, activeCategory, slotToday, slotTomorrow, nearbyActive, userCoords, sort, preferredCategories, priceMax, proOnly, withReviews]);

  const visible   = processed.slice(0, page * PAGE_SIZE);
  const hasMore   = visible.length < processed.length;
  const remaining = Math.min(processed.length - visible.length, PAGE_SIZE);

  const toggleClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap transition-colors duration-150 ${
      active
        ? 'bg-accent text-accent-foreground shadow-sm'
        : 'bg-transparent border border-border/60 text-foreground/60 hover:border-accent/40'
    }`;

  const searchLabel = searchQuery.length > 20
    ? `"${searchQuery.slice(0, 20)}…"`
    : `"${searchQuery}"`;

  // Active filter chips
  const activeFiltersList: ActiveFilterItem[] = [
    ...(activeCategory ? [{
      key: 'cat',
      label: serviceCategories.find(c => c.id === activeCategory)?.label ?? activeCategory,
      onRemove: () => setActiveCategory(null),
    }] : []),
    ...(slotToday     ? [{ key: 'today',    label: 'Сьогодні',    onRemove: () => setSlotToday(false)    }] : []),
    ...(slotTomorrow  ? [{ key: 'tomorrow', label: 'Завтра',      onRemove: () => setSlotTomorrow(false)  }] : []),
    ...(nearbyActive  ? [{ key: 'nearby',   label: 'Поруч',       onRemove: () => setNearbyActive(false)  }] : []),
    ...(proOnly       ? [{ key: 'pro',      label: 'PRO',         onRemove: () => setProOnly(false)       }] : []),
    ...(withReviews   ? [{ key: 'reviews',  label: 'З відгуками', onRemove: () => setWithReviews(false)   }] : []),
    ...(priceMax !== null ? [{ key: 'price', label: `до ${priceMax}₴`, onRemove: () => setPriceMax(null) }] : []),
    ...(searchQuery   ? [{ key: 'search',   label: searchLabel,   onRemove: () => setSearchQuery('')      }] : []),
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-transparent">
        <div
          className="max-w-2xl mx-auto px-4 pb-24"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)' }}
        >

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="mb-5"
          >
            <h1
              className="text-[4rem] leading-[0.88] font-normal text-foreground"
              style={{ fontFamily: 'var(--font-great-vibes, cursive)' }}
            >
              Майстри поруч
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/40 mt-2 font-medium">
              Краса поруч. Твій майстер чекає.
            </p>
          </motion.div>

          {/* ── Search ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.04 }}
            className="mb-3 relative"
          >
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ім'я, місто або послуга..."
              aria-label="Пошук майстрів за іменем, містом або послугою"
              className="w-full pl-9 pr-9 py-3 rounded-2xl bg-white/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 focus:bg-white/80 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 transition-all duration-150 min-h-[44px]"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Очистити пошук"
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/60 hover:bg-muted/60 transition-colors duration-150"
                >
                  <X size={10} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Category pills — horizontal scroll ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.06 }}
            className="mb-3"
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
            className="flex flex-col gap-2 mb-6"
          >
            {/* Row 1: toggle pills — scrollable */}
            <div ref={filterRowRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              <button
                type="button"
                onClick={toggleNearby}
                aria-pressed={nearbyActive}
                disabled={geoLoading}
                className={`${toggleClass(nearbyActive)} disabled:opacity-60 flex-shrink-0`}
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
                className={`${toggleClass(slotToday)} flex-shrink-0`}
              >
                <Clock size={12} />
                Сьогодні
              </button>

              <button
                type="button"
                onClick={() => setSlotTomorrow(v => !v)}
                aria-pressed={slotTomorrow}
                className={`${toggleClass(slotTomorrow)} flex-shrink-0`}
              >
                <Calendar size={12} />
                Завтра
              </button>

              <button
                type="button"
                onClick={() => setProOnly(v => !v)}
                aria-pressed={proOnly}
                className={`${toggleClass(proOnly)} flex-shrink-0`}
              >
                <BadgeCheck size={12} />
                PRO
              </button>

              <button
                type="button"
                onClick={() => setWithReviews(v => !v)}
                aria-pressed={withReviews}
                className={`${toggleClass(withReviews)} flex-shrink-0`}
              >
                <Star size={12} />
                З відгуками
              </button>
            </div>

            {/* Row 2: price + sort — equal width side by side */}
            <div className="flex gap-2">
              <PriceDropdown priceMax={priceMax} onChange={setPriceMax} fullWidth />
              <SortDropdown sort={sort} onChange={setSort} hasPreferred={preferredCategories.length > 0} fullWidth />
            </div>
          </motion.div>

          {/* ── Geo error nudge ── */}
          <AnimatePresence>
            {geoError && !nearbyActive && (
              <motion.p
                key="geo-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-muted-foreground/60 mb-3 flex items-center gap-1.5"
              >
                <span className="size-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" aria-hidden="true" />
                Геолокацію заблоковано. Дозволь у налаштуваннях.
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Active filter chips ── */}
          <ActiveFiltersBar filters={activeFiltersList} />

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
                  <span className="text-[11px] font-black text-accent tracking-[0.2em] uppercase">Рекомендуємо</span>
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
            <div className="mb-4">
              <p className="text-[10px] font-bold text-accent/70 uppercase tracking-widest">Для тебе</p>
              <p className="text-[9px] text-muted-foreground/40 mt-0.5">На основі твоїх записів</p>
            </div>
          )}

          {/* ── Masters grid ── */}
          <AnimatePresence mode="popLayout">
            {visible.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.06 }}
                  className="size-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles size={20} className="text-accent/40" />
                </motion.div>
                <p className="text-sm font-semibold text-foreground mb-1.5">
                  {searchQuery ? `За «${searchQuery}» нікого немає` : 'Нікого не знайдено'}
                </p>
                <p className="text-xs text-muted-foreground/60 mb-5">
                  {searchQuery ? 'Спробуй інше слово' : 'Спробуй інші фільтри'}
                </p>
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
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
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
              className="mt-10 flex justify-center"
            >
              <button
                type="button"
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-3 rounded-full bg-white/70 border border-border/50 text-sm font-semibold text-foreground/70 hover:bg-white hover:border-accent/30 transition-all duration-150 min-h-[44px] active:scale-[0.97]"
              >
                Показати ще {remaining}
              </button>
            </motion.div>
          )}

          {/* ── Footer CTA ── */}
          {!hasMore && visible.length > 0 && (
            <div className="mt-16 text-center px-6 py-8 rounded-2xl bg-accent/5 border border-accent/10">
              <p className="text-sm font-semibold text-foreground mb-1.5">Ти майстер?</p>
              <p className="text-xs text-muted-foreground/60 mb-5 max-w-[260px] mx-auto leading-relaxed">
                Реєструйся. Безкоштовно. Перший запис можеш отримати вже сьогодні.
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
    </MotionConfig>
  );
}
