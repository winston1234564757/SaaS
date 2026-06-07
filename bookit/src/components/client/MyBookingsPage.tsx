'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, ExternalLink, X, Star, ChevronRight, Check, MapPin, Navigation } from 'lucide-react';
import { cancelBooking, submitReview } from '@/app/my/bookings/actions';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Очікує', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
  confirmed: { label: 'Підтверджено', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)' },
  completed: { label: 'Завершено', color: 'var(--muted-foreground)', bg: 'color-mix(in srgb, var(--muted-foreground) 12%, transparent)' },
  cancelled: { label: 'Скасовано', color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)' },
  no_show: { label: 'Не прийшов', color: 'var(--text-tertiary)', bg: 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)' },
};

interface OrderProduct { id: string | null; name: string; price: number; qty: number; }
interface BookingService { id: string | null; name: string; price: number; duration: number; }

interface UnifiedOrder {
  id: string;
  type: 'booking' | 'shop';
  date: string;
  startTime?: string;
  endTime?: string;
  status: string;
  totalPrice: number;
  notes: string | null;
  masterId: string;
  masterName: string;
  masterSlug: string;
  masterEmoji: string;
  masterAvatarUrl?: string | null;
  hasReview: boolean;
  services?: BookingService[];
  products?: OrderProduct[];
  deliveryType?: string;
  pickupAt?: string;
  masterAddress?: string;
  masterCity?: string;
  masterLat?: number;
  masterLng?: number;
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const result = format(d, 'EEEE, d MMMM', { locale: uk });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function formatPrice(price: number) {
  return price.toLocaleString('uk-UA') + ' ₴';
}

export function MyBookingsPage({ bookings }: { bookings: UnifiedOrder[] }) {
  const [tab, setTab] = useState<'bookings' | 'shop'>('bookings');

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const filtered = bookings.filter(b => {
    if (tab === 'bookings') return b.type === 'booking';
    return b.type === 'shop' || (b.products && b.products.length > 0);
  });

  const upcoming = filtered.filter(b =>
    b.date >= today && ['pending', 'confirmed', 'new'].includes(b.status)
  );
  const past = filtered.filter(b =>
    b.date < today || !['pending', 'confirmed', 'new'].includes(b.status)
  );

  return (
    <div className="flex flex-col gap-4 pb-12">
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-foreground mb-0.5">Мої замовлення</h1>
        <p className="text-sm text-muted-foreground/60">Історія ваших візитів та покупок</p>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-4 p-1 rounded-xl bg-secondary/50">
          <button
            type="button"
            aria-pressed={tab === 'bookings'}
            onClick={() => setTab('bookings')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all active:scale-[0.95] cursor-pointer flex items-center justify-center gap-1.5",
              tab === 'bookings' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60"
            )}
          >
            <CalendarDays size={14} /> Записи
          </button>
          <button
            type="button"
            aria-pressed={tab === 'shop'}
            onClick={() => setTab('shop')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all active:scale-[0.95] cursor-pointer flex items-center justify-center gap-1.5",
              tab === 'shop' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60"
            )}
          >
            <Clock size={14} /> Магазин
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bento-card p-10 text-center flex flex-col items-center justify-center">
          <div className="text-muted-foreground/30 mb-4">
            {tab === 'bookings' ? <CalendarDays size={32} /> : <Clock size={32} />}
          </div>
          <p className="text-sm font-bold text-foreground">
            {tab === 'bookings' ? 'Записів поки немає' : 'Замовлень поки немає'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Знайдіть майстра та оберіть {tab === 'bookings' ? 'послугу' : 'товар'}</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3 px-1">
            {tab === 'bookings' ? 'Найближчі записи' : 'Нові замовлення'}
          </p>
          <div className="flex flex-col gap-3">
            {upcoming.map((b, i) => <OrderCard key={b.id} order={b} index={i} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-2">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3 px-1">
            Минулі
          </p>
          <div className="flex flex-col gap-3">
            {past.map((b, i) => <OrderCard key={b.id} order={b} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function cn(...args: any[]) { return args.filter(Boolean).join(' '); }

function OrderCard({ order: b, index }: { order: UnifiedOrder; index: number }) {
  const router = useRouter();
  const [cancelPending, startCancelTransition] = useTransition();
  const [reviewPending, startReviewTransition] = useTransition();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const status = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
  const canCancel = b.type === 'booking' && ['pending', 'confirmed'].includes(b.status);
  const canReview = ['completed', 'shipped'].includes(b.status) && !b.hasReview && !reviewSubmitted;

  function handleCancel() {
    startCancelTransition(async () => {
      await cancelBooking(b.id);
      setConfirmCancel(false);
      router.refresh();
    });
  }

  function handleSubmitReview() {
    if (reviewRating === 0) return;
    startReviewTransition(async () => {
      await submitReview({
        bookingId: b.type === 'booking' ? b.id : undefined,
        orderId: b.type === 'shop' ? b.id : undefined,
        masterId: b.masterId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      setShowReview(false);
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring' as const, stiffness: 300, damping: 24 }}
      className="bento-card p-4 relative overflow-hidden"
    >
      {/* Type badge */}
      <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-secondary text-[9px] font-bold uppercase text-muted-foreground/60 tracking-tighter">
        {b.type === 'booking' ? 'Запис' : 'Магазин'}
      </div>

      <div className="flex items-start gap-3">
        <div className="size-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 bg-accent/10 overflow-hidden relative">
          {b.masterAvatarUrl ? (
            <Image src={b.masterAvatarUrl} alt={b.masterName} fill className="object-cover" />
          ) : (
            b.masterEmoji
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 pr-12">
            <p className="text-sm font-bold text-foreground truncate">{b.masterName}</p>
          </div>

          <div className="flex flex-col gap-1 mt-1.5">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={12} className="text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground font-medium">{formatDate(b.date)}</span>
              {b.type === 'booking' && (
                <span className="text-xs text-muted-foreground">· {b.startTime} – {b.endTime}</span>
              )}
            </div>

            {b.deliveryType === 'pickup' && b.pickupAt && (
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-primary" />
                <span className="text-xs text-primary font-bold">Самовивіз: {formatDate(b.pickupAt.split('T')[0])}</span>
              </div>
            )}

            {(b.deliveryType === 'pickup' || b.type === 'booking') && b.masterAddress && (
              <div className="flex items-start gap-1.5 mt-1 p-3 rounded-xl bg-secondary/40 border border-secondary">
                <MapPin size={14} className="text-muted-foreground/60 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-foreground leading-tight">Місце зустрічі</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{b.masterAddress}</p>
                  <a
                    href={b.masterLat && b.masterLng
                      ? `https://www.google.com/maps/dir/?api=1&destination=${b.masterLat},${b.masterLng}`
                      : `https://maps.google.com/?q=${encodeURIComponent(b.masterAddress)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-primary hover:underline"
                  >
                    <Navigation size={10} /> Маршрут
                  </a>
                </div>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: status.color, background: status.bg }}
              >
                {status.label}
              </span>
            </div>
          </div>

          {/* Services/Products list */}
          <div className="mt-3 flex flex-col gap-1.5 border-t border-secondary pt-3">
            {b.services?.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-medium">{s.name}</span>
                <span className="text-muted-foreground/60">{formatPrice(s.price)}</span>
              </div>
            ))}
            {b.products?.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-medium">
                  {p.name} <span className="text-[10px] opacity-60">×{p.qty}</span>
                </span>
                <span className="text-muted-foreground/60">{formatPrice(p.price * p.qty)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-base font-bold text-foreground">{formatPrice(b.totalPrice)}</span>
            {b.masterSlug && b.status === 'completed' && b.type === 'booking' && (() => {
              const ids = b.services?.map(s => s.id).filter(Boolean).join(',');
              const href = ids ? `/${b.masterSlug}?services=${ids}` : `/${b.masterSlug}`;
              return (
                <Link
                  href={href}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/90 transition-colors"
                >
                  Записатися знову <ChevronRight size={12} />
                </Link>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2">
            {canCancel && (
              <div>
                {!confirmCancel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Скасувати запис
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-destructive/8 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-destructive flex-1 font-medium">Скасувати цей запис?</p>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelPending}
                      className="px-3 py-1 bg-destructive text-white rounded-lg text-[10px] font-bold disabled:opacity-40 active:scale-[0.95] cursor-pointer transition-all"
                    >
                      {cancelPending ? '...' : 'Так'}
                    </button>
                    <button type="button" onClick={() => setConfirmCancel(false)} aria-label="Закрити" className="text-muted-foreground/60 p-1 active:scale-[0.95] cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {(canReview || reviewSubmitted) && (
              <div>
                {reviewSubmitted ? (
                  <div className="flex items-center gap-1.5 text-success bg-success/8 px-3 py-1.5 rounded-xl">
                    <Check size={12} />
                    <span className="text-[11px] font-bold">Дякуємо за відгук!</span>
                  </div>
                ) : !showReview ? (
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className="w-full py-2.5 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 active:scale-[0.95] cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Star size={14} className="text-warning" />
                    Залишити відгук
                  </button>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-secondary/50 rounded-xl p-4 overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 mb-3 justify-center">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            type="button"
                            key={n}
                            aria-label={`${n} ${n === 1 ? 'зірка' : n < 5 ? 'зірки' : 'зірок'}`}
                            aria-pressed={reviewRating === n}
                            onClick={() => setReviewRating(n)}
                            onMouseEnter={() => setHoverRating(n)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform active:scale-[0.95] cursor-pointer"
                          >
                            <Star
                              size={28}
                              className={
                                n <= (hoverRating || reviewRating)
                                  ? 'fill-accent text-accent'
                                  : 'text-muted-foreground/30'
                              }
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Як вам сервіс? (необов'язково)..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-md bg-secondary border border-border text-xs text-foreground placeholder-muted-foreground outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                      />

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() => setShowReview(false)}
                          className="text-[11px] text-muted-foreground/60 font-bold active:scale-[0.95] cursor-pointer"
                        >
                          Скасувати
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitReview}
                          disabled={reviewRating === 0 || reviewPending}
                          className="ml-auto px-5 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.95] cursor-pointer transition-all"
                        >
                          {reviewPending ? '...' : 'Надіслати'}
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {b.hasReview && !reviewSubmitted && (
              <p className="text-[10px] text-muted-foreground/60 font-medium italic">Ви вже залишили відгук про це замовлення</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
