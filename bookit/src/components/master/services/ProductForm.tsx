'use client';

import { useState, useEffect } from 'react';
import { Infinity as InfinityIcon, Hash, Link2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { type Product, type Service, EMOJI_PRESETS } from './types';
import { ImageUploader } from './ImageUploader';
import { type ProductLink } from '@/lib/supabase/hooks/useProductLinks';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>, links: ProductLink[]) => void;
  initial?: Product | null;
  initialLinks?: ProductLink[];
  masterId: string;
  services: Service[];
}

const EMPTY: Omit<Product, 'id'> = {
  name: '',
  emoji: '✨',
  price: 0,
  stock: null,
  active: true,
  description: '',
  imageUrl: undefined,
};

export function ProductForm({
  isOpen,
  onClose,
  onSave,
  initial,
  initialLinks,
  masterId,
  services,
}: ProductFormProps) {
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY);
  const [limitStock, setLimitStock] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Product, string>>>({});

  // Links state: null = show for all, string[] = specific service IDs
  const [linkMode, setLinkMode] = useState<'all' | 'specific'>('all');
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        setForm({
          name: initial.name,
          emoji: initial.emoji,
          price: initial.price,
          stock: initial.stock,
          active: initial.active,
          description: initial.description ?? '',
          imageUrl: initial.imageUrl,
        });
        setLimitStock(initial.stock !== null);
      } else {
        setForm(EMPTY);
        setLimitStock(false);
      }

      // Restore link state from initialLinks
      if (initialLinks && initialLinks.length > 0) {
        setLinkMode('specific');
        setLinkedServiceIds(initialLinks.map(l => l.serviceId));
      } else {
        setLinkMode('all');
        setLinkedServiceIds([]);
      }

      setErrors({});
    }
  }, [isOpen, initial, initialLinks]);

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Вкажіть назву товару";
    if (form.price <= 0) e.price = "Вкажіть ціну";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const links: ProductLink[] =
      linkMode === 'specific'
        ? linkedServiceIds.map(id => ({ serviceId: id, isAutoSuggest: true }))
        : [];

    onSave({ ...form, stock: limitStock ? (form.stock ?? 0) : null }, links);
    onClose();
  }

  function handleStockToggle() {
    const next = !limitStock;
    setLimitStock(next);
    setForm(f => ({ ...f, stock: next ? 10 : null }));
  }

  function toggleService(serviceId: string) {
    setLinkedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Редагувати товар' : 'Новий товар'}
    >
      <div className="flex flex-col gap-5">
        {/* Emoji picker */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">Іконка</p>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'rgba(120, 154, 153, 0.12)' }}
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
            placeholder="Наприклад: Гель-лак OPI"
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
            placeholder="Коротко про товар: бренд, склад, ефект"
            className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 resize-none"
          />
        </div>

        {/* Image */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">
            Фото <span className="text-[#A8928D] font-normal">(необов'язково)</span>
          </p>
          <ImageUploader
            folder="products"
            masterId={masterId}
            value={form.imageUrl}
            onChange={url => setForm(f => ({ ...f, imageUrl: url ?? undefined }))}
          />
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

        {/* Stock */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-[#6B5750]">Залишок на складі</p>
          <div className="flex gap-2">
            <button
              onClick={() => !limitStock || handleStockToggle()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-medium transition-all ${
                !limitStock
                  ? 'bg-[#789A99] text-white border-transparent'
                  : 'bg-white/70 border-white/80 text-[#6B5750] hover:bg-white'
              }`}
            >
              <InfinityIcon size={15} />
              Необмежено
            </button>
            <button
              onClick={() => limitStock || handleStockToggle()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-medium transition-all ${
                limitStock
                  ? 'bg-[#789A99] text-white border-transparent'
                  : 'bg-white/70 border-white/80 text-[#6B5750] hover:bg-white'
              }`}
            >
              <Hash size={15} />
              Вказати кількість
            </button>
          </div>

          {limitStock && (
            <input
              type="number"
              min={0}
              value={form.stock ?? 0}
              onChange={e => setForm(f => ({ ...f, stock: Math.max(0, Number(e.target.value)) }))}
              placeholder="0"
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] outline-none transition-all focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20"
            />
          )}
        </div>

        {/* Recommendations / Links */}
        {services.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-[#789A99]" />
              <p className="text-xs font-medium text-[#6B5750]">Рекомендувати разом з</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setLinkMode('all'); setLinkedServiceIds([]); }}
                className={`flex-1 py-2.5 rounded-2xl border text-xs font-medium transition-all ${
                  linkMode === 'all'
                    ? 'bg-[#789A99] text-white border-transparent'
                    : 'bg-white/70 border-white/80 text-[#6B5750] hover:bg-white'
                }`}
              >
                Всі послуги
              </button>
              <button
                onClick={() => setLinkMode('specific')}
                className={`flex-1 py-2.5 rounded-2xl border text-xs font-medium transition-all ${
                  linkMode === 'specific'
                    ? 'bg-[#789A99] text-white border-transparent'
                    : 'bg-white/70 border-white/80 text-[#6B5750] hover:bg-white'
                }`}
              >
                Обрані послуги
              </button>
            </div>

            {linkMode === 'specific' && (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {services.filter(s => s.active).map(s => {
                  const checked = linkedServiceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        checked
                          ? 'bg-[#789A99]/10 border-[#789A99]/30'
                          : 'bg-white/70 border-white/80 hover:bg-white'
                      }`}
                    >
                      <span className="text-base">{s.emoji}</span>
                      <span className="flex-1 text-sm text-[#2C1A14]">{s.name}</span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        checked ? 'bg-[#789A99] border-[#789A99]' : 'border-[#D5C0BA]'
                      }`}>
                        {checked && <div className="w-2 h-2 rounded-sm bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm transition-all hover:bg-[#6B8C8B] active:scale-[0.98]"
        >
          {initial ? 'Зберегти зміни' : 'Додати товар'}
        </button>
      </div>
    </BottomSheet>
  );
}
