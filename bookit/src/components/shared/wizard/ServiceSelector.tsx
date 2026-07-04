'use client';
// src/components/shared/wizard/ServiceSelector.tsx
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, Sparkles, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { formatDurationFull } from '@/lib/utils/dates';
import { fmt, slide } from './helpers';
import type { WizardService } from './types';
import { ServiceIcon } from '@/lib/service-icons';
import { ServiceDetailSheet, type ServiceDetailData } from './ServiceDetailSheet';
import { Button } from '@/components/ui/Button';

interface ServiceSelectorProps {
  services: WizardService[];
  selectedServices: WizardService[];
  onToggle: (sv: WizardService) => void;
  mode: 'client' | 'master';
  partners: Array<{ id: string; name: string; slug: string; emoji: string; avatarUrl?: string | null; category?: string }>;
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
  onDetail,
  c2cDiscountPct,
}: {
  services: WizardService[];
  selectedServices: WizardService[];
  onToggle: (svc: WizardService) => void;
  onDetail: (svc: WizardService) => void;
  c2cDiscountPct?: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + CARD_GAP;
    setActiveIdx(Math.min(Math.round(el.scrollLeft / step), services.length - 1));
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

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
            <motion.div
              key={svc.id}
              className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden snap-start border w-[67%] sm:w-[40%]"
              style={{
                borderColor: sel ? 'var(--accent)' : 'var(--border)',
                boxShadow: sel ? '0 0 0 1px var(--accent)' : undefined,
                background: sel
                  ? 'color-mix(in srgb, var(--accent) 8%, var(--surface))'
                  : 'var(--surface)',
              }}
            >
              {/* Selectable area */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onToggle(svc)}
                data-testid="service-card"
                aria-pressed={sel}
                aria-label={`${svc.name}, ${formatDurationFull(svc.duration)}, ${fmt(price)}`}
                className="flex flex-col flex-1 text-left cursor-pointer"
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
                    <span className="absolute top-2 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-background/85 backdrop-blur-sm ring-1 ring-primary/25 px-2 py-0.5 rounded-full">
                      <Sparkles size={9} className="text-primary" /> Хіт
                    </span>
                  )}

                  {/* Selection indicator */}
                  <div
                    aria-hidden="true"
                    className={`absolute top-2 right-2.5 size-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
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
                  <p className="text-[11px] text-text-sub flex items-center gap-1 mt-1">
                    <Clock size={9} />
                    {formatDurationFull(svc.duration)}
                  </p>
                  <div className="mt-auto pt-2.5">
                    {c2cDiscountPct ? (
                      <>
                        <p className={`metric-value text-base leading-tight ${sel ? 'text-primary' : 'text-foreground'}`}>
                          {fmt(price)}
                        </p>
                        <p className="text-[10px] text-text-sub line-through leading-none mt-0.5">
                          {fmt(svc.price)}
                        </p>
                      </>
                    ) : (
                      <p className={`metric-value text-base ${sel ? 'text-primary' : 'text-foreground'}`}>
                        {fmt(price)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>

              {/* Detail trigger — separate from tap-to-select */}
              <button
                type="button"
                onClick={() => onDetail(svc)}
                aria-label={`Детальніше про послугу ${svc.name}`}
                className="shrink-0 py-2.5 text-center text-xs font-semibold text-text-sub border-t border-border hover:text-foreground hover:bg-secondary/40 active:scale-[0.98] transition-colors cursor-pointer"
              >
                Детальніше
              </button>
            </motion.div>
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
            className="size-11 rounded-full bg-secondary border border-border flex items-center justify-center text-text-sub hover:text-foreground hover:bg-secondary/80 active:scale-[0.9] transition-all disabled:opacity-25"
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
                    : 'size-1.5 bg-foreground/20'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollBy('next')}
            disabled={!canNext}
            aria-label="Наступна"
            className="size-11 rounded-full bg-secondary border border-border flex items-center justify-center text-text-sub hover:text-foreground hover:bg-secondary/80 active:scale-[0.9] transition-all disabled:opacity-25"
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
  const categories = [...new Set(services.map(s => s.category))];
  const canGoToDatetime = selectedServices.length > 0;
  const [detailService, setDetailService] = useState<WizardService | null>(null);

  const detailData: ServiceDetailData | null = detailService
    ? {
        id: detailService.id,
        name: detailService.name,
        category: detailService.category,
        price: detailService.price,
        duration: detailService.duration,
        description: detailService.description ?? null,
        imageUrl: detailService.image_url ?? null,
        iconName: detailService.icon_name,
        popular: detailService.popular,
      }
    : null;
  const detailSelected = !!detailService && selectedServices.some(s => s.id === detailService.id);
  const detailDiscounted = detailService && c2cDiscountPct
    ? Math.round(detailService.price * (1 - c2cDiscountPct / 100))
    : null;

  return (
    <motion.div key="services" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
      className="flex flex-col min-h-[400px]"
    >
      <div>
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="size-12 rounded-xl bg-secondary flex items-center justify-center">
              <Sparkles size={20} className="text-text-sub" />
            </div>
            <p className="text-sm font-semibold text-foreground">Послуг ще немає</p>
            <p className="text-xs text-text-sub">Додайте у розділі Послуги</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {categories.map(cat => (
              <div key={cat}>
                <p className="text-sm font-bold text-foreground mb-3">
                  {cat}
                </p>
                <CategoryCarousel
                  services={services.filter(s => s.category === cat)}
                  selectedServices={selectedServices}
                  onToggle={onToggle}
                  onDetail={setDetailService}
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
              <p className="text-sm font-bold text-foreground">
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
                  <div className="size-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : p.emoji ? (
                      <span className="text-2xl">{p.emoji}</span>
                    ) : (
                      <Sparkles size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-text-sub truncate lowercase italic">{p.category}</p>
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
                <label className="text-xs font-medium text-text-sub mb-1.5 flex items-center gap-1.5">
                  <Clock size={11} className="text-primary" />
                  Нестандартна тривалість, хв
                  <span className="font-normal text-text-sub">(необов'язково)</span>
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
                    aria-label="Нестандартна тривалість у хвилинах"
                    className="w-24 px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-text-sub outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {durationOverride !== null && (
                    <button
                      type="button"
                      onClick={() => { onDurationOverrideChange(null); onClearTime(); }}
                      className="text-xs text-text-sub hover:text-text-sub transition-colors"
                    >
                      Скинути
                    </button>
                  )}
                  <span className="text-xs text-text-sub">
                    {durationOverride !== null ? `стандарт: ${totalDuration}хв` : 'за послугами'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CTA — hero-band володіє сумою; дія тиха й чиста (kit Button, не pill) */}
      <div className="mt-auto pt-5 pb-2 sticky bottom-0 bg-gradient-to-t from-[var(--page-bg)] via-[var(--page-bg)]/90 to-transparent z-10">
        <AnimatePresence initial={false}>
          {canGoToDatetime && (
            <motion.div
              key="main-cta"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
            >
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onContinue}
                data-testid="wizard-next-btn"
                className="shadow-lg"
              >
                Далі
                <ArrowRight size={16} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {mode === 'client' && hasProducts && !canGoToDatetime && onSkipToProducts && (
          <Button variant="secondary" size="md" fullWidth onClick={onSkipToProducts}>
            Тільки товари
          </Button>
        )}
      </div>

      <ServiceDetailSheet
        open={!!detailService}
        onOpenChange={(o) => { if (!o) setDetailService(null); }}
        service={detailData}
        mode="client"
        isSelected={detailSelected}
        onSelect={() => { if (detailService) onToggle(detailService); }}
        discountedPrice={detailDiscounted}
      />
    </motion.div>
  );
}
