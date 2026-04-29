'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { pluralUk } from '@/lib/utils/pluralUk';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  isPopular: boolean;
}

export interface StudioMemberPublic {
  masterId: string;
  role: 'owner' | 'member';
  slug: string;
  name: string;
  bio: string | null;
  avatarEmoji: string;
  rating: number;
  ratingCount: number;
  categories: string[];
  services: Service[];
}

interface Props {
  studio: { id: string; name: string };
  members: StudioMemberPublic[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return `${price.toLocaleString('uk-UA')} ₴`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} хв`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}г ${m}хв` : `${h} год`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function StudioPublicPage({ studio, members }: Props) {
  const [expandedMaster, setExpandedMaster] = useState<string | null>(
    members.length === 1 ? members[0].masterId : null,
  );

  const memberCount = members.length;
  const countLabel = `${memberCount} ${pluralUk(memberCount, 'майстер', 'майстри', 'майстрів')}`;

  return (
    <div className="min-h-screen" style={{ background: '#FFE8DC' }}>
      <BlobBackground />

      {/* Header */}
      <div className="relative px-4 pt-10 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur border border-white/80 text-xs text-muted-foreground mb-4">
            <span className="text-base">🏛️</span>
            Студія краси
          </div>
          <h1 className="heading-serif text-3xl text-foreground mb-2">{studio.name}</h1>
          <p className="text-sm text-muted-foreground">{countLabel} · онлайн-запис 24/7</p>
        </motion.div>
      </div>

      {/* Masters */}
      <div className="px-4 pb-10 flex flex-col gap-3 max-w-xl mx-auto">
        {members.map((master, i) => {
          const isExpanded = expandedMaster === master.masterId;

          return (
            <motion.div
              key={master.masterId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 24 }}
              className="bento-card overflow-hidden"
            >
              {/* Master card header (always visible) */}
              <button
                className="w-full p-4 flex items-center gap-3 text-left active:scale-95 transition-all"
                onClick={() => setExpandedMaster(isExpanded ? null : master.masterId)}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(255,210,194,0.5)' }}
                >
                  {master.avatarEmoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-foreground truncate">{master.name}</p>
                    {master.role === 'owner' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary flex-shrink-0 whitespace-nowrap">
                        Власник
                      </span>
                    )}
                  </div>
                  {master.categories.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {master.categories.slice(0, 2).join(' · ')}
                    </p>
                  )}
                  {master.ratingCount > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="text-warning fill-[#D4935A]" />
                      <span className="text-xs font-semibold text-foreground">{master.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground/60">({master.ratingCount})</span>
                    </div>
                  )}
                </div>

                <div
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <ChevronDown size={14} className="text-primary" />
                </div>
              </button>

              {/* Expandable services section */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isExpanded ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.3s ease',
                }}
              >
                <div style={{ overflow: 'hidden', minHeight: 0 }}>
                  <div className="px-4 pb-4 flex flex-col gap-2">
                    {master.bio && (
                      <p className="text-xs text-muted-foreground leading-relaxed border-b border-secondary pb-3 mb-1">
                        {master.bio}
                      </p>
                    )}

                    {master.services.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 py-2 text-center">Немає активних послуг</p>
                    ) : (
                      master.services.map(svc => (
                        <div key={svc.id} className="flex items-center gap-2 p-3 rounded-2xl bg-white/50">
                          {svc.isPopular && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning flex-shrink-0">
                              ТОП
                            </span>
                          )}
                          <p className="flex-1 text-sm text-foreground font-medium truncate">{svc.name}</p>
                          <p className="text-xs text-muted-foreground/60 flex-shrink-0 mr-1">
                            {formatDuration(svc.duration)}
                          </p>
                          <p className="text-sm font-bold text-primary flex-shrink-0">
                            {formatPrice(svc.price)}
                          </p>
                        </div>
                      ))
                    )}

                    <Link
                      href={`/${master.slug}`}
                      className="mt-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-[0_4px_14px_rgba(120,154,153,0.3)] active:scale-[0.98]"
                    >
                      Записатись до {master.name.split(' ')[0]}
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <Link href="/" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          Powered by <span className="font-semibold">Bookit</span>
        </Link>
      </div>
    </div>
  );
}
