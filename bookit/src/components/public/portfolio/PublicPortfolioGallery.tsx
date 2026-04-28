'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Scissors, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export interface PublicPortfolioItemPreview {
  id: string;
  title: string;
  description: string | null;
  service_name: string | null;
  review_count: number;
  cover_url: string | null;
  photo_count: number;
}

interface Props {
  items: PublicPortfolioItemPreview[];
  masterSlug: string;
}

export function PublicPortfolioGallery({ items, masterSlug }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-6 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#2C1A14] font-display">Портфоліо</h2>
        <Link
          href={`/${masterSlug}/portfolio`}
          className="flex items-center gap-1 text-xs font-semibold text-[#789A99]"
        >
          Всі роботи <ArrowRight size={13} />
        </Link>
      </div>

      {/* Horizontal scroll strip — 2 items + "All works" */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
        {items.slice(0, 2).map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="shrink-0 snap-start"
          >
            <Link href={`/${masterSlug}/portfolio/${item.id}`}>
              <div
                className="w-44 rounded-3xl overflow-hidden transition-transform active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 16px rgba(44,26,20,0.08)' }}
              >
                {/* Cover */}
                <div className="relative w-44 h-44 bg-[#F5E8E3]">
                  {item.cover_url ? (
                    <Image src={item.cover_url} alt={item.title} fill className="object-cover" sizes="176px" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Scissors size={24} className="text-[#C8B8B2]" />
                    </div>
                  )}
                  {item.photo_count > 1 && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/40 rounded-full px-1.5 py-0.5">
                      {item.photo_count}
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="p-3 space-y-1">
                  <p className="text-xs font-semibold text-[#2C1A14] leading-snug line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.service_name && (
                      <span className="text-[10px] font-medium text-[#A8928D]">{item.service_name}</span>
                    )}
                    {item.review_count > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#A8928D]">
                        <Star size={9} /> {item.review_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* "See all" card */}
        <div className="shrink-0 snap-start w-44">
          <Link href={`/${masterSlug}/portfolio`}>
            <div
              className="w-44 h-full min-h-[220px] rounded-3xl flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.97]"
              style={{ border: '2px dashed rgba(120,154,153,0.4)' }}
            >
              <ArrowRight size={20} className="text-[#789A99]" />
              <span className="text-xs font-semibold text-[#789A99]">Всі роботи</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
