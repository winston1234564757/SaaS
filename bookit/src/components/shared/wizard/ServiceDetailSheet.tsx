'use client';

import Image from 'next/image';
import { Clock, Star, Check, Plus, PencilLine } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { ServiceIcon, type ServiceIconName } from '@/lib/service-icons';
import { useServiceReviews } from '@/lib/supabase/hooks/useServiceReviews';
import { formatDurationFull, timeAgo } from '@/lib/utils/dates';
import { pluralUk } from '@/lib/utils/pluralUk';
import { fmt } from './helpers';

export interface ServiceDetailData {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description?: string | null;
  imageUrl?: string | null;
  iconName: ServiceIconName;
  popular?: boolean;
}

interface ServiceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceDetailData | null;
  mode: 'client' | 'master';
  /** Client mode: whether the service is currently in the selection */
  isSelected?: boolean;
  /** Client mode: toggle the service into / out of the selection */
  onSelect?: () => void;
  /** Discounted price hint (client C2C). When set, shows struck original. */
  discountedPrice?: number | null;
  /** Price formatter — defaults to ₴ (wizard `fmt`). Master passes "грн" variant. */
  formatPrice?: (n: number) => string;
}

function Stars({ value, size = 13, className = '' }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-warning text-warning' : 'fill-current text-current opacity-25'}
        />
      ))}
    </span>
  );
}

export function ServiceDetailSheet({
  open,
  onOpenChange,
  service,
  mode,
  isSelected = false,
  onSelect,
  discountedPrice = null,
  formatPrice = fmt,
}: ServiceDetailSheetProps) {
  const { reviews, count, average, isLoading } = useServiceReviews(service?.id ?? null, open);

  if (!service) return null;

  const hasDescription = !!service.description?.trim();
  const finalPrice = discountedPrice ?? service.price;
  const hasDiscount = discountedPrice != null && discountedPrice < service.price;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} variant="adaptive" maxWidth="lg" contentClassName="px-0 py-0">
      {/* Hero — dark slate block; serif title overlaid. Unified for photo + icon fallback. */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--hero-card-bg)] flex items-end">
        {service.imageUrl ? (
          <>
            <Image src={service.imageUrl} alt={service.name} fill sizes="(min-width: 640px) 512px, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/92 via-[#0B1120]/35 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/12">
            <ServiceIcon name={service.iconName} size={104} />
          </div>
        )}

        {service.popular && (
          <span className="absolute top-3.5 right-3.5 flex items-center gap-1 h-7 pl-2 pr-2.5 rounded-full bg-warning/95 shadow-sm">
            <Star size={12} className="fill-white text-white" />
            <span className="text-[11px] font-bold text-white tracking-wide">Хіт</span>
          </span>
        )}

        {/* Overlaid identity */}
        <div className="relative z-10 w-full px-6 pb-5 pt-12 flex flex-col gap-2">
          <span className="self-start text-[10px] uppercase tracking-[0.14em] font-bold text-white/90 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {service.category}
          </span>
          <h2 className="heading-serif text-[28px] leading-[1.08] text-white m-0 tracking-tight text-balance">
            {service.name}
          </h2>
          <span className="flex items-center gap-1.5 text-[13px] text-white/75">
            <Clock size={13} />
            {formatDurationFull(service.duration)}
          </span>
        </div>
      </div>

      <div className="px-6 pt-5 pb-8 flex flex-col gap-6">
        {/* Price — focal number */}
        <div className="flex items-baseline gap-2.5">
          <span className="metric-value text-[32px] leading-none text-foreground">{formatPrice(finalPrice)}</span>
          {hasDiscount && (
            <span className="metric-value text-base text-text-sub line-through leading-none">
              {formatPrice(service.price)}
            </span>
          )}
        </div>

        {/* Description — or master nudge when empty */}
        {hasDescription ? (
          <p className="text-[15px] text-foreground/85 leading-relaxed whitespace-pre-line max-w-[68ch]">
            {service.description}
          </p>
        ) : mode === 'master' ? (
          <div className="flex items-start gap-2.5 rounded-2xl bg-primary/8 border border-primary/15 px-4 py-3.5">
            <PencilLine size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-[13px] text-secondary leading-snug">Додайте опис, щоб клієнтам було легше обрати</p>
          </div>
        ) : null}

        {/* Reviews */}
        <div className="flex flex-col gap-3.5 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-[0.14em] m-0">Відгуки</h3>
            {count > 0 && (
              <span className="flex items-center gap-1.5 text-foreground">
                <Stars value={average} size={13} className="text-warning" />
                <span className="metric-value text-sm">{average.toFixed(1)}</span>
                <span className="text-xs text-text-sub font-medium">· {count}</span>
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1].map(i => (
                <div key={i} className="h-[68px] rounded-2xl bg-muted/12 animate-pulse" />
              ))}
            </div>
          ) : count === 0 ? (
            <p className="text-sm text-text-sub py-1.5">Відгуків поки немає</p>
          ) : (
            <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
              {reviews.map(r => (
                <li key={r.id} className="rounded-2xl bg-secondary/55 border border-border px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{r.client_name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Stars value={r.rating} size={11} className="text-warning" />
                      <span className="sr-only">{r.rating} з 5</span>
                      <span className="text-[11px] text-text-sub tabular-nums">{timeAgo(r.created_at)}</span>
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-foreground/75 leading-snug mt-2">{r.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* CTA — client only */}
      {mode === 'client' && onSelect && (
        <div className="sticky bottom-0 px-6 pt-4 pb-6 bg-gradient-to-t from-secondary via-secondary/97 to-transparent">
          <button
            type="button"
            onClick={() => { onSelect(); if (!isSelected) onOpenChange(false); }}
            aria-pressed={isSelected}
            className={`w-full py-4 rounded-[100px] font-bold text-sm uppercase tracking-[0.12em] transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
              isSelected
                ? 'bg-secondary border-2 border-primary/30 text-primary hover:bg-primary/5'
                : 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-lg hover:opacity-90'
            }`}
          >
            {isSelected ? (
              <><Check size={16} /> Прибрати</>
            ) : (
              <><Plus size={16} /> Обрати · {formatPrice(finalPrice)}</>
            )}
          </button>
        </div>
      )}
    </Sheet>
  );
}
