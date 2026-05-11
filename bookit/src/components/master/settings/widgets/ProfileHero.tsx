'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Share2, Loader2, X, Star, MessageSquare, Check, BadgeCheck } from 'lucide-react';
import { Drawer } from 'vaul';
import { ImageCropper } from '../components/ImageCropper';
import { getCroppedImg } from '../utils/cropImage';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { cn } from '@/lib/utils/cn';
import { pluralUk } from '@/lib/utils/pluralUk';

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
  onAvatarChange
}: ProfileHeroProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const isPremium = tier === 'pro' || tier === 'studio';

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
        .upload(`avatars/${fileName}`, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`avatars/${fileName}`);
      onAvatarChange(publicUrl);
      setIsDrawerOpen(false);
      showToast({ type: 'success', title: 'Фото оновлено', message: 'Ваш новий аватар успішно збережено' });
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося завантажити фото' });
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[40px] bg-white border border-white/60 shadow-2xl group">
      {/* Photo Section */}
      <div 
        className="relative aspect-[3/4] w-full bg-muted cursor-pointer overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
      >
        {avatarUrl ? (
          <Image 
            src={avatarUrl} 
            alt={fullName} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-peach to-background-deep text-muted-foreground/40">
            <Camera size={48} strokeWidth={1} />
            <span className="text-xs font-medium uppercase tracking-widest">Додати фото</span>
          </div>
        )}
        
        {/* Gradient Overlay - Much more subtle */}
        <div 
          className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white/40 to-transparent" 
          style={{ height: '30%' }} 
        />
          
        {/* Top-right Verification Badge */}
        {isPremium && (
          <div className="absolute top-6 right-6 z-20">
            <div className="flex items-center gap-1.5 bg-success px-3 py-1.5 rounded-full text-white shadow-xl shadow-success/30 border border-white/20 active:scale-95 transition-all cursor-default">
              <BadgeCheck size={16} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-tight">Verified</span>
            </div>
          </div>
        )}

        {/* Hover Camera Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
              <Camera size={28} className="text-white/80" />
           </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="relative -mt-36 px-8 pb-8 flex flex-col z-20">
          <p className="text-[9px] font-bold text-text-mute/60 uppercase tracking-[0.3em] mb-2 drop-shadow-sm">
            {businessName || 'Master Profile'}
          </p>
          <h2 className="text-3xl font-black tracking-tight text-text-primary mb-5 leading-tight">
            {fullName}
          </h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-orange-100/50 px-2.5 py-1.5 rounded-xl border border-orange-200/50">
                <Star size={14} fill="#D4935A" className="text-[#D4935A]" />
                <span className="text-sm font-bold text-orange-700">{rating > 0 ? rating.toFixed(1) : '—'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-xl border border-white/60">
                <MessageSquare size={14} className="text-text-mute" />
                <span className="text-sm font-bold text-text-mute">
                  {ratingCount} {pluralUk(ratingCount, 'відгук', 'відгуки', 'відгуків')}
                </span>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (slug) {
                  navigator.clipboard.writeText(`https://bookit.com.ua/${slug}`);
                  showToast({ type: 'success', title: 'Посилання копійовано' });
                }
              }}
              className="w-11 h-11 rounded-2xl bg-white border border-white/80 shadow-md flex items-center justify-center text-text-primary active:scale-90 transition-all hover:bg-muted/10"
            >
              <Share2 size={18} />
            </button>
          </div>
      </div>

      {/* Hidden File Input */}
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
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96vh] bg-white rounded-t-[40px] flex flex-col z-[210] outline-none shadow-2xl">
            <div className="flex-1 overflow-y-auto px-6 pb-12 pt-4 scrollbar-hide">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted/60 mb-8" />
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold tracking-tight">Редагувати фото</h3>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-3 rounded-2xl bg-muted/30 hover:bg-muted transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="rounded-[32px] overflow-hidden border border-muted/20 shadow-inner bg-black/5">
                  {selectedImage && (
                    <ImageCropper 
                      image={selectedImage} 
                      onCropComplete={setCroppedAreaPixels} 
                    />
                  )}
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-5 rounded-3xl bg-muted/40 font-bold text-sm active:scale-95 transition-all"
                  >
                    Скасувати
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 py-5 rounded-3xl bg-accent text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-95 transition-all"
                  >
                    {uploading ? (
                      <><Loader2 size={18} className="animate-spin" /> Зберігаємо...</>
                    ) : (
                      'Зберегти результат'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
