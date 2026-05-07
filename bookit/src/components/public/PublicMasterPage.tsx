'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, BadgeCheck, Share2, Instagram, Send, Clock, Zap, Gift, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MasterLocationCard } from './MasterLocationCard';
import { LoyaltyWidget } from './LoyaltyWidget';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Tooltip } from '@/components/ui/Tooltip';
import { moodThemes, type MoodThemeKey } from '@/lib/constants/themes';
import { pluralUk } from '@/lib/utils/pluralUk';
import Image from 'next/image';
import { formatDurationFull } from '@/lib/utils/dates';

function BookingFlowSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" aria-hidden="true">
      <div className="w-full max-w-sm mx-auto bg-white/90 rounded-t-3xl p-6 animate-pulse">
        <div className="w-12 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <div className="h-5 w-2/3 rounded-xl bg-gray-200 mb-4" />
        <div className="h-12 w-full rounded-2xl bg-gray-200 mb-3" />
        <div className="h-12 w-full rounded-2xl bg-gray-200 mb-3" />
        <div className="h-12 w-full rounded-2xl bg-gray-200 mb-5" />
        <div className="h-14 w-full rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

const BookingFlow = dynamic(() => import('./BookingFlow').then(m => ({ default: m.BookingFlow })), {
  ssr: false,
  loading: () => <BookingFlowSkeleton />,
});
import { getNow } from '@/lib/utils/now';
import { TrustedPartnersBlock, type TrustedPartner } from './TrustedPartnersBlock';
import { PublicPortfolioGallery } from './portfolio/PublicPortfolioGallery';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular: boolean;
  emoji: string;
  category: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  emoji: string;
  inStock: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  clientName: string;
  createdAt: string;
}

export interface FlashDeal {
  id: string;
  serviceId?: string;
  serviceName: string;
  slotDate: string;
  slotTime: string;
  originalPrice: number;
  discountPct: number;
  expiresAt: string;
}

interface Master {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  location: string;
  mapUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  floor?: string | null;
  cabinet?: string | null;
  emoji: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  tier: 'starter' | 'pro' | 'studio';
  bio: string;
  services: Service[];
  products?: Product[];
  reviews?: Review[];
  instagram: string | null;
  telegram: string | null;
  themeKey?: string;
  avatarEmoji?: string;
  avatarUrl?: string | null;
  schedule?: { day: string; isWorking: boolean; startTime: string; endTime: string }[];
  bookingsThisMonth?: number;
  pricingRules?: Record<string, any>;
  workingHours?: Record<string, unknown> | null;
  flashDeals?: FlashDeal[];
  loyalty?: {
    tiers: Array<{ targetVisits: number; rewardType: string; rewardValue: number }>;
    currentVisits: number;
    isAuth: boolean;
  } | null;
  trustedPartners?: TrustedPartner[];
  portfolio?: Array<{
    id: string;
    title: string;
    description: string | null;
    cover_url: string | null;
    photo_count: number;
    service_name: string | null;
    review_count: number;
  }>;
}

function formatPrice(price: number) {
  return price.toLocaleString('uk-UA') + ' ₴';
}

function ThemedBlobBackground({ theme }: { theme: typeof moodThemes[MoodThemeKey] }) {
  return (
    <div className="blob-container" aria-hidden="true">
      <div className="blob blob-1" style={{ background: `${theme.accent}28` }} />
      <div className="blob blob-2" style={{ background: `${theme.gradient[0]}55` }} />
      <div className="blob blob-3" style={{ background: `${theme.gradient[1]}60` }} />
      <div className="blob blob-4" style={{ background: `${theme.accent}18` }} />
    </div>
  );
}

// ── Flash Deals Strip ──────────────────────────────────────────────────────────

function useCountdown(expiresAt: string) {
  // Start as null to avoid SSR/client Date.now() mismatch (React #418)
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - getNow().getTime()) / 1000));
    setSecs(calc());
    const id = setInterval(() => setSecs(calc), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  if (secs === null || secs <= 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function FlashDealCard({ deal, accent, onBook }: { deal: FlashDeal; accent: string; onBook: () => void }) {
  const countdown = useCountdown(deal.expiresAt);
  const discounted = Math.round(deal.originalPrice * (1 - deal.discountPct / 100));
  const [mon, d] = deal.slotDate.split('-').slice(1).map(Number);
  const months = ['', 'січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
  const dateLabel = `${d} ${months[mon]}`;

  if (!countdown) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex-shrink-0 w-72 rounded-2xl p-4 border"
      style={{ background: `${accent}12`, borderColor: `${accent}35` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
            <Zap size={14} style={{ color: accent }} />
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight">{deal.serviceName}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap bg-primary/20 text-primary">
          -{deal.discountPct}%
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground/60">{dateLabel} о {deal.slotTime}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-foreground">{discounted} ₴</span>
            <span className="text-xs text-muted-foreground/60 line-through">{deal.originalPrice} ₴</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono font-bold" style={{ color: accent }}>
          <Clock size={12} />
          {countdown}
        </div>
      </div>

      <button
        onClick={onBook}
        className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 transition-all"
        style={{ background: accent }}
      >
        Записатися за акцією
      </button>
    </motion.div>
  );
}

function FlashDealsStrip({ deals, accent, onBook }: { deals: FlashDeal[]; accent: string; onBook: (deal: FlashDeal) => void }) {
  if (deals.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <Zap size={16} style={{ color: accent }} />
        <h2 className="heading-serif text-lg" style={{ color: '#2C1A14' }}>Флеш-акції</h2>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full animate-pulse bg-primary/20 text-primary">
          LIVE
        </span>
      </div>
      <div className={deals.length === 1 ? '' : 'flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide'}>
        <AnimatePresence>
          {deals.map(deal => (
            <FlashDealCard key={deal.id} deal={deal} accent={accent} onBook={() => onBook(deal)} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Availability hook ──────────────────────────────────────────────────────────
// Приймає master.schedule (з schedule_templates), а НЕ working_hours JSONB
type ScheduleEntry = { day: string; isWorking: boolean; startTime: string; endTime: string };

function useAvailability(schedule: ScheduleEntry[] | null | undefined) {
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);

  useEffect(() => {
    if (!schedule || schedule.length === 0) return;

    const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const DAY_UA: Record<string, string> = { mon: 'пн', tue: 'вт', wed: 'ср', thu: 'чт', fri: 'пт', sat: 'сб', sun: 'нд' };

    // Перетворюємо масив у map для O(1) пошуку
    const byDay = Object.fromEntries(schedule.map(s => [s.day, s]));

    const compute = () => {
      const now = getNow();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const todayKey = DOW_KEYS[now.getDay()];
      const today = byDay[todayKey];

      // Сьогодні вихідний
      if (!today?.isWorking) {
        for (let i = 1; i <= 7; i++) {
          const nextKey = DOW_KEYS[(now.getDay() + i) % 7];
          const next = byDay[nextKey];
          if (next?.isWorking) {
            return { open: false, label: `Зачинено · ${DAY_UA[nextKey]} о ${next.startTime}` };
          }
        }
        return { open: false, label: 'Вихідний' };
      }

      const [sh, sm] = today.startTime.split(':').map(Number);
      const [eh, em] = today.endTime.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;

      if (nowMins >= startMins && nowMins < endMins) {
        return { open: true, label: `Відкрито · до ${today.endTime}` };
      }
      if (nowMins < startMins) {
        return { open: false, label: `Зачинено · відкриється о ${today.startTime}` };
      }
      // Після закриття — шукаємо наступний робочий день (включно з наступним тижнем)
      for (let i = 1; i <= 7; i++) {
        const nextKey = DOW_KEYS[(now.getDay() + i) % 7];
        const next = byDay[nextKey];
        if (next?.isWorking) {
          return { open: false, label: `Зачинено · ${DAY_UA[nextKey]} о ${next.startTime}` };
        }
      }
      return { open: false, label: 'Зачинено' };
    };

    setStatus(compute());
    const id = setInterval(() => setStatus(compute()), 60_000);
    return () => clearInterval(id);
  }, [schedule]);

  return status;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function PublicMasterPage({
  master,
  c2cRefCode = null,
  c2cDiscountPct = null,
  masterC2cEnabled = false,
  masterC2cDiscountPct = null,
}: {
  master: Master;
  c2cRefCode?: string | null;
  c2cDiscountPct?: number | null;
  masterC2cEnabled?: boolean;
  masterC2cDiscountPct?: number | null;
}) {
  const themeKey = (master.themeKey ?? 'default') as MoodThemeKey;
  const theme = moodThemes[themeKey] ?? moodThemes.default;
  const isDark = themeKey === 'darkLuxe';

  const searchParams = useSearchParams();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [repeatServices, setRepeatServices] = useState<Service[] | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeFlashDeal, setActiveFlashDeal] = useState<FlashDeal | null>(null);
  // '' on SSR to avoid day-of-week mismatch (server UTC vs client UTC+3)
  const [todayDow, setTodayDow] = useState('');
  const [c2cReferrerBalance, setC2cReferrerBalance] = useState<number>(0);
  const didAutoOpen = useRef(false);
  const availability = useAvailability(master.schedule ?? null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Persist C2C ref to localStorage so it survives navigation (e.g. user registers then returns)
  useEffect(() => {
    if (typeof window === 'undefined' || !c2cRefCode) return;
    try {
      localStorage.setItem('bookit_ref', c2cRefCode);
      if (c2cDiscountPct != null) localStorage.setItem('bookit_ref_pct', String(c2cDiscountPct));
    } catch { /* localStorage blocked in private mode — safe to ignore */ }
  }, [c2cRefCode, c2cDiscountPct]);

  // Fetch C2C referrer balance for logged-in clients (shows accumulated bonus from referred friends)
  useEffect(() => {
    if (!hydrated || !masterC2cEnabled || !master.id || c2cRefCode) return;
    const sb = createClient();
    sb.auth.getUser().then((authRes: Awaited<ReturnType<typeof sb.auth.getUser>>) => {
      const user = authRes.data?.user;
      if (!user) return;
      sb.rpc('get_c2c_balance', { p_referrer_id: user.id, p_master_id: master.id })
        .then((rpcRes: { data: unknown; error: unknown }) => {
          if (typeof rpcRes.data === 'number') setC2cReferrerBalance(rpcRes.data);
        })
        .catch(() => {});
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, master.id, masterC2cEnabled]);

  useEffect(() => {
    document.body.style.backgroundColor = theme.background;
    return () => { document.body.style.backgroundColor = ''; };
  }, [theme.background]);

  useEffect(() => {
    setTodayDow(['sun','mon','tue','wed','thu','fri','sat'][getNow().getDay()]);
  }, []);

  // Auto-open BookingFlow with pre-selected services from ?services= or ?serviceId= query param
  useEffect(() => {
    if (didAutoOpen.current) return;

    // ?serviceId= — deep link з Floating Bar "Хочу так само"
    const serviceId = searchParams.get('serviceId');
    if (serviceId) {
      const service = master.services.find(s => s.id === serviceId);
      if (service) {
        didAutoOpen.current = true;
        setRepeatServices(null);
        setSelectedService(service);
        setBookingOpen(true);
        return;
      }
    }

    // ?services= — repeat booking (кілька послуг)
    const ids = searchParams.get('services');
    if (!ids) return;
    const idList = ids.split(',').filter(Boolean);
    const matched = master.services.filter(s => idList.includes(s.id));
    if (matched.length === 0) return;
    didAutoOpen.current = true;
    setRepeatServices(matched);
    setSelectedService(null);
    setBookingOpen(true);
  }, [searchParams, master.services]);

  const categories = [...new Set(master.services.map(s => s.category))];

  function openBooking(service?: Service, flashDeal?: FlashDeal) {
    setRepeatServices(null);
    setSelectedService(service ?? null);
    setActiveFlashDeal(flashDeal ?? null);
    setBookingOpen(true);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: master.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  const textSecondary = isDark ? 'rgba(240, 230, 210, 0.65)' : '#6B5750';
  const textTertiary = isDark ? 'rgba(240, 230, 210, 0.40)' : '#A8928D';
  const accentBg = isDark ? `${theme.accent}30` : `${theme.accent}18`;
  const avatarBg = isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 210, 194, 0.55)';
  const serviceEmojiCircleBg = isDark ? 'rgba(212, 175, 55, 0.10)' : 'rgba(255, 210, 194, 0.4)';
  const socialBtnBg = isDark ? 'rgba(255,255,255,0.08)' : '#F5E8E3';

  return (
    <div>
      <ThemedBlobBackground theme={theme} />

      <div className="relative z-0 max-w-lg mx-auto px-4 pb-32 pt-6" data-hydrated={hydrated}>
        {/* ── Referral Banner (friend discount — incoming ref link) ── */}
        <AnimatePresence>
          {c2cRefCode && c2cDiscountPct && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-[28px] border p-4 mb-4 shadow-sm"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${theme.accent}12, ${theme.gradient[0]}08)`,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : `${theme.accent}30`
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: isDark ? 'rgba(212, 175, 55, 0.2)' : `${theme.accent}25` }}
                >
                  🎁
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">Привіт від подруги!</h3>
                  <p className="text-xs" style={{ color: textSecondary }}>
                    Твій візит до {master.name} буде зі знижкою <span className="font-bold" style={{ color: theme.accent }}>-{c2cDiscountPct}%</span>
                  </p>
                </div>
                <button
                  onClick={() => openBooking()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: theme.accent }}
                >
                  Забрати
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Referrer Balance Banner (accumulated bonus from referred friends) ── */}
        <AnimatePresence>
          {hydrated && c2cReferrerBalance > 0 && !c2cRefCode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-[24px] border p-4 mb-4"
              style={{
                background: 'rgba(92, 158, 122, 0.08)',
                borderColor: 'rgba(92, 158, 122, 0.25)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(92, 158, 122, 0.15)' }}>
                  <Gift size={18} style={{ color: '#5C9E7A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">У тебе є реферальний бонус</p>
                  <p className="text-xs text-muted-foreground">
                    -{c2cReferrerBalance}% на наступний запис — за приведених подруг
                  </p>
                </div>
                <button
                  onClick={() => openBooking()}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#5C9E7A' }}
                >
                  Записатись
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header card — "High-end Cozy Minimalism" ── */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="bento-card relative mb-4 overflow-hidden border border-white/50"
        >
          {/* Share button — absolute top-right */}
          <button
            onClick={handleShare}
            aria-label="Поділитись сторінкою"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-2xl bg-white/70 border border-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer active:scale-95 transition-all"
            style={{ color: textSecondary }}
          >
            <Share2 size={16} />
          </button>

          {/* Hero section — centered */}
          <div className="pt-7 pb-5 px-6 flex flex-col items-center text-center">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-[28px] flex items-center justify-center text-4xl relative overflow-hidden mb-4"
              style={{ 
                background: avatarBg, 
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : `0 8px 24px ${theme.accent}22`,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`
              }}
            >
              {master.avatarUrl ? (
                <Image 
                  src={master.avatarUrl} 
                  alt={master.name} 
                  fill 
                  className="object-cover" 
                  sizes="96px" 
                  priority 
                  quality={90}
                />
              ) : (
                <span className="select-none">{master.avatarEmoji ?? master.emoji}</span>
              )}
            </div>

            {/* Name + verified badge */}
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h1 className="heading-serif text-2xl leading-tight text-foreground">{master.name}</h1>
              {master.isVerified && (
                <Tooltip content={<p className="text-[11px] text-foreground">Верифікований майстер Bookit</p>} position="top">
                <BadgeCheck size={18} className="flex-shrink-0 cursor-default text-primary" />
                </Tooltip>
              )}
            </div>

            {/* Specialization */}
            <p className="text-sm mb-3" style={{ color: textSecondary }}>{master.specialty}</p>

            {/* Working hours / availability badge — client-only, no SSR flash */}
            {availability && (
              <div className="mb-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                  availability.open
                    ? 'bg-success/12 text-success'
                    : 'bg-muted-foreground/10 text-muted-foreground'
                }`}>
                  <span className={`size-1.5 rounded-full shrink-0 ${availability.open ? 'bg-success animate-pulse' : 'bg-muted-foreground/60'}`} />
                  {availability.label}
                </span>
              </div>
            )}

            {/* Rating row */}
            {master.rating > 0 && master.reviewsCount > 0 && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < Math.floor(master.rating) ? 'fill-warning text-warning' : 'text-secondary/80'}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">{master.rating.toFixed(1)}</span>
                <span className="text-xs" style={{ color: textTertiary }}>· {pluralUk(master.reviewsCount, 'відгук', 'відгуки', 'відгуків')}</span>
              </div>
            )}

            {/* Location */}
            {master.location && master.location !== 'Україна' && (
              <div className="flex items-center justify-center gap-1">
                <MapPin size={12} style={{ color: textTertiary }} />
                {master.mapUrl && !master.lat ? (
                  <a
                    href={master.mapUrl}
                    target={master.mapUrl.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="text-xs underline underline-offset-2 decoration-dotted hover:opacity-70 transition-opacity cursor-pointer"
                    style={{ color: textTertiary }}
                  >
                    {master.location}
                  </a>
                ) : (
                  <span className="text-xs" style={{ color: textTertiary }}>{master.location}</span>
                )}
              </div>
            )}
          </div>

          {/* Bio — left-aligned, separated by a subtle rule */}
          {master.bio && (
            <p
              className="text-sm px-6 pb-5 leading-relaxed border-t border-white/40 pt-4"
              style={{ color: textSecondary }}
            >
              {master.bio}
            </p>
          )}

          {/* Social links (Instagram / Telegram only — Shop moved to its own banner) */}
          {(master.instagram || master.telegram) && (
            <div className="flex items-center justify-center gap-2 px-6 pb-5 -mt-1 flex-wrap">
              {master.instagram && (
                <a
                  href={master.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
                  style={{ background: socialBtnBg, color: textSecondary }}
                >
                  <Instagram size={13} /> Instagram
                </a>
              )}
              {master.telegram && (
                <a
                  href={master.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
                  style={{ background: socialBtnBg, color: textSecondary }}
                >
                  <Send size={13} /> Telegram
                </a>
              )}
            </div>
          )}

        </motion.div>

        {/* Location Card — only when precise coords available */}
        {master.lat && master.lng && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 24 }}
            className="mb-4"
          >
            <MasterLocationCard
              location={master.location}
              mapUrl={master.mapUrl ?? null}
              lat={master.lat}
              lng={master.lng}
              floor={master.floor ?? null}
              cabinet={master.cabinet ?? null}
            />
          </motion.div>
        )}

        {/* Loyalty Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 280, damping: 24 }}
          className="mb-4"
        >
          {master.loyalty && (
            <LoyaltyWidget
              isAuth={master.loyalty.isAuth}
              currentVisits={master.loyalty.currentVisits}
              tiers={master.loyalty.tiers}
              onBook={() => openBooking()}
            />
          )}
        </motion.div>

        {/* Working Hours */}
        {master.schedule && master.schedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
            className="bento-card p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} style={{ color: theme.accent }} />
              <h2 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Графік роботи</h2>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {['mon','tue','wed','thu','fri','sat','sun'].map(day => {
                const entry = master.schedule!.find(s => s.day === day);
                const isWorking = entry?.isWorking ?? false;
                const dayLabel: Record<string, string> = { mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Нд' };
                const isToday = day === todayDow;
                return (
                  <div
                    key={day}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl text-center"
                    style={{
                      background: isToday
                        ? `${theme.accent}22`
                        : isWorking ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.03)',
                      border: isToday ? `1.5px solid ${theme.accent}55` : '1.5px solid transparent',
                    }}
                  >
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: isToday ? theme.accent : textTertiary }}
                    >
                      {dayLabel[day]}
                    </span>
                    {isWorking && entry ? (
                      <span className="text-xs leading-tight font-bold text-foreground">
                        {entry.startTime.slice(0,5)}<br />{entry.endTime.slice(0,5)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium" style={{ color: textTertiary }}>вих.</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}


        {/* Flash Deals */}
        {(master.flashDeals?.length ?? 0) > 0 && (
          <FlashDealsStrip
            deals={master.flashDeals!}
            accent={theme.accent}
            onBook={(deal) => openBooking(undefined, deal)}
          />
        )}

        {/* ── Shop Banner — prominent CTA before services (Pro/Studio only, with products) ── */}
        {(master.tier === 'pro' || master.tier === 'studio') && (master.products ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
            className="mb-6"
          >
            <Link
              href={`/${master.slug}/shop`}
              className="block relative overflow-hidden rounded-[24px] border transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)`
                  : `linear-gradient(135deg, ${theme.accent}18 0%, ${theme.gradient[0]}30 100%)`,
                borderColor: isDark ? 'rgba(212,175,55,0.25)' : `${theme.accent}35`,
              }}
            >
              {/* Decorative blob */}
              <div
                className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-30"
                style={{ background: `radial-gradient(circle, ${theme.accent}55, transparent 70%)` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-4 p-5">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{
                    background: isDark ? 'rgba(212,175,55,0.2)' : `${theme.accent}25`,
                    boxShadow: `0 4px 16px ${theme.accent}30`,
                  }}
                >
                  <ShoppingBag size={26} style={{ color: theme.accent }} />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold" style={{ color: theme.textPrimary }}>Магазин</p>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
                    {(master.products ?? []).length} {pluralUk((master.products ?? []).length, 'товар', 'товари', 'товарів')} · самовивіз або доставка
                  </p>
                </div>
                {/* Arrow */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isDark ? 'rgba(255,255,255,0.08)' : `${theme.accent}20` }}
                >
                  <ArrowRight size={16} style={{ color: theme.accent }} />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Portfolio Gallery — right after Shop */}
        {(master.portfolio?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, type: 'spring', stiffness: 280, damping: 24 }}
            className="mb-5 -mx-4"
          >
            <PublicPortfolioGallery
              items={master.portfolio!}
              masterSlug={master.slug}
            />
          </motion.div>
        )}

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
        >
          <h2 className="heading-serif text-lg mb-3 px-1" style={{ color: theme.textPrimary }}>Послуги</h2>

          {categories.map((category, ci) => {
            const catServices = master.services.filter(s => s.category === category);
            return (
              <div key={category} className="mb-5">
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1"
                  style={{ color: textTertiary }}
                >
                  {category}
                </p>
                <div className="flex flex-col gap-2">
                  {catServices.map((service, i) => (
                    <motion.button
                      key={service.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => openBooking(service)}
                      className="bento-card p-4 text-left w-full group relative overflow-hidden border border-white/40 hover:border-white/80 hover:shadow-lg transition-all duration-300"
                    >
                      {service.popular && (
                        <div className="absolute top-3 right-3 z-10">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md"
                            style={{ color: theme.accent, background: `${theme.accent}15`, border: `1px solid ${theme.accent}30` }}
                          >
                            Популярне
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ background: serviceEmojiCircleBg, border: '1px solid rgba(255,255,255,0.4)' }}
                        >
                          {service.emoji}
                        </div>
                        <div className="flex-1 min-w-0 pr-12">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{service.name}</p>
                          <p className="text-[11px] mt-0.5 font-medium opacity-70" style={{ color: textSecondary }}>
                            <Clock size={10} className="inline mr-1 -mt-0.5" />
                            {formatDurationFull(service.duration)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-base font-black text-foreground">{formatPrice(service.price)}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Products preview — teaser cards linking to /shop (product-only orders via ShopPage) */}
        {(master.products ?? []).length > 0 && (master.tier === 'pro' || master.tier === 'studio') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, type: 'spring', stiffness: 280, damping: 24 }}
            className="mt-2"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="heading-serif text-lg" style={{ color: theme.textPrimary }}>Товари</h2>
              <Link
                href={`/${master.slug}/shop`}
                className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: theme.accent }}
              >
                Всі товари <ArrowRight size={13} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {(master.products ?? []).slice(0, 3).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 + i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <Link
                    href={`/${master.slug}/shop`}
                    className="bento-card p-4 flex items-center gap-3 group hover:shadow-md transition-all block"
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: serviceEmojiCircleBg }}
                    >
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      {product.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: textTertiary }}>
                          {product.description}
                        </p>
                      )}
                      {!product.inStock && (
                        <span className="text-[10px] font-medium text-destructive">Немає в наявності</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-base font-bold text-foreground">{formatPrice(product.price)}</p>
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `${theme.accent}20` }}
                      >
                        <ArrowRight size={12} style={{ color: theme.accent }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            {(master.products ?? []).length > 3 && (
              <Link
                href={`/${master.slug}/shop`}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: `${theme.accent}15`, color: theme.accent }}
              >
                <ShoppingBag size={15} />
                Переглянути всі {(master.products ?? []).length} товарів
              </Link>
            )}
          </motion.div>
        )}

        {/* Reviews */}
        {(master.reviews ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 24 }}
            className="mt-2"
          >
            <div className="flex items-baseline gap-2 mb-3 px-1">
              <h2 className="heading-serif text-lg" style={{ color: theme.textPrimary }}>Відгуки</h2>
              {master.rating > 0 && master.reviewsCount > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-[#D4935A] text-warning" />
                  <span className="text-sm font-bold text-foreground">{master.rating.toFixed(1)}</span>
                  <span className="text-xs" style={{ color: textTertiary }}>· {master.reviewsCount} відгуків</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {(master.reviews ?? []).map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                  className="bento-card p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.clientName}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            size={11}
                            className={j < review.rating ? 'fill-[#D4935A] text-warning' : 'text-secondary/80'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] flex-shrink-0" style={{ color: textTertiary }}>
                      {new Date(review.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>{review.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trusted Partners */}
        {(master.trustedPartners?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 280, damping: 24 }}
            className="mt-8 mb-4"
          >
            <TrustedPartnersBlock partners={master.trustedPartners!} />
          </motion.div>
        )}

        {master.tier === 'starter' && (
          <p className="text-center text-[11px] mt-6" style={{ color: textTertiary }}>
            Powered by{' '}
            <span className="font-semibold" style={{ color: theme.accent }}>Bookit</span>
          </p>
        )}
      </div>

      {/* Floating Pill CTA */}
      <div className="fixed bottom-[88px] left-0 right-0 z-30 px-6 pointer-events-none md:bottom-8">
        <div className="max-w-lg mx-auto flex justify-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 280, damping: 24 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => openBooking()}
            data-testid="book-button"
            className="pointer-events-auto w-full max-w-[280px] h-14 rounded-full text-white font-bold text-base transition-all backdrop-blur-2xl border border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ 
              background: `${theme.accent}73`, // ~45% opacity
              boxShadow: `0 12px 32px ${theme.accent}33, inset 0 1px 0 rgba(255,255,255,0.4)` 
            }}
          >
            Записатися
          </motion.button>
        </div>
      </div>

      <BookingFlow
        isOpen={bookingOpen}
        onClose={() => { setBookingOpen(false); setRepeatServices(null); setActiveFlashDeal(null); }}
        services={master.services}
        products={master.products ?? []}
        initialService={selectedService}
        initialServices={repeatServices ?? undefined}
        masterName={master.name}
        masterId={master.id}
        bookingsThisMonth={master.bookingsThisMonth ?? 0}
        subscriptionTier={master.tier}
        pricingRules={master.pricingRules}
        workingHours={master.workingHours as import('@/types/database').WorkingHoursConfig | null}
        flashDeal={activeFlashDeal}
        c2cRefCode={c2cRefCode}
        c2cDiscountPct={c2cDiscountPct}
        masterC2cEnabled={masterC2cEnabled}
        masterC2cDiscountPct={masterC2cDiscountPct}
      />

    </div>
  );
}
