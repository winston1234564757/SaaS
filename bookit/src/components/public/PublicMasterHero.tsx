'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { BadgeCheck, MapPin, Star, Share2, Instagram, Send } from 'lucide-react';
import { EditorialCover } from '@/components/ui/EditorialCover';
import { pluralUk } from '@/lib/utils/pluralUk';

export interface PublicMasterHeroData {
  name: string;
  specialty: string | null;
  isVerified: boolean;
  avatarUrl: string | null;
  /** Емодзі-аватар майстра (fallback, коли немає фото). */
  avatarFallback: string;
  availability: { open: boolean; label: string } | null;
  rating: number;
  reviewsCount: number;
  occupancyRate: number | null;
  location: string | null;
  /** Готове посилання на мапу, коли є (інакше location — простий текст). */
  locationHref: string | null;
  bio: string | null;
  instagram: string | null;
  telegram: string | null;
  onShare: () => void;
  /** Верифікований бейдж загорнутий у Tooltip споживачем (SSR-safe). */
  verifiedBadge?: ReactNode;
}

/**
 * DS-CLIENT-01 — темна editorial-обкладинка публічної сторінки майстра.
 * Замінює центрований світлий bento-герой (anti-center + без темного блоку) на асиметричний
 * герой за Законом темного блоку: аватар + ім'я — домінанта, диференційовані сателіти
 * (доступність · рейтинг · завантаженість · локація), тихий низ (біо + соцмережі).
 * Props-only → рендериться і в прев'ю власними очима без даних майстра.
 */
export function PublicMasterHero(d: PublicMasterHeroData) {
  const glow = d.availability?.open ? '#34D399' : undefined;

  return (
    <EditorialCover glowColor={glow} className="mb-4">
      {/* Share — тихо у куті */}
      <button
        type="button"
        onClick={d.onShare}
        aria-label="Поділитись сторінкою"
        className="absolute top-0 right-0 size-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer active:scale-[0.92]"
      >
        <Share2 size={16} />
      </button>

      {/* ── Ідентичність: аватар + ім'я = домінанта ── */}
      <div className="flex items-start gap-4 pr-12">
        <div className="size-16 rounded-2xl overflow-hidden relative flex items-center justify-center text-3xl bg-white/10 ring-1 ring-white/15 shrink-0">
          {d.avatarUrl ? (
            <Image src={d.avatarUrl} alt={d.name} fill sizes="64px" className="object-cover" priority quality={90} />
          ) : (
            <span className="select-none">{d.avatarFallback}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="heading-serif text-[26px] leading-[1.1] text-white text-balance min-w-0">{d.name}</h1>
            {d.isVerified && (d.verifiedBadge ?? <BadgeCheck size={18} className="text-white/80 shrink-0" />)}
          </div>
          {d.specialty && <p className="text-sm text-white/70 mt-1">{d.specialty}</p>}
          {d.availability && (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mt-2.5 ${
                d.availability.open ? 'text-emerald-200 bg-emerald-400/12' : 'text-white/55 bg-white/10'
              }`}
            >
              <span className={`size-1.5 rounded-full shrink-0 ${d.availability.open ? 'bg-emerald-300 animate-pulse' : 'bg-white/40'}`} />
              {d.availability.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Диференційовані сателіти: рейтинг + завантаженість ── */}
      {(d.rating > 0 && d.reviewsCount > 0) || (d.occupancyRate && d.occupancyRate > 0) ? (
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-3">
          {d.rating > 0 && d.reviewsCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(d.rating) ? 'text-amber-200 fill-current' : 'text-white/15 fill-current'} />
                ))}
              </div>
              <span className="metric-value text-lg text-white leading-none">{d.rating.toFixed(1)}</span>
              <span className="text-xs text-white/55">· {pluralUk(d.reviewsCount, 'відгук', 'відгуки', 'відгуків')}</span>
            </div>
          )}
          {d.occupancyRate && d.occupancyRate > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-white/70" style={{ width: `${d.occupancyRate}%` }} />
              </div>
              <span className="text-[11px] font-medium text-white/55 whitespace-nowrap shrink-0">
                {d.occupancyRate}% зайнято цього місяця
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Локація ── */}
      {d.location && d.location !== 'Україна' && (
        <div className="flex items-center gap-1.5 mt-3.5">
          <MapPin size={13} className="text-white/50 shrink-0" />
          {d.locationHref ? (
            <a
              href={d.locationHref}
              target={d.locationHref.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="text-xs text-white/70 underline underline-offset-2 decoration-dotted hover:text-white transition-colors"
            >
              {d.location}
            </a>
          ) : (
            <span className="text-xs text-white/70">{d.location}</span>
          )}
        </div>
      )}

      {/* ── Біо ── */}
      {d.bio && <p className="text-sm text-white/70 leading-relaxed mt-4 pt-4 border-t border-white/10">{d.bio}</p>}

      {/* ── Соцмережі ── */}
      {(d.instagram || d.telegram) && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {d.instagram && (
            <a
              href={d.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/80 hover:bg-white/15 hover:text-white transition-colors active:scale-[0.95]"
            >
              <Instagram size={13} /> Instagram
            </a>
          )}
          {d.telegram && (
            <a
              href={d.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/80 hover:bg-white/15 hover:text-white transition-colors active:scale-[0.95]"
            >
              <Send size={13} /> Telegram
            </a>
          )}
        </div>
      )}
    </EditorialCover>
  );
}
