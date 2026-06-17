'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus, Trash2, Loader2, Package, Link2 } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct, saveProductLinks } from '@/app/(master)/dashboard/products/actions';
import { createClient } from '@/lib/supabase/client';
import { getCroppedImg } from '@/components/master/settings/utils/cropImage';
import { uploadPhoto } from '@/lib/upload/uploadPhoto';
import { CropDrawer } from '@/components/shared/CropDrawer';
import type { Area } from 'react-easy-crop';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useProductLinks } from '@/lib/supabase/hooks/useProductLinks';
import type { Product, ProductCategory } from '@/types/database';
import { ServiceIcon } from '@/lib/service-icons';
import { PhotoLightbox } from '@/components/shared/PhotoLightbox';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'hair',  label: 'Волосся' },
  { value: 'nails', label: 'Нігті' },
  { value: 'skin',  label: 'Шкіра' },
  { value: 'brows', label: 'Брови' },
  { value: 'body',  label: 'Тіло' },
  { value: 'tools', label: 'Інструменти' },
  { value: 'other', label: 'Інше' },
];

interface Props {
  open: boolean;
  initial: Product | null;
  onClose: () => void;
}

export function ProductFormDrawer({ open, initial, onClose }: Props) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { masterProfile } = useMasterContext();
  const { services } = useServices();
  const activeServices = services.filter(s => s.active);

  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState<ProductCategory>('other');
  const [priceStr, setPriceStr]       = useState('');
  const [stockStr, setStockStr]       = useState('0');
  const [photos, setPhotos]           = useState<string[]>([]);
  const [recommendAlways, setRecommendAlways] = useState(true);
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [cropSrc, setCropSrc]         = useState<string | null>(null);
  const [cropOpen, setCropOpen]       = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const [showDelete, setShowDelete]   = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load existing links when editing
  const { links, invalidate: invalidateLinks } = useProductLinks(isEdit ? initial!.id : null);

  // Populate fields when opening
  useEffect(() => {
    if (open && initial) {
      setName(initial.name);
      setDescription(initial.description ?? '');
      setCategory(initial.category);
      setPriceStr(String(initial.price_kopecks / 100));
      setStockStr(String(initial.stock_qty));
      setPhotos(initial.photos ?? []);
      setRecommendAlways(initial.recommend_always !== false);
    } else if (open && !initial) {
      setName(''); setDescription(''); setCategory('other');
      setPriceStr(''); setStockStr('0'); setPhotos([]);
      setRecommendAlways(true);
      setLinkedServiceIds([]);
    }
    setError(null);
    setShowDelete(false);
  }, [open, initial]);

  // Sync linked service IDs once links load (edit mode)
  useEffect(() => {
    if (isEdit && links.length > 0) {
      setLinkedServiceIds(links.map(l => l.serviceId));
    }
  }, [isEdit, links]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { setError('Файл більше 5 МБ'); return; }
    if (photos.length >= 5) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedAreaPixels: Area) => {
    if (!cropSrc) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      if (!blob) throw new Error('crop failed');
      const supabase = createClient();
      const masterId = masterProfile?.id ?? '';
      const result = await uploadPhoto(supabase, { type: 'product', masterId }, blob);
      if ('error' in result) {
        setError(result.error);
      } else {
        setPhotos(prev => [...prev, result.url]);
      }
      setCropOpen(false);
      setCropSrc(null);
    } catch {
      setError('Помилка завантаження фото');
      setCropOpen(false);
      setCropSrc(null);
    } finally {
      setUploading(false);
    }
  };

  function removePhoto(url: string) {
    setPhotos(prev => prev.filter(p => p !== url));
  }

  function toggleService(id: string) {
    setLinkedServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function handleClose() {
    onClose();
  }

  function handleSave() {
    const price = parseFloat(priceStr);
    if (!name.trim())             { setError('Назва обов\'язкова'); return; }
    if (isNaN(price) || price <= 0) { setError('Введіть коректну ціну'); return; }
    if (!recommendAlways && linkedServiceIds.length === 0) {
      setError('Оберіть хоча б одну послугу або увімкніть "Рекомендувати завжди"'); return;
    }

    setError(null);
    startTransition(async () => {
      const price_kopecks = Math.round(price * 100);

      let productId: string;

      if (isEdit) {
        const res = await updateProduct(initial!.id, {
          name: name.trim(), description: description.trim() || null,
          category, price_kopecks, photos, recommend_always: recommendAlways,
        });
        if (res.error) { setError(res.error); return; }
        productId = initial!.id;
      } else {
        const stock = parseInt(stockStr, 10) || 0;
        const res = await createProduct({
          name: name.trim(), description: description.trim() || null,
          category, price_kopecks, photos, stock_qty: stock,
          recommend_always: recommendAlways,
        });
        if (res.error) { setError(res.error); return; }
        productId = res.id!;
      }

      const linksRes = await saveProductLinks(productId, recommendAlways ? [] : linkedServiceIds.map(id => ({ serviceId: id, quantity: 1 })));
      if (linksRes.error) { setError(linksRes.error); return; }
      invalidateLinks();

      qc.invalidateQueries({ queryKey: ['products', masterProfile?.id] });
      handleClose();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteProduct(initial!.id);
      if (res.error) { setError(res.error); return; }
      qc.invalidateQueries({ queryKey: ['products', masterProfile?.id] });
      handleClose();
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-w-lg mx-auto flex flex-col max-h-[92dvh] border-t border-border"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {/* Handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="text-base font-bold text-foreground">
                {isEdit ? 'Редагувати товар' : 'Новий товар'}
              </h2>
              <button type="button" onClick={handleClose} aria-label="Закрити" className="size-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-[0.88] cursor-pointer transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">

              {/* Photos */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Фото ({photos.length}/5)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((url, photoIdx) => (
                    <div key={url} className="relative size-20 rounded-lg overflow-hidden bg-secondary">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(photoIdx)}
                        aria-label="Переглянути фото"
                        className="absolute inset-0 z-[1]"
                      />
                      <button type="button"
                        onClick={() => removePhoto(url)}
                        aria-label="Видалити фото"
                        className="absolute top-1 right-1 z-[2] size-5 rounded-full bg-destructive text-white flex items-center justify-center cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="size-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground/60 hover:border-primary hover:text-primary cursor-pointer transition-colors"
                    >
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                      <span className="text-[9px]">Додати</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={handleFilesSelected}
                />
              </div>

              {/* Name */}
              <Field label="Назва*">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Наприклад: Маска для волосся Kerastase"
                  aria-label="Назва товару"
                  className={INPUT_CLS}
                />
              </Field>

              {/* Category */}
              <Field label="Категорія">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button type="button"
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        category === c.value
                          ? 'bg-primary text-white'
                          : 'bg-secondary/60 text-muted-foreground border border-border hover:bg-secondary'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Price + Stock */}
              <div className="flex gap-3">
                <Field label="Ціна (₴)*" className="flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={priceStr}
                    onChange={e => setPriceStr(e.target.value)}
                    placeholder="0"
                    min="0"
                    aria-label="Ціна товару в гривнях"
                    className={INPUT_CLS}
                  />
                </Field>
                {!isEdit && (
                  <Field label="Кількість" className="flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={stockStr}
                      onChange={e => setStockStr(e.target.value)}
                      placeholder="0"
                      min="0"
                      aria-label="Кількість на складі"
                      className={INPUT_CLS}
                    />
                  </Field>
                )}
              </div>

              {/* Description */}
              <Field label="Опис">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Короткий опис товару..."
                  rows={3}
                  className={INPUT_CLS + ' resize-none'}
                />
              </Field>

              {/* Recommend toggle */}
              <div className="bg-secondary/60 rounded-lg border border-border p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Link2 size={15} className="text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Рекомендувати при будь-якому записі</p>
                      <p className="text-xs text-muted-foreground/60">Пропонувати товар незалежно від послуги</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={recommendAlways}
                    aria-label={recommendAlways ? 'Вимкнути рекомендацію' : 'Увімкнути рекомендацію'}
                    onClick={() => setRecommendAlways(v => !v)}
                    className="py-[12px] px-0.5 -my-[12px] flex items-center shrink-0 active:scale-95"
                  >
                    <span className={`relative w-12 h-6 rounded-full transition-colors ${
                      recommendAlways ? 'bg-accent' : 'bg-muted-foreground/25'
                    }`}>
                      <motion.div
                        animate={{ x: recommendAlways ? 24 : 0 }}
                        transition={{ type: 'spring' as const, stiffness: 500, damping: 30 } as const}
                        className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm"
                      />
                    </span>
                  </button>
                </div>

                {/* Service chips (visible when recommend_always = false) */}
                <AnimatePresence initial={false}>
                  {!recommendAlways && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        Оберіть послуги, до яких рекомендувати цей товар:
                      </p>
                      {activeServices.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60">У вас ще немає активних послуг</p>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {activeServices.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleService(s.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                                linkedServiceIds.includes(s.id)
                                  ? 'bg-primary text-white'
                                  : 'bg-secondary text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <ServiceIcon name={s.icon_name} size={14} />
                                <span>{s.name}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-destructive px-1">{error}</p>
              )}

              {/* Save */}
              <button type="button"
                onClick={handleSave}
                disabled={isPending || uploading}
                className="w-full py-3.5 rounded-lg bg-primary text-[var(--accent-on)] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.95] cursor-pointer transition-all"
              >
                {isPending
                  ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
                  : <><Package size={16} /> {isEdit ? 'Зберегти зміни' : 'Додати товар'}</>
                }
              </button>

              {/* Delete (edit only) */}
              {isEdit && (
                <div className="pt-1">
                  {!showDelete ? (
                    <button type="button"
                      onClick={() => setShowDelete(true)}
                      className="w-full py-3 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/8 cursor-pointer transition-colors"
                    >
                      Видалити товар
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => setShowDelete(false)}
                        className="flex-1 py-3 rounded-lg text-xs font-medium text-muted-foreground bg-secondary/60 hover:bg-secondary/80 cursor-pointer transition-colors"
                      >
                        Скасувати
                      </button>
                      <button type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex-1 py-3 rounded-lg text-xs font-semibold text-white bg-destructive flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.95] cursor-pointer transition-all"
                      >
                        <Trash2 size={13} /> Підтвердити
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {lightboxIndex !== null && (
              <PhotoLightbox
                photos={photos.map(url => ({ url }))}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onPrev={() => setLightboxIndex(prev => (prev !== null && prev > 0) ? prev - 1 : prev)}
                onNext={() => setLightboxIndex(prev => (prev !== null && prev < photos.length - 1) ? prev + 1 : prev)}
              />
            )}
          </AnimatePresence>

          <CropDrawer
            open={cropOpen}
            onOpenChange={open => { if (!open && !uploading) { setCropOpen(false); setCropSrc(null); } }}
            imageSrc={cropSrc}
            onConfirm={handleCropConfirm}
            onCancel={() => { setCropOpen(false); setCropSrc(null); }}
            uploading={uploading}
            aspectRatio={1}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full px-4 py-3 rounded-lg bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors';

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
