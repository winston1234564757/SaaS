'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Check, Clock, Loader2 } from 'lucide-react';
import { CATEGORY_TEMPLATES } from '@/lib/constants/onboardingTemplates';
import { cn } from '@/lib/utils/cn';
import { inputCls } from './types';
import { ScrollStrip } from '@/components/shared/ScrollStrip';

const CAT_TO_TEMPLATE: Record<string, string> = {
  nails: 'nails',
  hair: 'hair',
  brows: 'brows',
  makeup: 'makeup',
  massage: 'massage',
  barber: 'barbershop',
  other: '',
};

export interface SavedService {
  name: string;
  emoji: string;
  price: number;
  durationMinutes: number;
}

interface StepServicesProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  selectedCategories: string[];
  categoryPrices: Record<string, string>;
  categoryServiceTypes: Record<string, Record<string, boolean>>;
  saving: boolean;
  onCategoryPricesChange: (v: Record<string, string>) => void;
  onCategoryServiceTypesChange: (v: Record<string, Record<string, boolean>>) => void;
  onSave: (services: SavedService[]) => void;
  onSkip: () => void;
}

type Tier = 'express' | 'standard' | 'premium';
type EditingField = { tier: Tier; field: 'price' | 'duration' } | null;

const TIERS: { key: Tier; label: string }[] = [
  { key: 'express',  label: 'Базова'   },
  { key: 'standard', label: 'Стандарт' },
  { key: 'premium',  label: 'Преміум'  },
];

function formatPrice(n: number) {
  return n.toLocaleString('uk-UA') + ' ₴';
}

function formatDur(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h} год ${m} хв` : `${h} год`;
  return `${m} хв`;
}

export function StepServices({
  direction,
  slideVariants,
  transition,
  selectedCategories,
  categoryPrices,
  categoryServiceTypes,
  saving,
  onCategoryPricesChange,
  onCategoryServiceTypesChange,
  onSave,
  onSkip,
}: StepServicesProps) {
  const availableTabs = selectedCategories
    .filter(c => CAT_TO_TEMPLATE[c] && CATEGORY_TEMPLATES[CAT_TO_TEMPLATE[c]])
    .map(c => ({
      catId: c,
      templateKey: CAT_TO_TEMPLATE[c],
      label: CATEGORY_TEMPLATES[CAT_TO_TEMPLATE[c]].label,
    }));

  const [activeTabCatId, setActiveTabCatId] = useState(availableTabs[0]?.catId ?? '');
  const [priceError, setPriceError] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);

  // Per-category overrides: Record<catId, Record<Tier, string>>
  const [priceOverrides, setPriceOverrides] = useState<Record<string, Partial<Record<Tier, string>>>>({});
  const [durationOverrides, setDurationOverrides] = useState<Record<string, Partial<Record<Tier, string>>>>({});

  const activeTemplateKey = activeTabCatId
    ? (CAT_TO_TEMPLATE[activeTabCatId] ?? '')
    : (availableTabs[0]?.templateKey ?? '');
  const template = activeTemplateKey ? CATEGORY_TEMPLATES[activeTemplateKey] : null;

  const serviceBasePrice = categoryPrices[activeTabCatId] ?? '';
  const basePriceNum = parseFloat(serviceBasePrice) || 0;
  const selectedServiceTypes = categoryServiceTypes[activeTabCatId] ?? { express: true, standard: true, premium: true };

  function toggleTier(tier: Tier) {
    const current = categoryServiceTypes[activeTabCatId] ?? { express: true, standard: true, premium: true };
    onCategoryServiceTypesChange({
      ...categoryServiceTypes,
      [activeTabCatId]: { ...current, [tier]: !current[tier] },
    });
  }

  function computePrice(tier: Tier, priceMult: number): number | null {
    const catOverrides = priceOverrides[activeTabCatId] ?? {};
    if (catOverrides[tier] !== undefined) {
      const v = parseFloat(catOverrides[tier]!);
      return isNaN(v) ? null : v;
    }
    return basePriceNum > 0 ? Math.round(basePriceNum * priceMult) : null;
  }

  function computeDuration(tier: Tier, defaultTime: number): number {
    const catOverrides = durationOverrides[activeTabCatId] ?? {};
    if (catOverrides[tier] !== undefined) {
      const v = parseInt(catOverrides[tier]!);
      return isNaN(v) || v <= 0 ? defaultTime : v;
    }
    return defaultTime;
  }

  function handleSave() {
    const allServices: SavedService[] = [];

    for (const tab of availableTabs) {
      const tmpl = CATEGORY_TEMPLATES[tab.templateKey];
      const basePrice = parseFloat(categoryPrices[tab.catId] ?? '0') || 0;
      const types = categoryServiceTypes[tab.catId] ?? { express: true, standard: true, premium: true };
      const catPriceOverrides = priceOverrides[tab.catId] ?? {};
      const catDurOverrides = durationOverrides[tab.catId] ?? {};

      TIERS
        .filter(t => types[t.key] !== false)
        .forEach(t => {
          const def = tmpl[t.key];
          const price = catPriceOverrides[t.key] !== undefined
            ? (parseFloat(catPriceOverrides[t.key]!) || 0)
            : (basePrice > 0 ? Math.round(basePrice * def.priceMult) : 0);
          const duration = catDurOverrides[t.key] !== undefined
            ? (parseInt(catDurOverrides[t.key]!) || def.time)
            : def.time;
          if (price > 0) {
            allServices.push({ name: def.name, emoji: '', price, durationMinutes: duration });
          }
        });
    }

    if (allServices.length === 0 && availableTabs.length > 0) {
      setPriceError(true);
      return;
    }

    onSave(allServices);
  }

  return (
    <motion.div
      key="SERVICES"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card p-6"
    >
      <h2 className="heading-serif text-xl text-foreground mb-0.5">Твої послуги</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Більше послуг додаш в кабінеті
      </p>

      {availableTabs.length > 1 && (
        <ScrollStrip role="tablist" wrapperClassName="mb-4" className="flex gap-1.5 pb-1 -mx-1 px-1">
          {availableTabs.map(tab => (
            <button
              key={tab.catId}
              id={`tab-${tab.catId}`}
              type="button"
              role="tab"
              aria-selected={activeTabCatId === tab.catId}
              aria-controls="services-panel"
              onClick={() => { setActiveTabCatId(tab.catId); setEditingField(null); setPriceError(false); }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-[0.96]',
                activeTabCatId === tab.catId ? 'border-accent' : 'border-border bg-secondary/50',
              )}
              style={activeTabCatId === tab.catId
                ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                : { color: 'var(--text-secondary)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </ScrollStrip>
      )}

      <div
        role="tabpanel"
        id="services-panel"
        aria-labelledby={`tab-${activeTabCatId}`}
      >
        {template ? (
        <>
          <div className="mb-4">
            <label htmlFor="base-price" className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Стандартна ціна, ₴
            </label>
            <input
              id="base-price"
              type="number"
              inputMode="numeric"
              placeholder="400"
              value={serviceBasePrice}
              onChange={e => {
                onCategoryPricesChange({ ...categoryPrices, [activeTabCatId]: e.target.value });
                setPriceError(false);
              }}
              className={inputCls}
              aria-invalid={priceError}
              aria-describedby={priceError ? 'price-error' : 'price-hint'}
            />
            {priceError ? (
              <p id="price-error" className="text-destructive text-[11px] mt-1.5 ml-1 font-medium">
                Вкажи ціну
              </p>
            ) : (
              <p id="price-hint" className="text-[11px] mt-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                Інші варіанти розраховуються автоматично
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {TIERS.map(tier => {
              const def = template[tier.key];
              const price = computePrice(tier.key, def.priceMult);
              const duration = computeDuration(tier.key, def.time);
              const isOn = selectedServiceTypes[tier.key] !== false;
              const isEditingPrice = editingField?.tier === tier.key && editingField.field === 'price';
              const isEditingDuration = editingField?.tier === tier.key && editingField.field === 'duration';
              const catPriceOverrides = priceOverrides[activeTabCatId] ?? {};
              const catDurOverrides = durationOverrides[activeTabCatId] ?? {};

              return (
                <div
                  key={tier.key}
                  className={cn(
                    'rounded-xl border transition-all',
                    isOn ? 'border-accent/30 bg-accent/5' : 'border-border bg-secondary/30',
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={isOn}
                    onClick={() => toggleTier(tier.key)}
                    className="w-full flex items-center gap-3 px-4 pt-3 pb-2 text-left cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div
                      className="size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                      style={isOn
                        ? { borderColor: 'var(--accent)', background: 'var(--accent)' }
                        : { borderColor: 'var(--border)', background: 'transparent' }
                      }
                    >
                      {isOn && <Check size={9} style={{ color: 'var(--accent-on)' }} strokeWidth={3} />}
                    </div>
                    <p className="flex-1 text-xs font-semibold text-foreground truncate">{def.name}</p>
                    <span className="text-[10px] flex-shrink-0 opacity-50" style={{ color: 'var(--text-secondary)' }}>
                      {tier.label}
                    </span>
                  </button>

                  <div className="flex items-center gap-3 px-4 pb-3">
                    {/* Duration */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Clock size={9} style={{ color: 'var(--text-secondary)' }} />
                      {isEditingDuration ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={catDurOverrides[tier.key] ?? String(duration)}
                            onChange={e => setDurationOverrides(p => ({
                              ...p,
                              [activeTabCatId]: { ...(p[activeTabCatId] ?? {}), [tier.key]: e.target.value },
                            }))}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
                            autoFocus
                            className="w-12 text-[11px] px-1.5 py-0.5 rounded-lg border bg-secondary/70 outline-none text-center"
                            style={{ borderColor: 'var(--accent)', color: 'var(--foreground)' }}
                            aria-label="Тривалість у хвилинах"
                          />
                          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>хв</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingField({ tier: tier.key, field: 'duration' })}
                          className="text-[11px] cursor-text"
                          style={{
                            color: 'var(--text-secondary)',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '3px',
                            textDecorationColor: 'var(--border)',
                          }}
                          aria-label={`Змінити тривалість: ${formatDur(duration)}`}
                        >
                          {formatDur(duration)}
                        </button>
                      )}
                    </div>

                    {/* Price */}
                    <div className="ml-auto flex-shrink-0">
                      {isEditingPrice ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={catPriceOverrides[tier.key] ?? (price !== null ? String(price) : '')}
                            onChange={e => {
                              setPriceOverrides(p => ({
                                ...p,
                                [activeTabCatId]: { ...(p[activeTabCatId] ?? {}), [tier.key]: e.target.value },
                              }));
                              setPriceError(false);
                            }}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
                            autoFocus
                            className="w-16 text-sm font-bold px-1.5 py-0.5 rounded-lg border bg-secondary/70 outline-none text-center"
                            style={{ borderColor: 'var(--accent)', color: 'var(--foreground)' }}
                            aria-label="Ціна"
                          />
                          <span className="text-sm font-bold text-foreground">₴</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingField({ tier: tier.key, field: 'price' })}
                          className="text-sm font-bold cursor-text"
                          style={{
                            color: 'var(--foreground)',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '3px',
                            textDecorationColor: 'var(--border)',
                          }}
                          aria-label={`Змінити ціну: ${price !== null ? formatPrice(price) : 'не вказано'}`}
                        >
                          {price !== null ? formatPrice(price) : '—'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div
          className="rounded-xl border border-border px-4 py-6 text-center"
          style={{ background: 'var(--surface)' }}
        >
          <p className="text-sm text-foreground font-medium">Послуги додаш після реєстрації</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            У кабінеті є зручний редактор з шаблонами
          </p>
        </div>
      )}
      </div>

      <div className="flex flex-col gap-2 mt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.97]"
          style={{ background: 'var(--btn-primary-bg, var(--accent))', color: 'var(--accent-on)' }}
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
            : <>Далі <ArrowRight size={15} /></>
          }
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-sm font-medium transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          Додам пізніше
        </button>
      </div>
    </motion.div>
  );
}
