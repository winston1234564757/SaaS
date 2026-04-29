'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/dates';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { useReviews } from '@/lib/supabase/hooks/useReviews';
import { useMasterContext } from '@/lib/supabase/context';
import Link from 'next/link';

type Filter = 'all' | 'published' | 'hidden';

export function ReviewsPage() {
  const { reviews, isLoading, togglePublish, isToggling } = useReviews();
  const { masterProfile } = useMasterContext();
  const [filter, setFilter] = useState<Filter>('all');

  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('reviews', 1, {
    initialSeen: seenTours?.reviews ?? false,
    masterId: masterProfile?.id,
  });
  const isStarter = (masterProfile?.subscription_tier ?? 'starter') === 'starter';

  const publishedReviews = reviews.filter(r => r.is_published);
  const hiddenReviews = reviews.filter(r => !r.is_published);
  const published = publishedReviews.length;
  const hidden = hiddenReviews.length;

  const avg = (arr: typeof reviews) =>
    arr.length > 0 ? (arr.reduce((s, r) => s + r.rating, 0) / arr.length).toFixed(1) : '—';

  const avgAll       = avg(reviews);
  const avgPublished = avg(publishedReviews);
  const avgHidden    = avg(hiddenReviews);

  const filteredReviews = filter === 'all'
    ? reviews
    : filter === 'published'
      ? reviews.filter(r => r.is_published)
      : reviews.filter(r => !r.is_published);

  const filterPills: { key: Filter; label: string; count: number }[] = [
    { key: 'all',       label: 'Всі',       count: reviews.length },
    { key: 'published', label: 'Публічні',  count: published },
    { key: 'hidden',    label: 'Приховані', count: hidden },
  ];

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className={cn(
        'relative bento-card p-5 transition-all duration-500',
        currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="⭐ Ваш рейтинг"
          text="Тут будуть відгуки ваших клієнтів. Високий рейтинг піднімає вашу сторінку в пошуку. Не забувайте відповідати на коментарі!"
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
        <h1 className="heading-serif text-xl text-foreground mb-0.5">Відгуки</h1>
        <p className="text-sm text-muted-foreground/60">Керуйте відгуками клієнтів</p>
      </div>

      {/* Stats */}
      {!isLoading && reviews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Всі',        count: reviews.length, avg: avgAll,       countColor: '#789A99' },
            { label: 'Публічні',   count: published,      avg: avgPublished,  countColor: '#5C9E7A' },
            { label: 'Приховані',  count: hidden,         avg: avgHidden,     countColor: '#A8928D' },
          ].map(s => (
            <div key={s.label} className="bento-card p-3 text-center flex flex-col gap-0.5">
              <p className="text-base font-bold" style={{ color: s.countColor }}>{s.count}</p>
              <p className="text-[10px] text-muted-foreground/60">{s.label}</p>
              <div className="mt-1 pt-1 border-t border-secondary flex items-center justify-center gap-0.5">
                <Star size={9} className="fill-[#D4935A] text-warning" />
                <span className="text-[11px] font-semibold text-foreground">{s.avg}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pro nudge for Starter */}
      {isStarter && reviews.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/20">
          <span className="text-base flex-shrink-0">⭐</span>
          <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
            З <span className="font-semibold text-foreground">Pro</span> — автоматичні нагадування клієнтам залишити відгук після завершення запису
          </p>
          <Link href="/dashboard/billing?plan=pro"
            className="flex-shrink-0 text-[11px] font-semibold text-primary hover:text-primary/90 transition-colors whitespace-nowrap">
            Спробувати →
          </Link>
        </div>
      )}

      {/* Filter pills */}
      {!isLoading && reviews.length > 0 && (
        <div className="flex gap-2">
          {filterPills.map(pill => (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                filter === pill.key
                  ? 'bg-foreground text-white shadow-sm'
                  : 'bg-white/70 border border-white/80 text-muted-foreground hover:bg-white'
              )}
            >
              {pill.label}
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-lg',
                filter === pill.key
                  ? 'bg-white/20 text-white'
                  : 'bg-secondary text-muted-foreground/60'
              )}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-primary animate-spin" />
          <p className="text-sm text-muted-foreground/60">Завантаження відгуків...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
            <MessageSquare size={26} className="text-muted-foreground/60" />
          </div>
          <p className="text-sm font-semibold text-foreground">Відгуків ще немає</p>
          <p className="text-xs text-muted-foreground/60">Клієнти зможуть залишати відгуки після завершених записів</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bento-card p-8 flex flex-col items-center gap-2 text-center">
          <EyeOff size={22} className="text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">
            {filter === 'hidden' ? 'Прихованих відгуків немає' : 'Публічних відгуків немає'}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {filter === 'hidden'
              ? 'Усі відгуки зараз публічні'
              : 'Переключіть відгуки у "Публічний" режим'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filteredReviews.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className="bento-card p-4"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: 'rgba(255, 210, 194, 0.45)' }}
                    >
                      {r.client_name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">{r.client_name}</p>
                        {!r.is_published && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground/60">
                            прихований
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">
                        {formatDateFull(r.booking_date ?? r.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => togglePublish(r.id, r.is_published)}
                    disabled={isToggling === r.id}
                    title={r.is_published ? 'Сховати від клієнтів' : 'Показати на сторінці'}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50',
                      r.is_published
                        ? 'bg-success/12 text-success hover:bg-destructive/10 hover:text-destructive'
                        : 'bg-secondary text-muted-foreground/60 hover:bg-success/12 hover:text-success'
                    )}
                  >
                    {isToggling === r.id ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : r.is_published ? (
                      <><Eye size={11} /> Публічний</>
                    ) : (
                      <><EyeOff size={11} /> Прихований</>
                    )}
                  </button>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mt-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={14}
                      className={idx < r.rating ? 'fill-[#D4935A] text-warning' : 'text-secondary/80'}
                    />
                  ))}
                  <span className="text-xs font-bold text-foreground ml-1.5">{r.rating}.0</span>
                </div>

                {/* Comment */}
                {r.comment && (
                  <p className={cn(
                    'text-sm mt-2 leading-relaxed',
                    r.is_published ? 'text-muted-foreground' : 'text-muted-foreground/60'
                  )}>
                    {r.comment}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
