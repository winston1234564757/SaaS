'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Save,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Check,
  ImagePlus,
  Loader2,
  Infinity as InfinityIcon,
  Hash,
  Zap,
  ZapOff,
  FlaskConical,
  Bell,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { useProductLinks } from '@/lib/supabase/hooks/useProductLinks';
import { createProduct, updateProduct, deleteProduct, saveProductLinks, getProductStats, type ProductStats } from '@/app/(master)/dashboard/products/actions';
import { ProductStatsPanel } from './ProductStatsPanel';
import { createClient } from '@/lib/supabase/client';
import { getCroppedImg } from '@/components/master/settings/utils/cropImage';
import { uploadPhoto } from '@/lib/upload/uploadPhoto';
import { CropDrawer } from '@/components/shared/CropDrawer';
import { useToast } from '@/lib/toast/context';
import type { Area } from 'react-easy-crop';
import type { ProductCategory } from '@/types/database';
import { PRODUCT_ICON_OPTIONS, ProductIcon, type ProductIconName } from '@/lib/product-icons';

// humanized
const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const PURCHASE_UNIT_LABEL: Record<string, string> = { pcs: 'шт', g: 'г', kg: 'кг', ml: 'мл', L: 'л' };
const PURCHASE_UNITS = [
  ['pcs', 'шт'],
  ['ml', 'мл'],
  ['g', 'г'],
  ['L', 'л'],
  ['kg', 'кг'],
] as const;
const RATIO_TO_BASE: Record<string, number> = { pcs: 1, g: 1, ml: 1, kg: 1000, L: 1000 };

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'hair', label: 'Волосся' },
  { value: 'nails', label: 'Нігті' },
  { value: 'skin', label: 'Шкіра' },
  { value: 'brows', label: 'Брови' },
  { value: 'body', label: 'Тіло' },
  { value: 'tools', label: 'Інструменти' },
  { value: 'other', label: 'Інше' },
];

interface Props {
  id?: string;
}

export function ProductEditor({ id }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? '';
  const { services } = useServices();
  const activeServices = services.filter(s => s.active);
  const { products, isLoading } = useProducts();
  const product = id ? products.find(p => p.id === id) ?? null : null;
  const { links, invalidate: invalidateLinks } = useProductLinks(id ?? null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('other');
  const [priceStr, setPriceStr] = useState('');
  const [costStr, setCostStr] = useState('');
  const [stockStr, setStockStr] = useState('0');
  const [alertThresholdStr, setAlertThresholdStr] = useState('');
  const [purchaseUnitStr, setPurchaseUnitStr] = useState<'pcs' | 'g' | 'kg' | 'ml' | 'L'>('ml');
  const [purchaseQtyStr, setPurchaseQtyStr] = useState('');
  const [purchasePriceStr, setPurchasePriceStr] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [recommendAlways, setRecommendAlways] = useState(false);
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const [productType, setProductType] = useState<'retail' | 'consumable'>('retail');
  const [unit, setUnit] = useState<'pcs' | 'ml' | 'g'>('pcs');
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [iconName, setIconName] = useState<ProductIconName>('package');
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStockLimit, setShowStockLimit] = useState(true);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isConsumable = productType === 'consumable';

  // Live cost-per-usage calculation from bulk pricing
  const costPerUsageKopecks = useMemo(() => {
    const qty = parseFloat(purchaseQtyStr);
    const price = parseFloat(purchasePriceStr);
    if (!qty || !price || qty <= 0 || price <= 0) return null;
    return Math.round((price * 100) / (qty * (RATIO_TO_BASE[purchaseUnitStr] ?? 1)));
  }, [purchaseQtyStr, purchasePriceStr, purchaseUnitStr]);

  // Auto-fill cost from bulk pricing
  useEffect(() => {
    if (costPerUsageKopecks != null && isConsumable) {
      setCostStr((costPerUsageKopecks / 100).toFixed(2));
    }
  }, [costPerUsageKopecks, isConsumable]);

  const pageTitle = id
    ? (isConsumable ? 'Редагування розхідника' : 'Редагування товару')
    : (isConsumable ? 'Новий розхідник' : 'Новий товар');

  // Pre-select consumable type from URL param (new item only)
  useEffect(() => {
    if (!id && searchParams.get('type') === 'consumable') {
      setProductType('consumable');
      setRecommendAlways(false);
      setUnit('ml');
      setPurchaseUnitStr('L');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (id && product) {
      setName(product.name);
      setDescription(product.description ?? '');
      setCategory(product.category);
      setPriceStr(product.price_kopecks > 0 ? String(product.price_kopecks / 100) : '');
      setCostStr(product.cost_kopecks ? String(product.cost_kopecks / 100) : '');
      setStockStr(String(product.stock_qty));
      setAlertThresholdStr(product.stock_alert_threshold != null ? String(product.stock_alert_threshold) : '');
      setPurchaseUnitStr((product.purchase_unit as 'pcs' | 'g' | 'kg' | 'ml' | 'L') ?? 'ml');
      setPurchaseQtyStr(product.purchase_qty != null ? String(product.purchase_qty) : '');
      setPurchasePriceStr(product.purchase_price_kopecks != null ? String(product.purchase_price_kopecks / 100) : '');
      setPhotos(product.photos ?? []);
      setRecommendAlways(product.recommend_always ?? false);
      setIconName(product.icon_name ?? 'package');
      setProductType(product.product_type ?? 'retail');
      setUnit(product.unit ?? 'pcs');
      setAutoDeduct(product.auto_deduct !== false);
      setShowStockLimit(true);
      setError(null);
      setShowDelete(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    if (id && links.length > 0) {
      setLinkedServiceIds(links.map(l => l.serviceId));
      const qMap: Record<string, number> = {};
      links.forEach(l => { qMap[l.serviceId] = l.quantity; });
      setServiceQuantities(qMap);
    }
  }, [links, id]);

  // Per-product sales analytics (retail only, saved products)
  useEffect(() => {
    if (!id || !product || product.product_type === 'consumable') {
      setStats(null);
      return;
    }
    setStatsLoading(true);
    getProductStats(id)
      .then(({ data }) => setStats(data))
      .finally(() => setStatsLoading(false));
  }, [id, product?.id, product?.product_type]);

  function toggleService(serviceId: string) {
    setLinkedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
    if (!linkedServiceIds.includes(serviceId)) {
      setServiceQuantities(prev => ({ ...prev, [serviceId]: prev[serviceId] ?? 1 }));
    }
  }

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    const slots = 5 - photos.length;
    const toProcess = valid.slice(0, slots);
    if (!toProcess.length) return;

    const readers = toProcess.map(file => new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then(urls => {
      setCropSrc(urls[0]);
      setCropQueue(urls.slice(1));
      setCropOpen(true);
    });
  };

  const handleCropConfirm = async (croppedAreaPixels: Area) => {
    if (!cropSrc) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      if (!blob) throw new Error('crop failed');
      const supabase = createClient();
      const result = await uploadPhoto(supabase, { type: 'product', masterId }, blob);
      if ('error' in result) {
        setError(result.error);
        setCropOpen(false);
        setCropSrc(null);
        setCropQueue([]);
      } else {
        setPhotos(prev => [...prev, result.url]);
        if (cropQueue.length > 0) {
          setCropSrc(cropQueue[0]);
          setCropQueue(prev => prev.slice(1));
        } else {
          setCropOpen(false);
          setCropSrc(null);
        }
      }
    } catch {
      setError('Помилка завантаження фото');
      setCropOpen(false);
      setCropSrc(null);
      setCropQueue([]);
    } finally {
      setUploading(false);
    }
  };

  async function handleSave() {
    const price = parseFloat(priceStr) || 0;
    if (!name.trim()) { setError('Назва обов\'язкова'); return; }
    if (!isConsumable && price <= 0) { setError('Введіть коректну ціну'); return; }
    if (isConsumable && !recommendAlways && linkedServiceIds.length === 0) {
      setError('Оберіть хоча б одну послугу або увімкніть "До всіх послуг"');
      return;
    }
    if (!isConsumable && !recommendAlways && linkedServiceIds.length === 0) {
      setError('Оберіть хоча б одну послугу або увімкніть "Рекомендується завжди"');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const effectiveCost = costStr.trim() ? Math.round(parseFloat(costStr) * 100) : null;

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        price_kopecks: isConsumable ? Math.round(price * 100) : Math.round(price * 100),
        cost_kopecks: effectiveCost,
        photos,
        stock_qty: showStockLimit ? Math.max(0, parseInt(stockStr, 10) || 0) : 0,
        stock_alert_threshold: alertThresholdStr.trim() ? parseInt(alertThresholdStr, 10) : null,
        purchase_unit: purchaseQtyStr && purchasePriceStr ? purchaseUnitStr : null,
        purchase_qty: purchaseQtyStr.trim() ? parseFloat(purchaseQtyStr) : null,
        purchase_price_kopecks: purchasePriceStr.trim() ? Math.round(parseFloat(purchasePriceStr) * 100) : null,
        is_active: true,
        recommend_always: recommendAlways,
        sort_order: 0,
        product_type: productType,
        unit,
        icon_name: iconName,
        auto_deduct: autoDeduct,
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

      const serviceLinks = recommendAlways
        ? []
        : linkedServiceIds.map(sid => ({ serviceId: sid, quantity: serviceQuantities[sid] ?? 1 }));

      const linksRes = await saveProductLinks(productId, serviceLinks);
      if (linksRes.error) { setError(linksRes.error); return; }

      invalidateLinks();
      qc.invalidateQueries({ queryKey: ['products', masterProfile?.id] });
      showToast({ type: 'success', title: isConsumable ? 'Розхідник збережено' : 'Товар збережено' });
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
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mt-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Назад"
            className="size-10 rounded-full bg-secondary/60 border border-border flex items-center justify-center text-text-sub hover:bg-secondary/80 hover:text-primary transition-all active:scale-[0.88] cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="heading-serif text-xl text-foreground truncate">{pageTitle}</h1>
            <p className="text-xs text-text-sub truncate">
              {id ? (name || (isConsumable ? 'Поточний розхідник' : 'Поточний товар')) : (isConsumable ? 'Налаштування матеріалу для послуг' : 'Створення нового товару')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {id && (
            <button
              type="button"
              onClick={() => setShowDelete(v => !v)}
              aria-label="Видалити"
              className="hidden md:flex items-center justify-center size-10 rounded-full bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-[0.88] cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          )}
          <Button variant="primary" size="md" onClick={handleSave} disabled={isSaving || uploading} isLoading={isSaving} className="px-6 shadow-lg">
            <Save size={18} />
            <span className="hidden sm:inline">Зберегти</span>
          </Button>
        </div>
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Core metadata */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-[24px] flex items-center justify-center flex-shrink-0 bg-secondary/40 border border-border shadow-inner">
                <ProductIcon name={iconName} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-1 block ml-1">
                  {isConsumable ? 'Назва матеріалу' : 'Назва товару'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={isConsumable ? 'Наприклад: Гель-лак OPI №12' : 'Введіть назву...'}
                  aria-label="Назва"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/40 border text-lg font-medium placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                />
              </div>
            </div>

            {!isConsumable && (
              <div>
                <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] block ml-1 mb-2">Опис товару</label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Опишіть деталі товару, переваги та спосіб використання..."
                  className="w-full px-4 py-4 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-2 block ml-1">Категорія</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all border active:scale-[0.95] cursor-pointer ${
                      category === cat.value
                        ? 'bg-primary text-primary-foreground border-transparent'
                        : 'bg-secondary/40 border-border text-text-sub hover:bg-secondary/80'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {category === cat.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-2 block ml-1">Іконка</label>
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

        {/* Right: Media + Pricing */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {!isConsumable && (
            <div className="widget-card p-6 flex flex-col gap-4 border border-border rounded-[24px] bg-card">
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] block ml-1">Фото товару (до 5)</label>
              <div className="flex gap-2 flex-wrap">
                {photos.map(url => (
                  <div key={url} className="relative size-20 rounded-xl overflow-hidden bg-secondary border border-border shrink-0">
                    <Image src={url} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter(p => p !== url))}
                      aria-label="Видалити фото"
                      className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="size-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-text-sub hover:border-primary hover:text-primary cursor-pointer transition-all"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                    <span className="text-xs">Додати</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" aria-hidden="true" tabIndex={-1} onChange={handleFilesSelected} />
            </div>
          )}

          {/* Pricing card */}
          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <h3 className="text-[13px] font-semibold text-foreground">{isConsumable ? 'Параметри розхідника' : 'Ціна та стратегія'}</h3>

            {/* Retail price */}
            {!isConsumable && (
              <div>
                <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-2 block ml-1">Ціна (₴)</label>
                <input
                  type="number"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                  placeholder="0"
                  aria-label="Ціна товару"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/40 border text-base font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                />
              </div>
            )}

            {/* Consumable settings */}
            {isConsumable && (
              <div className="flex flex-col gap-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Налаштування розхідника</p>

                {/* 1. Unit selector */}
                <div>
                  <p className="text-[10px] font-semibold text-text-sub uppercase tracking-wider mb-2">Одиниця витрати</p>
                  <div className="flex gap-2">
                    {([['pcs', 'шт'], ['ml', 'мл'], ['g', 'г']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={unit === val}
                        onClick={() => setUnit(val)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-[0.95] cursor-pointer ${
                          unit === val
                            ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/10'
                            : 'bg-secondary/40 border-border text-text-sub hover:bg-secondary/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Bulk pricing */}
                <div>
                  <p className="text-[10px] font-semibold text-text-sub uppercase tracking-wider mb-2">Закупівля</p>
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <p className="text-[10px] text-text-sub mb-1.5">Одиниця упаковки</p>
                      <div className="grid grid-cols-5 gap-1">
                        {PURCHASE_UNITS.map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            aria-pressed={purchaseUnitStr === val}
                            onClick={() => setPurchaseUnitStr(val)}
                            className={`py-2 rounded-lg border text-[10px] font-bold transition-all active:scale-[0.95] cursor-pointer ${
                              purchaseUnitStr === val
                                ? 'bg-primary text-primary-foreground border-transparent'
                                : 'bg-secondary/40 border-border text-text-sub hover:bg-secondary/80'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-text-sub mb-1 block">
                          Кількість в упаковці ({PURCHASE_UNIT_LABEL[purchaseUnitStr]})
                        </label>
                        <input
                          type="number"
                          value={purchaseQtyStr}
                          onChange={e => setPurchaseQtyStr(e.target.value)}
                          placeholder="0"
                          min="0"
                          aria-label="Кількість в упаковці"
                          className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-sub mb-1 block">Ціна закупки (₴)</label>
                        <input
                          type="number"
                          value={purchasePriceStr}
                          onChange={e => setPurchasePriceStr(e.target.value)}
                          placeholder="0"
                          min="0"
                          aria-label="Ціна закупки"
                          className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {costPerUsageKopecks != null && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ type: 'spring' as const, stiffness: 340, damping: 28 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--accent-light)] border border-[var(--border)]">
                          <Bell size={14} className="text-[var(--accent)] mt-0.5 shrink-0" />
                          <p className="text-xs text-[var(--text-secondary)]">
                            Собівартість:{' '}
                            <span className="font-bold text-[var(--text-primary)]">
                              {(costPerUsageKopecks / 100).toFixed(2)} ₴ / {UNIT_LABEL[unit]}
                            </span>
                            {' '}— автоматично підставиться в поле нижче і піде в розрахунок маржинальності послуг
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 3. Собівартість (auto-filled or manual) */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-text-sub mb-1.5 block ml-1">
                      Собівартість / {UNIT_LABEL[unit]} (₴)
                    </label>
                    <input
                      type="number"
                      value={costStr}
                      onChange={e => setCostStr(e.target.value)}
                      placeholder="0"
                      aria-label="Собівартість"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/40 border text-sm font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-text-sub mb-1.5 block ml-1">Ціна продажу (₴)</label>
                    <input
                      type="number"
                      value={priceStr}
                      onChange={e => setPriceStr(e.target.value)}
                      placeholder="0"
                      aria-label="Ціна продажу"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/40 border text-sm font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                    />
                  </div>
                </div>

                {/* 4. Auto-deduct */}
                <button
                  type="button"
                  aria-pressed={autoDeduct}
                  onClick={() => setAutoDeduct(v => !v)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer ${
                    autoDeduct ? 'bg-success/10 border-success/20' : 'bg-secondary/40 border-border'
                  }`}
                >
                  <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${autoDeduct ? 'bg-success/20 text-success' : 'bg-muted/40 text-text-sub'}`}>
                    {autoDeduct ? <Zap size={18} /> : <ZapOff size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground leading-tight">
                      {autoDeduct ? 'Автосписання увімкнено' : 'Автосписання вимкнено'}
                    </p>
                    <p className="text-xs text-text-sub mt-0.5">
                      {autoDeduct ? 'Списується при завершенні запису' : 'Склад не змінюється автоматично'}
                    </p>
                  </div>
                </button>

                {/* 5. Stock alert threshold */}
                <div>
                  <label className="text-[10px] font-semibold text-text-sub uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Bell size={10} />
                    Сповіщати, коли залишиться
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={alertThresholdStr}
                      onChange={e => setAlertThresholdStr(e.target.value)}
                      placeholder="—"
                      min="0"
                      aria-label="Поріг сповіщення"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-sub pointer-events-none">
                      {UNIT_LABEL[unit]}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-sub mt-1 ml-1">Надішлемо сповіщення, коли запаси закінчуються</p>
                </div>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Stock */}
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-1 block ml-1">Наявність на складі</label>
              <button
                type="button"
                aria-pressed={showStockLimit}
                onClick={() => setShowStockLimit(v => !v)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer ${showStockLimit ? 'bg-secondary/50 border-border' : 'bg-primary/5 border-primary/20'}`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${showStockLimit ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                  {showStockLimit ? <Hash size={18} /> : <InfinityIcon size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">{showStockLimit ? 'Обмежений склад' : 'Безлімітний склад'}</p>
                  <p className="text-xs text-text-sub mt-0.5">Відстеження товарних залишків</p>
                </div>
              </button>

              {showStockLimit && (
                <div className="relative">
                  <input
                    type="number"
                    value={stockStr}
                    onChange={e => setStockStr(e.target.value)}
                    placeholder="Введіть кількість..."
                    min="0"
                    aria-label="Кількість на складі"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border text-sm text-foreground outline-none transition-all focus:bg-secondary focus:border-primary font-bold pr-12"
                  />
                  {isConsumable && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-sub pointer-events-none select-none">
                      {UNIT_LABEL[unit]}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Retail strategy (recommendation) */}
            {!isConsumable && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-1 block ml-1">Рекомендації клієнтам</label>
                  <button
                    type="button"
                    aria-pressed={recommendAlways}
                    onClick={() => setRecommendAlways(v => !v)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer ${recommendAlways ? 'bg-secondary/50 border-border' : 'bg-primary/5 border-primary/20'}`}
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${recommendAlways ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                      {recommendAlways ? <Eye size={18} /> : <EyeOff size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight">
                        {recommendAlways ? 'Рекомендується завжди' : 'Рекомендувати вибірково'}
                      </p>
                      <p className="text-xs text-text-sub mt-0.5">Показ товару в кошику при записі</p>
                    </div>
                  </button>

                  {!recommendAlways && (
                    <div className="flex flex-col gap-2.5 bg-secondary/20 p-3 rounded-xl border border-border mt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-sub">Рекомендувати з послугами:</p>
                      {activeServices.length === 0 ? (
                        <p className="text-xs text-text-sub pl-1">Немає активних послуг</p>
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
                                  : 'bg-secondary text-text-sub hover:bg-muted/80'
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
              </>
            )}

            {/* Sales analytics — retail only */}
            {id && !isConsumable && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] block ml-1">Аналітика продажів</label>
                  <ProductStatsPanel stats={stats} loading={statsLoading} />
                </div>
              </>
            )}

            {/* Direct link — retail only */}
            {id && !isConsumable && (
              <>
                <div className="h-px bg-border" />
                <div className="bg-secondary/40 border border-border p-4 rounded-xl flex flex-col items-center text-center gap-3">
                  <div className="size-12 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shadow-sm shrink-0">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">Пряме посилання</p>
                    <p className="text-xs text-text-sub mt-0.5 leading-relaxed">Клієнт зможе переглянути товар у магазині</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(`${window.location.origin}/studio/${masterId}/shop`); }}
                    className="w-full py-2 rounded-lg bg-secondary border border-border text-primary font-bold text-xs hover:bg-secondary/80 active:scale-[0.95] cursor-pointer transition-all"
                  >
                    Копіювати лінк
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step 2 — Service linking (consumable only, full width) */}
      {isConsumable && (
        <div className="widget-card p-6 flex flex-col gap-5 border border-border rounded-[24px] bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FlaskConical size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Прив&apos;язка до послуг</p>
                <p className="text-[11px] text-text-sub">Для яких послуг використовується цей матеріал?</p>
              </div>
            </div>
            {!recommendAlways && linkedServiceIds.length > 0 && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                обрано {linkedServiceIds.length} послуг
              </span>
            )}
          </div>

          <button
            type="button"
            aria-pressed={!recommendAlways}
            onClick={() => setRecommendAlways(v => !v)}
            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer ${
              !recommendAlways ? 'bg-primary/5 border-primary/20' : 'bg-secondary/50 border-border'
            }`}
          >
            <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${!recommendAlways ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'}`}>
              {!recommendAlways ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground leading-tight">
                {recommendAlways ? 'До всіх послуг' : 'Конкретні послуги'}
              </p>
              <p className="text-xs text-text-sub mt-0.5">
                {recommendAlways
                  ? 'Списується при завершенні будь-якого запису'
                  : 'Прив\'язано до конкретних послуг'}
              </p>
            </div>
          </button>

          {!recommendAlways && (
            <div className="flex flex-col gap-3">
              {activeServices.length === 0 ? (
                <p className="text-xs text-text-sub">Немає активних послуг. Додайте послуги спочатку.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {activeServices.map(s => (
                    <div key={s.id} className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                          linkedServiceIds.includes(s.id)
                            ? 'bg-primary text-white border-transparent shadow-md shadow-primary/10'
                            : 'bg-secondary/40 border-border text-text-sub hover:bg-secondary/80'
                        }`}
                      >
                        <span className="truncate block">{s.name}</span>
                      </button>
                      {linkedServiceIds.includes(s.id) && (
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={serviceQuantities[s.id] ?? 1}
                            onChange={e => setServiceQuantities(prev => ({
                              ...prev,
                              [s.id]: Math.max(0.1, parseFloat(e.target.value) || 0.1),
                            }))}
                            className="w-full px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary text-center outline-none focus:ring-1 focus:ring-primary/30 pr-8"
                            title={`Кількість на сеанс (${UNIT_LABEL[unit]})`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-primary/60 pointer-events-none">
                            {UNIT_LABEL[unit]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="heading-serif text-xl text-foreground mb-2">
              {isConsumable ? 'Видалити розхідник?' : 'Видалити товар?'}
            </h3>
            <p className="text-sm text-text-sub mb-6">
              {isConsumable ? 'Матеріал сховається з dashboard і не буде доступний у записах.' : 'Товар сховається з dashboard і не буде доступний клієнтам.'}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDelete(false)} className="flex-1 py-3 rounded-full bg-secondary text-foreground font-semibold active:scale-[0.95] cursor-pointer transition-all">
                Скасувати
              </button>
              <button type="button" onClick={handleDelete} className="flex-1 py-3 rounded-full bg-destructive text-white font-semibold active:scale-[0.95] cursor-pointer transition-all">
                Підтвердити
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 bg-[var(--background)]/80 backdrop-blur-xl border-t border-[var(--border)] -mx-4 px-4 py-3 mt-2" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {id && (
            <button
              type="button"
              onClick={() => setShowDelete(v => !v)}
              aria-label="Видалити"
              className="size-11 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.93]"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || uploading}
            className="flex-1 h-11 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-transform"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isSaving ? 'Зберігаємо...' : (id ? 'Зберегти зміни' : 'Створити')}
          </button>
        </div>
      </div>

      <CropDrawer
        open={cropOpen}
        onOpenChange={open => { if (!open && !uploading) { setCropOpen(false); setCropSrc(null); setCropQueue([]); } }}
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => { setCropOpen(false); setCropSrc(null); setCropQueue([]); }}
        uploading={uploading}
        aspectRatio={1}
      />
    </div>
  );
}
