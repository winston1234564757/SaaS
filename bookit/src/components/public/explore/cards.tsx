'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Calendar, BadgeCheck, ArrowRight } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import { formatDistance } from '@/lib/utils/haversine';
import {
  SPRING, CORMORANT, getCategoryLabel, primaryPhoto, monogramHue, initialOf,
  type ExploreMaster, type ProcessedMaster,
} from './shared';

// ─── Media cover — photo, else a designed monogram cover (never a sad "E") ──────

function MediaCover({
  master,
  className = '',
  monogramSize = 'text-5xl',
}: {
  master: ExploreMaster;
  className?: string;
  monogramSize?: string;
}) {
  const [err, setErr] = useState(false);
  const photo = !err ? primaryPhoto(master) : null;

  if (photo) {
    return (
      <Image
        src={photo}
        alt={master.name}
        fill
        className={`object-cover ${className}`}
        sizes="(max-width: 640px) 50vw, 220px"
        onError={() => setErr(true)}
      />
    );
  }

  const hue = monogramHue(master.name || master.slug);
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(140deg, hsl(${hue} 48% 91%), hsl(${hue} 54% 79%))` }}
    >
      <span
        className={`${monogramSize} leading-none select-none`}
        style={{ fontFamily: CORMORANT, color: `hsl(${hue} 42% 40%)` }}
      >
        {initialOf(master.name)}
      </span>
    </div>
  );
}

// ─── Availability — honest label (schedule works today, not "free slot") ────────

function AvailChip({ today, tomorrow }: { today: boolean; tomorrow: boolean }) {
  if (!today && !tomorrow) return null;
  const isToday = today;
  const color = isToday ? 'var(--success)' : 'var(--warning)';
  const Icon  = isToday ? Clock : Calendar;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full leading-none w-fit"
      style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)` }}
    >
      <Icon size={10} aria-hidden="true" />
      {isToday ? 'Працює сьогодні' : 'Працює завтра'}
    </span>
  );
}

function ProTag({ small }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center font-bold bg-accent text-accent-foreground rounded-full leading-none tracking-wide ${
        small ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-1'
      }`}
    >
      PRO
    </span>
  );
}

// ─── Grid card ──────────────────────────────────────────────────────────────────

export function MasterCard({
  master, index, showDistance, isRecommended,
}: {
  master: ProcessedMaster;
  index: number;
  showDistance: boolean;
  isRecommended: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.035, 0.25), ...SPRING }}
      className="h-full"
    >
      <Link href={`/${master.slug}`} className="block group h-full">
        <div className="bento-card rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-200 group-hover:-translate-y-0.5 active:scale-[0.97]">

          {/* Media zone — always filled */}
          <div className="relative h-32 overflow-hidden">
            <MediaCover master={master} />
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10 pointer-events-none">
              {master.isPro ? <ProTag small /> : <span aria-hidden="true" />}
              {showDistance && master.distance !== null && (
                <span className="flex items-center gap-0.5 text-[8px] font-semibold text-foreground/90 bg-background/85 px-1.5 py-0.5 rounded-full leading-none backdrop-blur-sm">
                  <MapPin size={7} aria-hidden="true" />
                  {formatDistance(master.distance)}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-3.5 pt-2.5 pb-3.5 flex flex-col flex-1 gap-1.5">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-1">
                <h3
                  className="text-foreground truncate leading-snug flex-1"
                  style={{ fontFamily: CORMORANT, fontSize: '1.1rem', fontWeight: 500 }}
                >
                  {master.name}
                </h3>
                {isRecommended && (
                  <BadgeCheck size={14} className="text-accent flex-shrink-0" aria-label="Рекомендуємо" />
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center text-[10px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full leading-none">
                  {getCategoryLabel(master.categories)}
                </span>
                {master.city && (
                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                    <MapPin size={8} aria-hidden="true" />
                    {master.city}
                  </span>
                )}
              </div>

              {master.ratingCount > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-warning fill-warning" aria-hidden="true" />
                  <span className="text-xs font-semibold text-foreground metric-value">{master.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    · {master.ratingCount} {pluralUk(master.ratingCount, 'відгук', 'відгуки', 'відгуків')}
                  </span>
                </div>
              )}

              {master.topServices[0] && (
                <p className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full w-fit max-w-full truncate">
                  {master.topServices[0].name} · {master.topServices[0].price}₴
                </p>
              )}

              <AvailChip today={master.availableToday} tomorrow={master.availableTomorrow} />
            </div>

            <div
              aria-hidden="true"
              className="mt-2 w-full py-2.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold text-center flex items-center justify-center min-h-[40px]"
            >
              Записатись
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── List card ──────────────────────────────────────────────────────────────────

export function MasterListCard({
  master, index, showDistance, isRecommended,
}: {
  master: ProcessedMaster;
  index: number;
  showDistance: boolean;
  isRecommended: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.025, 0.18), ...SPRING }}
    >
      <Link href={`/${master.slug}`} className="block group">
        <div className="bento-card rounded-2xl overflow-hidden flex transition-all duration-200 active:scale-[0.98]">

          <div className="relative w-24 flex-shrink-0 self-stretch min-h-[104px]">
            <MediaCover master={master} monogramSize="text-3xl" />
            {master.isPro && (
              <span className="absolute top-1.5 left-1.5">
                <ProTag small />
              </span>
            )}
            {showDistance && master.distance !== null && (
              <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-[7px] font-semibold text-accent-foreground bg-accent/70 px-1 py-0.5 rounded-full leading-none backdrop-blur-sm">
                <MapPin size={6} aria-hidden="true" />
                {formatDistance(master.distance)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-between gap-1.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <h3
                  className="text-foreground truncate flex-1 leading-snug"
                  style={{ fontFamily: CORMORANT, fontSize: '1.1rem', fontWeight: 500 }}
                >
                  {master.name}
                </h3>
                {isRecommended && (
                  <BadgeCheck size={12} className="text-accent flex-shrink-0" aria-label="Рекомендуємо" />
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center text-[10px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full leading-none">
                  {getCategoryLabel(master.categories)}
                </span>
                {master.city && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <MapPin size={8} aria-hidden="true" />
                    {master.city}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="space-y-1 min-w-0">
                {master.ratingCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={9} className="text-warning fill-warning" aria-hidden="true" />
                    <span className="text-xs font-semibold text-foreground metric-value">{master.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({master.ratingCount})
                    </span>
                  </div>
                )}
                <AvailChip today={master.availableToday} tomorrow={master.availableTomorrow} />
              </div>

              <span className="text-xs font-semibold text-accent flex items-center gap-0.5 flex-shrink-0" aria-hidden="true">
                Записатись <ArrowRight size={10} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Spotlight — one editorial PRO with a real photo ────────────────────────────

export function SpotlightCard({ master }: { master: ExploreMaster }) {
  return (
    <Link href={`/${master.slug}`} className="block group active:scale-[0.98] transition-transform duration-200">
      <div className="bento-card rounded-3xl overflow-hidden flex">
        <div className="relative w-32 sm:w-40 flex-shrink-0 self-stretch min-h-[150px]">
          <MediaCover master={master} monogramSize="text-6xl" />
          <span className="absolute top-2.5 left-2.5"><ProTag /></span>
        </div>
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-2">
          <span className="text-[10px] font-bold text-accent tracking-[0.2em] uppercase">Обране</span>
          <h3
            className="text-foreground leading-tight"
            style={{ fontFamily: CORMORANT, fontSize: '1.55rem', fontWeight: 500 }}
          >
            {master.name}
          </h3>
          <p className="text-[11px] text-muted-foreground -mt-1">
            {getCategoryLabel(master.categories)}
            {master.city ? ` · ${master.city}` : ''}
          </p>
          {master.ratingCount > 0 && (
            <div className="flex items-center gap-1">
              <Star size={12} className="text-warning fill-warning" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground metric-value">{master.rating.toFixed(1)}</span>
              <span className="text-[11px] text-muted-foreground">
                · {master.ratingCount} {pluralUk(master.ratingCount, 'відгук', 'відгуки', 'відгуків')}
              </span>
            </div>
          )}
          {master.topServices[0] && (
            <p className="text-[11px] text-muted-foreground">
              {master.topServices[0].name} · {master.topServices[0].price}₴
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bento-card rounded-3xl overflow-hidden animate-pulse">
          <div className="h-32 bg-muted/20" />
          <div className="px-3.5 py-3.5 space-y-2">
            <div className="h-4 bg-muted/30 rounded-full w-3/4" />
            <div className="h-3 bg-muted/20 rounded-full w-1/2" />
            <div className="h-8 bg-muted/20 rounded-full w-full mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
