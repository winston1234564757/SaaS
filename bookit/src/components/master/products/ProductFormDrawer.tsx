'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus, Trash2, Loader2, Package, Link2 } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct, saveProductLinks } from '@/app/(master)/dashboard/products/actions';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useProductLinks } from '@/lib/supabase/hooks/useProductLinks';
import type { Product, ProductCategory } from '@/types/database';

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
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const [showDelete, setShowDelete]   = useState(false);
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

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > 5) {
      setError('Максимум 5 фото'); return;
    }
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { setError('Файл більше 5 МБ'); continue; }
      const ext  = file.name.split('.').pop();
      const path = `${masterProfile!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('product-photos')
        .upload(path, file, { upsert: false });
      if (upErr) { setError(upErr.message); continue; }
      const { data } = supabase.storage.from('product-photos').getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    setPhotos(prev => [...prev, ...newUrls]);
    setUploading(false);
  }

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

      // Persist service links via server action (admin client, no RLS issues)
      const linksRes = await saveProductLinks(productId, recommendAlways ? [] : linkedServiceIds);
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F5] rounded-t-3xl max-w-lg mx-auto flex flex-col max-h-[92dvh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {/* Handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-[#D4B9B0] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="text-base font-bold text-[#2C1A14]">
                {isEdit ? 'Редагувати товар' : 'Новий товар'}
              </h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#F5E8E3] flex items-center justify-center text-[#6B5750]">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">

              {/* Photos */}
              <div>
                <label className="text-xs font-semibold text-[#6B5750] uppercase tracking-wider mb-2 block">
                  Фото ({photos.length}/5)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {photos.map(url => (
                    <div key={url} className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#F5E8E3]">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button
                        onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#C05B5B] text-white flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#D4B9B0] flex flex-col items-center justify-center gap-1 text-[#A8928D] hover:border-[#789A99] hover:text-[#789A99] transition-colors"
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
                  multiple
                  className="hidden"
                  onChange={e => handlePhotoUpload(e.target.files)}
                />
              </div>

              {/* Name */}
              <Field label="Назва*">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Наприклад: Маска для волосся Kerastase"
                  className={INPUT_CLS}
                />
              </Field>

              {/* Category */}
              <Field label="Категорія">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        category === c.value
                          ? 'bg-[#789A99] text-white'
                          : 'bg-white/70 text-[#6B5750] border border-white/80 hover:bg-white'
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
              <div className="bg-white/60 rounded-2xl border border-white/80 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Link2 size={15} className="text-[#789A99] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#2C1A14]">Рекомендувати при будь-якому записі</p>
                      <p className="text-xs text-[#A8928D]">Пропонувати товар незалежно від послуги</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecommendAlways(v => !v)}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                      recommendAlways ? 'bg-[#789A99]' : 'bg-[#D4B9B0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        recommendAlways ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
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
                      <p className="text-xs text-[#6B5750] mb-2 font-medium">
                        Оберіть послуги, до яких рекомендувати цей товар:
                      </p>
                      {activeServices.length === 0 ? (
                        <p className="text-xs text-[#A8928D]">У вас ще немає активних послуг</p>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {activeServices.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleService(s.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                linkedServiceIds.includes(s.id)
                                  ? 'bg-[#789A99] text-white'
                                  : 'bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1]'
                              }`}
                            >
                              {s.emoji} {s.name}
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
                <p className="text-xs text-[#C05B5B] px-1">{error}</p>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={isPending || uploading}
                className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
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
                    <button
                      onClick={() => setShowDelete(true)}
                      className="w-full py-3 rounded-2xl text-xs font-medium text-[#C05B5B] hover:bg-[#C05B5B]/8 transition-colors"
                    >
                      Видалити товар
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDelete(false)}
                        className="flex-1 py-3 rounded-2xl text-xs font-medium text-[#6B5750] bg-white/60 hover:bg-white/80 transition-colors"
                      >
                        Скасувати
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex-1 py-3 rounded-2xl text-xs font-semibold text-white bg-[#C05B5B] flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.97] transition-all"
                      >
                        <Trash2 size={13} /> Підтвердити
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] outline-none focus:border-[#789A99]/50 transition-colors';

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-[#6B5750] uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
