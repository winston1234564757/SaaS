'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Save,
  QrCode,
  FlaskConical,
  Plus,
  X,
  Lock as LockIcon,
} from 'lucide-react';
import { Drawer } from 'vaul';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { type Service, CATEGORIES, DURATIONS, formatDuration, formatPrice, serviceSchema } from './types';
import { pluralUk } from '@/lib/utils/pluralUk';
import { PhotoUploader } from '@/components/shared/PhotoUploader';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { SERVICE_ICON_OPTIONS, ServiceIcon } from '@/lib/service-icons';
import {
  addServiceConsumableLinks,
  removeServiceConsumableLink,
  getServiceStats,
  type ServiceStats,
} from '@/app/(master)/dashboard/services/actions';

interface Props {
  id?: string;
}

type LinkedConsumable = {
  product_id: string;
  name: string;
  unit: 'pcs' | 'ml' | 'g';
  quantity: number;
};

type ConsumableOption = {
  id: string;
  name: string;
  unit: 'pcs' | 'ml' | 'g';
};

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };

// Relative Ukrainian date for "last booking" line
function relDate(ymd: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${ymd}T00:00:00`);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'сьогодні';
  if (days === 1) return 'вчора';
  if (days < 7) return `${days} ${pluralUk(days, 'день', 'дні', 'днів')} тому`;
  if (days < 31) {
    const w = Math.floor(days / 7);
    return `${w} ${pluralUk(w, 'тиждень', 'тижні', 'тижнів')} тому`;
  }
  const m = Math.floor(days / 30);
  return `${m} ${pluralUk(m, 'місяць', 'місяці', 'місяців')} тому`;
}

const EMPTY: Omit<Service, 'id'> = {
  name: '',
  icon_name: 'sparkles',
  category: 'Манікюр',
  price: 0,
  duration: 60,
  popular: false,
  active: true,
  description: '',
  imageUrl: undefined,
};

export function ServiceEditor({ id }: Props) {
  const router = useRouter();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? '';

  const { services, addService, editService, deleteService, isLoading } = useServices();
  const service = id ? services.find(s => s.id === id) : null;

  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Service, string>>>({});
  const [customDurationStr, setCustomDurationStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Linked consumables
  const [linkedConsumables, setLinkedConsumables] = useState<LinkedConsumable[]>([]);

  // Per-service stats
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Add-consumable sheet
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [allConsumables, setAllConsumables] = useState<ConsumableOption[]>([]);
  const [addSelectedIds, setAddSelectedIds] = useState<Set<string>>(new Set());
  const [addQties, setAddQties] = useState<Record<string, string>>({});
  const [isAddingConsumable, setIsAddingConsumable] = useState(false);

  const fetchLinkedConsumables = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('product_service_links')
      .select('quantity, products!inner(id, name, unit, product_type)')
      .eq('service_id', id)
      .eq('products.product_type', 'consumable');
    if (data) {
      setLinkedConsumables(data.map((row: { quantity: number; products: { id: string; name: string; unit: 'pcs' | 'ml' | 'g' } }) => ({
        product_id: row.products.id,
        name: row.products.name,
        unit: row.products.unit,
        quantity: Number(row.quantity),
      })));
    }
  }, [id]);

  const loadAllConsumables = useCallback(async () => {
    if (!masterId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, unit')
      .eq('product_type', 'consumable')
      .eq('master_id', masterId)
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('name');
    setAllConsumables((data ?? []) as ConsumableOption[]);
  }, [masterId]);

  useEffect(() => { fetchLinkedConsumables(); }, [fetchLinkedConsumables]);

  useEffect(() => {
    if (!id) { setStats(null); return; }
    let cancelled = false;
    setStatsLoading(true);
    getServiceStats(id).then(({ data }) => {
      if (!cancelled) { setStats(data); setStatsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (id && service) {
      setForm({
        name: service.name,
        icon_name: service.icon_name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        popular: service.popular,
        active: service.active,
        description: service.description ?? '',
        imageUrl: service.imageUrl,
      });
      const dur = service.duration;
      setCustomDurationStr(DURATIONS.includes(dur as (typeof DURATIONS)[number]) ? '' : String(dur));
    } else if (!id) {
      setForm(EMPTY);
      setCustomDurationStr('');
    }
  }, [id, service]);

  function validate(formData: Omit<Service, 'id'>) {
    const result = serviceSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof Service, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof Service;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSave() {
    if (!validate(form)) return;
    setIsSaving(true);
    try {
      if (id) {
        await editService(id, form);
      } else {
        await addService(form);
      }
      router.push('/dashboard/services');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteService(id);
      router.push('/dashboard/services');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRemoveConsumable(productId: string) {
    if (!id) return;
    setLinkedConsumables(prev => prev.filter(c => c.product_id !== productId));
    await removeServiceConsumableLink(id, productId);
    fetchLinkedConsumables();
  }

  async function handleOpenAddSheet() {
    await loadAllConsumables();
    setAddSelectedIds(new Set(linkedConsumables.map(c => c.product_id)));
    const initialQties: Record<string, string> = {};
    linkedConsumables.forEach(c => { initialQties[c.product_id] = String(c.quantity); });
    setAddQties(initialQties);
    setShowAddSheet(true);
  }

  async function handleSaveConsumableLinks() {
    if (!id) return;
    setIsAddingConsumable(true);
    try {
      const links = Array.from(addSelectedIds).map(pid => ({
        productId: pid,
        quantity: parseFloat(addQties[pid] || '1') || 1,
      }));
      await addServiceConsumableLinks(id, links);
      await fetchLinkedConsumables();
      setShowAddSheet(false);
    } finally {
      setIsAddingConsumable(false);
    }
  }

  function toggleAddSelected(productId: string) {
    setAddSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
        if (!addQties[productId]) setAddQties(q => ({ ...q, [productId]: '1' }));
      }
      return next;
    });
  }

  if (id && isLoading && !service) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex items-center justify-between mt-4 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Назад"
            className="size-10 rounded-full bg-secondary/60 border border-border flex items-center justify-center text-text-sub hover:bg-secondary/80 hover:text-primary transition-all active:scale-[0.88] cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="heading-serif text-xl text-foreground">
              {id ? 'Редагування послуги' : 'Нова послуга'}
            </h1>
            <p className="text-xs text-text-sub">
              {id ? form.name : 'Створення нової послуги'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {id && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Видалити послугу"
              className="hidden md:flex items-center justify-center size-10 rounded-full bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-[0.88] cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          )}
          <Button variant="primary" size="md" onClick={handleSave} disabled={isSaving} isLoading={isSaving} className="px-6 shadow-lg">
            <Save size={18} />
            <span className="hidden sm:inline">Зберегти</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Core Metadata + Consumables */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-[24px] flex items-center justify-center text-4xl flex-shrink-0 bg-secondary/40 border border-border shadow-inner">
                <ServiceIcon name={form.icon_name} size={34} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-1 block ml-1">
                  Назва послуги
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => {
                    setForm(f => ({ ...f, name: e.target.value }));
                    if (errors.name) setErrors(p => ({ ...p, name: undefined }));
                  }}
                  placeholder="Наприклад: Манікюр + покриття"
                  aria-label="Назва послуги"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-background border text-lg font-medium placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border',
                    errors.name ? 'border-destructive/50' : ''
                  )}
                />
                {errors.name && <p className="text-[11px] text-destructive font-medium mt-1 ml-1">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-2 block ml-1">
                Категорія
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={cn(
                      'flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all border active:scale-[0.95] cursor-pointer',
                      form.category === cat
                        ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/10'
                        : 'bg-secondary/40 border-border text-text-sub hover:bg-secondary/80'
                    )}
                  >
                    <span className="truncate">{cat}</span>
                    {form.category === cat && <Check size={14} className="shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] block ml-1 mb-2">
                Опис послуги
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Розкажіть деталі: що входить, який результат, які особливості..."
                className="w-full px-4 py-4 rounded-xl bg-background border border-border text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 focus:bg-secondary focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-3 block ml-1">
                Іконка
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {SERVICE_ICON_OPTIONS.map(opt => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon_name: opt.name }))}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all active:scale-[0.95] cursor-pointer',
                      form.icon_name === opt.name
                        ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/20'
                        : 'bg-secondary/40 border-border text-text-sub hover:bg-secondary/80'
                    )}
                  >
                    <ServiceIcon name={opt.name} size={14} className="shrink-0" />
                    <span className="text-xs font-semibold truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compact consumables — directly under metadata card */}
          <div className={cn(
            'widget-card px-4 py-3 flex flex-col gap-2.5 border border-border rounded-[24px] bg-card',
            !id && 'opacity-50 pointer-events-none'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FlaskConical size={13} className="text-text-sub" />
                <p className="text-xs font-semibold text-text-sub">Розхідники</p>
                {linkedConsumables.length > 0 && (
                  <span className="text-[10px] font-bold text-text-sub bg-secondary/60 px-1.5 py-0.5 rounded-full">
                    {linkedConsumables.length}
                  </span>
                )}
              </div>
              {!id ? (
                <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                  <LockIcon size={10} />
                  Спочатку збережіть
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAddSheet}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors active:scale-[0.95] cursor-pointer min-h-[28px]"
                >
                  <Plus size={11} />
                  Додати
                </button>
              )}
            </div>

            {linkedConsumables.length === 0 ? (
              <p className="text-[10px] text-text-sub leading-relaxed pb-0.5">
                Матеріали не налаштовано — списуються зі складу при завершенні запису
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pb-0.5">
                {linkedConsumables.map(c => (
                  <div
                    key={c.product_id}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-secondary/50 border border-border/60"
                  >
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{c.name}</span>
                    <span className="text-[10px] font-bold text-text-sub shrink-0">
                      {c.quantity}&thinsp;{UNIT_LABEL[c.unit]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveConsumable(c.product_id)}
                      aria-label={`Видалити ${c.name}`}
                      className="size-4 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors active:scale-95 shrink-0"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Media + Prices */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="widget-card p-6 flex flex-col gap-4 border border-border rounded-[24px] bg-card">
            <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] block ml-1">
              Фото послуги
            </label>
            <div className="min-h-[160px]">
              <PhotoUploader
                entity={{ type: 'service', masterId }}
                value={form.imageUrl ?? null}
                onChange={url => setForm(f => ({ ...f, imageUrl: url ?? undefined }))}
              />
            </div>
          </div>

          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <h3 className="text-[13px] font-semibold text-foreground">Ціна та тривалість</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-2 block ml-1">
                  Ціна (грн)
                </label>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, price: Number(e.target.value) }));
                    if (errors.price) setErrors(p => ({ ...p, price: undefined }));
                  }}
                  placeholder="0"
                  aria-label="Ціна в гривнях"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-background border text-base font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border',
                    errors.price ? 'border-destructive/50' : ''
                  )}
                />
                {errors.price && <p className="text-[11px] text-destructive font-medium mt-1 ml-1">{errors.price}</p>}
              </div>

              <div>
                <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] mb-2 block ml-1">
                  Тривалість (хв)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customDurationStr || form.duration}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      setCustomDurationStr(e.target.value);
                      if (!Number.isNaN(v)) setForm(f => ({ ...f, duration: v }));
                    }}
                    aria-label="Тривалість у хвилинах"
                    className="w-full px-4 py-3 rounded-xl bg-background border text-base font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                  />
                  <div className="flex-shrink-0 flex items-center px-4 bg-secondary/20 rounded-xl text-xs font-semibold text-text-sub border border-border">
                    {formatDuration(form.duration)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, duration: d }));
                      setCustomDurationStr('');
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border active:scale-[0.95] cursor-pointer',
                      form.duration === d && !customDurationStr
                        ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/20 scale-105'
                        : 'bg-secondary/40 border-border text-text-sub hover:bg-secondary/80'
                    )}
                  >
                    {formatDuration(d)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-medium text-text-sub uppercase tracking-[0.08em] ml-1">
                Налаштування відображення
              </label>

              <button
                type="button"
                aria-pressed={form.active}
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer',
                  form.active ? 'bg-secondary/50 border-border' : 'bg-destructive/5 border-destructive/20 opacity-70'
                )}
              >
                <div className={cn('size-9 rounded-lg flex items-center justify-center shrink-0', form.active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive')}>
                  {form.active ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">{form.active ? 'Активна' : 'Прихована'}</p>
                  <p className="text-xs text-text-sub mt-0.5">Показувати клієнтам у каталозі</p>
                </div>
              </button>

              <button
                type="button"
                aria-pressed={form.popular}
                onClick={() => setForm(f => ({ ...f, popular: !f.popular }))}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.95] cursor-pointer',
                  form.popular ? 'bg-warning/10 border-warning/30' : 'bg-secondary/50 border-border'
                )}
              >
                <div className={cn('size-9 rounded-lg flex items-center justify-center shrink-0', form.popular ? 'bg-warning/20 text-warning' : 'bg-muted/20 text-text-sub')}>
                  <Star size={18} className={form.popular ? 'fill-warning' : ''} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">Популярна</p>
                  <p className="text-xs text-text-sub mt-0.5">Виділити позначкою &quot;ТОП&quot;</p>
                </div>
              </button>
            </div>

            {id && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-4">
                  {stats && stats.completedCount > 0 ? (
                    <div className="bg-secondary/20 border border-border p-4 rounded-xl">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm font-bold text-foreground tabular-nums leading-tight">{stats.completedCount}</p>
                          <p className="text-[10px] uppercase tracking-wider text-text-sub mt-0.5">Записів</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground tabular-nums leading-tight">{formatPrice(stats.revenue)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-text-sub mt-0.5">Виручка</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground tabular-nums leading-tight">{formatPrice(stats.avgCheck)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-text-sub mt-0.5">Сер. чек</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/60 text-xs text-text-sub">
                        <span>Частка <b className="font-bold text-foreground">{stats.sharePct}%</b></span>
                        {stats.lastDate && <span>Останній запис {relDate(stats.lastDate)}</span>}
                      </div>
                      {stats.plannedCount > 0 && (
                        <p className="text-xs text-text-sub text-center mt-2">
                          Попереду ще {stats.plannedCount} {pluralUk(stats.plannedCount, 'запис', 'записи', 'записів')}
                        </p>
                      )}
                    </div>
                  ) : statsLoading ? (
                    <div className="bg-secondary/20 border border-dashed border-border p-4 rounded-xl text-center">
                      <p className="text-xs font-semibold text-text-sub">Рахуємо статистику…</p>
                    </div>
                  ) : (
                    <div className="bg-secondary/20 border border-dashed border-border p-4 rounded-xl text-center">
                      <p className="text-xs font-semibold text-text-sub">Статистика з&apos;явиться після перших записів</p>
                      {stats && stats.plannedCount > 0 && (
                        <p className="text-xs text-text-sub mt-1">Попереду {stats.plannedCount} {pluralUk(stats.plannedCount, 'запис', 'записи', 'записів')}</p>
                      )}
                    </div>
                  )}
                  <div className="bg-secondary/40 border border-border p-4 rounded-xl flex flex-col items-center text-center gap-3">
                    <div className="size-12 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shadow-sm shrink-0">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">Пряме посилання</p>
                      <p className="text-xs text-text-sub mt-0.5 leading-relaxed">Клієнт одразу потрапить на запис цієї послуги</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/studio/${masterId}?serviceId=${id}`)}
                      className="w-full py-2 rounded-full bg-secondary border border-border text-primary font-bold text-xs hover:bg-secondary/80 active:scale-[0.95] cursor-pointer transition-all"
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

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="heading-serif text-xl text-foreground mb-2">Видалити послугу?</h3>
            <p className="text-sm text-text-sub mb-6">
              Послуга зникне з каталогу. Відновити можна буде в будь-який момент.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-full bg-secondary text-foreground font-bold text-sm active:scale-[0.95] cursor-pointer transition-all"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 rounded-full bg-destructive text-white font-bold text-sm shadow-lg shadow-destructive/20 active:scale-[0.95] cursor-pointer transition-all"
              >
                Видалити
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add consumable sheet */}
      <Drawer.Root open={showAddSheet} onOpenChange={v => !v && setShowAddSheet(false)} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[28px] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-border/60 shrink-0" />
            <div className="px-5 overflow-y-auto pb-safe flex flex-col gap-4">
              <div className="flex items-center justify-between pt-1 pb-2">
                <Drawer.Title className="text-base font-bold text-foreground">
                  Додати матеріал
                </Drawer.Title>
                {addSelectedIds.size > 0 && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    обрано {addSelectedIds.size}
                  </span>
                )}
              </div>

              {allConsumables.length === 0 ? (
                <div className="py-8 text-center">
                  <FlaskConical size={32} className="text-text-sub mx-auto mb-3" />
                  <p className="text-sm text-text-sub">Немає розхідників</p>
                  <p className="text-xs text-text-sub mt-1">Спочатку додайте матеріали у розділі товарів</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/10">
                  {allConsumables.map(c => {
                    const isSelected = addSelectedIds.has(c.id);
                    return (
                      <div key={c.id} className="flex items-center gap-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleAddSelected(c.id)}
                          aria-pressed={isSelected}
                          className={`size-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-secondary/40'
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                          <p className="text-[10px] text-text-sub">{UNIT_LABEL[c.unit]}</p>
                        </div>
                        {isSelected && (
                          <div className="relative shrink-0">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={addQties[c.id] ?? '1'}
                              onChange={e => setAddQties(q => ({ ...q, [c.id]: e.target.value }))}
                              aria-label={`Кількість ${c.name}`}
                              className="w-20 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary text-center outline-none focus:ring-1 focus:ring-primary/30 pr-7"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-primary/60 pointer-events-none">
                              {UNIT_LABEL[c.unit]}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pb-6 pt-2 sticky bottom-0 bg-surface">
                <button
                  type="button"
                  onClick={() => setShowAddSheet(false)}
                  className="flex-1 h-12 rounded-full border border-border text-sm font-semibold text-text-sub hover:bg-secondary/60 transition-colors active:scale-[0.97]"
                >
                  Скасувати
                </button>
                <Button variant="primary" size="lg" onClick={handleSaveConsumableLinks} disabled={isAddingConsumable || addSelectedIds.size === 0} isLoading={isAddingConsumable} className="flex-1">
                  Зберегти
                </Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
