'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Star, Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import type { Review } from '@/lib/supabase/hooks/useReviews';

interface Props {
  review: Review | null;
  onClose: () => void;
  onTogglePublish: (id: string, current: boolean) => void;
  isToggling: string | null;
}

/**
 * M-REVW-02: full review detail. Mirrors FlashDealDetailSheet adaptive Sheet
 * (Dialog desktop / vaul mobile) — full comment without truncation + visibility action.
 */
export function ReviewDetailSheet({ review, onClose, onTogglePublish, isToggling }: Props) {
  return (
    <Sheet
      open={!!review}
      onOpenChange={(v) => !v && onClose()}
      title="Відгук"
      maxWidth="md"
    >
      {review && (
        <div className="flex flex-col gap-5 pb-4">
          {/* Hero: client + date */}
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl flex items-center justify-center text-lg font-semibold shrink-0 bg-primary/15 text-primary">
              {review.client_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{review.client_name}</p>
              <p className="text-xs text-text-sub mt-0.5">
                {formatDateFull(review.booking_date ?? review.created_at)}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                size={20}
                className={idx < review.rating ? 'text-warning fill-current' : 'text-border fill-none'}
              />
            ))}
            <span className="text-lg font-bold text-foreground ml-2 tabular-nums">{review.rating}.0</span>
          </div>

          {/* Comment */}
          {review.comment ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {review.comment}
            </p>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-secondary/50 text-text-sub">
              <MessageSquare size={15} className="shrink-0" />
              <p className="text-sm">Клієнт залишив лише оцінку, без коментаря</p>
            </div>
          )}

          {/* Visibility action */}
          <button
            type="button"
            onClick={() => onTogglePublish(review.id, review.is_published)}
            disabled={isToggling === review.id}
            className={cn(
              'flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50',
              review.is_published
                ? 'bg-secondary/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                : 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] hover:opacity-90'
            )}
          >
            {isToggling === review.id ? (
              <Loader2 size={15} className="animate-spin" />
            ) : review.is_published ? (
              <><EyeOff size={15} /> Сховати від клієнтів</>
            ) : (
              <><Eye size={15} /> Показати на сторінці</>
            )}
          </button>
        </div>
      )}
    </Sheet>
  );
}
