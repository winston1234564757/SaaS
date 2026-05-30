'use client';
// src/components/shared/wizard/ServiceSelector.tsx
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import { formatDurationFull } from '@/lib/utils/dates';
import { fmt, slide } from './helpers';
import type { WizardService } from './types';
import { ServiceIcon } from '@/lib/service-icons';

interface ServiceSelectorProps {
  services: WizardService[];
  selectedServices: WizardService[];
  onToggle: (sv: WizardService) => void;
  mode: 'client' | 'master';
  partners: Array<{ id: string; name: string; slug: string; emoji: string; category?: string }>;
  direction: number;
  durationOverride: number | null;
  totalDuration: number;
  effectiveDuration: number;
  totalServicesPrice: number;
  hasProducts?: boolean;
  onDurationOverrideChange: (v: number | null) => void;
  onClearTime: () => void;
  onContinue: () => void;
  onSkipToProducts?: () => void;
}

const CARD_GAP = 12;

// ── Horizontal carousel for one category ────────────────────────────────────
function CategoryCarousel({
  services,
  selectedServices,
  onToggle,
  c2cDiscountPct,
}: {
  services: WizardService[];
  selectedServices: WizardService[];
  onToggle: (svc: WizardService) => void;
  c2cDiscountPct?: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + CARD_GAP;
    setActiveIdx(Math.min(Math.round(el.scrollLeft / step), services.length - 1));
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, [services.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateState, { passive: true });
    updateState();
    return () => el.removeEventListener('scroll', updateState);
  }, [updateState]);

  function scrollBy(dir: 'prev' | 'next') {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | null;
    if (!card) return;
    el.scrollBy({ left: (card.offsetWidth + CARD_GAP) * (dir === 'next' ? 1 : -1), behavior: 'smooth' });
  }

  function scrollToIdx(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | null;
    if (!card) return;
    el.scrollTo({ left: idx * (card.offsetWidth + CARD_GAP), behavior: 'smooth' });
  }

  const showNav = services.length > 1;
  const dotsCount = Math.min(services.length, 8);

  return (
    <div className="flex flex-col gap-3">
      {/* Carousel track */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ gap: CARD_GAP, WebkitOverflowScrolling: 'touch' }}
      >
        {services.map(svc => {
          const sel = selectedServices.some(s => s.id === svc.id);
          const price = c2cDiscountPct
            ? Math.round(svc.price * (1 - c2cDiscountPct / 100))
            : svc.price;

          return (
            <motion.button
              key={svc.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onToggle(svc)}
              data-testid="service-card"
              aria-pressed={sel}
              aria-label={`${svc.name}, ${formatDurationFull(svc.duration)}, ${fmt(price)}`}
              className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden text-left cursor-pointer snap-start border w-[67%] sm:w-[40%]"
              style={{
                borderColor: sel ? 'var(--accent)' : 'var(--border)',
                boxShadow: sel ? '0 0 0 1px var(--accent)' : undefined,
                background: sel
                  ? 'color-mix(in srgb, var(--accent) 8%, var(--surface))'
                  : 'var(--surface)',
              }}
            >
              {/* Photo / placeholder */}
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                  minHeight: 108,
                  background: sel
                    ? 'color-mix(in srgb, var(--accent) 15%, var(--surface))'
                    : 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
                }}
              >
                {svc.image_url ? (
                  <img
                    src={svc.image_url}
                    alt={svc.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <ServiceIcon name={svc.icon_name} size={40} className="text-primary/30" />
                )}

                {svc.popular && (
                  <span className="absolute top-2 left-2.5 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/12 px-2 py-0.5 rounded-full">
                    популярне
                  </span>
                )}

                {/* Selection indicator */}
                <div
                  aria-hidden="true"
                  className={`absolute top-2 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                    sel ? 'bg-primary border-primary' : 'border-border/60 bg-background/50'
                  }`}
                >
                  {sel && <Check size={10} className="text-white" strokeWidth={3.5} />}
                </div>
              </div>

              {/* Info */}
              <div className="px-3 pt-2.5 pb-3 flex flex-col flex-1">
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {svc.name}
                </p>
                <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                  <Clock size={9} />
                  {formatDurationFull(svc.duration)}
                </p>
                <div className="mt-auto pt-2.5">
                  {c2cDiscountPct ? (
                    <>
                      <p className={`text-base font-bold tabular-nums leading-tight ${sel ? 'text-primary' : 'text-foreground'}`}>
                        {fmt(price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 line-through leading-none mt-0.5">
                        {fmt(svc.price)}
                      </p>
                    </>
                  ) : (
                    <p className={`text-base font-bold tabular-nums ${sel ? 'text-primary' : 'text-foreground'}`}>
                      {fmt(price)}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Nav row: arrows + dots */}
      {showNav && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => scrollBy('prev')}
            disabled={!canPrev}
            aria-label="Попередня"
            className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-[0.9] transition-all disabled:opacity-25"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: dotsCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIdx(i)}
                aria-label={`${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === activeIdx
                    ? 'w-4 h-1.5 bg-[var(--accent)]'
                    : 'w-1.5 h-1.5 bg-foreground/20'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollBy('next')}
            disabled={!canNext}
            aria-label="Наступна"
            className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-[0.9] transition-all disabled:opacity-25"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ServiceSelector ─────────────────────────────────────────────────────
export function ServiceSelector({
  services,
  selectedServices,
  onToggle,
  mode,
  partners,
  direction,
  durationOverride,
  totalDuration,
  effectiveDuration,
  totalServicesPrice,
  c2cDiscountPct,
  onDurationOverrideChange,
  onClearTime,
  onContinue,
  hasProducts = false,
  onSkipToProducts,
}: ServiceSelectorProps & { c2cDiscountPct?: number | null }) {
  const categories = useMemo(() => [...new Set(services.map(s => s.category))], [services]);
  const canGoToDatetime = selectedServices.length > 0;

  return (
    <motion.div key="services" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
      className="flex flex-col min-h-[400px]"
    >
      <div>
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Sparkles size={20} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-foreground">Послуг ще немає</p>
            <p className="text-xs text-muted-foreground/60">Додайте у розділі Послуги</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {categories.map(cat => (
              <div key={cat}>
                <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.12em] mb-3">
                  {cat}
                </p>
                <CategoryCarousel
                  services={services.filter(s => s.category === cat)}
                  selectedServices={selectedServices}
                  onToggle={onToggle}
                  c2cDiscountPct={c2cDiscountPct}
                />
              </div>
            ))}
          </div>
        )}

        {/* Recommended Partners */}
        {partners.length > 0 && (
          <div className="mt-8 mb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                Рекомендуємо також
              </p>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Наші партнери
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {partners.map(p => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="flex-shrink-0 w-[140px] bento-card p-3 flex flex-col items-center text-center gap-2 hover:bg-secondary/90 active:scale-[0.95] transition-transform duration-100 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Sparkles size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground/60 truncate lowercase italic">{p.category}</p>
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-primary border-t border-border pt-2 w-full">
                    Дивитись
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Duration override (master only) */}
        {mode === 'master' && (
          <div
            style={{
              display: 'grid',
              gridTemplateRows: selectedServices.length > 0 ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.28s ease',
            }}
          >
            <div style={{ overflow: 'hidden', minHeight: 0 }}>
              <div
                className="mt-4 mb-2"
                style={{
                  opacity: selectedServices.length > 0 ? 1 : 0,
                  transition: 'opacity 0.2s ease 0.05s',
                }}
              >
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Clock size={11} className="text-primary" />
                  Нестандартна тривалість, хв
                  <span className="font-normal text-muted-foreground/60">(необов'язково)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={5} max={480} step={5}
                    value={durationOverride ?? ''}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      onDurationOverrideChange(isNaN(v) ? null : Math.min(480, Math.max(5, v)));
                      onClearTime();
                    }}
                    placeholder={String(totalDuration)}
                    className="w-24 px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {durationOverride !== null && (
                    <button
                      type="button"
                      onClick={() => { onDurationOverrideChange(null); onClearTime(); }}
                      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      Скинути
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground/60">
                    {durationOverride !== null ? `стандарт: ${totalDuration}хв` : 'за послугами'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selection summary chip */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: selectedServices.length > 0 ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.28s ease',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div className="pt-4 pb-1">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/20"
                style={{
                  opacity: selectedServices.length > 0 ? 1 : 0,
                  transition: 'opacity 0.2s ease 0.05s',
                }}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 border border-primary/25 flex-shrink-0">
                  <Sparkles size={12} className="text-primary" />
                </div>
                <p className="text-xs text-muted-foreground flex-1 min-w-0 break-words leading-tight">
                  <span className="font-semibold text-foreground">
                    {selectedServices.length === 1
                      ? selectedServices[0].name
                      : pluralUk(selectedServices.length, 'послуга', 'послуги', 'послуг')}
                  </span>
                  <span className="ml-1 text-muted-foreground/60">
                    · {formatDurationFull(effectiveDuration)} · {fmt(totalServicesPrice)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-5 pb-2 sticky bottom-0 bg-gradient-to-t from-secondary via-secondary/90 to-transparent z-10">
        <button
          type="button"
          disabled={!canGoToDatetime}
          onClick={onContinue}
          data-testid="wizard-next-btn"
          className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-lg cursor-pointer ${
            canGoToDatetime
              ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] hover:opacity-90 active:scale-[0.95]'
              : 'bg-secondary/60 border border-border text-muted-foreground/60 cursor-not-allowed shadow-none'
          }`}
        >
          {canGoToDatetime
            ? `Далі · ${pluralUk(selectedServices.length, 'послуга', 'послуги', 'послуг')} · ${fmt(c2cDiscountPct ? Math.round(totalServicesPrice * (1 - c2cDiscountPct / 100)) : totalServicesPrice)}`
            : 'Обери послугу'}
        </button>
        {mode === 'client' && hasProducts && !canGoToDatetime && onSkipToProducts && (
          <button
            type="button"
            onClick={onSkipToProducts}
            className="w-full mt-3 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest text-primary border-2 border-primary/20 hover:bg-primary/5 active:scale-[0.95] transition-all bg-secondary/40 cursor-pointer"
          >
            Тільки товари
          </button>
        )}
      </div>
    </motion.div>
  );
}
