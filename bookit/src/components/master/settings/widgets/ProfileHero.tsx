'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Share2, Loader2, X, Star, MessageSquare, BadgeCheck, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { Drawer } from 'vaul';
import { ImageCropper } from '../components/ImageCropper';
import { getCroppedImg } from '../utils/cropImage';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { pluralUk } from '@/lib/utils/pluralUk';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const isPremium = tier === 'pro' || tier === 'studio';
  const displayName = businessName || fullName;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsDrawerOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');
      const supabase = createClient();
      const fileName = `${masterId}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(`avatars/${fileName}`, croppedBlob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`avatars/${fileName}`);
      onAvatarChange(publicUrl);
      setIsDrawerOpen(false);
      showToast({ type: 'success', title: 'Фото оновлено' });
    } catch (err) {
      showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося завантажити фото' });
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  return (
    <>
      {/* Card — full-bleed photo with gradient overlay */}
      <motion.div
        layout
        transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
        className="widget-card overflow-hidden relative flex flex-col justify-end min-h-[380px]"
      >

        {/* Photo layer */}
        <div className="absolute inset-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <Camera size={40} strokeWidth={1.2} className="text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Smooth gradient — no pure white, natural fade */}
        <div
          className="absolute bottom-0 inset-x-0 pointer-events-none h-[65%] bg-gradient-to-t from-background via-background/70 to-transparent"
        />

        {/* Premium badge — top right */}
        {isPremium && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-border/60 z-10">
            <BadgeCheck size={13} className="text-success" />
            <span className="text-[10px] font-bold text-success uppercase tracking-tight">Pro</span>
          </div>
        )}

        {/* Content — sits on the gradient */}
        <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-2.5 z-10">

          {/* Name + share */}
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

            <button type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (slug) {
                  navigator.clipboard.writeText(`https://bookit.com.ua/${slug}`);
                  showToast({ type: 'success', title: 'Посилання скопійовано' });
                }
              }}
              aria-label="Скопіювати посилання"
              className="size-9 rounded-xl bg-secondary/70 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:bg-surface active:scale-[0.88] cursor-pointer transition-all shrink-0 border border-border/50 shadow-sm"
            >
              <Share2 size={15} />
            </button>
          </div>

          {/* Bio */}
          <ExpandableBio value={bio} />

          {/* Thin divider */}
          <div className="h-px bg-foreground/8" />

          {/* Stats + view button */}
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
                <span className="text-[11px] text-muted-foreground/50">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background text-[11px] font-bold hover:opacity-80 active:scale-[0.95] cursor-pointer transition-all"
              >
                <ExternalLink size={11} />
                Переглянути
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Cropper Drawer */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96vh] bg-background rounded-t-[40px] flex flex-col z-[210] outline-none shadow-2xl">
            <div className="flex-1 overflow-y-auto px-6 pb-12 pt-4 scrollbar-hide">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted/60 mb-8" />
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold tracking-tight">Редагувати фото</h3>
                  <button type="button" onClick={() => setIsDrawerOpen(false)} aria-label="Закрити" className="p-3 rounded-2xl bg-muted/30 hover:bg-muted transition-colors cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
                <div className="rounded-[32px] overflow-hidden border border-muted/20 shadow-inner bg-black/5">
                  {selectedImage && (
                    <ImageCropper image={selectedImage} onCropComplete={setCroppedAreaPixels} />
                  )}
                </div>
                <div className="mt-10 flex gap-4">
                  <button type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-5 rounded-3xl bg-muted/45 font-bold text-sm active:scale-[0.95] cursor-pointer transition-all border border-border"
                  >
                    Скасувати
                  </button>
                  <button type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 py-5 rounded-3xl bg-accent text-[var(--accent-on)] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.95] cursor-pointer transition-all"
                  >
                    {uploading ? <><Loader2 size={18} className="animate-spin" /> Зберігаємо...</> : 'Зберегти'}
                  </button>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
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
        <button type="button"
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
