'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Save,
  QrCode,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { type Service, CATEGORIES, DURATIONS, formatDuration, serviceSchema } from './types';
import { ImageUploader } from './ImageUploader';
import { useMasterContext } from '@/lib/supabase/context';
import { SERVICE_ICON_OPTIONS, ServiceIcon } from '@/lib/service-icons';

interface Props {
  id?: string;
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
            className="size-10 rounded-lg bg-secondary/60 border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary/80 hover:text-primary transition-all active:scale-[0.88] cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="heading-serif text-xl text-foreground">
              {id ? 'Редагування послуги' : 'Нова послуга'}
            </h1>
            <p className="text-xs text-muted-foreground/60">
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
              className="hidden md:flex items-center justify-center size-10 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-[0.88] cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 h-11 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.95] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span className="hidden sm:inline">Зберегти</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Core Metadata (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-[24px] flex items-center justify-center text-4xl flex-shrink-0 bg-secondary/40 border border-border shadow-inner">
                <ServiceIcon name={form.icon_name} size={34} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-1 block ml-1">
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
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-background border text-lg font-medium placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border',
                    errors.name ? 'border-destructive/50' : ''
                  )}
                />
                {errors.name && <p className="text-[11px] text-destructive font-medium mt-1 ml-1">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-2 block ml-1">
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
                        : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    <span className="truncate">{cat}</span>
                    {form.category === cat && <Check size={14} className="shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] block ml-1 mb-2">
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
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-3 block ml-1">
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
                        : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    <ServiceIcon name={opt.name} size={14} className="shrink-0" />
                    <span className="text-xs font-semibold truncate">{opt.label}</span>
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
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] block ml-1">
              Фото послуги
            </label>
            <div className="min-h-[160px]">
              <ImageUploader
                folder="services"
                masterId={masterId}
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url ?? undefined }))}
              />
            </div>
          </div>

          {/* Strategy & Prices Bento Box */}
          <div className="widget-card p-6 flex flex-col gap-6 border border-border rounded-[24px] bg-card">
            <h3 className="text-[13px] font-semibold text-foreground">Ціна та тривалість</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-2 block ml-1">
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
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-background border text-base font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border',
                    errors.price ? 'border-destructive/50' : ''
                  )}
                />
                {errors.price && <p className="text-[11px] text-destructive font-medium mt-1 ml-1">{errors.price}</p>}
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] mb-2 block ml-1">
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
                    className="w-full px-4 py-3 rounded-xl bg-background border text-base font-bold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 border-border"
                  />
                  <div className="flex-shrink-0 flex items-center px-4 bg-secondary/20 rounded-xl text-xs font-semibold text-muted-foreground border border-border">
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
                        : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {formatDuration(d)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-[0.08em] ml-1">
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
                <div className={cn(
                  'size-9 rounded-lg flex items-center justify-center shrink-0',
                  form.active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                )}>
                  {form.active ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">{form.active ? 'Активна' : 'Прихована'}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Показувати клієнтам у каталозі</p>
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
                <div className={cn(
                  'size-9 rounded-lg flex items-center justify-center shrink-0',
                  form.popular ? 'bg-warning/20 text-warning' : 'bg-muted/20 text-muted-foreground'
                )}>
                  <Star size={18} className={form.popular ? 'fill-warning' : ''} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">Популярна</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Виділити позначкою &quot;ТОП&quot;</p>
                </div>
              </button>
            </div>

            {id && (
              <>
                <div className="h-px bg-border" />

                <div className="flex flex-col gap-4">
                  <div className="bg-secondary/20 border border-dashed border-border p-4 rounded-xl text-center">
                    <p className="text-xs font-semibold text-muted-foreground/60">Статистика з&apos;явиться після перших записів</p>
                  </div>

                  <div className="bg-secondary/40 border border-border p-4 rounded-xl flex flex-col items-center text-center gap-3">
                    <div className="size-12 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shadow-sm shrink-0">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">Пряме посилання</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">Клієнт одразу потрапить на запис цієї послуги</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/studio/${masterId}?serviceId=${id}`)}
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
            <p className="text-sm text-muted-foreground mb-6">
              Послуга зникне з каталогу. Відновити можна буде в будь-який момент.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-lg bg-secondary text-foreground font-bold text-sm active:scale-[0.95] cursor-pointer transition-all"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 rounded-lg bg-destructive text-white font-bold text-sm shadow-lg shadow-destructive/20 active:scale-[0.95] cursor-pointer transition-all"
              >
                Видалити
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
