'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Search, X, SlidersHorizontal, Sparkles, ArrowRight, LayoutGrid, AlignJustify } from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';
import { pluralUk } from '@/lib/utils/pluralUk';
import { haversineKm } from '@/lib/utils/haversine';
import {
  SPRING, PAGE_SIZE, CATEGORY_ALIASES,
  type SortMode, type ViewMode, type ExploreMaster, type ProcessedMaster,
} from './explore/shared';
import { SearchPortal } from './explore/SearchPortal';
import { IntentGrid, type HeroMode } from './explore/IntentGrid';
import { FilterSheet } from './explore/FilterSheet';
import { MasterCard, MasterListCard, SpotlightCard } from './explore/cards';
import { ReferralInviteCTA } from './explore/ReferralInviteCTA';
import { Button } from '@/components/ui/Button';

export type { ExploreMaster } from './explore/shared';

interface Props {
  masters: ExploreMaster[];
  categoryCounts: Record<string, number>;
  preferredCategories: string[];
  inviteCode: string | null;
}

// ─── Sticky compact search (appears once the portal scrolls away) ───────────────

function StickySearch({
  show, searchQuery, onSearchChange, onOpenFilters, activeFilterCount,
}: {
  show: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="fixed top-0 inset-x-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border md:hidden"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Пошук…"
                aria-label="Пошук майстрів"
                className="w-full min-h-[42px] pl-9 pr-8 rounded-full bg-secondary/60 border border-border text-sm text-foreground placeholder:text-text-sub focus:outline-none focus:border-accent/40 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Очистити пошук"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted/40 flex items-center justify-center text-text-sub active:scale-90"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onOpenFilters}
              aria-label="Фільтри"
              className="relative size-[42px] rounded-full bg-secondary/60 border border-border flex items-center justify-center text-foreground active:scale-90 transition-transform flex-shrink-0"
            >
              <SlidersHorizontal size={15} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────────

export function ExplorePage({ masters, categoryCounts, preferredCategories, inviteCode }: Props) {
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
  const [withReviews,    setWithReviews]    = useState(false);
  const [proOnly,        setProOnly]        = useState(false);
  const [viewMode,       setViewMode]       = useState<ViewMode>('grid');
  const [filtersOpen,    setFiltersOpen]    = useState(false);
  const [portalGone,     setPortalGone]     = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const isFiltered = !!(activeCategory || slotToday || slotTomorrow || nearbyActive || searchQuery || priceMax !== null || proOnly || withReviews || sort !== 'popular');

  const activeFilterCount =
    (priceMax !== null ? 1 : 0) + (withReviews ? 1 : 0) + (sort !== 'popular' ? 1 : 0);

  useEffect(() => { setPage(1); }, [activeCategory, slotToday, slotTomorrow, nearbyActive, sort, searchQuery, priceMax, proOnly, withReviews]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setPortalGone(!entry!.isIntersecting),
      { rootMargin: '-4px 0px 0px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const resetFilters = useCallback(() => {
    setActiveCategory(null);
    setSlotToday(false);
    setSlotTomorrow(false);
    setNearbyActive(false);
    setSearchQuery('');
    setPriceMax(null);
    setWithReviews(false);
    setProOnly(false);
    setSort('popular');
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

  // Hero intent — real availability counts, honest fallback chain
  const hero = useMemo<{ mode: HeroMode; count: number }>(() => {
    const today    = masters.filter(m => m.availableToday).length;
    if (today > 0) return { mode: 'today', count: today };
    const tomorrow = masters.filter(m => m.availableTomorrow).length;
    if (tomorrow > 0) return { mode: 'tomorrow', count: tomorrow };
    return { mode: 'top', count: 0 };
  }, [masters]);

  // Spotlight — top PRO that actually has a photo; hidden otherwise
  const spotlight = useMemo(() => {
    const cands = masters.filter(m => m.isPro && (m.avatarUrl || m.portfolioPhotos[0]));
    if (!cands.length) return null;
    return [...cands].sort((a, b) => b.ratingCount - a.ratingCount || b.rating - a.rating)[0]!;
  }, [masters]);
  const showSpotlight = !isFiltered && !!spotlight;

  const processed = useMemo<ProcessedMaster[]>(() => {
    let result = masters;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.city ?? '').toLowerCase().includes(q) ||
        m.topServices.some(s => s.name.toLowerCase().includes(q)),
      );
    }

    if (activeCategory) {
      const cat     = serviceCategories.find(c => c.id === activeCategory);
      const aliases = CATEGORY_ALIASES[activeCategory] ?? [];
      result = result.filter(m =>
        m.categories.includes(activeCategory) ||
        (cat && m.categories.includes(cat.label)) ||
        aliases.some(a => m.categories.includes(a)),
      );
    }

    if (slotToday)    result = result.filter(m => m.availableToday);
    if (slotTomorrow) result = result.filter(m => m.availableTomorrow);
    if (proOnly)      result = result.filter(m => m.isPro);
    if (withReviews)  result = result.filter(m => m.ratingCount > 0);
    if (priceMax !== null) result = result.filter(m => m.minPrice === null || m.minPrice <= priceMax);

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
      sorted.sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
    } else {
      sorted.sort((a, b) => {
        if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
        return b.ratingCount - a.ratingCount;
      });
    }

    return sorted;
  }, [masters, searchQuery, activeCategory, slotToday, slotTomorrow, nearbyActive, userCoords, sort, preferredCategories, priceMax, proOnly, withReviews]);

  const forDisplay = showSpotlight && spotlight ? processed.filter(m => m.id !== spotlight.id) : processed;
  const visible    = forDisplay.slice(0, page * PAGE_SIZE);
  const hasMore    = visible.length < forDisplay.length;
  const remaining  = Math.min(forDisplay.length - visible.length, PAGE_SIZE);

  const isRecommended = (m: ExploreMaster) =>
    preferredCategories.some(c => m.categories.includes(c)) && m.ratingCount >= 3;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-transparent pb-28">

        <SearchPortal
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          categoryCounts={categoryCounts}
          totalCount={masters.length}
        />

        <StickySearch
          show={portalGone}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />

        <div ref={sentinelRef} aria-hidden="true" />

        <div className="max-w-2xl mx-auto px-4">

          {/* Intent grid */}
          <div className="mt-5">
            <IntentGrid
              hero={hero}
              slotToday={slotToday}
              slotTomorrow={slotTomorrow}
              proOnly={proOnly}
              nearbyActive={nearbyActive}
              geoLoading={geoLoading}
              sortRating={sort === 'rating'}
              onToggleToday={() => setSlotToday(v => !v)}
              onToggleTomorrow={() => setSlotTomorrow(v => !v)}
              onTogglePro={() => setProOnly(v => !v)}
              onToggleNearby={toggleNearby}
              onToggleTopRated={() => setSort(s => (s === 'rating' ? 'popular' : 'rating'))}
              onOpenFilters={() => setFiltersOpen(true)}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Geo error */}
          <AnimatePresence>
            {geoError && !nearbyActive && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-text-sub mt-3 flex items-center gap-1.5"
              >
                <span className="size-1.5 rounded-full bg-text-sub/40 flex-shrink-0" aria-hidden="true" />
                Геолокацію заблоковано. Дозволь її в налаштуваннях браузера.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Spotlight */}
          <AnimatePresence>
            {showSpotlight && spotlight && (
              <motion.div
                key="spotlight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ ...SPRING, delay: 0.08 }}
                className="mt-6"
              >
                <SpotlightCard master={spotlight} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Count + view toggle */}
          <div className="flex items-center justify-between mt-7 mb-3.5">
            {isFiltered && forDisplay.length > 0 ? (
              <p className="text-xs text-text-sub font-medium">
                {forDisplay.length} {pluralUk(forDisplay.length, 'майстер', 'майстри', 'майстрів')}
              </p>
            ) : sort === 'smart' && preferredCategories.length > 0 && !nearbyActive ? (
              <p className="text-xs font-semibold text-accent">Підібрано для тебе</p>
            ) : <span />}
            <div className="flex items-center gap-0.5 bg-secondary/50 p-1 rounded-full">
              <button
                type="button"
                aria-label="Сітка"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={`size-8 rounded-full flex items-center justify-center transition-all duration-150 ${
                  viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-text-sub hover:text-foreground'
                }`}
              >
                <LayoutGrid size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Список"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`size-8 rounded-full flex items-center justify-center transition-all duration-150 ${
                  viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-text-sub hover:text-foreground'
                }`}
              >
                <AlignJustify size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Results */}
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
                <div className="size-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={20} className="text-accent/50" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1.5">
                  {searchQuery ? `За «${searchQuery}» нікого не знайшли` : 'Нікого не знайшли'}
                </p>
                <p className="text-xs text-text-sub mb-5">
                  {searchQuery ? 'Спробуй інше слово або прибери фільтри' : 'Спробуй змінити фільтри'}
                </p>
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Скинути все
                </Button>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div key="grid" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visible.map((m, i) => (
                  <MasterCard key={m.id} master={m} index={i} showDistance={nearbyActive} isRecommended={isRecommended(m)} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="list" className="flex flex-col gap-2">
                {visible.map((m, i) => (
                  <MasterListCard key={m.id} master={m} index={i} showDistance={nearbyActive} isRecommended={isRecommended(m)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button variant="secondary" size="md" onClick={() => setPage(p => p + 1)}>
                Показати ще {remaining}
              </Button>
            </div>
          )}

          {/* Referral CTA — invite your master (C2B) */}
          {!hasMore && visible.length > 0 && (
            <ReferralInviteCTA inviteCode={inviteCode} />
          )}

          {/* Footer CTA — recruit masters */}
          {!hasMore && visible.length > 0 && (
            <div className="mt-4 text-center px-6 py-8 rounded-3xl bg-accent/5 border border-accent/10">
              <p className="text-sm font-semibold text-foreground mb-1.5">Ти майстер?</p>
              <p className="text-xs text-text-sub mb-5 max-w-[260px] mx-auto leading-relaxed">
                Приєднуйся безкоштовно. Перший запис можеш отримати вже сьогодні.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold min-h-[44px] hover:opacity-90 transition-opacity duration-150"
              >
                Стати майстром
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>

        <FilterSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          priceMax={priceMax}
          setPriceMax={setPriceMax}
          sort={sort}
          setSort={setSort}
          withReviews={withReviews}
          setWithReviews={setWithReviews}
          hasPreferred={preferredCategories.length > 0}
          onReset={resetFilters}
        />
      </div>
    </MotionConfig>
  );
}
