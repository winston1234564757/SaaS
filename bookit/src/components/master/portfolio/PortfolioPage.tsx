'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Trash2, Loader2, Lock, PenLine, Check, X as XIcon } from 'lucide-react';
import { usePortfolio } from '@/lib/supabase/hooks/usePortfolio';
import { useMasterContext } from '@/lib/supabase/context';
import Image from 'next/image';
import Link from 'next/link';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';

const STARTER_LIMIT = 9;

export function PortfolioPage() {
  const { masterProfile } = useMasterContext();
  const { currentStep, nextStep, closeTour } = useTour('portfolio', 2);
  const { photos, isLoading, isUploading, uploadPhoto, deletePhoto, updateCaption } = usePortfolio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPro = masterProfile?.subscription_tier === 'pro' || masterProfile?.subscription_tier === 'studio';
  const atLimit = !isPro && photos.length >= STARTER_LIMIT;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    for (const file of files) {
      if (atLimit) break;
      await uploadPhoto(file);
    }
    e.target.value = '';
  }

  function startEditCaption(id: string, current: string | null) {
    setEditingId(id);
    setEditCaption(current ?? '');
  }

  async function saveCaption(id: string) {
    await updateCaption(id, editCaption);
    setEditingId(null);
  }

  async function handleDelete(id: string, storagePath: string) {
    setDeletingId(id);
    await deletePhoto(id, storagePath);
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="relative">
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="📸 Ваше портфоліо"
          text="Завантажте фото найкращих робіт. Візуальне портфоліо — це фактор №1, на який дивляться клієнти при виборі майстра."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />
      </div>
      {/* Header */}
      <div className="bento-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Портфоліо</h1>
            <p className="text-sm text-[#A8928D]">Покажіть свої кращі роботи</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-semibold text-[#2C1A14]">
              {photos.length}
              {!isPro && <span className="text-[#A8928D] font-normal"> / {STARTER_LIMIT}</span>}
            </p>
            <p className="text-[11px] text-[#A8928D]">фото</p>
          </div>
        </div>

        {!isPro && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-[#F5E8E3] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((photos.length / STARTER_LIMIT) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="h-full rounded-full"
                style={{ background: photos.length >= STARTER_LIMIT ? '#C05B5B' : '#789A99' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pro-lock banner */}
      {atLimit && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#789A99]/12 flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-[#789A99]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2C1A14]">Ліміт Starter: {STARTER_LIMIT} фото</p>
            <p className="text-xs text-[#A8928D]">На Pro — необмежена галерея</p>
          </div>
          <Link
            href="/dashboard/billing"
            className="flex-shrink-0 px-3 py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold hover:bg-[#6B8C8B] transition-colors"
          >
            Pro
          </Link>
        </motion.div>
      )}

      <div className="relative">
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="✍️ Підписи до фото"
          text="Обов'язково додавайте опис до фото, щоб клієнти бачили складність вашої роботи."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
      </div>
      {/* Upload zone */}
      {!atLimit && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bento-card flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-[#C8B8B2] hover:border-[#789A99] hover:bg-white/40 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 size={28} className="text-[#789A99] animate-spin" />
          ) : (
            <ImagePlus size={28} className="text-[#A8928D]" />
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-[#6B5750]">
              {isUploading ? 'Завантаження...' : 'Додати фото'}
            </p>
            <p className="text-xs text-[#A8928D] mt-0.5">JPG, PNG, WebP — до 5 МБ</p>
          </div>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-[#789A99] animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">🖼️</div>
          <p className="text-sm font-semibold text-[#2C1A14]">Портфоліо поки порожнє</p>
          <p className="text-xs text-[#A8928D] max-w-[220px]">Завантажте фото своїх робіт, щоб клієнти могли оцінити ваш стиль</p>
        </div>
      ) : (
        /* Photo grid */
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 26 }}
                className="bento-card overflow-hidden group"
              >
                {/* Photo */}
                <div className="relative w-full aspect-square">
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? `Фото ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 300px"
                  />

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(photo.id, photo.storagePath)}
                    disabled={deletingId === photo.id}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#2C1A14]/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#C05B5B] transition-all"
                  >
                    {deletingId === photo.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>

                {/* Caption */}
                <div className="px-3 py-2">
                  {editingId === photo.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editCaption}
                        onChange={e => setEditCaption(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveCaption(photo.id)}
                        placeholder="Підпис..."
                        className="flex-1 text-xs bg-white/80 border border-[#789A99]/40 rounded-lg px-2 py-1 outline-none text-[#2C1A14]"
                      />
                      <button onClick={() => saveCaption(photo.id)} className="text-[#5C9E7A]">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-[#A8928D]">
                        <XIcon size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditCaption(photo.id, photo.caption)}
                      className="flex items-center gap-1.5 w-full text-left group/caption"
                    >
                      <p className="text-[11px] text-[#A8928D] flex-1 truncate group-hover/caption:text-[#6B5750] transition-colors">
                        {photo.caption || 'Додати підпис...'}
                      </p>
                      <PenLine size={10} className="text-[#C8B8B2] group-hover/caption:text-[#A8928D] flex-shrink-0 transition-colors" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
