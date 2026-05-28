'use client';

import { useState, useEffect } from 'react';
import { Infinity as InfinityIcon, Hash, Link2 } from 'lucide-react';
import { PopUpModal } from '@/components/ui/PopUpModal';
import { type Product, type Service, productSchema } from './types';
import { ImageUploader } from './ImageUploader';
import { type ProductLink } from '@/lib/supabase/hooks/useProductLinks';
import { ProductIcon, PRODUCT_ICON_OPTIONS } from '@/lib/product-icons';
import { ServiceIcon } from '@/lib/service-icons';

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
  icon_name: 'sparkles',
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

  const [linkMode, setLinkMode] = useState<'all' | 'specific'>('all');
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: initial.name,
        icon_name: initial.icon_name,
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

    if (initialLinks && initialLinks.length > 0) {
      setLinkMode('specific');
      setLinkedServiceIds(initialLinks.map(l => l.serviceId));
    } else {
      setLinkMode('all');
      setLinkedServiceIds([]);
    }

    setErrors({});
  }, [isOpen, initial, initialLinks]);

  function validate(formData: Omit<Product, 'id'>) {
    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof Product, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof Product;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  function handleSubmit() {
    if (!validate(form)) return;

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
    <PopUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Редагувати товар' : 'Новий товар'}
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Іконка</p>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 bg-secondary/40 border border-border">
              <ProductIcon name={form.icon_name} size={20} />
            </div>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {PRODUCT_ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icon_name: opt.name }))}
                  className={`w-9 h-9 rounded-xl transition-all active:scale-[0.88] cursor-pointer flex items-center justify-center ${
                    form.icon_name === opt.name
                      ? 'bg-primary/20 ring-1.5 ring-primary scale-110'
                      : 'bg-secondary/40 hover:bg-secondary/80 border border-border'
                  }`}
                >
                  <ProductIcon name={opt.name} size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Назва</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Наприклад: Гель-лак OPI"
            className={`w-full px-4 py-3 rounded-lg bg-secondary/40 border text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              errors.name ? 'border-destructive' : 'border-border'
            }`}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Опис <span className="text-muted-foreground/60 font-normal">{'(необов\'язково)'}</span>
          </label>
          <textarea
            rows={3}
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Коротко про товар: бренд, склад, ефект"
            className="w-full px-4 py-3 rounded-lg bg-secondary/40 border border-border text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Фото <span className="text-muted-foreground/60 font-normal">(необов’язково)</span>
          </p>
          <ImageUploader
            folder="products"
            masterId={masterId}
            value={form.imageUrl}
            onChange={url => setForm(f => ({ ...f, imageUrl: url ?? undefined }))}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ціна (грн)</label>
          <input
            type="number"
            min={0}
            value={form.price || ''}
            onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            placeholder="0"
            className={`w-full px-4 py-3 rounded-lg bg-secondary/40 border text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              errors.price ? 'border-destructive' : 'border-border'
            }`}
          />
          {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Залишок на складі</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => !limitStock || handleStockToggle()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all active:scale-[0.95] cursor-pointer ${
                !limitStock
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              <InfinityIcon size={15} />
              Необмежено
            </button>
            <button
              type="button"
              onClick={() => limitStock || handleStockToggle()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all active:scale-[0.95] cursor-pointer ${
                limitStock
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
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
              className="w-full px-4 py-3 rounded-lg bg-secondary/40 border border-border text-sm text-foreground outline-none transition-all focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>

        {services.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-primary" />
              <p className="text-xs font-medium text-muted-foreground">До яких послуг підходить</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setLinkMode('all'); setLinkedServiceIds([]); }}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.95] cursor-pointer ${
                  linkMode === 'all'
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                Всі послуги
              </button>
              <button
                type="button"
                onClick={() => setLinkMode('specific')}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.95] cursor-pointer ${
                  linkMode === 'specific'
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
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
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.95] cursor-pointer ${
                        checked
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-secondary/40 border-border hover:bg-secondary/80'
                      }`}
                    >
                      <ServiceIcon name={s.icon_name} size={14} />
                      <span className="flex-1 text-sm text-foreground">{s.name}</span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        checked ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {checked && <div className="w-2 h-2 rounded-sm bg-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.95] cursor-pointer"
        >
          {initial ? 'Зберегти зміни' : 'Додати товар'}
        </button>
      </div>
    </PopUpModal>
  );
}
