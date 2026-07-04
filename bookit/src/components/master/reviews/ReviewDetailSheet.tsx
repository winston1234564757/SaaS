'use client';

import { Sheet } from '@/components/ui/Sheet';
import { EditorialCover } from '@/components/ui/EditorialCover';
import { Button } from '@/components/ui/Button';
import { Star, Eye, EyeOff, MessageSquare, Quote } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/dates';
import type { Review } from '@/lib/supabase/hooks/useReviews';

interface Props {
  review: Review | null;
  onClose: () => void;
  onTogglePublish: (id: string, current: boolean) => void;
  isToggling: string | null;
}

/**
 * DS-MODAL-03 — повний відгук клієнта. Дизайн-мова: темна обкладинка несе вердикт
 * (оцінка = домінанта, glow за настроєм), світле тіло — сам коментар + дія видимості.
 * Реюз C-CLI-01 (EditorialCover + Sheet srTitle + kit Button).
 */
export function ReviewDetailSheet({ review, onClose, onTogglePublish, isToggling }: Props) {
  return (
    <Sheet
      open={!!review}
      onOpenChange={(v) => !v && onClose()}
      srTitle={review ? `Відгук: ${review.client_name}` : 'Відгук'}
      maxWidth="md"
    >
      {review && (
        <ReviewDetailView
          review={review}
          busy={isToggling === review.id}
          onTogglePublish={() => onTogglePublish(review.id, review.is_published)}
        />
      )}
    </Sheet>
  );
}

// ── Presentational view (props-only → own-eyes прев'ю без auth) ──────────────────

export function ReviewDetailView({
  review, busy, onTogglePublish,
}: {
  review: Review;
  busy: boolean;
  onTogglePublish: () => void;
}) {
  // Тон обкладинки за настроєм оцінки (світлі on-dark тінти).
  const glow = review.rating >= 4 ? '#34D399' : review.rating === 3 ? '#FB923C' : '#F87171';

  return (
    <div className="flex flex-col gap-5 pb-2">
      {/* ── HERO: хто + вердикт-оцінка ── */}
      <EditorialCover glowColor={glow}>
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl flex items-center justify-center heading-serif text-2xl text-white bg-white/10 ring-1 ring-white/15 shrink-0">
            {review.client_name[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="heading-serif text-xl text-white truncate leading-tight">{review.client_name}</p>
            <p className="text-xs text-white/55 mt-0.5">
              {formatDateFull(review.booking_date ?? review.created_at)}
            </p>
          </div>
        </div>

        {/* Оцінка — домінанта */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
          <div className="flex items-center gap-1" aria-label={`Оцінка ${review.rating} з 5`}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                size={22}
                className={idx < review.rating ? 'text-amber-200 fill-current' : 'text-white/15 fill-current'}
                aria-hidden
              />
            ))}
          </div>
          <span className="metric-value text-2xl text-white leading-none ml-1">{review.rating}.0</span>
        </div>
      </EditorialCover>

      {/* ── ТІЛО: коментар ── */}
      {review.comment ? (
        <div className="bento-card p-5">
          <Quote size={16} className="text-text-sub mb-2" aria-hidden />
          <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-line">{review.comment}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-secondary/50 text-text-sub">
          <MessageSquare size={15} className="shrink-0" aria-hidden />
          <p className="text-sm">Клієнт залишив лише оцінку, без коментаря</p>
        </div>
      )}

      {/* ── Дія: видимість на публічній сторінці ── */}
      <Button
        variant={review.is_published ? 'secondary' : 'primary'}
        size="lg"
        fullWidth
        isLoading={busy}
        onClick={onTogglePublish}
      >
        {review.is_published ? (
          <><EyeOff size={16} /> Сховати від клієнтів</>
        ) : (
          <><Eye size={16} /> Показати на сторінці</>
        )}
      </Button>
    </div>
  );
}
