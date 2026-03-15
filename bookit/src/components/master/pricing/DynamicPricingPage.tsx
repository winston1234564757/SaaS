'use client';

import { useState } from 'react';
import { savePricingRules } from '@/app/(master)/dashboard/pricing/actions';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import { TrendingUp, TrendingDown, Clock, Bird, Zap, Info } from 'lucide-react';

interface Props {
  initial: PricingRules;
}

const DAYS_UA: { key: string; label: string }[] = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Нд' },
];

function DaysToggle({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {DAYS_UA.map(d => (
        <button
          key={d.key}
          type="button"
          onClick={() => {
            onChange(
              value.includes(d.key) ? value.filter(x => x !== d.key) : [...value, d.key]
            );
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            value.includes(d.key)
              ? 'bg-[#789A99] text-white border-[#789A99]'
              : 'bg-white text-[#6B5750] border-[#E8D5CF] hover:border-[#789A99]'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

export function DynamicPricingPage({ initial }: Props) {
  const [rules, setRules] = useState<PricingRules>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState({
    peak: !!initial.peak,
    quiet: !!initial.quiet,
    early_bird: !!initial.early_bird,
    last_minute: !!initial.last_minute,
  });

  function patch<K extends keyof PricingRules>(key: K, value: PricingRules[K]) {
    setRules(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const toSave: PricingRules = {};
    if (enabled.peak && rules.peak) toSave.peak = rules.peak;
    if (enabled.quiet && rules.quiet) toSave.quiet = rules.quiet;
    if (enabled.early_bird && rules.early_bird) toSave.early_bird = rules.early_bird;
    if (enabled.last_minute && rules.last_minute) toSave.last_minute = rules.last_minute;
    await savePricingRules(toSave);
    setSaved(true);
    setSaving(false);
  }

  const sections = [
    {
      key: 'peak' as const,
      icon: TrendingUp,
      color: '#D4935A',
      bg: '#D4935A12',
      title: 'Пік-години (надбавка)',
      hint: 'Підвищуй ціну в найбільш популярний час',
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1.5">Дні</p>
            <DaysToggle
              value={rules.peak?.days ?? ['fri', 'sat']}
              onChange={v => patch('peak', { ...(rules.peak ?? { hours: [16, 20], markup_pct: 15 }), days: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1">Початок (год)</p>
              <input
                type="number" min={0} max={23}
                value={rules.peak?.hours[0] ?? 16}
                onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], markup_pct: 15 }), hours: [Number(e.target.value), rules.peak?.hours[1] ?? 20] })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1">Кінець (год)</p>
              <input
                type="number" min={0} max={24}
                value={rules.peak?.hours[1] ?? 20}
                onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], markup_pct: 15 }), hours: [rules.peak?.hours[0] ?? 16, Number(e.target.value)] })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Надбавка (%)</p>
            <input
              type="number" min={5} max={50}
              value={rules.peak?.markup_pct ?? 15}
              onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], hours: [16,20] }), markup_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'quiet' as const,
      icon: TrendingDown,
      color: '#789A99',
      bg: '#789A9912',
      title: 'Тихий час (знижка)',
      hint: 'Приваблюй клієнтів у непопулярний час',
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1.5">Дні</p>
            <DaysToggle
              value={rules.quiet?.days ?? ['mon', 'tue', 'wed']}
              onChange={v => patch('quiet', { ...(rules.quiet ?? { hours: [9, 13], discount_pct: 10 }), days: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1">Початок (год)</p>
              <input
                type="number" min={0} max={23}
                value={rules.quiet?.hours[0] ?? 9}
                onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], discount_pct: 10 }), hours: [Number(e.target.value), rules.quiet?.hours[1] ?? 13] })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1">Кінець (год)</p>
              <input
                type="number" min={0} max={24}
                value={rules.quiet?.hours[1] ?? 13}
                onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], discount_pct: 10 }), hours: [rules.quiet?.hours[0] ?? 9, Number(e.target.value)] })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Знижка (%)</p>
            <input
              type="number" min={5} max={40}
              value={rules.quiet?.discount_pct ?? 10}
              onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], hours: [9,13] }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'early_bird' as const,
      icon: Bird,
      color: '#5C9E7A',
      bg: '#5C9E7A12',
      title: 'Рання бронь (знижка)',
      hint: 'Стимулюй планувати наперед',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Днів наперед (від)</p>
            <input
              type="number" min={3} max={60}
              value={rules.early_bird?.days_ahead ?? 14}
              onChange={e => patch('early_bird', { ...(rules.early_bird ?? { discount_pct: 7 }), days_ahead: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Знижка (%)</p>
            <input
              type="number" min={3} max={30}
              value={rules.early_bird?.discount_pct ?? 7}
              onChange={e => patch('early_bird', { ...(rules.early_bird ?? { days_ahead: 14 }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'last_minute' as const,
      icon: Zap,
      color: '#C05B5B',
      bg: '#C05B5B12',
      title: 'Остання хвилина (знижка)',
      hint: 'Заповнюй вільні слоти в останній момент',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Годин до слоту (до)</p>
            <input
              type="number" min={1} max={24}
              value={rules.last_minute?.hours_ahead ?? 4}
              onChange={e => patch('last_minute', { ...(rules.last_minute ?? { discount_pct: 20 }), hours_ahead: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Знижка (%)</p>
            <input
              type="number" min={5} max={50}
              value={rules.last_minute?.discount_pct ?? 20}
              onChange={e => patch('last_minute', { ...(rules.last_minute ?? { hours_ahead: 4 }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#789A99]/15 flex items-center justify-center">
          <Clock size={20} className="text-[#789A99]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2C1A14]">Динамічне ціноутворення</h1>
          <p className="text-sm text-[#A8928D]">Автоматично коригуй ціни залежно від часу</p>
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100">
        <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Клієнти бачать скориговану ціну при виборі слоту. Правила не накладаються — діє перше, що підходить: рання бронь → остання хвилина → пік → тихий час.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map(({ key, icon: Icon, color, bg, title, hint, content }) => (
          <div key={key} className="bg-white rounded-2xl border border-[#E8D5CF]/60 overflow-hidden">
            <div
              className="flex items-center gap-3 px-5 py-4 cursor-pointer"
              onClick={() => setEnabled(prev => ({ ...prev, [key]: !prev[key] }))}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#2C1A14]">{title}</p>
                <p className="text-xs text-[#A8928D]">{hint}</p>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${enabled[key] ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${enabled[key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
            {enabled[key] && (
              <div className="px-5 pb-5 border-t border-[#E8D5CF]/50">
                <div className="pt-4">
                  {content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#789A99] hover:bg-[#5C7E7D] disabled:opacity-50 text-white font-semibold rounded-2xl py-3 text-sm transition-colors"
      >
        {saving ? 'Зберігаємо...' : saved ? '✅ Збережено!' : 'Зберегти правила'}
      </button>
    </div>
  );
}
