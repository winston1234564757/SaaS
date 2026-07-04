'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import type { SortMode } from './shared';

const PRICE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Будь-яка' },
  { value: 300,  label: 'До 300₴'  },
  { value: 500,  label: 'До 500₴'  },
  { value: 1000, label: 'До 1000₴' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  priceMax: number | null;
  setPriceMax: (v: number | null) => void;
  sort: SortMode;
  setSort: (s: SortMode) => void;
  withReviews: boolean;
  setWithReviews: (v: boolean) => void;
  hasPreferred: boolean;
  onReset: () => void;
}

export function FilterSheet({
  open, onOpenChange, priceMax, setPriceMax, sort, setSort, withReviews, setWithReviews, hasPreferred, onReset,
}: Props) {
  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'popular', label: 'За популярністю' },
    { value: 'rating',  label: 'За рейтингом'    },
    { value: 'newest',  label: 'Спочатку новіші' },
    ...(hasPreferred ? [{ value: 'smart' as SortMode, label: 'Підібрано для тебе' }] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Фільтри" variant="adaptive" maxWidth="md">
      <div className="space-y-7 pb-4">

        {/* Price */}
        <section>
          <h4 className="text-[13px] font-semibold text-foreground mb-2.5">Ціна</h4>
          <div className="grid grid-cols-4 gap-2">
            {PRICE_OPTIONS.map(opt => {
              const active = priceMax === opt.value;
              return (
                <button
                  key={opt.value ?? 'any'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPriceMax(opt.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors duration-150 active:scale-95 ${
                    active
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'bg-background/60 border border-border text-text-sub hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Sort */}
        <section>
          <h4 className="text-[13px] font-semibold text-foreground mb-2.5">Сортування</h4>
          <div className="flex flex-col gap-1.5">
            {sortOptions.map(opt => {
              const active = sort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSort(opt.value)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm min-h-[48px] transition-colors duration-150 active:scale-[0.99] ${
                    active
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {opt.label}
                  {active && <Check size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* With reviews */}
        <section>
          <button
            type="button"
            role="switch"
            aria-checked={withReviews}
            onClick={() => setWithReviews(!withReviews)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-background/60 border border-border min-h-[52px] active:scale-[0.99] transition-transform"
          >
            <span className="text-sm font-medium text-foreground">Лише з відгуками</span>
            <span
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                withReviews ? 'bg-accent' : 'bg-secondary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform duration-200 ${
                  withReviews ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>
        </section>

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <Button variant="secondary" size="md" fullWidth onClick={onReset}>
            Скинути
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={() => onOpenChange(false)}>
            Готово
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
