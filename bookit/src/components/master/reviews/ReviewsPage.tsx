'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Eye, EyeOff, Loader2, MessageSquare, ChevronDown, MessageSquareText } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/dates';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { useReviews, type Review } from '@/lib/supabase/hooks/useReviews';
import { useMasterContext } from '@/lib/supabase/context';
import { ReviewDetailSheet } from './ReviewDetailSheet';
import Link from 'next/link';

type PublishFilter = 'all' | 'published' | 'hidden';
type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',  label: 'Новіші спершу' },
  { key: 'oldest',  label: 'Старіші спершу' },
  { key: 'highest', label: 'Високий рейтинг' },
  { key: 'lowest',  label: 'Низький рейтинг' },
];

export function ReviewsPage() {
  const { reviews, isLoading, togglePublish, isToggling } = useReviews();
  const { masterProfile } = useMasterContext();

  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<Set<number>>(new Set());
  const [commentOnly, setCommentOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');
  const [detail, setDetail] = useState<Review | null>(null);

  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('reviews', 1, {
    initialSeen: seenTours?.reviews ?? false,
    masterId: masterProfile?.id,
  });
  const isStarter = (masterProfile?.subscription_tier ?? 'starter') === 'starter';

  const published = reviews.filter(r => r.is_published).length;
  const hidden = reviews.length - published;
  const avgAll = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 0;
  const avgRounded = Math.round(avgAll);

  // Rating distribution 5★ → 1★ (over all reviews — the true breakdown)
  const distribution = useMemo(
    () => [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
    })),
    [reviews]
  );
  const maxBar = Math.max(1, ...distribution.map(d => d.count));

  const visible = useMemo(() => {
    let arr = reviews;
    if (publishFilter === 'published') arr = arr.filter(r => r.is_published);
    else if (publishFilter === 'hidden') arr = arr.filter(r => !r.is_published);
    if (ratingFilter.size > 0) arr = arr.filter(r => ratingFilter.has(r.rating));
    if (commentOnly) arr = arr.filter(r => !!r.comment);

    const time = (r: Review) => +new Date(r.created_at);
    return [...arr].sort((a, b) => {
      switch (sort) {
        case 'oldest':  return time(a) - time(b);
        case 'highest': return b.rating - a.rating || time(b) - time(a);
        case 'lowest':  return a.rating - b.rating || time(b) - time(a);
        default:        return time(b) - time(a);
      }
    });
  }, [reviews, publishFilter, ratingFilter, commentOnly, sort]);

  const hasActiveFilters = publishFilter !== 'all' || ratingFilter.size > 0 || commentOnly;
  const resetFilters = () => {
    setPublishFilter('all');
    setRatingFilter(new Set());
    setCommentOnly(false);
  };
  const toggleRating = (star: number) => {
    setRatingFilter(prev => {
      const next = new Set(prev);
      if (next.has(star)) next.delete(star); else next.add(star);
      return next;
    });
  };

  const publishPills: { key: PublishFilter; label: string; count: number }[] = [
    { key: 'all',       label: 'Всі',       count: reviews.length },
    { key: 'published', label: 'Публічні',  count: published },
    { key: 'hidden',    label: 'Приховані', count: hidden },
  ];

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start">

        {/* Left rail: header + hero rating + distribution-filter + controls */}
        <div className="flex flex-col gap-4">

          {/* Header (tour anchor) */}
          <div className={cn(
            'relative bento-card p-5 transition-all duration-500',
            currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
          )}>
            <AnchoredTooltip
              isOpen={currentStep === 0}
              onClose={closeTour}
              title="Ваш рейтинг"
              text="Тут будуть відгуки ваших клієнтів. Високий рейтинг піднімає вашу сторінку в пошуку. Не забувайте відповідати на коментарі!"
              position="bottom"
              primaryButtonText="Зрозуміло"
              onPrimaryClick={nextStep}
            />
            <h1 className="heading-serif text-xl text-foreground mb-0.5">Відгуки</h1>
            <p className="text-sm text-text-sub">Керуйте відгуками клієнтів</p>
          </div>

          {/* Hero rating + distribution-as-filter */}
          {!isLoading && reviews.length > 0 && (
            <div className="bento-card p-5 flex flex-col gap-4">
              {/* Average — the headline outcome */}
              <div className="flex items-end gap-3">
                <span className="heading-serif text-5xl leading-none text-foreground tabular-nums">
                  {avgAll.toFixed(1)}
                </span>
                <div className="flex flex-col gap-1 pb-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < avgRounded ? 'text-warning fill-current' : 'text-border fill-none'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-sub tabular-nums">
                    {reviews.length} {pluralUk(reviews.length, 'відгук', 'відгуки', 'відгуків')}
                  </span>
                </div>
              </div>

              {/* Quiet secondary strip — no boxes */}
              <p className="text-xs text-text-sub tabular-nums">
                Публічні <span className="text-foreground font-semibold">{published}</span>
                <span className="mx-1.5 text-border">·</span>
                Приховані <span className="text-foreground font-semibold">{hidden}</span>
              </p>

              {/* Distribution rows — each one filters by that rating */}
              <div className="flex flex-col gap-1 pt-1 border-t border-secondary">
                {distribution.map(({ star, count }) => {
                  const active = ratingFilter.has(star);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => toggleRating(star)}
                      disabled={count === 0}
                      aria-pressed={active}
                      aria-label={`Показати оцінки ${star} ${pluralUk(star, 'зірка', 'зірки', 'зірок')}`}
                      className={cn(
                        'flex items-center gap-2.5 py-2 px-1.5 -mx-1.5 rounded-lg transition-all',
                        'disabled:opacity-40 disabled:cursor-default',
                        active ? 'bg-[var(--btn-primary-bg)]/10' : 'enabled:hover:bg-secondary/40',
                        count > 0 && 'active:scale-[0.99] cursor-pointer'
                      )}
                    >
                      <span className="flex items-center gap-0.5 w-9 shrink-0">
                        <span className={cn(
                          'text-xs font-semibold tabular-nums',
                          active ? 'text-foreground' : 'text-text-sub'
                        )}>
                          {star}
                        </span>
                        <Star size={11} className="text-warning fill-current" />
                      </span>
                      <span className="flex-1 h-2 rounded-full bg-secondary/70 overflow-hidden">
                        <span
                          className={cn('block h-full rounded-full transition-all', active ? 'bg-warning' : 'bg-warning/55')}
                          style={{ width: `${(count / maxBar) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right text-[11px] tabular-nums text-text-sub">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls: publish pills + comment toggle + sort */}
          {!isLoading && reviews.length > 0 && (
            <div className="flex flex-col gap-3">
              {/* Publish filter */}
              <div className="flex flex-wrap gap-2">
                {publishPills.map(pill => (
                  <button
                    type="button"
                    key={pill.key}
                    onClick={() => setPublishFilter(pill.key)}
                    aria-pressed={publishFilter === pill.key}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] cursor-pointer',
                      publishFilter === pill.key
                        ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-sm'
                        : 'bg-secondary/40 border border-border text-text-sub hover:bg-secondary/80'
                    )}
                  >
                    {pill.label}
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-lg tabular-nums',
                      publishFilter === pill.key
                        ? 'bg-[var(--accent-on)]/20 text-[var(--accent-on)]'
                        : 'bg-secondary text-text-sub'
                    )}>
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Comment-only toggle + sort */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCommentOnly(v => !v)}
                  aria-pressed={commentOnly}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] cursor-pointer',
                    commentOnly
                      ? 'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-sm'
                      : 'bg-secondary/40 border border-border text-text-sub hover:bg-secondary/80'
                  )}
                >
                  <MessageSquareText size={13} />
                  Лише з коментарем
                </button>

                <div className="relative flex-1 min-w-0">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="Сортування відгуків"
                    className="w-full appearance-none bg-secondary/40 border border-border rounded-xl text-xs font-semibold text-text-sub pl-3 pr-8 py-2 cursor-pointer transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-bg)]/30"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none" />
                </div>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="self-start text-xs font-semibold text-primary hover:text-primary/80 transition-colors active:scale-[0.96] cursor-pointer"
                >
                  Скинути фільтри
                </button>
              )}
            </div>
          )}

          {/* Pro nudge for Starter */}
          {isStarter && reviews.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/20">
              <Star size={16} className="text-primary flex-shrink-0" />
              <p className="text-xs text-text-sub flex-1 leading-relaxed">
                З <span className="font-semibold text-foreground">Pro</span> — автоматичні нагадування клієнтам залишити відгук після завершення запису
              </p>
              <Link href="/dashboard/billing?plan=pro"
                className="flex-shrink-0 text-[11px] font-semibold text-primary hover:text-primary/90 transition-colors whitespace-nowrap active:scale-[0.88] cursor-pointer">
                Спробувати →
              </Link>
            </div>
          )}
        </div>

        {/* Right: reviews list */}
        <div>
          {isLoading ? (
            <div className="bento-card p-10 flex flex-col items-center gap-3">
              <Loader2 size={24} className="text-primary animate-spin" />
              <p className="text-sm text-text-sub">Завантаження відгуків...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
              <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
                <MessageSquare size={26} className="text-text-sub" />
              </div>
              <p className="text-sm font-semibold text-foreground">Відгуків ще немає</p>
              <p className="text-xs text-text-sub">Клієнти зможуть залишати відгуки після завершених записів</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="bento-card p-8 flex flex-col items-center gap-2 text-center">
              <MessageSquare size={22} className="text-text-sub" />
              <p className="text-sm font-semibold text-foreground">Нічого не знайдено</p>
              <p className="text-xs text-text-sub">Спробуйте змінити або скинути фільтри</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors active:scale-[0.96] cursor-pointer"
              >
                Скинути фільтри
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
              <AnimatePresence mode="popLayout">
                {visible.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className="relative bento-card p-4"
                  >
                    {/* Full-card underlay button → detail (a11y: single primary action) */}
                    <button
                      type="button"
                      onClick={() => setDetail(r)}
                      aria-label={`Відгук від ${r.client_name}, оцінка ${r.rating} з 5`}
                      className="absolute inset-0 z-0 rounded-[inherit] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-bg)]/40"
                    />

                    <div className="relative z-10 pointer-events-none">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0 bg-primary/20 text-primary">
                            {r.client_name[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground">{r.client_name}</p>
                              {!r.is_published && (
                                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-secondary text-text-sub">
                                  прихований
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-text-sub">
                              {formatDateFull(r.booking_date ?? r.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Visibility toggle — exception to underlay */}
                        <button
                          type="button"
                          onClick={() => togglePublish(r.id, r.is_published)}
                          disabled={isToggling === r.id}
                          title={r.is_published ? 'Сховати від клієнтів' : 'Показати на сторінці'}
                          className={cn(
                            'pointer-events-auto relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.88] disabled:opacity-50 cursor-pointer',
                            r.is_published
                              ? 'bg-success/12 text-success hover:bg-destructive/10 hover:text-destructive'
                              : 'bg-secondary text-text-sub hover:bg-success/12 hover:text-success'
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
                            className={idx < r.rating ? 'text-warning fill-current' : 'text-border fill-none'}
                          />
                        ))}
                        <span className="text-xs font-bold text-foreground ml-1.5 tabular-nums">{r.rating}.0</span>
                      </div>

                      {/* Comment */}
                      {r.comment && (
                        <p className={cn(
                          'text-sm mt-2 leading-relaxed line-clamp-3',
                          r.is_published ? 'text-text-sub' : 'text-text-sub'
                        )}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <ReviewDetailSheet
        review={detail}
        onClose={() => setDetail(null)}
        onTogglePublish={togglePublish}
        isToggling={isToggling}
      />
    </div>
  );
}
