import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { type Service, CATEGORIES, DURATIONS, EMOJI_PRESETS, formatDuration } from './types';
import { ImageUploader } from './ImageUploader';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Service, 'id'>) => void;
  initial?: Service | null;
  masterId: string;
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

export function ServiceForm({ isOpen, onClose, onSave, initial, masterId }: ServiceFormProps) {
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Service, string>>>({});
  // Tracks the raw text in the custom input — empty when a pill was last used
  const [customDurationStr, setCustomDurationStr] = useState('');

  useEffect(() => {
    if (isOpen) {
      const svc = initial
        ? {
            name: initial.name,
            emoji: initial.emoji,
            category: initial.category,
            price: initial.price,
            duration: initial.duration,
            popular: initial.popular,
            active: initial.active,
            description: initial.description ?? '',
            imageUrl: initial.imageUrl,
          }
        : EMPTY;
      setForm(svc);
      // Pre-fill custom input only when editing a non-standard duration
      const dur = svc.duration;
      setCustomDurationStr(DURATIONS.includes(dur as typeof DURATIONS[number]) ? '' : String(dur));
      setErrors({});
    }
  }, [isOpen, initial]);

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Вкажіть назву послуги";
    if (form.price <= 0) e.price = "Вкажіть ціну";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (validate()) {
      onSave(form);
      onClose();
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Редагувати послугу' : 'Нова послуга'}
    >
      <div className="flex flex-col gap-5">
        {/* Emoji picker */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">Іконка</p>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'rgba(255, 210, 194, 0.4)' }}
            >
              {form.emoji}
            </div>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-xl text-xl transition-all ${
                    form.emoji === e
                      ? 'bg-[#789A99]/20 ring-1.5 ring-[#789A99] scale-110'
                      : 'bg-white/70 hover:bg-white border border-white/80'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Назва</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Наприклад: Класичний манікюр"
            className={`w-full px-4 py-3 rounded-2xl bg-white/70 border text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 ${
              errors.name ? 'border-[#C05B5B]' : 'border-white/80'
            }`}
          />
          {errors.name && <p className="text-xs text-[#C05B5B] mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">
            Опис <span className="text-[#A8928D] font-normal">(необов'язково)</span>
          </label>
          <textarea
            rows={3}
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Розкажіть клієнтам про послугу"
            className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 resize-none"
          />
        </div>

        {/* Image */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">
            Фото <span className="text-[#A8928D] font-normal">(необов'язково)</span>
          </p>
          <ImageUploader
            folder="services"
            masterId={masterId}
            value={form.imageUrl}
            onChange={url => setForm(f => ({ ...f, imageUrl: url ?? undefined }))}
          />
        </div>

        {/* Category */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">Категорія</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.category === cat
                    ? 'bg-[#789A99] text-white'
                    : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Ціна (₴)</label>
          <input
            type="number"
            min={0}
            value={form.price || ''}
            onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            placeholder="0"
            className={`w-full px-4 py-3 rounded-2xl bg-white/70 border text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 ${
              errors.price ? 'border-[#C05B5B]' : 'border-white/80'
            }`}
          />
          {errors.price && <p className="text-xs text-[#C05B5B] mt-1">{errors.price}</p>}
        </div>

        {/* Duration */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">Тривалість</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => {
                  setForm(f => ({ ...f, duration: d }));
                  setCustomDurationStr('');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.duration === d && customDurationStr === ''
                    ? 'bg-[#789A99] text-white'
                    : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                }`}
              >
                {formatDuration(d)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={customDurationStr}
              onChange={e => {
                const raw = e.target.value;
                setCustomDurationStr(raw);
                const v = parseInt(raw, 10);
                if (!isNaN(v) && v >= 5) setForm(f => ({ ...f, duration: Math.min(480, v) }));
              }}
              placeholder="хв"
              className="w-24 px-3 py-2 rounded-xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20"
            />
            <span className="text-xs text-[#A8928D]">
              {customDurationStr ? formatDuration(form.duration) : formatDuration(form.duration)}
              {customDurationStr !== '' && (
                <span className="ml-1.5 text-[#789A99] font-medium">нестандарт</span>
              )}
            </span>
          </div>
        </div>

        {/* Popular toggle */}
        <button
          onClick={() => setForm(f => ({ ...f, popular: !f.popular }))}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all ${
            form.popular
              ? 'bg-[#D4935A]/10 border-[#D4935A]/30'
              : 'bg-white/70 border-white/80 hover:bg-white'
          }`}
        >
          <Star
            size={16}
            className={form.popular ? 'fill-[#D4935A] text-[#D4935A]' : 'text-[#A8928D]'}
          />
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-[#2C1A14]">Популярна послуга</p>
            <p className="text-xs text-[#A8928D]">Відображається першою на публічній сторінці</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            form.popular ? 'border-[#D4935A] bg-[#D4935A]' : 'border-[#D5C0BA]'
          }`}>
            {form.popular && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm transition-all hover:bg-[#6B8C8B] active:scale-[0.98]"
        >
          {initial ? 'Зберегти зміни' : 'Додати послугу'}
        </button>
      </div>
    </BottomSheet>
  );
}
