'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Save,
  Trash2,
  Package,
  Link2,
  Eye,
  EyeOff,
  Layers3,
  BarChart3,
  Check,
  ImagePlus,
  Loader2,
  Infinity as InfinityIcon,
  Hash,
} from 'lucide-react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { useProductLinks } from '@/lib/supabase/hooks/useProductLinks';
import { createProduct, updateProduct, deleteProduct, saveProductLinks } from '@/app/(master)/dashboard/products/actions';
import { createClient } from '@/lib/supabase/client';
import type { Product, ProductCategory } from '@/types/database';
import { PRODUCT_ICON_OPTIONS, ProductIcon, type ProductIconName } from '@/lib/product-icons';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'hair', label: 'Волосся' },
  { value: 'nails', label: 'Нігті' },
  { value: 'skin', label: 'Шкіра' },
  { value: 'brows', label: 'Брови' },
  { value: 'body', label: 'Тіло' },
  { value: 'tools', label: 'Інструменти' },
  { value: 'other', label: 'Інше' },
];

const PRODUCT_TYPES = [
  { value: 'retail', label: 'Для продажу' },
  { value: 'consumable', label: 'Розхідник для послуги' },
] as const;


interface Props {
  id?: string;
}

export function ProductEditor({ id }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? '';
  const { services } = useServices();
  const activeServices = services.filter(s => s.active);
  const { products, isLoading } = useProductsForEditor();
  const product = id ? products.find(p => p.id === id) ?? null : null;
  const { links, invalidate: invalidateLinks } = useProductLinks(id ?? null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('other');
  const [priceStr, setPriceStr] = useState('');
  const [stockStr, setStockStr] = useState('0');
  const [photos, setPhotos] = useState<string[]>([]);
  const [recommendAlways, setRecommendAlways] = useState(true);
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([]);
  const [productType, setProductType] = useState<'retail' | 'consumable'>('retail');
  const [iconName, setIconName] = useState<ProductIconName>('package');
  const [uploading, setUploading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStockLimit, setShowStockLimit] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id && product) {
      setName(product.name);
      setDescription(product.description ?? '');
      setCategory(product.category);
      setPriceStr(String(product.price_kopecks / 100));
      setStockStr(String(product.stock_qty));
      setPhotos(product.photos ?? []);
      setRecommendAlways(product.recommend_always !== false);
      setIconName((product as Product & { icon_name?: ProductIconName }).icon_name ?? 'package');
      setProductType((product as Product & { product_type?: 'retail' | 'consumable' }).product_type ?? 'retail');
      setShowStockLimit(true);
    } else if (!id) {
      setName('');
      setDescription('');
      setCategory('other');
      setPriceStr('');
      setStockStr('0');
      setPhotos([]);
      setRecommendAlways(true);
      setLinkedServiceIds([]);
      setIconName('package');
      setProductType('retail');
      setShowStockLimit(true);
    }
    setError(null);
    setShowDelete(false);
  }, [id, product]);

  useEffect(() => {
    if (id && links.length > 0) {
      setLinkedServiceIds(links.map(l => l.serviceId));
    }
  }, [id, links]);

  function toggleService(serviceId: string) {
    setLinkedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > 5) {
      setError('Максимум 5 фото');
      return;
    }
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл більший за 5 МБ');
        continue;
      }
      const ext = file.name.split('.').pop();
      const path = `${masterId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-photos').upload(path, file, { upsert: false });
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const { data } = supabase.storage.from('product-photos').getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    setPhotos(prev => [...prev, ...newUrls]);
    setUploading(false);
  }

  async function handleSave() {
    const price = parseFloat(priceStr);
    if (!name.trim()) { setError('Назва обов\'язкова'); return; }
    if (isNaN(price) || price <= 0) { setError('Введіть коректну ціну'); return; }
    if (!recommendAlways && linkedServiceIds.length === 0) {
      setError('Оберіть хоча б одну послугу або увімкніть "Рекомендувати завжди"');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        price_kopecks: Math.round(price * 100),
        photos,
        stock_qty: showStockLimit ? Math.max(0, parseInt(stockStr, 10) || 0) : 0,
        is_active: true,
        recommend_always: recommendAlways,
        sort_order: 0,
        product_type: productType,
        icon_name: iconName,
      };

      let productId = id;
      if (productId) {
        const res = await updateProduct(productId, payload);
        if (res.error) { setError(res.error); return; }
      } else {
        const res = await createProduct(payload);
        if (res.error || !res.id) { setError(res.error ?? 'Не вдалося створити продукт'); return; }
        productId = res.id;
      }

      const linksRes = await saveProductLinks(productId, recommendAlways ? [] : linkedServiceIds);
      if (linksRes.error) { setError(linksRes.error); return; }

      invalidateLinks();
      qc.invalidateQueries({ queryKey: ['products', masterProfile?.id] });
      router.replace(`/dashboard/products/${productId}`, { scroll: false });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setIsSaving(true);
    try {
      const res = await deleteProduct(id);
      if (res.error) { setError(res.error); return; }
      qc.invalidateQueries({ queryKey: ['products', masterProfile?.id] });
      router.push('/dashboard/products');
    } finally {
      setIsSaving(false);
    }
  }

  if (id && isLoading && !product) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between mt-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            aria-label="Назад"
            className="w-10 h-10 rounded-lg bg-secondary/60 border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary/80 hover:text-primary transition-all active:scale-[0.88] cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="heading-serif text-xl text-foreground truncate">
              {id ? 'Редагування товару' : 'Новий товар'}
            </h1>
            <p className="text-xs text-muted-foreground/60 truncate">
              {id ? name || 'Поточний товар' : 'Створення нового товару або розхідника'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {id && (
            <button
              onClick={() => setShowDelete(v => !v)}
              aria-label="Видалити товар"
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-[0.88] cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || uploading}
            className="flex items-center gap-2 px-6 h-11 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.95] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span className="hidden sm:inline">Зберегти</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Core Metadata (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl flex-shrink-0 bg-secondary/40 border border-border shadow-inner">
                <ProductIcon name={iconName} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-1 block ml-1">Назва товару</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Введіть назву..."
                  className="w-full px-4 py-3 rounded-xl bg-secondary/40 border text-lg font-medium placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] block ml-1 mb-2">Опис товару</label>
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Опишіть деталі товару, переваги та спосіб використання..."
                className="w-full px-4 py-4 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-2 block ml-1">Категорія</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all border active:scale-[0.95] cursor-pointer ${
                      category === cat.value
                        ? 'bg-primary text-primary-foreground border-transparent'
                        : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {category === cat.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-2 block ml-1">Іконка</label>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_ICON_OPTIONS.map(opt => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIconName(opt.name)}
                    className={`p-2.5 rounded-xl text-sm transition-all active:scale-[0.95] cursor-pointer border ${
                      iconName === opt.name
                        ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/20'
                        : 'bg-secondary/40 border-border hover:bg-secondary/80'
                    }`}
                  >
                    {opt.icon ? <opt.icon size={16} /> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Media Assets & Strategy & Prices (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Media Assets Bento Box */}
          <div className="widget-card p-6 flex flex-col gap-4 border border-border rounded-[24px] bg-card">
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] block ml-1">Фото товару (до 5)</label>
            <div className="flex gap-2 flex-wrap">
              {photos.map(url => (
                <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden bg-secondary border border-border shrink-0">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    onClick={() => setPhotos(prev => prev.filter(p => p !== url))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground/60 hover:border-primary hover:text-primary cursor-pointer transition-all"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  <span className="text-xs">Додати</span>
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

          {/* Strategy & Prices Bento Box */}
          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <h3 className="text-[13px] font-semibold text-foreground">Ціна та стратегія</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-2 block ml-1">Ціна (₴)</label>
                <input
                  type="number"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/40 border text-base font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-2 block ml-1">Тип товару</label>
                <div className="flex gap-2">
                  {PRODUCT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setProductType(t.value)}
                      className={`flex-1 py-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.95] cursor-pointer ${
                        productType === t.value
                          ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/10'
                          : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-1 block ml-1">Наявність на складі</label>
              <button
                type="button"
                onClick={() => setShowStockLimit(v => !v)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer ${
                  showStockLimit ? 'bg-secondary/50 border-border' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${showStockLimit ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                  {showStockLimit ? <Hash size={18} /> : <InfinityIcon size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">{showStockLimit ? 'Обмежений склад' : 'Безлімітний склад'}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Відстеження товарних залишків</p>
                </div>
              </button>

              {showStockLimit && (
                <input
                  type="number"
                  value={stockStr}
                  onChange={e => setStockStr(e.target.value)}
                  placeholder="Введіть кількість..."
                  min="0"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border text-sm text-foreground outline-none transition-all focus:bg-secondary focus:border-primary font-bold"
                />
              )}
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-1 block ml-1">Рекомендації клієнтам</label>
              <button
                type="button"
                onClick={() => setRecommendAlways(v => !v)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer ${
                  recommendAlways ? 'bg-secondary/50 border-border' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${recommendAlways ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                  {recommendAlways ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">{recommendAlways ? 'Рекомендується завжди' : 'Рекомендувати вибірково'}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Показ товару в кошику при записі</p>
                </div>
              </button>

              {!recommendAlways && (
                <div className="flex flex-col gap-2.5 bg-secondary/20 p-3 rounded-xl border border-border mt-1">
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Рекомендувати з послугами:</p>
                  </div>
                  {activeServices.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 pl-1">Немає активних послуг</p>
                  ) : (
                    <div className="flex gap-1.5 flex-wrap">
                      {activeServices.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            linkedServiceIds.includes(s.id)
                              ? 'bg-primary text-white'
                              : 'bg-secondary text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {id && (
              <>
                <div className="h-px bg-border" />

                <div className="flex flex-col gap-4">
                  <div className="bg-sage/5 border border-sage/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center text-sage shrink-0">
                        <BarChart3 size={16} />
                      </div>
                      <h4 className="font-bold text-xs text-foreground">Аналітика продажів</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-secondary/40 p-2.5 rounded-lg border border-border">
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60 mb-0.5">Продано</p>
                        <p className="text-base font-display font-bold text-foreground leading-tight">24</p>
                        <p className="text-xs text-success font-bold mt-0.5 leading-none">+12%</p>
                      </div>
                      <div className="bg-secondary/40 p-2.5 rounded-lg border border-border">
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60 mb-0.5">Виручка</p>
                        <p className="text-base font-display font-bold text-foreground leading-tight">12.4к ₴</p>
                        <p className="text-xs text-success font-bold mt-0.5 leading-none">+8%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/40 border border-border p-4 rounded-xl flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shadow-sm shrink-0">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">Пряме посилання</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">Клієнт зможе переглянути товар у вашому магазині</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}/studio/${masterId}/shop`);
                        }
                      }}
                      className="w-full py-2 rounded-lg bg-secondary border border-border text-primary font-bold text-xs hover:bg-secondary/80 active:scale-[0.95] cursor-pointer transition-all"
                    >
                      Копіювати лінк
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDelete && id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="heading-serif text-xl text-foreground mb-2">Видалити товар?</h3>
            <p className="text-sm text-muted-foreground/70 mb-6">Товар сховається з dashboard і не буде доступний клієнтам.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-3 rounded-lg bg-secondary text-foreground font-semibold active:scale-[0.95] cursor-pointer transition-all">
                Скасувати
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-lg bg-destructive text-white font-semibold active:scale-[0.95] cursor-pointer transition-all">
                Підтвердити
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-secondary/40 p-3 rounded-lg border border-border">
      <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-1">{label}</p>
      <p className="text-xl font-display font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-success font-bold mt-0.5">{hint}</p>
    </div>
  );
}

function useProductsForEditor() {
  const { products, isLoading, error, refetch } = useProducts();
  return { products, isLoading, error, refetch };
}

