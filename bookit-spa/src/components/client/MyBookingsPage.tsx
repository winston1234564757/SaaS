import { useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, ExternalLink, X, Star } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Очікує',       color: '#D4935A', bg: 'rgba(212,147,90,0.12)' },
  confirmed: { label: 'Підтверджено', color: '#5C9E7A', bg: 'rgba(92,158,122,0.12)' },
  completed: { label: 'Завершено',    color: '#A8928D', bg: 'rgba(168,146,141,0.12)' },
  cancelled: { label: 'Скасовано',   color: '#C05B5B', bg: 'rgba(192,91,91,0.12)' },
  no_show:   { label: 'Не прийшов',  color: '#8B7AB5', bg: 'rgba(139,122,181,0.12)' },
};

interface BookingService { id: string | null; name: string; price: number; duration: number; }

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  notes: string | null;
  masterId: string;
  masterName: string;
  masterSlug: string;
  masterEmoji: string;
  hasReview: boolean;
  services: BookingService[];
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const result = format(d, 'EEEE, d MMMM', { locale: uk });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function formatPrice(price: number) {
  return price.toLocaleString('uk-UA') + ' ₴';
}

async function cancelBooking(bookingId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancellation_reason: 'client_requested' })
    .eq('id', bookingId)
    .eq('client_id', user.id)
    .in('status', ['pending', 'confirmed']);
    
  // Fetch Edge Function or simply let it be without Telegram on client to avoid exposing token.
}

async function submitReview(params: {
  bookingId: string;
  masterId: string;
  rating: number;
  comment: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, master_id')
    .eq('id', params.bookingId)
    .eq('client_id', user.id)
    .eq('status', 'completed')
    .single();

  if (!booking) throw new Error('Booking not found or not eligible for review');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const clientName = profile?.full_name ?? 'Клієнт';

  await supabase
    .from('client_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  const { error } = await supabase
    .from('reviews')
    .insert({
      booking_id: params.bookingId,
      master_id: booking.master_id,
      client_id: user.id,
      client_name: clientName,
      rating: params.rating,
      comment: params.comment || null,
      is_published: true,
    });

  if (error) throw error;
}

export function MyBookingsPage({ bookings }: { bookings: Booking[] }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const upcoming = bookings.filter(b =>
    b.date >= today && ['pending', 'confirmed'].includes(b.status)
  );
  const past = bookings.filter(b =>
    b.date < today || !['pending', 'confirmed'].includes(b.status)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Мої записи</h1>
        <p className="text-sm text-[#A8928D]">Ваша історія та майбутні візити</p>
      </div>

      {bookings.length === 0 && (
        <div className="bento-card p-8 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-sm font-medium text-[#2C1A14]">Записів поки немає</p>
          <p className="text-xs text-[#A8928D] mt-1">Знайдіть майстра та запишіться онлайн</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <p className="text-xs font-bold text-[#A8928D] uppercase tracking-widest mb-2 px-1">
            Майбутні записи
          </p>
          <div className="flex flex-col gap-2">
            {upcoming.map((b, i) => <BookingCard key={b.id} booking={b} index={i} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-1">
          <p className="text-xs font-bold text-[#A8928D] uppercase tracking-widest mb-2 px-1">
            Минулі записи
          </p>
          <div className="flex flex-col gap-2">
            {past.map((b, i) => <BookingCard key={b.id} booking={b} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingCard({ booking: b, index }: { booking: Booking; index: number }) {
  const queryClient = useQueryClient();
  const [cancelPending, startCancelTransition] = useTransition();
  const [reviewPending, startReviewTransition] = useTransition();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const status = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
  const canCancel = ['pending', 'confirmed'].includes(b.status);
  const canReview = b.status === 'completed' && !b.hasReview && !reviewSubmitted;

  function handleCancel() {
    startCancelTransition(async () => {
      await cancelBooking(b.id);
      setConfirmCancel(false);
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
    });
  }

  function handleSubmitReview() {
    if (reviewRating === 0) return;
    startReviewTransition(async () => {
      await submitReview({
        bookingId: b.id,
        masterId: b.masterId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      setShowReview(false);
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
      className="bento-card p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'rgba(255, 210, 194, 0.55)' }}
        >
          {b.masterEmoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#2C1A14] truncate">{b.masterName}</p>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <CalendarDays size={11} className="text-[#A8928D]" />
              <span className="text-xs text-[#6B5750]">{formatDate(b.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-[#A8928D]" />
              <span className="text-xs text-[#6B5750]">{b.startTime} – {b.endTime}</span>
            </div>
          </div>

          {b.services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {b.services.map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-white/60 text-[#6B5750]">
                  {s.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5 gap-2">
            <span className="text-sm font-bold text-[#2C1A14]">{formatPrice(b.totalPrice)}</span>
            {b.masterSlug && b.status === 'completed' && (() => {
              const ids = b.services.map(s => s.id).filter(Boolean).join(',');
              const href = ids ? `/${b.masterSlug}?services=${ids}` : `/${b.masterSlug}`;
              return (
                <Link
                  to={href}
                  className="flex items-center gap-1 text-[11px] text-[#789A99] hover:text-[#5C7E7D] transition-colors"
                >
                  Записатися знову <ExternalLink size={10} />
                </Link>
              );
            })()}
          </div>

          {/* Cancel */}
          {canCancel && (
            <div className="mt-2.5">
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-[11px] text-[#C05B5B] hover:underline"
                >
                  Скасувати запис
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#C05B5B]/8 rounded-xl px-3 py-2">
                  <p className="text-[11px] text-[#C05B5B] flex-1">Скасувати цей запис?</p>
                  <button
                    onClick={handleCancel}
                    disabled={cancelPending}
                    className="text-[11px] font-semibold text-[#C05B5B] hover:opacity-70 disabled:opacity-40"
                  >
                    {cancelPending ? '...' : 'Так'}
                  </button>
                  <button onClick={() => setConfirmCancel(false)} className="text-[#A8928D] hover:text-[#6B5750]">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Review */}
          {(canReview || reviewSubmitted) && (
            <div className="mt-2.5">
              {reviewSubmitted ? (
                <p className="text-[11px] text-[#5C9E7A] font-medium">Дякуємо за відгук!</p>
              ) : !showReview ? (
                <button
                  onClick={() => setShowReview(true)}
                  className="text-[11px] text-[#789A99] hover:text-[#5C7E7D] transition-colors font-medium"
                >
                  Залишити відгук
                </button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/60 rounded-2xl p-3 overflow-hidden"
                  >
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-2.5">
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          onClick={() => setReviewRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={22}
                            className={
                              n <= (hoverRating || reviewRating)
                                ? 'fill-[#D4935A] text-[#D4935A]'
                                : 'text-[#E8D5CF]'
                            }
                          />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Розкажіть про свій досвід (необов'язково)..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-white/80 border border-white/80 text-xs text-[#2C1A14] placeholder-[#A8928D] outline-none resize-none focus:border-[#789A99] transition-colors"
                    />

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setShowReview(false)}
                        className="text-[11px] text-[#A8928D] hover:text-[#6B5750]"
                      >
                        Скасувати
                      </button>
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewRating === 0 || reviewPending}
                        className="ml-auto px-3 py-1.5 rounded-xl bg-[#789A99] text-white text-[11px] font-semibold hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
                      >
                        {reviewPending ? 'Відправляємо...' : 'Відправити'}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}

          {b.hasReview && !reviewSubmitted && (
            <p className="mt-2 text-[11px] text-[#A8928D]">Відгук залишено</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
