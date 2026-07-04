'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, BadgeCheck, Clock, Zap, Gift, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MasterLocationCard } from './MasterLocationCard';
import { PublicMasterHero } from './PublicMasterHero';
import { LoyaltyWidget } from './LoyaltyWidget';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Tooltip } from '@/components/ui/Tooltip';
import { moodThemes, type MoodThemeKey } from '@/lib/constants/themes';
import { pluralUk } from '@/lib/utils/pluralUk';
import Image from 'next/image';
import { formatDurationFull } from '@/lib/utils/dates';
import { ProductIcon } from '@/lib/product-icons';
import { ServiceIcon } from '@/lib/service-icons';
import type { ProductIconName } from '@/lib/product-icons';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;
const SPRING_CARD = { type: 'spring', stiffness: 300, damping: 24 } as const;

function BookingFlowSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" aria-hidden="true">
      <div className="w-full max-w-sm mx-auto bg-secondary/90 rounded-t-xl p-6 animate-pulse">
        <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-5" />
        <div className="h-5 w-2/3 rounded-xl bg-muted mb-4" />
        <div className="h-12 w-full rounded-xl bg-muted mb-3" />
        <div className="h-12 w-full rounded-xl bg-muted mb-3" />
        <div className="h-12 w-full rounded-xl bg-muted mb-5" />
        <div className="h-14 w-full rounded-xl bg-muted" />
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
  icon_name: string;
  category: string;
  image_url?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  icon_name: ProductIconName;
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
  occupancyRate?: number;
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
      className="flex-shrink-0 w-72 rounded-xl p-4 border"
      style={{ background: `${accent}12`, borderColor: `${accent}35` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
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
          <p className="text-xs text-text-sub">{dateLabel} о {deal.slotTime}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="metric-value text-lg text-foreground">{discounted} ₴</span>
            <span className="text-xs text-text-sub line-through">{deal.originalPrice} ₴</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold tabular-nums text-primary">
          <Clock size={12} />
          {countdown}
        </div>
      </div>

      <button
        type="button"
        onClick={onBook}
        className="w-full py-2 rounded-lg text-sm font-semibold text-[var(--accent-on)] transition-opacity hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer"
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
      transition={{ ...SPRING, delay: 0.1 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <Zap size={16} style={{ color: accent }} />
        <h2 className="heading-serif text-lg text-foreground">Флеш-акції</h2>
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
  const themeKey = 'frost' as MoodThemeKey;
  const theme = moodThemes[themeKey];
  const isDark = themeKey === 'darkLuxe';

  const searchParams = useSearchParams();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [repeatServices, setRepeatServices] = useState<Service[] | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeFlashDeal, setActiveFlashDeal] = useState<FlashDeal | null>(null);
  const [actionDate, setActionDate] = useState<string | undefined>();
  const [actionTime, setActionTime] = useState<string | undefined>();
  // '' on SSR to avoid day-of-week mismatch (server UTC vs client UTC+3)
  const [todayDow, setTodayDow] = useState('');

  const urlRefCode = searchParams.get('ref');
  const effectiveRefCode = c2cRefCode || (masterC2cEnabled ? urlRefCode : null);
  const effectiveDiscountPct = c2cDiscountPct ?? (effectiveRefCode && masterC2cEnabled ? (masterC2cDiscountPct ?? 10) : null);

  const { data: c2cReferrerBalance = 0 } = useQuery<number>({
    queryKey: ['c2c-balance', master.id],
    queryFn: async () => {
      const sb = createClient();
      const { data: authData } = await sb.auth.getUser();
      const user = authData?.user;
      if (!user) return 0;
      const { data } = await sb.rpc('get_c2c_balance', { p_referrer_id: user.id, p_master_id: master.id });
      return typeof data === 'number' ? data : 0;
    },
    enabled: hydrated && masterC2cEnabled && !!master.id && !effectiveRefCode,
    staleTime: 5 * 60 * 1000,
  });
  const didAutoOpen = useRef(false);
  const availability = useAvailability(master.schedule ?? null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Persist C2C ref to localStorage so it survives navigation (e.g. user registers then returns)
  useEffect(() => {
    if (typeof window === 'undefined' || !effectiveRefCode) return;
    try {
      localStorage.setItem('bookit_ref', effectiveRefCode);
      if (effectiveDiscountPct != null) localStorage.setItem('bookit_ref_pct', String(effectiveDiscountPct));
    } catch { /* localStorage blocked in private mode — safe to ignore */ }
  }, [effectiveRefCode, effectiveDiscountPct]);


  useEffect(() => {
    document.body.style.backgroundColor = theme.background;
    return () => { document.body.style.backgroundColor = ''; };
  }, [theme.background]);

  useEffect(() => {
    setTodayDow(['sun','mon','tue','wed','thu','fri','sat'][getNow().getDay()]);
  }, []);

  // URL Action Bus — _action=booking:create (richer programmatic deep-link)
  useUrlActionBus('booking:create', ({ serviceId, date, startTime }) => {
    if (didAutoOpen.current) return;
    didAutoOpen.current = true;
    const service = serviceId ? (master.services.find(s => s.id === serviceId) ?? null) : null;
    setRepeatServices(null);
    setSelectedService(service);
    setActiveFlashDeal(null);
    setActionDate(date);
    setActionTime(startTime);
    setBookingOpen(true);
  });

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
  const serviceEmojiCircleBg = isDark ? 'rgba(212, 175, 55, 0.10)' : 'rgba(255, 210, 194, 0.4)';

  return (
    <div>
      <ThemedBlobBackground theme={theme} />

      <div className="relative z-0 max-w-lg mx-auto px-4 pb-32 pt-6" data-hydrated={hydrated}>
        {/* ── Referral Banner (friend discount — incoming ref link) ── */}
        <AnimatePresence>
          {effectiveRefCode && effectiveDiscountPct && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl border p-4 mb-4 shadow-sm"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${theme.accent}12, ${theme.gradient[0]}08)`,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : `${theme.accent}30`
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: isDark ? 'rgba(212, 175, 55, 0.2)' : `${theme.accent}25` }}
                >
                  <Gift size={18} style={{ color: theme.accent }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">Привіт від подруги!</h3>
                  <p className="text-xs" style={{ color: textSecondary }}>
                    Твій візит до {master.name} буде зі знижкою <span className="font-bold" style={{ color: theme.accent }}>-{effectiveDiscountPct}%</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openBooking()}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[var(--accent-on)] transition-opacity hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer"
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
          {hydrated && c2cReferrerBalance > 0 && !effectiveRefCode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-success/25 p-4 mb-4 bg-success/8"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-success/15">
                  <Gift size={18} className="text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">У тебе є реферальний бонус</p>
                  <p className="text-xs text-text-sub">
                    -{c2cReferrerBalance}% на наступний запис — за приведених подруг
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openBooking()}
                  className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer bg-success"
                >
                  Записатись
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header hero — темна editorial-обкладинка (DS-CLIENT-01) ── */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={SPRING}
        >
          <PublicMasterHero
            name={master.name}
            specialty={master.specialty}
            isVerified={master.isVerified}
            avatarUrl={master.avatarUrl ?? null}
            avatarFallback={master.avatarEmoji ?? master.emoji}
            availability={availability}
            rating={master.rating}
            reviewsCount={master.reviewsCount}
            occupancyRate={typeof master.occupancyRate === 'number' ? master.occupancyRate : null}
            location={master.location ?? null}
            locationHref={master.mapUrl && !master.lat ? master.mapUrl : null}
            bio={master.bio ?? null}
            instagram={master.instagram ?? null}
            telegram={master.telegram ?? null}
            onShare={handleShare}
            verifiedBadge={
              <Tooltip content={<p className="text-[11px] text-foreground">Верифікований майстер Bookit</p>} position="top">
                <BadgeCheck size={18} className="text-white/80 shrink-0 cursor-default" />
              </Tooltip>
            }
          />
        </motion.div>

        {/* Location Card — only when precise coords available */}
        {master.lat && master.lng && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: 0.05 }}
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
          transition={{ ...SPRING, delay: 0.08 }}
          className="mb-4"
        >
          {master.loyalty && (
            <LoyaltyWidget
              masterId={master.id}
              serverIsAuth={master.loyalty.isAuth}
              serverCurrentVisits={master.loyalty.currentVisits}
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
            transition={{ ...SPRING, delay: 0.1 }}
            className="bento-card p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Графік роботи</h2>
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
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-center ${
                      isToday ? 'bg-primary/10 ring-1 ring-primary/25' : isWorking ? 'bg-secondary/50' : 'bg-secondary/20'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-text-sub'}`}>
                      {dayLabel[day]}
                    </span>
                    {isWorking && entry ? (
                      <span className="text-xs leading-tight font-bold text-foreground tabular-nums">
                        {entry.startTime.slice(0,5)}<br />{entry.endTime.slice(0,5)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-text-sub">вих.</span>
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
            transition={{ ...SPRING, delay: 0.1 }}
            className="mb-6"
          >
            <Link
              href={`/${master.slug}/shop`}
              className="bento-card flex items-center gap-4 p-4 group hover:bg-secondary/40 transition-colors active:scale-[0.99] cursor-pointer"
            >
              <div className="size-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 ring-1 ring-primary/15">
                <ShoppingBag size={22} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground">Магазин</p>
                <p className="text-xs mt-0.5 text-text-sub">
                  {(master.products ?? []).length} {pluralUk((master.products ?? []).length, 'товар', 'товари', 'товарів')} · самовивіз або доставка
                </p>
              </div>
              <ArrowRight size={18} className="text-text-sub shrink-0 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
            </Link>
          </motion.div>
        )}

        {/* Portfolio Gallery — right after Shop */}
        {(master.portfolio?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.14 }}
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
          transition={{ ...SPRING, delay: 0.15 }}
        >
          <h2 className="heading-serif text-lg mb-3 px-1" style={{ color: theme.textPrimary }}>Послуги</h2>

          {categories.map((category) => {
            const catServices = master.services.filter(s => s.category === category);
            return (
              <div key={category} className="bento-card p-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-sub px-3 pt-2 pb-2.5">
                  {category}
                </p>
                <div className="flex flex-col">
                  {catServices.map((service, i) => (
                    <motion.button
                      type="button"
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ ...SPRING_CARD, delay: i * 0.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openBooking(service)}
                      className={`w-full text-left flex items-center gap-3.5 px-3 py-3 rounded-xl group transition-colors cursor-pointer hover:bg-secondary/60 ${
                        i > 0 ? 'border-t border-border/40' : ''
                      }`}
                    >
                      {service.image_url ? (
                        <Image
                          src={service.image_url}
                          alt={service.name}
                          width={44}
                          height={44}
                          className="size-11 rounded-xl shrink-0 object-cover"
                        />
                      ) : (
                        <div
                          className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${service.popular ? 'ring-1 ring-primary/20' : ''}`}
                          style={{ background: service.popular ? 'var(--accent-light)' : serviceEmojiCircleBg }}
                        >
                          <ServiceIcon name={service.icon_name} size={18} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{service.name}</p>
                          {service.popular && (
                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              Хіт
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-[11px] mt-0.5 font-medium text-text-sub">
                          <Clock size={10} />
                          {formatDurationFull(service.duration)}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="metric-value text-[15px] text-foreground">{formatPrice(service.price)}</span>
                        <ArrowRight size={14} className="text-text-sub opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
            transition={{ ...SPRING, delay: 0.24 }}
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
            <div className="bento-card p-2">
              {(master.products ?? []).slice(0, 3).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_CARD, delay: 0.26 + i * 0.04 }}
                >
                  <Link
                    href={`/${master.slug}/shop`}
                    className={`flex items-center gap-3.5 px-3 py-3 rounded-xl group hover:bg-secondary/60 transition-colors cursor-pointer ${i > 0 ? 'border-t border-border/40' : ''}`}
                  >
                    <div
                      className="size-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: serviceEmojiCircleBg }}
                    >
                      <ProductIcon name={product.icon_name} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{product.name}</p>
                      {product.description && (
                        <p className="text-[11px] mt-0.5 text-text-sub line-clamp-1">{product.description}</p>
                      )}
                      {!product.inStock && (
                        <span className="text-[10px] font-bold text-destructive">Немає в наявності</span>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="metric-value text-[15px] text-foreground">{formatPrice(product.price)}</span>
                      <ArrowRight size={14} className="text-text-sub opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            {(master.products ?? []).length > 3 && (
              <Link
                href={`/${master.slug}/shop`}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/15 transition-colors active:scale-[0.98] cursor-pointer"
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
            transition={{ ...SPRING, delay: 0.3 }}
            className="mt-2"
          >
            <div className="flex items-baseline gap-2.5 mb-3 px-1">
              <h2 className="heading-serif text-lg" style={{ color: theme.textPrimary }}>Відгуки</h2>
              {master.rating > 0 && master.reviewsCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="fill-warning text-warning" />
                  <span className="metric-value text-base text-foreground leading-none">{master.rating.toFixed(1)}</span>
                  <span className="text-xs text-text-sub">· {pluralUk(master.reviewsCount, 'відгук', 'відгуки', 'відгуків')}</span>
                </div>
              )}
            </div>

            {(() => {
              const reviews = master.reviews ?? [];
              const [top, ...rest] = reviews;
              return (
                <>
                  {/* Featured — свіжий відгук багатший (краще розкриває довіру) */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING_CARD, delay: 0.32 }}
                    className="bento-card p-5 mb-2"
                  >
                    <div className="flex items-center gap-1 mb-2.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={14} className={j < top.rating ? 'fill-warning text-warning' : 'text-border'} />
                      ))}
                    </div>
                    {top.comment ? (
                      <p className="text-[15px] leading-relaxed text-foreground">{top.comment}</p>
                    ) : (
                      <p className="text-sm text-text-sub">Клієнт залишив оцінку без коментаря</p>
                    )}
                    <div className="flex items-center gap-2.5 mt-4 pt-3.5 border-t border-border/40">
                      <div className="size-8 rounded-full bg-primary/12 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {top.clientName[0]?.toUpperCase() ?? '?'}
                      </div>
                      <p className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">{top.clientName}</p>
                      <span className="text-[11px] text-text-sub shrink-0">
                        {new Date(top.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </motion.div>

                  {/* Решта — компактний реєстр з hairline-роздільниками */}
                  {rest.length > 0 && (
                    <div className="bento-card p-2">
                      {rest.map((review, i) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...SPRING_CARD, delay: 0.36 + i * 0.04 }}
                          className={`flex items-start gap-3 px-3 py-3 ${i > 0 ? 'border-t border-border/40' : ''}`}
                        >
                          <div className="size-8 rounded-full bg-secondary/70 text-text-sub flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {review.clientName[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">{review.clientName}</p>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, j) => (
                                  <Star key={j} size={10} className={j < review.rating ? 'fill-warning text-warning' : 'text-border'} />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-[13px] leading-relaxed text-text-sub mt-1 line-clamp-3">{review.comment}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}

        {/* Trusted Partners */}
        {(master.trustedPartners?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.22 }}
            className="mt-8 mb-4"
          >
            <TrustedPartnersBlock partners={master.trustedPartners!} />
          </motion.div>
        )}

        {master.tier === 'starter' && (
          <p className="text-center text-[11px] mt-6 text-text-sub">
            Powered by{' '}
            <span className="font-semibold text-primary">Bookit</span>
          </p>
        )}
      </div>

      {/* Floating Pill CTA */}
      <div className="fixed bottom-[88px] left-0 right-0 z-30 px-6 pointer-events-none md:bottom-8">
        <div className="max-w-lg mx-auto flex justify-center">
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => openBooking()}
            data-testid="book-button"
            className="pointer-events-auto w-full max-w-[280px] h-14 rounded-full text-[var(--accent-on)] font-bold text-base transition-all backdrop-blur-2xl border border-border/30 shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:scale-[1.02] active:scale-[0.95] flex items-center justify-center gap-2 cursor-pointer"
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
        onClose={() => { setBookingOpen(false); setRepeatServices(null); setActiveFlashDeal(null); setActionDate(undefined); setActionTime(undefined); }}
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
        initialDate={actionDate}
        initialTime={actionTime}
        c2cRefCode={effectiveRefCode}
        c2cDiscountPct={effectiveDiscountPct}
        masterC2cEnabled={masterC2cEnabled}
        masterC2cDiscountPct={masterC2cDiscountPct}
        trustedPartners={master.trustedPartners ?? []}
      />

    </div>
  );
}
