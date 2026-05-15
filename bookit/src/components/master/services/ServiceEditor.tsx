'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Star, 
  Trash2, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Users, 
  Clock, 
  Zap,
  Check,
  Save,
  QrCode
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { type Service, CATEGORIES, DURATIONS, EMOJI_PRESETS, formatDuration, formatPrice } from './types';
import { ImageUploader } from './ImageUploader';
import { useMasterContext } from '@/lib/supabase/context';
import { Tooltip } from '@/components/ui/Tooltip';

interface Props {
  id?: string; // If undefined, we are in "Create" mode
}

const EMPTY: Omit<Service, 'id'> = {
  name: '',
  emoji: '💅',
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
        emoji: service.emoji,
        category: service.category,
        price: service.price,
        duration: service.duration,
        popular: service.popular,
        active: service.active,
        description: service.description ?? '',
        imageUrl: service.imageUrl,
      });
      const dur = service.duration;
      setCustomDurationStr(DURATIONS.includes(dur as any) ? '' : String(dur));
    } else if (!id) {
      setForm(EMPTY);
      setCustomDurationStr('');
    }
  }, [id, service]);

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Вкажіть назву послуги";
    if (form.price <= 0) e.price = "Вкажіть ціну";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between sticky top-[72px] lg:top-4 z-40 bg-peach/80 backdrop-blur-md py-2 -mx-2 px-2 rounded-3xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white/60 border border-white/80 flex items-center justify-center text-muted-foreground hover:bg-white hover:text-primary transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="heading-serif text-xl text-foreground">
              {id ? 'Редагування послуги' : 'Нова послуга'}
            </h1>
            <p className="text-xs text-muted-foreground/60">
              {id ? form.name : 'Створення нового пропозиції'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {id && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 h-11 rounded-2xl bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-[#6B8C8B] transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span className="hidden sm:inline">Зберегти</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Base Info Bento */}
          <div className="widget-card p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl flex-shrink-0 shadow-inner"
                style={{ background: 'rgba(255, 210, 194, 0.4)' }}
              >
                {form.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-1 block ml-1">Назва послуги</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Введіть назву..."
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl bg-white/40 border text-lg font-medium placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-primary",
                    errors.name ? "border-destructive/50" : "border-white/40"
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-2 block ml-1">Ціна (₴)</label>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  placeholder="0"
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl bg-white/40 border text-base font-bold outline-none transition-all focus:bg-white focus:border-primary",
                    errors.price ? "border-destructive/50" : "border-white/40"
                  )}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-2 block ml-1">Тривалість (хв)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customDurationStr || form.duration}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      setCustomDurationStr(e.target.value);
                      if (!isNaN(v)) setForm(f => ({ ...f, duration: v }));
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-white/40 border text-base font-bold outline-none transition-all focus:bg-white focus:border-primary border-white/40"
                  />
                  <div className="flex-shrink-0 flex items-center px-4 bg-white/20 rounded-2xl text-xs font-medium text-muted-foreground border border-white/40">
                    {formatDuration(form.duration)}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Durations */}
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setForm(f => ({ ...f, duration: d }));
                    setCustomDurationStr('');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    form.duration === d && !customDurationStr
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                      : "bg-white/40 border-white/40 text-muted-foreground hover:bg-white"
                  )}
                >
                  {formatDuration(d)}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="widget-card p-6 flex flex-col gap-4">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 block ml-1">Опис послуги</label>
              <textarea
                rows={6}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Опишіть деталі послуги для ваших клієнтів..."
                className="w-full px-4 py-4 rounded-2xl bg-white/40 border border-white/40 text-sm text-foreground placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-primary resize-none h-full"
              />
            </div>
            <div className="widget-card p-6 flex flex-col gap-4">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 block ml-1">Медіа (Фото)</label>
              <div className="flex-1 min-h-[160px]">
                <ImageUploader
                  folder="services"
                  masterId={masterId}
                  value={form.imageUrl}
                  onChange={url => setForm(f => ({ ...f, imageUrl: url ?? undefined }))}
                />
              </div>
            </div>
          </div>

          {/* Icon Picker */}
          <div className="widget-card p-6">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-4 block ml-1">Обрати іконку</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {EMOJI_PRESETS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={cn(
                    "w-full aspect-square rounded-xl text-xl flex items-center justify-center transition-all",
                    form.emoji === e
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110 ring-2 ring-white"
                      : "bg-white/40 hover:bg-white text-foreground"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Stats (Only for existing) */}
          {id && (
            <div className="widget-card p-6 bg-sage/5 border-sage/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sage/20 flex items-center justify-center text-sage">
                  <BarChart3 size={20} />
                </div>
                <h3 className="font-bold text-foreground">Аналітика</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 p-3 rounded-2xl border border-white/40">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-1">Записи</p>
                  <p className="text-xl font-display font-bold text-foreground">24</p>
                  <p className="text-[10px] text-success font-bold mt-0.5">+12%</p>
                </div>
                <div className="bg-white/40 p-3 rounded-2xl border border-white/40">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-1">Дохід</p>
                  <p className="text-xl font-display font-bold text-foreground">12.4к</p>
                  <p className="text-[10px] text-success font-bold mt-0.5">+8%</p>
                </div>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div className="widget-card p-6">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-4 block ml-1">Категорія</label>
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all border",
                    form.category === cat
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                      : "bg-white/40 border-white/40 text-muted-foreground hover:bg-white"
                  )}
                >
                  {cat}
                  {form.category === cat && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility & Logic */}
          <div className="widget-card p-6 flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-1 block ml-1">Налаштування відображення</label>
            
            <button
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                form.active ? "bg-white/60 border-white/60" : "bg-destructive/5 border-destructive/20 opacity-70"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                form.active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {form.active ? <Eye size={20} /> : <EyeOff size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{form.active ? 'Активна' : 'Прихована'}</p>
                <p className="text-[10px] text-muted-foreground/60">Доступність для онлайн-запису</p>
              </div>
            </button>

            <button
              onClick={() => setForm(f => ({ ...f, popular: !f.popular }))}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                form.popular ? "bg-warning/10 border-warning/40" : "bg-white/60 border-white/60"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                form.popular ? "bg-warning/20 text-warning" : "bg-muted/20 text-muted-foreground"
              )}>
                <Star size={20} className={form.popular ? 'fill-warning' : ''} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Популярна</p>
                <p className="text-[10px] text-muted-foreground/60">Відображається першою в списку</p>
              </div>
            </button>
          </div>

          {/* QR Code / Share (Existing only) */}
          {id && (
            <div className="widget-card p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-white/40 flex items-center justify-center text-primary shadow-sm">
                <QrCode size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Пряме посилання</p>
                <p className="text-[10px] text-muted-foreground/60">Клієнт відразу потрапить на запис цієї послуги</p>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-secondary text-primary font-bold text-xs hover:bg-secondary/80 transition-all">
                Копіювати лінк
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="heading-serif text-xl text-foreground mb-2">Видалити послугу?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Це дію неможливо буде скасувати. Послуга перестане відображатися в списку.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm"
              >
                Скасувати
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 rounded-2xl bg-destructive text-white font-bold text-sm shadow-lg shadow-destructive/20"
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
