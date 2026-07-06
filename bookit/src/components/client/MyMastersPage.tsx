'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, MessageCircle, MapPin } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import { ClientPageHero } from './ClientPageHero';
import { monogramHue, initialOf, CORMORANT } from '@/components/public/explore/shared';

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
    <>
      {/* MOBILE / tablet - unchanged */}
      <div className="lg:hidden flex flex-col gap-4">
        <ClientPageHero
          title="Мої майстри"
          metric={masters.length}
          metricLabel={pluralUk(masters.length, 'майстер', 'майстри', 'майстрів')}
          subtitle={masters.length === 0 ? 'Ще немає збережених майстрів' : undefined}
        />

        {masters.length === 0 && <EmptyState />}

        {masters.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {masters.map((master, index) => (
                <MasterCard key={master.id} master={master} index={index} />
              ))}
            </div>
            <FindMoreLink />
          </>
        )}
      </div>

      {/* DESKTOP (lg+) - editorial gallery */}
      <DesktopMasters masters={masters} />
    </>
  );
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="bento-card p-8 text-center flex flex-col items-center gap-4"
    >
      <p className="text-sm font-semibold text-foreground">
        Ти ще не записувалась до жодного майстра
      </p>
      <p className="text-xs text-text-sub">Знайди майстра і запишись, це просто</p>
      <Link
        href="/explore"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
      >
        Знайти майстра
      </Link>
    </motion.div>
  );
}

function FindMoreLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/explore"
      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary/50 text-text-sub font-semibold hover:bg-secondary active:scale-[0.97] transition-all border border-border text-sm ${className}`}
    >
      <Search size={15} />
      Знайти нових майстрів
    </Link>
  );
}

/** Photo cover, else a designed monogram (deterministic Frost hue + serif initial). */
function MediaCover({
  master, sizes, monogramSize,
}: { master: Master; sizes: string; monogramSize: string }) {
  if (master.avatarUrl) {
    return <Image src={master.avatarUrl} alt={master.name} fill className="object-cover" sizes={sizes} />;
  }
  const hue = monogramHue(master.name || master.slug);
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `linear-gradient(140deg, hsl(${hue} 48% 91%), hsl(${hue} 54% 79%))` }}
    >
      <span className={`${monogramSize} leading-none select-none`} style={{ fontFamily: CORMORANT, color: `hsl(${hue} 42% 40%)` }}>
        {initialOf(master.name)}
      </span>
    </div>
  );
}

function CategoryPills({ categories, max }: { categories: string[]; max: number }) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.slice(0, max).map(cat => (
        <span key={cat} className="text-[11px] font-medium text-text-sub border border-border/60 px-2 py-0.5 rounded-full">
          {cat}
        </span>
      ))}
    </div>
  );
}

// ─── Mobile card (unchanged behaviour) ──────────────────────────────────────

function MasterCard({ master, index }: { master: Master; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ...SPRING }}
    >
      <div className="bento-card overflow-hidden">
        <Link href={`/${master.slug}`} className="block relative h-40 bg-accent/5 hover:opacity-95 transition-opacity">
          <MediaCover master={master} sizes="(max-width: 640px) 50vw, 33vw" monogramSize="text-4xl" />

          <div className="absolute top-2 right-2 flex items-center bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[10px] font-semibold text-white">
              {master.visitCount} {pluralUk(master.visitCount, 'візит', 'візити', 'візитів')}
            </span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[10px] font-medium text-white/90">{relativeDate(master.lastVisitDate)}</span>
          </div>
        </Link>

        <div className="p-3">
          <p className="text-sm font-semibold text-foreground truncate">{master.name}</p>

          {master.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {master.categories.slice(0, 2).map(cat => (
                <span key={cat} className="text-[10px] font-medium text-text-sub border border-border/60 px-1.5 py-0.5 rounded-full">
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

// ─── Desktop (lg+) - featured + auto-fit gallery ────────────────────────────

function DesktopMasters({ masters }: { masters: Master[] }) {
  // Featured = the client's main master (most visits, tie broken by recency).
  const sorted = [...masters].sort(
    (a, b) => b.visitCount - a.visitCount || b.lastVisitDate.localeCompare(a.lastVisitDate),
  );
  const featured = sorted[0] ?? null;
  const rest = sorted.slice(1);

  return (
    <div className="hidden lg:block px-8 py-8 max-w-6xl mx-auto">
      <ClientPageHero
        title="Мої майстри"
        metric={masters.length}
        metricLabel={pluralUk(masters.length, 'майстер', 'майстри', 'майстрів')}
        subtitle={masters.length === 0 ? 'Ще немає збережених майстрів' : undefined}
      />

      {masters.length === 0 ? (
        <div className="mt-6"><EmptyState /></div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {featured && <FeaturedMasterCard master={featured} />}

          {rest.length > 0 && (
            <section>
              <p className="heading-serif text-lg text-foreground mb-3">Інші майстри</p>
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(258px, 1fr))' }}>
                {rest.map((m, i) => <GalleryMasterCard key={m.id} master={m} index={i} />)}
              </div>
            </section>
          )}

          <FindMoreLink className="max-w-sm" />
        </div>
      )}
    </div>
  );
}

function FeaturedMasterCard({ master }: { master: Master }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex overflow-hidden rounded-3xl border border-border bg-background"
    >
      <Link
        href={`/${master.slug}`}
        aria-label={`Сторінка майстра ${master.name}`}
        className="relative w-[38%] max-w-[360px] shrink-0 bg-accent/5 hover:opacity-95 transition-opacity"
      >
        <MediaCover master={master} sizes="360px" monogramSize="text-7xl" />
      </Link>

      <div className="flex flex-1 min-w-0 flex-col justify-center gap-3.5 p-7">
        <p className="text-xs font-semibold text-accent">Твій головний майстер</p>

        <div>
          <h2 className="heading-serif text-3xl text-foreground leading-tight truncate">{master.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-text-sub">
            <span className="text-foreground"><span className="metric-value text-base">{master.visitCount}</span> {pluralUk(master.visitCount, 'візит', 'візити', 'візитів')}</span>
            <span aria-hidden="true" className="text-border">·</span>
            <span>востаннє {relativeDate(master.lastVisitDate)}</span>
            {master.city && (
              <>
                <span aria-hidden="true" className="text-border">·</span>
                <span className="inline-flex items-center gap-1"><MapPin size={13} className="text-text-sub" />{master.city}</span>
              </>
            )}
          </div>
        </div>

        <CategoryPills categories={master.categories} max={4} />

        <div className="mt-1 flex items-center gap-2.5">
          <Link
            href={`/${master.slug}`}
            className="inline-flex items-center justify-center px-6 min-h-[44px] rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Записатись
          </Link>
          <Link
            href={`/my/messages?to=${master.id}`}
            aria-label="Написати майстру"
            className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold hover:bg-secondary/70 active:scale-[0.98] transition-all"
          >
            <MessageCircle size={16} />
            Написати
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function GalleryMasterCard({ master, index }: { master: Master; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ...SPRING }}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background"
    >
      <Link href={`/${master.slug}`} className="relative block h-44 bg-accent/5 hover:opacity-95 transition-opacity">
        <MediaCover master={master} sizes="(max-width: 1280px) 33vw, 258px" monogramSize="text-5xl" />
        <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <span className="text-[10px] font-semibold text-white">
            {master.visitCount} {pluralUk(master.visitCount, 'візит', 'візити', 'візитів')}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground truncate">{master.name}</p>
          <p className="text-xs text-text-sub mt-0.5">востаннє {relativeDate(master.lastVisitDate)}</p>
        </div>

        <CategoryPills categories={master.categories} max={2} />

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link
            href={`/${master.slug}`}
            className="flex-1 flex items-center justify-center min-h-[44px] rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
          >
            Записатись
          </Link>
          <Link
            href={`/my/messages?to=${master.id}`}
            aria-label="Написати майстру"
            className="size-11 flex items-center justify-center rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/70 active:scale-[0.94] transition-all shrink-0"
          >
            <MessageCircle size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
