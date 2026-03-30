import { motion } from 'framer-motion';
import { Star, Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/dates';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { useReviews } from '@/lib/supabase/hooks/useReviews';


export function ReviewsPage() {
  const { reviews, isLoading, togglePublish, isToggling } = useReviews();
  const { currentStep, nextStep, closeTour } = useTour('reviews', 1);

  const published = reviews.filter(r => r.is_published).length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

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
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Відгуки</h1>
        <p className="text-sm text-[#A8928D]">Керуйте відгуками клієнтів</p>
      </div>

      {/* Stats */}
      {!isLoading && reviews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Всього',     value: reviews.length,  color: '#789A99' },
            { label: 'Опублік.',   value: published,        color: '#5C9E7A' },
            { label: 'Сер. оцінка', value: avgRating,      color: '#D4935A' },
          ].map(s => (
            <div key={s.label} className="bento-card p-3 text-center">
              <p className="text-base font-bold text-[#2C1A14]">{s.value}</p>
              <p className="text-[10px] text-[#A8928D]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-[#789A99] animate-spin" />
          <p className="text-sm text-[#A8928D]">Завантаження відгуків...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E8E3] flex items-center justify-center">
            <MessageSquare size={26} className="text-[#A8928D]" />
          </div>
          <p className="text-sm font-semibold text-[#2C1A14]">Відгуків ще немає</p>
          <p className="text-xs text-[#A8928D]">Клієнти зможуть залишати відгуки після завершених записів</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bento-card p-4 transition-opacity ${!r.is_published ? 'opacity-60' : ''}`}
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
                    <p className="text-sm font-semibold text-[#2C1A14]">{r.client_name}</p>
                    <p className="text-[10px] text-[#A8928D]">
                      {formatDateFull(r.booking_date ?? r.created_at)}
                    </p>
                  </div>
                </div>

                {/* Publish toggle */}
                <button
                  onClick={() => togglePublish(r.id, r.is_published)}
                  disabled={isToggling === r.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50 ${
                    r.is_published
                      ? 'bg-[#5C9E7A]/12 text-[#5C9E7A] hover:bg-[#5C9E7A]/20'
                      : 'bg-white/70 border border-white/80 text-[#A8928D] hover:bg-white'
                  }`}
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
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < r.rating ? 'fill-[#D4935A] text-[#D4935A]' : 'text-[#E8D5CF]'}
                  />
                ))}
                <span className="text-xs font-bold text-[#2C1A14] ml-1.5">{r.rating}.0</span>
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-[#6B5750] mt-2 leading-relaxed">{r.comment}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
