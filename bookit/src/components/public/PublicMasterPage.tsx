'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, BadgeCheck, Share2, Instagram, Send, Clock, ChevronLeft, ChevronRight, X, Images } from 'lucide-react';
import { BookingFlow } from './BookingFlow';
import { Tooltip } from '@/components/ui/Tooltip';
import { moodThemes, type MoodThemeKey } from '@/lib/constants/themes';
import Image from 'next/image';

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

interface PortfolioPhoto {
  id: string;
  url: string;
  caption: string | null;
}

interface Master {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  location: string;
  emoji: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  tier: 'starter' | 'pro' | 'studio';
  bio: string;
  services: Service[];
  products?: Product[];
  reviews?: Review[];
  portfolio?: PortfolioPhoto[];
  instagram: string | null;
  telegram: string | null;
  themeKey?: string;
  avatarEmoji?: string;
  schedule?: { day: string; isWorking: boolean; startTime: string; endTime: string }[];
  bookingsThisMonth?: number;
  pricingRules?: Record<string, any>;
}

function formatDuration(min: number) {
  if (min < 60) return `${min} хв`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} год ${m} хв` : `${h} год`;
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

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: PortfolioPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  const photo = photos[idx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'rgba(18, 10, 7, 0.92)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
      >
        <X size={18} />
      </button>

      {/* Counter */}
      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-white/60 z-10">
        {idx + 1} / {photos.length}
      </p>

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg px-4"
          style={{ maxHeight: '80dvh' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
            <Image
              src={photo.url}
              alt={photo.caption ?? `Фото ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
              priority
            />
          </div>
          {photo.caption && (
            <p className="text-center text-sm text-white/80 mt-3">{photo.caption}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  background: i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
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
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const didAutoOpen = useRef(false);

  useEffect(() => {
    document.body.style.backgroundColor = theme.background;
    return () => { document.body.style.backgroundColor = ''; };
  }, [theme.background]);

  // Auto-open BookingFlow with pre-selected services from ?services= query param
  useEffect(() => {
    if (didAutoOpen.current) return;
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
  const portfolio = master.portfolio ?? [];
  const GRID_LIMIT = 9;
  const visiblePhotos = showAllPhotos ? portfolio : portfolio.slice(0, GRID_LIMIT);

  function openBooking(service?: Service) {
    setRepeatServices(null);
    setSelectedService(service ?? null);
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

      <div className="max-w-lg mx-auto px-4 pb-32 pt-6">

        {/* Top bar */}
        <div className="flex items-center justify-end mb-4">
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Поділитись сторінкою</p>} position="left">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-2xl bg-white/70 border border-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white/90 transition-colors"
              style={{ color: textSecondary }}
            >
              <Share2 size={16} />
            </button>
          </Tooltip>
        </div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="bento-card p-6 mb-4"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ background: avatarBg }}
            >
              {master.avatarEmoji ?? master.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="heading-serif text-xl leading-tight text-[#2C1A14]">{master.name}</h1>
                {master.isVerified && (
                  <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Верифікований майстер Bookit</p>} position="top">
                    <BadgeCheck size={17} style={{ color: theme.accent }} className="flex-shrink-0 cursor-default" />
                  </Tooltip>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: textSecondary }}>{master.specialty}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin size={12} style={{ color: textTertiary }} />
                <span className="text-xs" style={{ color: textTertiary }}>{master.location}</span>
              </div>

              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < Math.floor(master.rating) ? 'fill-[#D4935A] text-[#D4935A]' : 'text-[#E8D5CF]'}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-[#2C1A14]">{master.rating}</span>
                <span className="text-xs" style={{ color: textTertiary }}>({master.reviewsCount} відгуків)</span>
                {portfolio.length > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: textTertiary }}>
                    <Images size={11} />
                    {portfolio.length} робіт
                  </span>
                )}
              </div>
            </div>
          </div>

          {master.bio && (
            <p className="text-sm mt-4 leading-relaxed" style={{ color: textSecondary }}>{master.bio}</p>
          )}

          {(master.instagram || master.telegram) && (
            <div className="flex items-center gap-2 mt-3">
              {master.instagram && (
                <a
                  href={master.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:opacity-80"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: socialBtnBg, color: textSecondary }}
                >
                  <Send size={13} /> Telegram
                </a>
              )}
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} style={{ color: theme.accent }} />
              <h2 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Графік роботи</h2>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['mon','tue','wed','thu','fri','sat','sun'].map(day => {
                const entry = master.schedule!.find(s => s.day === day);
                const isWorking = entry?.isWorking ?? false;
                const dayLabel: Record<string, string> = { mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Нд' };
                const today = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center"
                    style={{
                      background: isToday
                        ? `${theme.accent}22`
                        : isWorking ? 'rgba(255,255,255,0.45)' : 'transparent',
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: isToday ? theme.accent : textTertiary }}
                    >
                      {dayLabel[day]}
                    </span>
                    {isWorking && entry ? (
                      <span className="text-[9px] leading-tight" style={{ color: textSecondary }}>
                        {entry.startTime.slice(0,5)}<br />{entry.endTime.slice(0,5)}
                      </span>
                    ) : (
                      <span className="text-[9px]" style={{ color: textTertiary }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Portfolio ── */}
        {portfolio.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 280, damping: 24 }}
            className="mb-5"
          >
            <div className="flex items-baseline justify-between mb-3 px-1">
              <h2 className="heading-serif text-lg" style={{ color: theme.textPrimary }}>Портфоліо</h2>
              <span className="text-xs" style={{ color: textTertiary }}>{portfolio.length} робіт</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {visiblePhotos.map((photo, i) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.14 + i * 0.03, type: 'spring', stiffness: 300, damping: 26 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setLightboxIdx(portfolio.indexOf(photo))}
                  className="relative aspect-square rounded-2xl overflow-hidden group"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? `Робота ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw, 160px"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-[#2C1A14]/0 group-hover:bg-[#2C1A14]/20 transition-all duration-200 rounded-2xl" />
                </motion.button>
              ))}

              {/* "Показати ще" tile */}
              {!showAllPhotos && portfolio.length > GRID_LIMIT && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setShowAllPhotos(true)}
                  className="relative aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-1"
                  style={{ background: `${theme.accent}18`, border: `1.5px dashed ${theme.accent}50` }}
                >
                  <span className="text-lg font-bold" style={{ color: theme.accent }}>
                    +{portfolio.length - GRID_LIMIT}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: theme.accent }}>
                    більше
                  </span>
                </motion.button>
              )}
            </div>
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
                          <p className="text-xs mt-0.5" style={{ color: textTertiary }}>{formatDuration(service.duration)}</p>
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
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: textTertiary }}>
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
            className="w-full h-14 rounded-2xl text-white font-bold text-base transition-opacity hover:opacity-90"
            style={{ background: theme.accent, boxShadow: `0 8px 28px ${theme.accent}55` }}
          >
            Записатися
          </motion.button>
        </div>
      </div>

      <BookingFlow
        isOpen={bookingOpen}
        onClose={() => { setBookingOpen(false); setRepeatServices(null); }}
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
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            photos={portfolio}
            initialIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
