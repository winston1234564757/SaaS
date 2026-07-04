'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, CalendarSearch, Clock, MapPin, Navigation,
  ShoppingBag, Star, ChevronDown, Package, MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cancelBooking, submitReview } from '@/app/my/bookings/actions';
import { Sheet } from '@/components/ui/Sheet';
import { pluralUk } from '@/lib/utils/pluralUk';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

interface BookingService {
  id: string | null;
  name: string;
  price: number;
  duration: number;
}

interface OrderProduct {
  id: string | null;
  name: string;
  price: number;
  qty: number;
}

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

interface MasterGroupData {
  masterId: string;
  masterName: string;
  masterSlug: string;
  masterAvatarUrl?: string | null;
  bookings: UnifiedOrder[];
}

// Тони калібровані під дрібний (10px) текст пілів на Frost-тінтах: good/warn ≥4.9:1.
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Очікує',       color: '#9A4508',            bg: 'color-mix(in srgb, #9A4508 12%, transparent)' },
  confirmed: { label: 'Підтверджено', color: '#0B6B2E',            bg: 'color-mix(in srgb, #0B6B2E 12%, transparent)' },
  completed: { label: 'Завершено',    color: '#475569',            bg: 'color-mix(in srgb, #475569 12%, transparent)' },
  cancelled: { label: 'Скасовано',    color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)' },
  no_show:   { label: 'Не прийшов',  color: '#9A4508',            bg: 'color-mix(in srgb, #9A4508 10%, transparent)' },
  shipped:   { label: 'Відправлено', color: 'var(--primary)',     bg: 'color-mix(in srgb, var(--primary) 12%, transparent)' },
  new:       { label: 'Нове',        color: 'var(--primary)',     bg: 'color-mix(in srgb, var(--primary) 12%, transparent)' },
};

function getToday() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso: string) {
  const r = format(new Date(iso + 'T00:00:00'), 'EEEE, d MMMM', { locale: uk });
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function fmtShort(iso: string) {
  return format(new Date(iso + 'T00:00:00'), 'd MMM', { locale: uk });
}

function fmtPrice(p: number) {
  return p.toLocaleString('uk-UA') + ' ₴';
}

function getCfg(status: string) {
  return STATUS_CFG[status] ?? STATUS_CFG.pending;
}

function Avatar({ url, name, size }: { url?: string | null; name: string; size: number }) {
  if (url) {
    return (
      <div
        className="relative flex-shrink-0 rounded-full overflow-hidden border border-border"
        style={{ width: size, height: size }}
      >
        <Image src={url} alt={name} fill className="object-cover" sizes={`${size}px`} />
      </div>
    );
  }
  return (
    <div
      className="flex-shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const c = getCfg(status);
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
      style={{ color: c.color, background: c.bg }}
    >
      {c.label}
    </span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={11}
          className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'}
        />
      ))}
    </div>
  );
}

function CancelSheet({
  open,
  onOpenChange,
  bookingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} variant="bottom" title="Скасувати запис?">
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-sm text-text-sub leading-relaxed">
          Майстра повідомлять про скасування.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await cancelBooking(bookingId);
              onOpenChange(false);
              router.refresh();
            });
          }}
          className="h-11 w-full rounded-full bg-destructive text-white text-sm font-bold active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {pending ? '...' : 'Так, скасувати'}
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="h-11 w-full rounded-full bg-secondary border border-border text-foreground text-sm font-bold active:scale-[0.97] transition-transform"
        >
          Не скасовувати
        </button>
      </div>
    </Sheet>
  );
}

function ReviewSheet({
  open,
  onOpenChange,
  bookingId,
  orderId,
  masterId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId?: string;
  orderId?: string;
  masterId: string;
  onSuccess: (rating: number) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [pending, start] = useTransition();

  function reset() {
    setRating(0);
    setHover(0);
    setComment('');
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose} variant="bottom" title="Як пройшов візит?">
      <div className="flex flex-col gap-6 pb-2">
        <p className="text-sm text-text-sub">Ваш відгук допоможе іншим клієнтам</p>

        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <motion.button
              key={n}
              type="button"
              aria-label={`${n} ${pluralUk(n, 'зірка', 'зірки', 'зірок')}`}
              aria-pressed={rating === n}
              animate={{ scale: rating === n ? [1, 1.28, 1] : 1 }}
              transition={SPRING}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star
                size={38}
                className={cn(
                  'transition-colors duration-150',
                  n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-border'
                )}
              />
            </motion.button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Розкажіть детальніше — необов'язково"
          className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border text-sm text-foreground placeholder:text-text-sub outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="min-h-[44px] flex items-center text-sm text-text-sub font-medium active:opacity-60 transition-opacity"
          >
            Не зараз
          </button>
          <Button
            variant="primary"
            size="md"
            disabled={!rating || pending}
            isLoading={pending}
            onClick={() => {
              if (!rating) return;
              const r = rating;
              start(async () => {
                await submitReview({ bookingId, orderId, masterId, rating: r, comment });
                onSuccess(r);
                reset();
                onOpenChange(false);
              });
            }}
            className="ml-auto"
          >
            Надіслати
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function HeroCard({ order }: { order: UnifiedOrder }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const isToday = order.date === getToday();
  const services = order.services ?? [];
  const shown = services.slice(0, 3);
  const extra = services.length - 3;
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative rounded-3xl border border-primary/20 bg-primary/[0.06] p-5 overflow-hidden"
      >
        {/* Row 1: avatar + name + today chip + status */}
        <div className="flex items-center gap-3">
          <Avatar url={order.masterAvatarUrl} name={order.masterName} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="heading-serif text-lg text-foreground leading-tight">{order.masterName}</p>
              {isToday && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                  Сьогодні
                </span>
              )}
            </div>
          </div>
          <StatusPill status={order.status} />
        </div>

        {/* Date + time */}
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={13} className="text-primary flex-shrink-0" />
            <span className="text-[13px] font-semibold text-foreground">{fmtDate(order.date)}</span>
          </div>
          {order.startTime && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-text-sub flex-shrink-0" />
              <span className="text-xs text-text-sub">
                {order.startTime}{order.endTime ? ` — ${order.endTime}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Services as pills */}
        {shown.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {shown.map((s, i) => (
              <span
                key={i}
                className="text-xs bg-background/70 border border-border/60 rounded-full px-2.5 py-1 font-medium text-foreground whitespace-nowrap"
              >
                {s.name}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-xs bg-secondary/50 rounded-full px-2.5 py-1 text-text-sub whitespace-nowrap">
                +{extra} {pluralUk(extra, 'послуга', 'послуги', 'послуг')}
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {order.masterAddress && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-2xl bg-background/60 border border-border">
            <MapPin size={13} className="text-text-sub flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground">Де зустрічаємось</p>
              <p className="text-[11px] text-text-sub truncate mt-0.5">{order.masterAddress}</p>
              <a
                href={
                  order.masterLat && order.masterLng
                    ? `https://www.google.com/maps/dir/?api=1&destination=${order.masterLat},${order.masterLng}`
                    : `https://maps.google.com/?q=${encodeURIComponent(order.masterAddress)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary"
              >
                <Navigation size={9} />
                Маршрут
              </a>
            </div>
          </div>
        )}

        {/* Price + cancel */}
        <div className="mt-4 flex items-center justify-between">
          <span className="metric-value text-lg text-foreground">{fmtPrice(order.totalPrice)}</span>
          {canCancel && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="min-h-[44px] flex items-center text-xs text-text-sub hover:text-destructive transition-colors font-medium"
            >
              Скасувати запис
            </button>
          )}
        </div>
      </motion.div>

      <CancelSheet open={cancelOpen} onOpenChange={setCancelOpen} bookingId={order.id} />
    </>
  );
}

function CompactUpcomingRow({ order, index }: { order: UnifiedOrder; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-background border border-border"
    >
      <Avatar url={order.masterAvatarUrl} name={order.masterName} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{order.masterName}</p>
        <p className="text-xs text-text-sub mt-0.5">
          {fmtShort(order.date)}{order.startTime ? ` · ${order.startTime}` : ''}
        </p>
      </div>
      <StatusPill status={order.status} />
    </motion.div>
  );
}

function CompactBookingRow({ order }: { order: UnifiedOrder }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);

  const services = order.services ?? [];
  const first = services[0];
  const extra = services.length - 1;
  const canReview = order.status === 'completed' && !order.hasReview && !submitted;
  const reviewed = order.hasReview || submitted;

  return (
    <>
      <div className="flex flex-col gap-2 py-3 border-t border-border/40 first:border-t-0 first:pt-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <span className="text-xs text-text-sub font-medium flex-shrink-0">{fmtShort(order.date)}</span>
            {first && (
              <span className="text-xs bg-secondary rounded-full px-2 py-0.5 font-medium text-foreground max-w-[130px] truncate flex-shrink-0">
                {first.name}
              </span>
            )}
            {extra > 0 && (
              <span className="text-xs text-text-sub flex-shrink-0">+{extra}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusPill status={order.status} />
            <span className="text-xs font-bold text-foreground whitespace-nowrap">{fmtPrice(order.totalPrice)}</span>
          </div>
        </div>

        {canReview && (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="self-start h-11 px-4 rounded-full bg-secondary border border-border text-foreground text-xs font-semibold active:scale-[0.97] transition-transform flex items-center gap-1.5"
          >
            <Star size={11} className="text-amber-400" />
            Поділитись враженнями
          </button>
        )}

        {reviewed && (
          <div className="flex items-center gap-1.5">
            {submitted ? (
              <>
                <span className="text-[11px] text-text-sub">Ваша оцінка:</span>
                <StarRow rating={submittedRating} />
              </>
            ) : (
              <span className="text-[11px] text-text-sub">Ви вже залишили відгук</span>
            )}
          </div>
        )}
      </div>

      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        bookingId={order.id}
        masterId={order.masterId}
        onSuccess={r => { setSubmitted(true); setSubmittedRating(r); }}
      />
    </>
  );
}

function MasterGroup({ group, index }: { group: MasterGroupData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const shown = expanded ? group.bookings : group.bookings.slice(0, 3);
  const hasMore = group.bookings.length > 3;

  const rebookIds = group.bookings[0]?.services?.map(s => s.id).filter(Boolean).join(',') ?? '';
  const rebookHref = rebookIds
    ? `/${group.masterSlug}?services=${rebookIds}`
    : `/${group.masterSlug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: index * 0.05 }}
      className="rounded-3xl border border-border bg-background overflow-hidden"
    >
      {/* Row 1: avatar + master info */}
      <div className="flex flex-col p-4 gap-3">
        <div className="flex items-center gap-3">
          <Avatar url={group.masterAvatarUrl} name={group.masterName} size={44} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{group.masterName}</p>
            <p className="text-xs text-text-sub mt-0.5">
              {group.bookings.length} {pluralUk(group.bookings.length, 'візит', 'візити', 'візитів')}
            </p>
          </div>
        </div>

        {/* Row 2: action buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/my/messages?to=${group.masterId}`}
            className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 rounded-full bg-secondary border border-border text-foreground text-xs font-semibold active:scale-[0.97] transition-transform"
          >
            <MessageCircle size={14} />
            Написати
          </Link>
          <Button variant="primary" size="sm" onClick={() => router.push(rebookHref)} className="min-h-[44px] flex-1">
            Записатись знову
          </Button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map(b => (
            <CompactBookingRow key={b.id} order={b} />
          ))}
        </AnimatePresence>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-primary font-semibold active:opacity-70 transition-opacity"
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={SPRING}
              className="flex"
            >
              <ChevronDown size={14} />
            </motion.span>
            {expanded ? 'Сховати' : `Всі записи (${group.bookings.length})`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ShopOrderCard({ order, index }: { order: UnifiedOrder; index: number }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);

  const products = order.products ?? [];
  const shown = products.slice(0, 2);
  const extra = products.length - 2;
  const canReview = ['completed', 'shipped'].includes(order.status) && !order.hasReview && !submitted;
  const reviewed = order.hasReview || submitted;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: index * 0.04 }}
        className="rounded-3xl border border-border bg-background p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar url={order.masterAvatarUrl} name={order.masterName} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{order.masterName}</p>
              <p className="text-xs text-text-sub mt-0.5">{fmtShort(order.date)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusPill status={order.status} />
            <span className="text-sm font-bold text-foreground">{fmtPrice(order.totalPrice)}</span>
          </div>
        </div>

        {shown.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border/40 pt-3">
            {shown.map((p, i) => (
              <div key={i} className="flex justify-between items-center gap-2">
                <span className="text-xs text-text-sub truncate">
                  {p.name}
                  <span className="ml-1 text-text-sub">×{p.qty}</span>
                </span>
                <span className="text-xs text-text-sub flex-shrink-0">{fmtPrice(p.price * p.qty)}</span>
              </div>
            ))}
            {extra > 0 && (
              <p className="text-xs text-text-sub">
                і ще {extra} {pluralUk(extra, 'товар', 'товари', 'товарів')}
              </p>
            )}
          </div>
        )}

        {order.deliveryType === 'pickup' && order.pickupAt && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-text-sub">
            <Package size={12} className="flex-shrink-0" />
            <span>Самовивіз: {fmtShort(order.pickupAt.split('T')[0])}</span>
          </div>
        )}

        {canReview && (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="mt-3 h-11 px-4 rounded-full bg-secondary border border-border text-foreground text-xs font-semibold active:scale-[0.97] transition-transform flex items-center gap-1.5"
          >
            <Star size={11} className="text-amber-400" />
            Поділитись враженнями
          </button>
        )}

        {reviewed && (
          <div className="mt-2 flex items-center gap-1.5">
            {submitted ? (
              <>
                <span className="text-[11px] text-text-sub">Ваша оцінка:</span>
                <StarRow rating={submittedRating} />
              </>
            ) : (
              <span className="text-[11px] text-text-sub">Ви вже залишили відгук</span>
            )}
          </div>
        )}
      </motion.div>

      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        orderId={order.id}
        masterId={order.masterId}
        onSuccess={r => { setSubmitted(true); setSubmittedRating(r); }}
      />
    </>
  );
}

function UpcomingEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING}
      className="rounded-3xl border border-dashed border-border bg-secondary/30 p-8 flex flex-col items-center gap-3 text-center"
    >
      <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center">
        <CalendarSearch size={22} className="text-text-sub" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Поки нічого не заплановано</p>
        <p className="text-xs text-text-sub mt-1">Оберіть майстра і заплануйте наступний візит</p>
      </div>
      <Link
        href="/explore"
        className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center active:scale-[0.97] transition-transform"
      >
        Знайти майстра
      </Link>
    </motion.div>
  );
}

export function MyBookingsPage({ bookings }: { bookings: UnifiedOrder[] }) {
  const [tab, setTab] = useState<'bookings' | 'shop'>('bookings');
  const today = getToday();

  const bookingItems = bookings.filter(b => b.type === 'booking');
  const shopItems = bookings.filter(b => b.type === 'shop');

  const upcoming = bookingItems.filter(
    b => b.date >= today && ['pending', 'confirmed', 'new'].includes(b.status)
  );
  const past = bookingItems.filter(
    b => b.date < today || ['completed', 'cancelled', 'no_show'].includes(b.status)
  );

  const pendingShop = shopItems.filter(b => ['pending', 'new'].includes(b.status)).length;

  const masterGroups: MasterGroupData[] = [];
  const seenMasters = new Map<string, number>();
  for (const b of past) {
    const idx = seenMasters.get(b.masterId);
    if (idx !== undefined) {
      masterGroups[idx].bookings.push(b);
    } else {
      seenMasters.set(b.masterId, masterGroups.length);
      masterGroups.push({
        masterId: b.masterId,
        masterName: b.masterName,
        masterSlug: b.masterSlug,
        masterAvatarUrl: b.masterAvatarUrl,
        bookings: [b],
      });
    }
  }

  const heroCard = upcoming[0];
  const extraUpcoming = upcoming.slice(1);

  return (
    <div data-theme="frost" className="flex flex-col min-h-full bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-4 py-2">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/60">
          <button
            type="button"
            aria-pressed={tab === 'bookings'}
            onClick={() => setTab('bookings')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-[0.97]',
              tab === 'bookings'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-text-sub'
            )}
          >
            <CalendarDays size={13} />
            Записи
          </button>
          <button
            type="button"
            aria-pressed={tab === 'shop'}
            onClick={() => setTab('shop')}
            className={cn(
              'flex-1 relative flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-[0.97]',
              tab === 'shop'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-text-sub'
            )}
          >
            <ShoppingBag size={13} />
            Замовлення
            {pendingShop > 0 && (
              <span className="absolute -top-0.5 right-2 size-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingShop}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-28">
        <AnimatePresence mode="popLayout" initial={false}>
          {tab === 'bookings' ? (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={SPRING}
              className="flex flex-col gap-4"
            >
              <section className="flex flex-col gap-3">
                {heroCard ? (
                  <>
                    <HeroCard order={heroCard} />
                    {extraUpcoming.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest px-1">
                          Майбутні візити
                        </p>
                        {extraUpcoming.map((b, i) => (
                          <CompactUpcomingRow key={b.id} order={b} index={i} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <UpcomingEmpty />
                )}
              </section>

              {masterGroups.length > 0 && (
                <section className="flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest px-1">
                    Раніше
                  </p>
                  {masterGroups.map((g, i) => (
                    <MasterGroup key={g.masterId} group={g} index={i} />
                  ))}
                </section>
              )}

              {bookingItems.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="size-16 rounded-3xl bg-secondary/60 flex items-center justify-center">
                    <CalendarSearch size={28} className="text-text-sub" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Тут поки порожньо</p>
                    <p className="text-sm text-text-sub mt-1">Ваша історія візитів з'явиться тут</p>
                  </div>
                  <Link
                    href="/explore"
                    className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center active:scale-[0.97] transition-transform"
                  >
                    Знайти майстра
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="shop"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={SPRING}
              className="flex flex-col gap-3"
            >
              {shopItems.length > 0 ? (
                shopItems.map((o, i) => (
                  <ShopOrderCard key={o.id} order={o} index={i} />
                ))
              ) : (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="size-16 rounded-3xl bg-secondary/60 flex items-center justify-center">
                    <ShoppingBag size={28} className="text-text-sub" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Замовлень ще немає</p>
                    <p className="text-sm text-text-sub mt-1">Ваша історія замовлень з'явиться тут</p>
                  </div>
                  <Link
                    href="/explore"
                    className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center active:scale-[0.97] transition-transform"
                  >
                    Знайти майстра
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
