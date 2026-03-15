'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

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
  if (diffDays < 7) return `${diffDays} дні тому`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)} тиж. тому`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} міс. тому`;
  return `${Math.round(diffDays / 365)} р. тому`;
}

export function MyMastersPage({ masters }: { masters: Master[] }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Мої майстри</h1>
        <p className="text-sm text-[#A8928D]">
          {masters.length > 0
            ? `${masters.length} ${pluralMasters(masters.length)}`
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
          <p className="text-4xl mb-3">🌸</p>
          <p className="text-sm font-medium text-[#2C1A14] mb-1">
            Ти ще не записувалась до жодного майстра
          </p>
          <p className="text-xs text-[#A8928D] mb-5">
            Знайди свого ідеального майстра та запишись онлайн
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#5C7E7D] transition-colors"
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
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'rgba(255, 210, 194, 0.50)' }}
        >
          {master.avatarEmoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#2C1A14] truncate">{master.name}</p>

          {master.categories.length > 0 && (
            <p className="text-xs text-[#A8928D] mt-0.5 truncate">
              {master.categories.join(' · ')}
            </p>
          )}

          {master.city && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-[#A8928D] flex-shrink-0" />
              <span className="text-xs text-[#A8928D] truncate">{master.city}</span>
            </div>
          )}

          <p className="text-xs text-[#6B5750] mt-1">
            {master.visitCount} {pluralVisits(master.visitCount)} · Останній: {relativeDate(master.lastVisitDate)}
          </p>
        </div>

        {/* Book button */}
        <Link
          href={`/${master.slug}`}
          className="flex-shrink-0 px-3 py-2 rounded-2xl bg-[#789A99] text-white text-xs font-semibold hover:bg-[#5C7E7D] transition-colors"
        >
          Записатись
        </Link>
      </div>
    </motion.div>
  );
}

function pluralMasters(count: number): string {
  if (count === 1) return 'майстер';
  if (count >= 2 && count <= 4) return 'майстри';
  return 'майстрів';
}

function pluralVisits(count: number): string {
  if (count === 1) return 'візит';
  if (count >= 2 && count <= 4) return 'візити';
  return 'візитів';
}
