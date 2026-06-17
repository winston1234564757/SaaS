'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Share2, Loader2, Star, MessageSquare, BadgeCheck, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/lib/toast/context';
import { pluralUk } from '@/lib/utils/pluralUk';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PhotoUploader } from '@/components/shared/PhotoUploader';

interface ProfileHeroProps {
  masterId: string;
  fullName: string;
  businessName: string;
  bio: string;
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
  bio,
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
      className="widget-card overflow-hidden relative flex flex-col justify-end min-h-[380px]"
    >

      {/* Photo layer — click anywhere outside content to change */}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted">
                <Camera size={40} strokeWidth={1.2} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
              </div>
            )}
            {uploading ? (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
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

      {/* Gradient toned to surface */}
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none h-[65%]"
        style={{ background: 'linear-gradient(to top, var(--surface) 0%, color-mix(in srgb, var(--surface) 65%, transparent) 55%, transparent 100%)' }}
      />

      {/* Premium badge */}
      {isPremium && (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-border/60 z-10">
          <BadgeCheck size={13} className="text-success" />
          <span className="text-[10px] font-bold text-success uppercase tracking-tight">Pro</span>
        </div>
      )}

      {/* Content — pointer-events-none so clicks fall through to photo button */}
      <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-2.5 z-10 pointer-events-none">

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                {fullName || "Ваше ім'я"}
              </h2>
              {isPremium && <BadgeCheck size={17} className="text-success shrink-0" />}
            </div>
            {businessName && (
              <p className="text-[11px] text-muted-foreground/60 font-medium mt-0.5 truncate">{businessName}</p>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (slug) {
                navigator.clipboard.writeText(`https://bookit.com.ua/${slug}`);
                showToast({ type: 'success', title: 'Посилання скопійовано' });
              }
            }}
            aria-label="Скопіювати посилання"
            className="size-9 rounded-xl bg-secondary/70 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:bg-surface active:scale-[0.88] cursor-pointer transition-all shrink-0 border border-border/50 shadow-sm pointer-events-auto"
          >
            <Share2 size={15} />
          </button>
        </div>

        <div className="pointer-events-auto">
          <ExpandableBio value={bio} />
        </div>

        <div className="h-px bg-foreground/8" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star size={13} fill="#D4935A" className="text-[#D4935A]" />
              <span className="text-sm font-bold text-foreground">
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare size={13} className="text-muted-foreground/50" />
              <span className="text-sm font-bold text-foreground">{ratingCount}</span>
              <span className="text-[11px] text-muted-foreground/70">
                {pluralUk(ratingCount, 'відгук', 'відгуки', 'відгуків')}
              </span>
            </div>
          </div>

          {slug && (
            <a
              href={`https://bookit.com.ua/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background text-[11px] font-bold hover:opacity-80 active:scale-[0.95] cursor-pointer transition-all pointer-events-auto"
            >
              <ExternalLink size={11} />
              Переглянути
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ExpandableBio({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const clamped = value.length > 120 && !expanded;

  return (
    <motion.div layout transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }} className="space-y-1.5 pt-1.5 border-t border-foreground/10 w-full text-left">
      <label className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest px-1">Опис профілю</label>
      <motion.div layout="position">
        <p
          className={cn(
            'text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap px-1',
            clamped && 'line-clamp-3'
          )}
        >
          {value || 'Опис відсутній'}
        </p>
      </motion.div>
      {value.length > 120 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:opacity-70 active:scale-[0.95] cursor-pointer transition-all z-20 relative mt-1"
        >
          {expanded ? <><ChevronUp size={12} /> Згорнути</> : <><ChevronDown size={12} /> Читати далі</>}
        </button>
      )}
    </motion.div>
  );
}
