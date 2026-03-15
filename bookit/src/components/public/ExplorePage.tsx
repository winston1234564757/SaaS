'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, Sparkles, ChevronDown, SlidersHorizontal, X, Scissors } from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';

interface Master {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  city: string | null;
  rating: number;
  ratingCount: number;
  avatarEmoji: string;
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
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeCity, setActiveCity]       = useState<string | null>(null);
  const [sort, setSort]                   = useState<SortMode>('popular');
  const [showFilters, setShowFilters]     = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const filtered = useMemo(() => {
    let result = masters;

    if (activeCategory) {
      result = result.filter(m => m.categories.includes(activeCategory));
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

    // Sort
    const sorted = [...result];
    if (sort === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    } else if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // 'popular' — default server order (rating_count desc), PRO first among equals
    if (sort === 'popular') {
      sorted.sort((a, b) => {
        if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
        return b.ratingCount - a.ratingCount;
      });
    }

    return sorted;
  }, [masters, activeCategory, activeCity, search, sort]);

  const activeFiltersCount = [activeCategory, activeCity].filter(Boolean).length;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #FFD2C2 0%, #F0EAE8 50%, #D4E8E7 100%)' }}
    >
      <div className="max-w-lg mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="mb-6 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/50 border border-white/70 px-4 py-1.5 rounded-full mb-3">
            <Sparkles size={13} className="text-[#789A99]" />
            <span className="text-xs font-semibold text-[#6B5750]">Знайди свого майстра</span>
          </div>
          <h1 className="heading-serif text-3xl text-[#2C1A14] leading-tight">Красота поруч</h1>
          <p className="text-sm text-[#6B5750] mt-1">{masters.length} майстрів у Bookit</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 280, damping: 24 }}
          className="relative mb-3"
        >
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8928D]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ім'я, місто або спеціалізація..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8928D] hover:text-[#6B5750]">
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09, type: 'spring', stiffness: 280, damping: 24 }}
          className="flex gap-2 mb-4"
        >
          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
              activeFiltersCount > 0 || showFilters
                ? 'bg-[#789A99] text-white shadow-[0_3px_12px_rgba(120,154,153,0.3)]'
                : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
            }`}
          >
            <SlidersHorizontal size={12} />
            Фільтри
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#789A99] text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide flex-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                !activeCategory
                  ? 'bg-[#789A99] text-white shadow-[0_3px_12px_rgba(120,154,153,0.3)]'
                  : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
              }`}
            >
              ✨ Всі
            </button>
            {serviceCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#789A99] text-white shadow-[0_3px_12px_rgba(120,154,153,0.3)]'
                    : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
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
                {/* City filter */}
                <div>
                  <p className="text-[11px] font-semibold text-[#A8928D] uppercase tracking-wide mb-2">Місто</p>
                  <div className="relative">
                    <button
                      onClick={() => setShowCityDropdown(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/80 bg-white/70 text-sm text-[#2C1A14] hover:bg-white transition-colors"
                    >
                      <span className={activeCity ? 'text-[#2C1A14]' : 'text-[#A8928D]'}>
                        {activeCity ?? 'Будь-яке місто'}
                      </span>
                      <ChevronDown size={14} className={`text-[#A8928D] transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showCityDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-full left-0 right-0 mt-1 bento-card p-1 z-20 max-h-48 overflow-y-auto"
                        >
                          <button
                            onClick={() => { setActiveCity(null); setShowCityDropdown(false); }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${!activeCity ? 'bg-[#789A99]/12 text-[#5C7E7D] font-semibold' : 'text-[#6B5750] hover:bg-white/60'}`}
                          >
                            Будь-яке місто
                          </button>
                          {cities.map(city => (
                            <button
                              key={city}
                              onClick={() => { setActiveCity(city); setShowCityDropdown(false); }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${activeCity === city ? 'bg-[#789A99]/12 text-[#5C7E7D] font-semibold' : 'text-[#6B5750] hover:bg-white/60'}`}
                            >
                              {city}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="text-[11px] font-semibold text-[#A8928D] uppercase tracking-wide mb-2">Сортування</p>
                  <div className="flex gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSort(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          sort === opt.value
                            ? 'bg-[#789A99] text-white'
                            : 'bg-white/60 border border-white/80 text-[#6B5750] hover:bg-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setActiveCity(null); setActiveCategory(null); }}
                    className="text-xs text-[#C05B5B] font-medium hover:underline text-center"
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
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#A8928D] mb-3">
            Знайдено: {filtered.length}
          </motion.p>
        )}

        {/* Masters list */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm font-semibold text-[#2C1A14]">Нікого не знайдено</p>
            <p className="text-xs text-[#A8928D] mt-1">Спробуй інший запит або змінити фільтри</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((master, i) => (
              <MasterCard key={master.id} master={master} index={i} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-[#A8928D]">
            Ти майстер?{' '}
            <Link href="/register" className="text-[#789A99] font-semibold hover:underline">
              Приєднуйся безкоштовно →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function MasterCard({ master, index }: { master: Master; index: number }) {
  const masterCategories = serviceCategories.filter(c => master.categories.includes(c.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.3), type: 'spring', stiffness: 280, damping: 24 }}
    >
      <Link href={`/${master.slug}`} className="block">
        <div className="bento-card p-4 hover:shadow-lg transition-all active:scale-[0.99]">
          <div className="flex items-start gap-3.5">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative"
              style={{ background: 'rgba(255,210,194,0.5)' }}
            >
              {master.avatarEmoji}
              {master.isPro && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-[#D4935A] px-1 py-0.5 rounded-full leading-none">
                  PRO
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#2C1A14] truncate">{master.name}</p>
                {master.ratingCount > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star size={11} className="text-[#D4935A] fill-[#D4935A]" />
                    <span className="text-xs font-semibold text-[#2C1A14]">{master.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-[#A8928D]">({master.ratingCount})</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {master.city && (
                  <div className="flex items-center gap-1">
                    <MapPin size={10} className="text-[#A8928D]" />
                    <span className="text-[11px] text-[#A8928D]">{master.city}</span>
                  </div>
                )}
                {master.serviceCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Scissors size={10} className="text-[#A8928D]" />
                    <span className="text-[11px] text-[#A8928D]">{master.serviceCount} послуг</span>
                  </div>
                )}
              </div>

              {master.bio && (
                <p className="text-xs text-[#6B5750] mt-1.5 line-clamp-2 leading-relaxed">{master.bio}</p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {masterCategories.slice(0, 3).map(cat => (
                    <span
                      key={cat.id}
                      className="text-[10px] font-medium text-[#6B5750] bg-[#F5E8E3] px-2 py-0.5 rounded-full"
                    >
                      {cat.emoji} {cat.label}
                    </span>
                  ))}
                  {masterCategories.length > 3 && (
                    <span className="text-[10px] text-[#A8928D]">+{masterCategories.length - 3}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-[#789A99] flex-shrink-0 ml-2">
                  Записатись →
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
