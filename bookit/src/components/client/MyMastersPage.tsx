'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, MessageCircle } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';

interface Master {
  id: string;
  slug: string;
  name: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  categories: string[];
  city: string | null;
  visitCount: number;
  lastVisitDate: string;
}

const SPRING = { type: 'spring', stiffness: 300, damping: 24 } as const;

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
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-foreground mb-0.5">Мої майстри</h1>
        <p className="text-sm text-muted-foreground/60">
          {masters.length > 0
            ? `${masters.length} ${pluralUk(masters.length, 'майстер', 'майстри', 'майстрів')}`
            : 'Ще немає майстрів'}
        </p>
      </div>

      {masters.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="bento-card p-8 text-center flex flex-col items-center gap-4"
        >
          <p className="text-sm font-semibold text-foreground">
            Ти ще не записувалась до жодного майстра
          </p>
          <p className="text-xs text-muted-foreground/60">
            Знайди майстра і запишись — це просто
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
          >
            Знайти майстра
          </Link>
        </motion.div>
      )}

      {masters.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {masters.map((master, index) => (
              <MasterCard key={master.id} master={master} index={index} />
            ))}
          </div>

          <Link
            href="/explore"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary/50 text-muted-foreground font-semibold hover:bg-secondary active:scale-[0.97] transition-all border border-border text-sm"
          >
            <Search size={15} />
            Знайти нових майстрів
          </Link>
        </>
      )}
    </div>
  );
}

function MasterCard({ master, index }: { master: Master; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ...SPRING }}
    >
      <div className="bento-card overflow-hidden">
        <Link href={`/${master.slug}`} className="block relative h-40 bg-accent/10 hover:opacity-95 transition-opacity">
          {master.avatarUrl ? (
            <Image
              src={master.avatarUrl}
              alt={master.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              {master.avatarEmoji}
            </div>
          )}

          <div className="absolute top-2 right-2 flex items-center bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[10px] font-semibold text-white">
              {master.visitCount} {pluralUk(master.visitCount, 'візит', 'візити', 'візитів')}
            </span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[10px] font-medium text-white/90">
              {relativeDate(master.lastVisitDate)}
            </span>
          </div>
        </Link>

        <div className="p-3">
          <p className="text-sm font-semibold text-foreground truncate">{master.name}</p>

          {master.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {master.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="text-[10px] font-medium text-muted-foreground/70 border border-border/60 px-1.5 py-0.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-2">
            <Link
              href={`/${master.slug}`}
              className="flex-1 flex items-center justify-center py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.97] transition-all min-h-[44px]"
            >
              Записатись
            </Link>
            <Link
              href={`/my/messages?to=${master.id}`}
              aria-label="Написати майстру"
              className="size-11 flex items-center justify-center rounded-xl bg-secondary border border-border text-foreground active:scale-[0.94] transition-transform shrink-0"
            >
              <MessageCircle size={15} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
