'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';

interface Master {
  id: string;
  slug: string;
  name: string;
  avatarEmoji: string;
  categories: string[];
  city: string | null;
  visitCount: number;
  lastVisitDate: string;
}

function relativeDate(dateStr: string): string {
  const today = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'сьогодні';
  if (diffDays === 1) return 'вчора';
  if (diffDays < 7) return `${diffDays} ${pluralUk(diffDays, 'день', 'дні', 'днів')} тому`;
  if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    return `${weeks} ${pluralUk(weeks, 'тиждень', 'тижні', 'тижнів')} тому`;
  }
  if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return `${months} ${pluralUk(months, 'місяць', 'місяці', 'місяців')} тому`;
  }
  const years = Math.round(diffDays / 365);
  return `${years} ${pluralUk(years, 'рік', 'роки', 'років')} тому`;
}

export function MyMastersPage({ masters }: { masters: Master[] }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-foreground mb-0.5">Мої майстри</h1>
        <p className="text-sm text-muted-foreground/60">
          {masters.length > 0
            ? `${masters.length} ${pluralUk(masters.length, 'майстер', 'майстри', 'майстрів')}`
            : 'Ще немає майстрів'}
        </p>
      </div>

      {/* Empty state */}
      {masters.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="bento-card p-8 text-center"
        >
          <p className="text-sm font-medium text-foreground mb-1">
            Ти ще не записувалась до жодного майстра
          </p>
          <p className="text-xs text-muted-foreground/60 mb-5">
            Знайди свого ідеального майстра та запишись онлайн
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Знайти майстра
          </Link>
        </motion.div>
      )}

      {/* Masters list */}
      {masters.length > 0 && (
        <div className="flex flex-col gap-2">
          {masters.map((master, index) => (
            <MasterCard key={master.id} master={master} index={index} />
          ))}
          <Link
            href="/explore"
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-lg bg-secondary/50 text-muted-foreground font-semibold hover:bg-secondary active:scale-[0.95] transition-all border border-secondary text-sm cursor-pointer"
          >
            <Search size={15} />
            Знайти нових майстрів
          </Link>
        </div>
      )}
    </div>
  );
}

function MasterCard({ master, index }: { master: Master; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      className="bento-card p-4"
    >
      <div className="flex items-center gap-3">
        {/* Emoji avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 bg-accent/15"
        >
          {master.avatarEmoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{master.name}</p>

          {master.categories.length > 0 && (
            <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
              {master.categories.join(' · ')}
            </p>
          )}

          {master.city && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-muted-foreground/60 flex-shrink-0" />
              <span className="text-xs text-muted-foreground/60 truncate">{master.city}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-1">
            {master.visitCount} {pluralUk(master.visitCount, 'візит', 'візити', 'візитів')} · Останній: {relativeDate(master.lastVisitDate)}
          </p>
        </div>

        {/* Book button */}
        <Link
          href={`/${master.slug}`}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer"
        >
          Записатись
        </Link>
      </div>
    </motion.div>
  );
}


