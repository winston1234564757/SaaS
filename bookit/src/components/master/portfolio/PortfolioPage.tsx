'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus, Trash2, Loader2, Lock, PenLine,
  Check, X as XIcon, Link as LinkIcon, Camera, Images, AlertCircle,
} from 'lucide-react';
import { usePortfolio } from '@/lib/supabase/hooks/usePortfolio';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';

const STARTER_LIMIT = 9;
const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

export function PortfolioPage() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const { currentStep, nextStep, closeTour } = useTour('portfolio', 2);
  const { photos, isLoading, isUploading, uploadPhoto, deletePhoto, updateCaption, updateServiceLink, uploadError, clearUploadError, queryError } = usePortfolio();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro    = masterProfile?.subscription_tier === 'pro' || masterProfile?.subscription_tier === 'studio';
  const atLimit  = !isPro && photos.length >= STARTER_LIMIT;

  const { data: services = [] } = useQuery<{ id: string; name: string; price: number }[]>({
    queryKey: ['services-list', masterId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price')
        .eq('master_id', masterId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });

  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [deletingId, setDeletingId]   = useState<string | null>(null);

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

  const progressPct   = Math.min((photos.length / STARTER_LIMIT) * 100, 100);
  const progressColor = photos.length >= STARTER_LIMIT ? '#C05B5B' : photos.length >= 7 ? '#D4935A' : '#789A99';

  return (
    <div className="flex flex-col gap-4 pb-10">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.04 }}
        className={cn(
          'relative bento-card p-5 transition-all duration-500',
          currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
        )}
      >
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="Ваше портфоліо"
          text="Завантажте фото найкращих робіт. Візуальне портфоліо — це фактор №1, на який дивляться клієнти при виборі майстра."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#789A99]/12 flex items-center justify-center shrink-0">
              <Images size={22} className="text-[#789A99]" />
            </div>
            <div>
              <h1 className="heading-serif text-xl text-[#2C1A14] leading-tight">Портфоліо</h1>
              <p className="text-sm text-[#A8928D]">Ваші найкращі роботи</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-[#2C1A14] leading-none tabular-nums">
              {photos.length}
              {!isPro && <span className="text-base font-normal text-[#A8928D]">/{STARTER_LIMIT}</span>}
            </p>
            <p className="text-[11px] text-[#A8928D] mt-0.5">фото</p>
          </div>
        </div>

        {/* Starter progress */}
        {!isPro && (
          <div className="mt-4 space-y-1.5">
            <div className="h-2 rounded-full bg-[#F5E8E3] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.25 }}
                className="h-full rounded-full"
                style={{ background: progressColor }}
              />
            </div>
            <p className="text-[10px] text-[#A8928D] text-right">
              {atLimit
                ? 'Ліміт вичерпано — перейдіть на Pro'
                : `${STARTER_LIMIT - photos.length} вільних слотів`}
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Query error banner ── */}
      <AnimatePresence>
        {queryError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bento-card p-4 flex items-center gap-3"
            style={{ background: 'rgba(192,91,91,0.06)', borderColor: 'rgba(192,91,91,0.2)' }}
          >
            <AlertCircle size={16} className="text-[#C05B5B] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#C05B5B]">Помилка завантаження портфоліо</p>
              <p className="text-[10px] text-[#C05B5B]/70 mt-0.5 break-all">{queryError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pro limit banner ── */}
      {atLimit && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-4 flex items-center gap-3"
          style={{ background: 'rgba(120,154,153,0.06)', borderColor: 'rgba(120,154,153,0.2)' }}
        >
          <div className="w-10 h-10 rounded-2xl bg-[#789A99]/12 flex items-center justify-center shrink-0">
            <Lock size={18} className="text-[#789A99]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2C1A14]">Ліміт Starter: {STARTER_LIMIT} фото</p>
            <p className="text-xs text-[#A8928D]">Pro — необмежена галерея та пріоритет у пошуку</p>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 px-3.5 py-2.5 rounded-xl bg-[#789A99] text-white text-xs font-bold hover:bg-[#6B8C8B] transition-colors cursor-pointer min-h-[44px] flex items-center"
          >
            Pro
          </Link>
        </motion.div>
      )}

      {/* ── Upload zone ── */}
      <div className={cn(
        'relative rounded-2xl transition-all duration-500',
        currentStep === 1 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="Підписи до фото"
          text="Обов'язково додавайте опис до фото, щоб клієнти бачили складність вашої роботи."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
        {!atLimit && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.08 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bento-card w-full flex flex-col items-center justify-center gap-3.5 py-10 border-2 border-dashed border-[#C8B8B2] hover:border-[#789A99] hover:bg-white/40 transition-all duration-300 disabled:opacity-60 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-3xl bg-[#789A99]/10 flex items-center justify-center group-hover:bg-[#789A99]/18 group-hover:scale-[1.06] transition-all duration-300">
              {isUploading
                ? <Loader2 size={26} className="text-[#789A99] animate-spin" />
                : <ImagePlus size={26} className="text-[#789A99]" />
              }
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#6B5750] group-hover:text-[#2C1A14] transition-colors">
                {isUploading ? 'Завантаження…' : 'Додати фото'}
              </p>
              <p className="text-xs text-[#A8928D] mt-0.5">JPG, PNG, WebP · до 10 МБ · декілька файлів</p>
            </div>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bento-card p-4 flex items-center gap-3"
            style={{ background: 'rgba(192,91,91,0.06)', borderColor: 'rgba(192,91,91,0.2)' }}
          >
            <AlertCircle size={16} className="text-[#C05B5B] shrink-0" />
            <p className="text-xs text-[#C05B5B] flex-1">{uploadError}</p>
            <button onClick={clearUploadError} className="text-[#C05B5B] p-1 cursor-pointer">
              <XIcon size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Loading skeleton ── */}
      {isLoading && photos.length === 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bento-card aspect-[4/5] animate-pulse bg-white/50 rounded-3xl" />
          ))}
        </div>
      ) : photos.length === 0 ? (

        /* ── Empty state ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="bento-card p-10 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#789A99]/10 flex items-center justify-center">
            <Camera size={28} className="text-[#789A99]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#2C1A14]">Портфоліо поки порожнє</p>
            <p className="text-xs text-[#A8928D] max-w-[220px] mt-1 leading-relaxed">
              Завантажте фото своїх робіт, щоб клієнти могли оцінити ваш стиль
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-[#789A99] text-white text-xs font-semibold hover:bg-[#6B8C8B] transition-colors cursor-pointer shadow-[0_4px_12px_rgba(120,154,153,0.3)]"
          >
            Завантажити перше фото
          </button>
        </motion.div>
      ) : (

        /* ── Photo grid ── */
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ delay: i * 0.04, ...SPRING }}
                className="bento-card overflow-hidden group hover:shadow-[0_8px_28px_rgba(44,26,20,0.13)] transition-shadow duration-300"
              >
                {/* Photo */}
                <div className="relative w-full aspect-[4/5] overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? `Фото ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 300px"
                  />

                  {/* Service badge overlay (top-left) */}
                  {photo.serviceId && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#789A99]/85 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full max-w-[calc(100%-52px)]">
                      <LinkIcon size={9} className="shrink-0" />
                      <span className="truncate">
                        {services.find(s => s.id === photo.serviceId)?.name ?? 'Послуга'}
                      </span>
                    </div>
                  )}

                  {/* Delete button (top-right, always visible) */}
                  <button
                    onClick={() => handleDelete(photo.id, photo.storagePath)}
                    disabled={deletingId === photo.id}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#C05B5B]/80 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {deletingId === photo.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>

                {/* Caption */}
                <div className="px-3 pt-2.5 pb-1.5">
                  {editingId === photo.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editCaption}
                        onChange={e => setEditCaption(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveCaption(photo.id); }}
                        placeholder="Підпис…"
                        className="flex-1 text-xs bg-white/80 border border-[#789A99]/40 rounded-xl px-2.5 py-1.5 outline-none text-[#2C1A14] focus:ring-1 focus:ring-[#789A99]/40"
                      />
                      <button
                        onClick={() => saveCaption(photo.id)}
                        className="text-[#5C9E7A] p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-[#A8928D] p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditCaption(photo.id, photo.caption)}
                      className="flex items-center gap-1.5 w-full text-left group/caption cursor-pointer"
                    >
                      <p className="text-[11px] text-[#A8928D] flex-1 truncate group-hover/caption:text-[#6B5750] transition-colors">
                        {photo.caption || 'Додати підпис…'}
                      </p>
                      <PenLine size={10} className="text-[#C8B8B2] group-hover/caption:text-[#A8928D] shrink-0 transition-colors" />
                    </button>
                  )}
                </div>

                {/* Service link select */}
                <div className="px-3 pb-3">
                  <select
                    value={photo.serviceId ?? ''}
                    onChange={e => updateServiceLink(photo.id, e.target.value || null)}
                    className="w-full text-[11px] px-2.5 py-2 rounded-xl bg-white/70 border border-white/70 text-[#6B5750] outline-none hover:border-[#789A99]/40 focus:border-[#789A99]/60 transition-colors cursor-pointer"
                  >
                    <option value="">— кнопка «Хочу так само» —</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.price} ₴</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
