import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { supabase } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import {
  TrendingUp, TrendingDown, Clock, Bird, Zap,
  CheckCircle2, Layers, ArrowUpDown,
} from 'lucide-react';

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

function DaysToggle({ value, onChange, activeColor }: {
  value: string[];
  onChange: (v: string[]) => void;
  activeColor: string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAYS_UA.map(d => (
        <button
          key={d.key}
          type="button"
          onClick={() =>
            onChange(value.includes(d.key) ? value.filter(x => x !== d.key) : [...value, d.key])
          }
          className={cn(
            'min-w-[36px] min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer',
            value.includes(d.key)
              ? 'text-white shadow-sm'
              : 'bg-white/70 text-[#6B5750] border-white/80 hover:border-current/40 hover:bg-white/90'
          )}
          style={value.includes(d.key)
            ? { background: activeColor, borderColor: activeColor }
            : {}
          }
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

const INFO_CHIPS = [
  { icon: Layers,      label: 'Стекінг',    hint: 'Правила накладаються одне на одне' },
  { icon: TrendingDown, label: 'Мax -30%',  hint: 'Нижня межа знижки від ціни' },
  { icon: TrendingUp,   label: 'Мax +50%',  hint: 'Верхня межа надбавки від ціни' },
];

export function DynamicPricingPage({ initial }: Props) {
  const { currentStep, nextStep, closeTour } = useTour('pricing', 2);
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const [rules, setRules]   = useState<PricingRules>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState({
    peak:        !!initial.peak,
    quiet:       !!initial.quiet,
    early_bird:  !!initial.early_bird,
    last_minute: !!initial.last_minute,
  });

  function patch<K extends keyof PricingRules>(key: K, value: PricingRules[K]) {
    setRules(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!masterId) { setSaveError('Профіль не знайдено'); return; }
    setSaving(true);
    setSaveError(null);
    const toSave: PricingRules = {};
    if (enabled.peak        && rules.peak)        toSave.peak        = rules.peak;
    if (enabled.quiet       && rules.quiet)       toSave.quiet       = rules.quiet;
    if (enabled.early_bird  && rules.early_bird)  toSave.early_bird  = rules.early_bird;
    if (enabled.last_minute && rules.last_minute) toSave.last_minute = rules.last_minute;

    const { error: dbError } = await supabase
      .from('master_profiles')
      .update({ pricing_rules: toSave })
      .eq('id', masterId);

    if (dbError) { setSaveError(dbError.message); setSaved(false); }
    else         { setSaved(true); }
    setSaving(false);
  }

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  // ── Sections config ─────────────────────────────────────────────────────
  const sections = [
    {
      key:         'peak' as const,
      icon:        TrendingUp,
      color:       '#D4935A',
      borderCls:   'border-l-[#D4935A]',
      bgOpacity:   'rgba(212,147,90,0.09)',
      title:       'Пік-години',
      typeLabel:   'Надбавка',
      hint:        'Підвищуй ціну в найбільш популярний час',
      impact:      enabled.peak && rules.peak ? `+${rules.peak.markup_pct}%` : null,
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#6B5750] mb-2">Дні тижня</p>
            <DaysToggle
              activeColor="#D4935A"
              value={rules.peak?.days ?? ['fri', 'sat']}
              onChange={v => patch('peak', { ...(rules.peak ?? { hours: [16,20], markup_pct: 15 }), days: v })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1.5">З (год)</p>
              <input type="number" min={0} max={23}
                value={rules.peak?.hours[0] ?? 16}
                onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], markup_pct: 15 }), hours: [Number(e.target.value), rules.peak?.hours[1] ?? 20] })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50 transition-colors"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1.5">До (год)</p>
              <input type="number" min={0} max={24}
                value={rules.peak?.hours[1] ?? 20}
                onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], markup_pct: 15 }), hours: [rules.peak?.hours[0] ?? 16, Number(e.target.value)] })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50 transition-colors"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1.5">Надбавка</p>
              <div className="relative">
                <input type="number" min={5} max={50}
                  value={rules.peak?.markup_pct ?? 15}
                  onChange={e => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], hours: [16,20] }), markup_pct: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 pr-7 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#D4935A]/30 focus:border-[#D4935A]/50 transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A8928D] pointer-events-none">%</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key:        'quiet' as const,
      icon:       TrendingDown,
      color:      '#789A99',
      borderCls:  'border-l-[#789A99]',
      bgOpacity:  'rgba(120,154,153,0.09)',
      title:      'Тихий час',
      typeLabel:  'Знижка',
      hint:       'Приваблюй клієнтів у непопулярний час',
      impact:     enabled.quiet && rules.quiet ? `-${rules.quiet.discount_pct}%` : null,
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#6B5750] mb-2">Дні тижня</p>
            <DaysToggle
              activeColor="#789A99"
              value={rules.quiet?.days ?? ['mon', 'tue', 'wed']}
              onChange={v => patch('quiet', { ...(rules.quiet ?? { hours: [9,13], discount_pct: 10 }), days: v })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1.5">З (год)</p>
              <input type="number" min={0} max={23}
                value={rules.quiet?.hours[0] ?? 9}
                onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], discount_pct: 10 }), hours: [Number(e.target.value), rules.quiet?.hours[1] ?? 13] })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#789A99]/40 transition-colors"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1.5">До (год)</p>
              <input type="number" min={0} max={24}
                value={rules.quiet?.hours[1] ?? 13}
                onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], discount_pct: 10 }), hours: [rules.quiet?.hours[0] ?? 9, Number(e.target.value)] })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#789A99]/40 transition-colors"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5750] mb-1.5">Знижка</p>
              <div className="relative">
                <input type="number" min={5} max={40}
                  value={rules.quiet?.discount_pct ?? 10}
                  onChange={e => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], hours: [9,13] }), discount_pct: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 pr-7 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#789A99]/40 transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A8928D] pointer-events-none">%</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key:        'early_bird' as const,
      icon:       Bird,
      color:      '#5C9E7A',
      borderCls:  'border-l-[#5C9E7A]',
      bgOpacity:  'rgba(92,158,122,0.09)',
      title:      'Рання бронь',
      typeLabel:  'Знижка',
      hint:       'Стимулюй планувати наперед',
      impact:     enabled.early_bird && rules.early_bird ? `-${rules.early_bird.discount_pct}%` : null,
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1.5">Днів наперед (від)</p>
            <input type="number" min={3} max={60}
              value={rules.early_bird?.days_ahead ?? 14}
              onChange={e => patch('early_bird', { ...(rules.early_bird ?? { discount_pct: 7 }), days_ahead: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#5C9E7A]/30 focus:border-[#5C9E7A]/50 transition-colors"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1.5">Знижка (%)</p>
            <input type="number" min={3} max={30}
              value={rules.early_bird?.discount_pct ?? 7}
              onChange={e => patch('early_bird', { ...(rules.early_bird ?? { days_ahead: 14 }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#5C9E7A]/30 focus:border-[#5C9E7A]/50 transition-colors"
            />
          </div>
        </div>
      ),
    },
    {
      key:        'last_minute' as const,
      icon:       Zap,
      color:      '#C05B5B',
      borderCls:  'border-l-[#C05B5B]',
      bgOpacity:  'rgba(192,91,91,0.09)',
      title:      'Остання хвилина',
      typeLabel:  'Знижка',
      hint:       'Заповнюй вільні слоти в останній момент',
      impact:     enabled.last_minute && rules.last_minute ? `-${rules.last_minute.discount_pct}%` : null,
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1.5">Годин до слоту (до)</p>
            <input type="number" min={1} max={24}
              value={rules.last_minute?.hours_ahead ?? 4}
              onChange={e => patch('last_minute', { ...(rules.last_minute ?? { discount_pct: 20 }), hours_ahead: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#C05B5B]/30 focus:border-[#C05B5B]/50 transition-colors"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-1.5">Знижка (%)</p>
            <input type="number" min={5} max={50}
              value={rules.last_minute?.discount_pct ?? 20}
              onChange={e => patch('last_minute', { ...(rules.last_minute ?? { hours_ahead: 4 }), discount_pct: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8D5CF] bg-white/60 text-sm text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#C05B5B]/30 focus:border-[#C05B5B]/50 transition-colors"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-8">

      {/* ── Header ── */}
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
          title="Смарт-ціноутворення"
          text="Автоматично заповнюйте 'вікна' у графіку. Ми самі запропонуємо клієнтам найоптимальніший час запису."
          position="bottom"
          primaryButtonText="Далі →"
          onPrimaryClick={nextStep}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#789A99]/14 flex items-center justify-center shrink-0">
              <ArrowUpDown size={20} className="text-[#789A99]" />
            </div>
            <div>
              <h1 className="heading-serif text-xl text-[#2C1A14] leading-tight">Ціноутворення</h1>
              <p className="text-sm text-[#A8928D]">Автоматичне коригування цін</p>
            </div>
          </div>
          <span className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full shrink-0 transition-colors',
            enabledCount > 0
              ? 'bg-[#789A99]/12 text-[#789A99]'
              : 'bg-[#F5E8E3] text-[#A8928D]'
          )}>
            {enabledCount > 0 ? `${enabledCount} активних` : 'Вимкнено'}
          </span>
        </div>

        {/* Три інфо-плитки */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {INFO_CHIPS.map(({ icon: ChipIcon, label, hint }) => (
            <div
              key={label}
              title={hint}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl bg-white/50 border border-white/70 text-center cursor-default"
            >
              <ChipIcon size={14} className="text-[#789A99]" />
              <span className="text-[10px] font-semibold text-[#6B5750] leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Rule cards ── */}
      <div className={cn(
        'relative rounded-2xl transition-all duration-500',
        currentStep === 1 && 'tour-glow z-40 scale-[1.02]'
      )}>
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="Динамічні знижки"
          text="Встановіть знижку на 'незручні' години (наприклад, ранкові), щоб стимулювати клієнтів бронювати порожній час."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />
        <div className="flex flex-col gap-3">
          {sections.map(({ key, icon: Icon, color, borderCls, bgOpacity, title, typeLabel, hint, impact, content }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.14 + i * 0.06 }}
              className={cn('bento-card overflow-hidden border-l-4', borderCls)}
            >
              {/* Toggle row */}
              <div
                className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none"
                onClick={() => setEnabled(prev => ({ ...prev, [key]: !prev[key] }))}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: bgOpacity }}
                >
                  <Icon size={19} style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#2C1A14]">{title}</p>
                    {/* Type badge */}
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: `${color}12`, color }}
                    >
                      {typeLabel}
                    </span>
                    {/* Live impact badge */}
                    {impact && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color }}
                      >
                        {impact}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-[#A8928D] mt-0.5 truncate">{hint}</p>
                </div>

                {/* Toggle pill */}
                <div
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
                  style={{ background: enabled[key] ? color : '#E8D5CF' }}
                >
                  <motion.div
                    animate={{ x: enabled[key] ? 21 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                  />
                </div>
              </div>

              {/* Expanded settings */}
              <AnimatePresence initial={false}>
                {enabled[key] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 mb-4 p-4 rounded-2xl bg-white/40 border border-white/70">
                      {content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Save button ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.42 }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2.5 bg-[#789A99] hover:bg-[#5C7E7D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors shadow-[0_4px_16px_rgba(120,154,153,0.35)] cursor-pointer"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Зберігаємо…
            </>
          ) : saved ? (
            <>
              <CheckCircle2 size={16} />
              Збережено!
            </>
          ) : (
            'Зберегти правила'
          )}
        </motion.button>

        {saveError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-center text-[#C05B5B] mt-2"
          >
            {saveError}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
