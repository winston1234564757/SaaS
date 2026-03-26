'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { savePricingRules } from '@/app/(master)/dashboard/pricing/actions';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import { TrendingUp, TrendingDown, Clock, Bird, Zap, Info, CheckCircle2 } from 'lucide-react';

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
              : 'bg-white/70 text-[#6B5750] border-white/80 hover:border-[#789A99]'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

export function DynamicPricingPage({ initial }: Props) {
  const { currentStep, nextStep, closeTour } = useTour('pricing', 2);
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

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  const sections = [
    {
      key: 'peak' as const,
      icon: TrendingUp,
      color: '#D4935A',
      bg: 'rgba(212,147,90,0.08)',
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
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1">Кінець (год)</p>
              <input
                type="number" min={0} max={24}
                value={rules.peak?.hours[1] ?? 20}
                onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], markup_pct: 15 }), hours: [rules.peak?.hours[0] ?? 16, Number(e.target.value)] })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Надбавка (%)</p>
            <input
              type="number" min={5} max={50}
              value={rules.peak?.markup_pct ?? 15}
              onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], hours: [16,20] }), markup_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'quiet' as const,
      icon: TrendingDown,
      color: '#789A99',
      bg: 'rgba(120,154,153,0.08)',
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
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1">Кінець (год)</p>
              <input
                type="number" min={0} max={24}
                value={rules.quiet?.hours[1] ?? 13}
                onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], discount_pct: 10 }), hours: [rules.quiet?.hours[0] ?? 9, Number(e.target.value)] })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Знижка (%)</p>
            <input
              type="number" min={5} max={40}
              value={rules.quiet?.discount_pct ?? 10}
              onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], hours: [9,13] }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#789A99]/40"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'early_bird' as const,
      icon: Bird,
      color: '#5C9E7A',
      bg: 'rgba(92,158,122,0.08)',
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
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C9E7A]/30 focus:border-[#5C9E7A]/50"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Знижка (%)</p>
            <input
              type="number" min={3} max={30}
              value={rules.early_bird?.discount_pct ?? 7}
              onChange={e => patch('early_bird', { ...(rules.early_bird ?? { days_ahead: 14 }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C9E7A]/30 focus:border-[#5C9E7A]/50"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'last_minute' as const,
      icon: Zap,
      color: '#C05B5B',
      bg: 'rgba(192,91,91,0.08)',
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
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#C05B5B]/30 focus:border-[#C05B5B]/50"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1">Знижка (%)</p>
            <input
              type="number" min={5} max={50}
              value={rules.last_minute?.discount_pct ?? 20}
              onChange={e => patch('last_minute', { ...(rules.last_minute ?? { hours_ahead: 4 }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#C05B5B]/30 focus:border-[#C05B5B]/50"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className={cn(
          'relative bento-card p-5 transition-all duration-500',
          currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
        )}
      >
        <AnchoredTooltip
          isOpen={currentStep === 0}
          onClose={closeTour}
          title="⚡ Смарт-слоти"
          text="Автоматично заповнюйте 'вікна' у графіку. Ми самі запропонуємо клієнтам найоптимальніший час запису."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#789A99]/15 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-[#789A99]" />
            </div>
            <div>
              <h1 className="heading-serif text-xl text-[#2C1A14]">Ціноутворення</h1>
              <p className="text-sm text-[#A8928D]">Автоматичне коригування цін</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#789A99] bg-[#789A99]/10 px-2.5 py-1 rounded-full">
            {enabledCount} активних
          </span>
        </div>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.10 }}
        className="bento-card p-4 flex items-start gap-3"
        style={{ background: 'rgba(120,154,153,0.08)' }}
      >
        <Info size={14} className="text-[#789A99] mt-0.5 shrink-0" />
        <p className="text-xs text-[#6B5750]">
          Клієнти бачать скориговану ціну при виборі слоту. Правила не накладаються — діє перше, що підходить: рання бронь → остання хвилина → пік → тихий час.
        </p>
      </motion.div>

      {/* Sections */}
      <div className={cn(
        'relative rounded-2xl transition-all duration-500',
        currentStep === 1 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="💸 Динамічні знижки"
          text="Встановіть знижку на 'незручні' години (наприклад, ранкові), щоб стимулювати клієнтів бронювати порожній час."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
        <div className="flex flex-col gap-3">
          {sections.map(({ key, icon: Icon, color, bg, title, hint, content }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.14 + i * 0.06 }}
              className="bento-card overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer group"
                onClick={() => setEnabled(prev => ({ ...prev, [key]: !prev[key] }))}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2C1A14]">{title}</p>
                  <p className="text-xs text-[#A8928D]">{hint}</p>
                </div>
                <div
                  className={`w-10 h-5 rounded-full transition-colors shrink-0 ${enabled[key] ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'}`}
                >
                  <motion.div
                    animate={{ x: enabled[key] ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-sm"
                  />
                </div>
              </div>
              <AnimatePresence initial={false}>
                {enabled[key] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-[#F5E8E3]/60 pt-4">
                      {content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.40 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#789A99] hover:bg-[#5C7E7D] disabled:opacity-50 text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors shadow-[0_4px_14px_rgba(120,154,153,0.3)]"
      >
        {saved && <CheckCircle2 size={16} />}
        {saving ? 'Зберігаємо...' : saved ? 'Збережено!' : 'Зберегти правила'}
      </motion.button>
    </div>
  );
}
