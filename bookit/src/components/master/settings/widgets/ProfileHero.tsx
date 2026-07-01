'use client';

import Image from 'next/image';
import { Camera, Share2, Loader2, Star, MessageSquare, BadgeCheck, ExternalLink } from 'lucide-react';
import { useToast } from '@/lib/toast/context';
import { pluralUk } from '@/lib/utils/pluralUk';
import { motion } from 'framer-motion';
import { PhotoUploader } from '@/components/shared/PhotoUploader';

interface ProfileHeroProps {
  masterId: string;
  fullName: string;
  businessName: string;
  avatarUrl: string | null;
  tier: string;
  rating: number;
  ratingCount: number;
  slug: string;
  onAvatarChange: (url: string) => void;
}

export function ProfileHero({
  masterId,
  fullName,
  businessName,
  avatarUrl,
  tier,
  rating,
  ratingCount,
  slug,
  onAvatarChange,
}: ProfileHeroProps) {
  const { showToast } = useToast();
  const isPremium = tier === 'pro' || tier === 'studio';
  const displayName = businessName || fullName;

  return (
    <motion.div
      layout
      transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
      className="widget-card overflow-hidden relative flex flex-col min-h-[380px]"
    >
      {/* ── COVER (hero): full-bleed avatar, editorial scrim, serif name ── */}
      <div className="relative flex-1 min-h-[240px]">
        <PhotoUploader
          entity={{ type: 'master-avatar', masterId }}
          value={avatarUrl}
          onChange={(url) => { if (url) onAvatarChange(url); }}
        >
          {({ triggerUpload, uploading, preview }) => (
            <button
              type="button"
              onClick={triggerUpload}
              aria-label="Змінити фото профілю"
              className="absolute inset-0 z-[1] group"
            >
              {(preview ?? avatarUrl) ? (
                <Image
                  src={preview ?? avatarUrl ?? ''}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-700 to-slate-900 pb-16">
                  <Camera size={38} strokeWidth={1.2} className="text-white/50 group-hover:text-white/75 transition-colors" />
                  <span className="text-[11px] font-bold text-white/75">Додай фото</span>
                </div>
              )}
              {uploading ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-white" />
                </div>
              ) : avatarUrl ? (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Camera size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : null}
            </button>
          )}
        </PhotoUploader>

        {/* Editorial scrim — always dark at the name zone, independent of photo */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-border/60 z-10">
            <BadgeCheck size={13} className="text-success" />
            <span className="text-[10px] font-bold text-success uppercase tracking-tight">Pro</span>
          </div>
        )}

        {/* Masthead name — the one dominant element */}
        <div className="absolute inset-x-0 bottom-0 p-5 z-10 pointer-events-none">
          <h2 className="heading-serif text-[27px] leading-[1.04] text-white text-balance [text-shadow:0_1px_14px_rgba(0,0,0,0.5)]">
            {fullName || "Ваше ім'я"}
          </h2>
          {businessName && (
            <p className="text-xs text-white/80 font-medium mt-1 truncate [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">{businessName}</p>
          )}
        </div>
      </div>

      {/* ── FOOTER (rest): quiet stats + one dominant action ── */}
      <div className="p-4 pt-3.5 flex flex-col gap-3">
        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-warning" fill="currentColor" />
            <span className="metric-value text-sm text-foreground">
              {rating > 0 ? rating.toFixed(1) : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-text-sub" />
            <span className="metric-value text-sm text-foreground">{ratingCount}</span>
            <span className="text-[11px] text-text-sub">
              {pluralUk(ratingCount, 'відгук', 'відгуки', 'відгуків')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {slug ? (
            <a
              href={`https://bookit.com.ua/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-foreground text-background text-sm font-bold hover:opacity-90 active:scale-[0.97] transition-all shadow-sm"
            >
              <ExternalLink size={15} />
              Переглянути сторінку
            </a>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-secondary border border-border text-text-sub text-sm font-bold">
              Спочатку опублікуй сторінку
            </div>
          )}

          {slug && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`https://bookit.com.ua/${slug}`);
                showToast({ type: 'success', title: 'Посилання скопійовано' });
              }}
              aria-label="Скопіювати посилання"
              className="size-11 shrink-0 rounded-2xl bg-secondary border border-border flex items-center justify-center text-text-sub hover:text-foreground active:scale-[0.92] transition-all shadow-sm"
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
