'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, BadgeCheck, Share2, Instagram, Send, Clock, Zap } from 'lucide-react';
import { MasterLocationCard } from './MasterLocationCard';
import { LoyaltyWidget } from './LoyaltyWidget';
import { BookingFlow } from './BookingFlow';
import { Tooltip } from '@/components/ui/Tooltip';
import { moodThemes, type MoodThemeKey } from '@/lib/constants/themes';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';
import Image from 'next/image';
import { getNow } from '@/lib/utils/now';

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
}

function formatPrice(price: number) {
  return price.toLocaleString('uk-UA') + ' ₴';
}

function ThemedBlobBackground({ theme }: { theme: typeof moodThemes[MoodThemeKey] }) {
  return (
    <div className="blob-container" aria-hidden="true">
      <div className="blob" style={{ width: 700, height: 700, top: -250, right: -200, background: `${theme.accent}28`, animationDuration: '24s' }} />
      <div className="blob" style={{ width: 550, height: 550, bottom: -150, left: -180, background: `${theme.gradient[0]}55`, animationDuration: '20s', animationDelay: '-8s' }} />
      <div className="blob" style={{ width: 450, height: 450, top: '40%', left: '35%', background: `${theme.gradient[1]}60`, animationDuration: '26s', animationDelay: '-16s' }} />
      <div className="blob" style={{ width: 300, height: 300, top: '10%', left: '5%', background: `${theme.accent}18`, animationDuration: '18s', animationDelay: '-12s' }} />
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
  const [d, mon] = deal.slotDate.split('-').slice(1).map(Number);
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
          <p className="text-sm font-semibold text-[#2C1A14] leading-tight">{deal.serviceName}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: `${accent}20`, color: accent }}>
          -{deal.discountPct}%
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-[#A8928D]">{dateLabel} о {deal.slotTime}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-[#2C1A14]">{discounted} ₴</span>
            <span className="text-xs text-[#A8928D] line-through">{deal.originalPrice} ₴</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono font-bold" style={{ color: accent }}>
          <Clock size={12} />
          {countdown}
        </div>
      </div>

      <button
        onClick={onBook}
        className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
      className="mb-5"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <Zap size={16} style={{ color: accent }} />
        <h2 className="heading-serif text-lg" style={{ color: '#2C1A14' }}>Флеш-акції</h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: `${accent}20`, color: accent }}>
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
export function PublicMasterPage({ master }: { master: Master }) {
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
  const didAutoOpen = useRef(false);
  const availability = useAvailability(master.schedule ?? null);

  useEffect(() => {
    setHydrated(true);
  }, []);

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
    <>
      <ThemedBlobBackground theme={theme} />

      <div className="max-w-lg mx-auto px-4 pb-32 pt-6" data-hydrated={hydrated}>

        {/* ── Header card — "High-end Cozy Minimalism" ── */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="bento-card relative mb-4 overflow-hidden"
        >
          {/* Share button — absolute top-right */}
          <button
            onClick={handleShare}
            aria-label="Поділитись сторінкою"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-2xl bg-white/70 border border-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer"
            style={{ color: textSecondary }}
          >
            <Share2 size={16} />
          </button>

          {/* Hero section — centered */}
          <div className="pt-7 pb-5 px-6 flex flex-col items-center text-center">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-[28px] flex items-center justify-center text-4xl relative overflow-hidden mb-4"
              style={{ background: avatarBg, boxShadow: `0 8px 24px ${theme.accent}22` }}
            >
              {master.avatarUrl ? (
                <Image src={master.avatarUrl} alt={master.name} fill className="object-cover" sizes="96px" />
              ) : (
                master.avatarEmoji ?? master.emoji
              )}
            </div>

            {/* Name + verified badge */}
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h1 className="heading-serif text-2xl leading-tight text-[#2C1A14]">{master.name}</h1>
              {master.isVerified && (
                <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Верифікований майстер Bookit</p>} position="top">
                  <BadgeCheck size={18} style={{ color: theme.accent }} className="flex-shrink-0 cursor-default" />
                </Tooltip>
              )}
            </div>

            {/* Specialization */}
            <p className="text-sm mb-3" style={{ color: textSecondary }}>{master.specialty}</p>

            {/* Working hours / availability badge — client-only, no SSR flash */}
            {availability && (
              <div className="mb-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full ${
                  availability.open
                    ? 'bg-[#5C9E7A]/12 text-[#5C9E7A]'
                    : 'bg-[#6B5750]/10 text-[#6B5750]'
                }`}>
                  <span className={`size-1.5 rounded-full shrink-0 ${availability.open ? 'bg-[#5C9E7A] animate-pulse' : 'bg-[#A8928D]'}`} />
                  {availability.label}
                </span>
              </div>
            )}

            {/* Rating row */}
            {master.rating > 0 && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < Math.floor(master.rating) ? 'fill-[#D4935A] text-[#D4935A]' : 'text-[#E8D5CF]'}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-[#2C1A14]">{master.rating}</span>
                <span className="text-xs" style={{ color: textTertiary }}>({pluralize(master.reviewsCount, ['відгук', 'відгуки', 'відгуків'])})</span>
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

          {/* Social links */}
          {(master.instagram || master.telegram) && (
            <div className="flex items-center justify-center gap-2 px-6 pb-5 -mt-1">
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 280, damping: 24 }}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09, type: 'spring', stiffness: 280, damping: 24 }}
          className="mb-4"
        >
          {master.loyalty && (
            <LoyaltyWidget
              isAuth={master.loyalty.isAuth}
              currentVisits={master.loyalty.currentVisits}
              tiers={master.loyalty.tiers}
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
                      <span className="text-[10px] leading-tight font-medium" style={{ color: textSecondary }}>
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
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + ci * 0.05 + i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => openBooking(service)}
                      className="bento-card p-4 text-left w-full group relative overflow-hidden"
                    >
                      {service.popular && (
                        <div className="absolute top-3 right-3">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: theme.accent, background: accentBg }}
                          >
                            Популярне
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: serviceEmojiCircleBg }}
                        >
                          {service.emoji}
                        </div>
                        <div className="flex-1 min-w-0 pr-16">
                          <p className="text-sm font-semibold text-[#2C1A14]">{service.name}</p>
                          <p className="text-xs mt-0.5 break-words leading-tight" style={{ color: textTertiary }}>{formatDurationFull(service.duration)}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-base font-bold text-[#2C1A14]">{formatPrice(service.price)}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Products */}
        {(master.products ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, type: 'spring', stiffness: 280, damping: 24 }}
            className="mt-2"
          >
            <h2 className="heading-serif text-lg mb-3 px-1" style={{ color: theme.textPrimary }}>Товари</h2>
            <div className="flex flex-col gap-2">
              {(master.products ?? []).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 + i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                  className="bento-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: serviceEmojiCircleBg }}
                    >
                      {product.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2C1A14]">{product.name}</p>
                      {product.description && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: textTertiary }}>
                          {product.description}
                        </p>
                      )}
                      {!product.inStock && (
                        <span className="text-[10px] font-medium text-[#C05B5B]">Немає в наявності</span>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-base font-bold text-[#2C1A14]">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
              {master.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-[#D4935A] text-[#D4935A]" />
                  <span className="text-sm font-bold text-[#2C1A14]">{master.rating}</span>
                  <span className="text-xs" style={{ color: textTertiary }}>({master.reviewsCount})</span>
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
                      <p className="text-sm font-semibold text-[#2C1A14]">{review.clientName}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            size={11}
                            className={j < review.rating ? 'fill-[#D4935A] text-[#D4935A]' : 'text-[#E8D5CF]'}
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

        {master.tier === 'starter' && (
          <p className="text-center text-[11px] mt-6" style={{ color: textTertiary }}>
            Powered by{' '}
            <span className="font-semibold" style={{ color: theme.accent }}>Bookit</span>
          </p>
        )}
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-5 pt-2"
        style={{ background: `linear-gradient(to top, ${theme.background}f0 60%, transparent)` }}
      >
        <div className="max-w-lg mx-auto">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 280, damping: 24 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openBooking()}
            data-testid="book-button"
            className="w-full h-14 rounded-2xl text-white font-bold text-base transition-opacity hover:opacity-90"
            style={{ background: theme.accent, boxShadow: `0 8px 28px ${theme.accent}55` }}
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
        initialStep={repeatServices ? 'datetime' : undefined}
        masterName={master.name}
        masterId={master.id}
        bookingsThisMonth={master.bookingsThisMonth ?? 0}
        subscriptionTier={master.tier}
        pricingRules={master.pricingRules}
        workingHours={master.workingHours as import('@/types/database').WorkingHoursConfig | null}
        flashDeal={activeFlashDeal}
      />

    </>
  );
}
