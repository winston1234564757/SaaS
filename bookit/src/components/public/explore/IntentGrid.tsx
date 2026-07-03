'use client';

import { Navigation, Clock, Calendar, BadgeCheck, Star, SlidersHorizontal, ArrowRight } from 'lucide-react';
import type { ElementType } from 'react';
import { pluralUk } from '@/lib/utils/pluralUk';

export type HeroMode = 'today' | 'tomorrow' | 'top';

interface Props {
  hero: { mode: HeroMode; count: number };
  slotToday: boolean;
  slotTomorrow: boolean;
  proOnly: boolean;
  nearbyActive: boolean;
  geoLoading: boolean;
  sortRating: boolean;
  onToggleToday: () => void;
  onToggleTomorrow: () => void;
  onTogglePro: () => void;
  onToggleNearby: () => void;
  onToggleTopRated: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

function chipCls(active: boolean) {
  return `flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold min-h-[44px] whitespace-nowrap flex-shrink-0 transition-colors duration-150 active:scale-95 ${
    active
      ? 'bg-accent text-accent-foreground shadow-sm'
      : 'bg-background/60 border border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
  }`;
}

export function IntentGrid({
  hero, slotToday, slotTomorrow, proOnly, nearbyActive, geoLoading, sortRating,
  onToggleToday, onToggleTomorrow, onTogglePro, onToggleNearby, onToggleTopRated,
  onOpenFilters, activeFilterCount,
}: Props) {
  const heroActive =
    hero.mode === 'today' ? slotToday : hero.mode === 'tomorrow' ? slotTomorrow : sortRating;
  const heroToggle =
    hero.mode === 'today' ? onToggleToday : hero.mode === 'tomorrow' ? onToggleTomorrow : onToggleTopRated;

  const heroTitle =
    hero.mode === 'today' ? 'Працюють сьогодні'
    : hero.mode === 'tomorrow' ? 'Працюють завтра'
    : 'Найкращий рейтинг';
  const heroSub =
    hero.mode === 'top'
      ? 'Майстри з найвищими оцінками'
      : `${hero.count} ${pluralUk(hero.count, 'майстер приймає', 'майстри приймають', 'майстрів приймають')}`;
  const HeroIcon: ElementType =
    hero.mode === 'today' ? Clock : hero.mode === 'tomorrow' ? Calendar : Star;

  return (
    <div className="space-y-2.5">
      {/* Hero intent — actionable shortcut, not a stat */}
      <button
        type="button"
        aria-pressed={heroActive}
        onClick={heroToggle}
        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] ${
          heroActive
            ? 'bg-accent text-accent-foreground shadow-md'
            : 'bento-card'
        }`}
      >
        <span
          className={`size-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            heroActive ? 'bg-accent-foreground/15' : 'bg-accent/10'
          }`}
        >
          <HeroIcon size={19} className={heroActive ? 'text-accent-foreground' : 'text-accent'} aria-hidden="true" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold leading-tight">{heroTitle}</span>
          <span className={`block text-[11px] mt-0.5 ${heroActive ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
            {heroSub}
          </span>
        </span>
        <ArrowRight size={16} className={`flex-shrink-0 ${heroActive ? 'text-accent-foreground/80' : 'text-muted-foreground'}`} aria-hidden="true" />
      </button>

      {/* Secondary intents + filters */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-0.5">
        <button type="button" onClick={onToggleNearby} aria-pressed={nearbyActive} disabled={geoLoading} className={`${chipCls(nearbyActive)} disabled:opacity-60`}>
          {geoLoading
            ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
            : <Navigation size={12} aria-hidden="true" />}
          Поруч
        </button>

        {hero.mode !== 'today' && (
          <button type="button" onClick={onToggleToday} aria-pressed={slotToday} className={chipCls(slotToday)}>
            <Clock size={12} aria-hidden="true" />
            Сьогодні
          </button>
        )}
        {hero.mode !== 'tomorrow' && (
          <button type="button" onClick={onToggleTomorrow} aria-pressed={slotTomorrow} className={chipCls(slotTomorrow)}>
            <Calendar size={12} aria-hidden="true" />
            Завтра
          </button>
        )}

        <button type="button" onClick={onTogglePro} aria-pressed={proOnly} className={chipCls(proOnly)}>
          <BadgeCheck size={12} aria-hidden="true" />
          PRO
        </button>

        {hero.mode !== 'top' && (
          <button type="button" onClick={onToggleTopRated} aria-pressed={sortRating} className={chipCls(sortRating)}>
            <Star size={12} aria-hidden="true" />
            Топ-рейтинг
          </button>
        )}

        <button
          type="button"
          onClick={onOpenFilters}
          className={chipCls(activeFilterCount > 0)}
          aria-label="Відкрити фільтри"
        >
          <SlidersHorizontal size={12} aria-hidden="true" />
          Фільтри
          {activeFilterCount > 0 && (
            <span className="ml-0.5 size-4 rounded-full bg-accent-foreground/25 text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
