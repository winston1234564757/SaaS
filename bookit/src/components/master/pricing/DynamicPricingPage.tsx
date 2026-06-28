'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { pluralUk } from '@/lib/utils/pluralUk';
import { savePricingRules, getDynamicPricingSavedSlots, getPricingRulesOverview, type PricingRulesOverview as OverviewData } from '@/app/(master)/dashboard/pricing/actions';
import { useMasterContext } from '@/lib/supabase/context';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import {
  TrendingUp, TrendingDown, Bird, Zap,
  CheckCircle2, Layers, ArrowUpDown, BarChart3,
} from 'lucide-react';
import { PricingUpgradeGate } from '@/components/master/pricing/PricingUpgradeGate';
import { PricingRuleStatsSheet, type RuleStatMeta } from '@/components/master/pricing/PricingRuleStatsSheet';
import { PricingRulesOverview } from '@/components/master/pricing/PricingRulesOverview';

interface Props {
  initial?: PricingRules;
  isDrawer?: boolean;
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

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

// Семантичні токени: warm = надбавка (вгору), cool = знижка (вниз).
const WARM = 'var(--warning)';   // #B45309 — амбер
const COOL = 'var(--success)';   // #16803C — green

const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// Ілюстративна база для прев'ю «що станеться з ціною». Не реальна ціна майстра.
const PREVIEW_BASE = 500;

const INFO_CHIPS = [
  { icon: Layers,       label: 'Стекінг',  desc: 'Правила накладаються одне на одне. Якщо на слот спрацюють два — їхні відсотки додаються.' },
  { icon: TrendingDown, label: 'Max -30%', desc: 'Хоч скільки знижок зійдеться на слоті, ціна не впаде більше ніж на 30% від базової.' },
  { icon: TrendingUp,   label: 'Max +50%', desc: 'Сумарна надбавка не підніме ціну більше ніж на 50% від базової.' },
];

function kopToUah(kop: number): string {
  return (kop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const DaysToggle = React.memo(({ value, onChange, activeColor }: {
  value: string[];
  onChange: (v: string[]) => void;
  activeColor: string;
}) => (
  <div className="flex gap-1.5 flex-wrap">
    {DAYS_UA.map(d => (
      <button
        key={d.key}
        type="button"
        aria-pressed={value.includes(d.key)}
        onClick={() => onChange(value.includes(d.key) ? value.filter(x => x !== d.key) : [...value, d.key])}
        className={cn(
          'min-w-[36px] min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer active:scale-[0.88] transform-gpu',
          value.includes(d.key)
            ? 'text-white shadow-sm'
            : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary/60'
        )}
        style={value.includes(d.key) ? { background: activeColor, borderColor: activeColor } : {}}
      >
        {d.label}
      </button>
    ))}
  </div>
));
DaysToggle.displayName = 'DaysToggle';

const TRIAL_LIMIT_KOP = 100_000;

export function DynamicPricingPage({ initial, isDrawer }: Props) {
  const { masterProfile, isLoading: masterLoading } = useMasterContext();

  const tier = masterProfile?.subscription_tier ?? 'starter';
  const extraEarned = masterProfile?.dynamic_pricing_extra_earned ?? 0;
  const isPro = tier === 'pro' || tier === 'studio';
  const isStarter = tier === 'starter';
  const trialExhausted = isStarter && extraEarned >= TRIAL_LIMIT_KOP;

  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('pricing', 2, {
    initialSeen: seenTours?.pricing ?? false,
    masterId: masterProfile?.id,
  });

  const [rules, setRules]   = useState<PricingRules>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSlots, setSavedSlots] = useState<number | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [statsRule, setStatsRule] = useState<RuleStatMeta | null>(null);
  const [enabled, setEnabled] = useState({
    peak:        !!initial?.peak,
    quiet:       !!initial?.quiet,
    early_bird:  !!initial?.early_bird,
    last_minute: !!initial?.last_minute,
  });

  // Огляд правил (усі тарифи) + врятовані слоти (Pro, для доказ-рядка hero).
  useEffect(() => {
    let active = true;
    getPricingRulesOverview().then(r => { if (active) setOverview(r); });
    if (isPro) getDynamicPricingSavedSlots().then(r => { if (active) setSavedSlots(r.count); });
    return () => { active = false; };
  }, [isPro]);

  if (masterLoading) {
    return (
      <div className="flex flex-col gap-5 p-6 animate-pulse">
        <div className="h-40 bg-secondary/40 border border-border/40 rounded-3xl" />
        <div className="h-64 bg-secondary/40 border border-border/40 rounded-3xl" />
      </div>
    );
  }

  // Paywall: ліміт trial вичерпано — гейт замінює всю сторінку.
  if (trialExhausted) {
    return (
      <PricingUpgradeGate
        trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: true }}
        quietHoursInsight={null}
        isDrawer={isDrawer}
      />
    );
  }

  const patch = (key: keyof PricingRules, value: any) => {
    setRules(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const toSave: PricingRules = {};
    if (enabled.peak) toSave.peak = rules.peak;
    if (enabled.quiet) toSave.quiet = rules.quiet;
    if (enabled.early_bird) toSave.early_bird = rules.early_bird;
    if (enabled.last_minute) toSave.last_minute = rules.last_minute;

    const result = await savePricingRules(toSave);
    if (result.error) {
      setSaveError(result.error);
      setSaved(false);
    } else {
      setSaved(true);
    }
    setSaving(false);
  };

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  // Прев'ю по типу правила (ілюстративні, база 500 ₴).
  // Надбавка — один раз (Пік). Знижка — один раз на найбільшій увімкненій з трьох.
  const markupPreview = enabled.peak
    ? Math.round(PREVIEW_BASE * (1 + (rules.peak?.markup_pct ?? 15) / 100))
    : null;

  const enabledDiscountPcts: number[] = [];
  if (enabled.quiet)       enabledDiscountPcts.push(rules.quiet?.discount_pct ?? 10);
  if (enabled.early_bird)  enabledDiscountPcts.push(rules.early_bird?.discount_pct ?? 7);
  if (enabled.last_minute) enabledDiscountPcts.push(rules.last_minute?.discount_pct ?? 20);
  const maxDiscountPct = enabledDiscountPcts.length ? Math.max(...enabledDiscountPcts) : null;
  const discountPreview = maxDiscountPct != null
    ? Math.round(PREVIEW_BASE * (1 - maxDiscountPct / 100))
    : null;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {isStarter && (
        <PricingUpgradeGate
          trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: false }}
          quietHoursInsight={null}
          isDrawer={isDrawer}
        />
      )}

      {!isPro && !isStarter && <PricingUpgradeGate isDrawer={isDrawer} />}

      {!isDrawer && (
        <PricingHero
          currentStep={currentStep}
          closeTour={closeTour}
          nextStep={nextStep}
          enabledCount={enabledCount}
          extraEarned={extraEarned}
          savedSlots={isPro ? savedSlots : null}
        />
      )}

      {!isDrawer && <PricingRulesOverview data={overview} onOpenRule={setStatsRule} />}

      <div className={cn('relative flex flex-col gap-2.5', currentStep === 1 && 'tour-glow z-40 scale-[1.02] transition-all duration-500')}>
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="Динамічні знижки"
          text="Встановіть знижку на 'незручні' години, щоб стимулювати клієнтів бронювати порожній час."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />

        <SectionHeader label="Заробити більше" tone="warm" />
        {markupPreview != null && <PreviewRow tone="warm" adj={markupPreview} />}

        <PricingRuleCard
          icon={TrendingUp}
          tone="warm"
          title="Пік-години"
          hint="Підвищуй ціну в популярний час"
          isEnabled={enabled.peak}
          onToggle={() => setEnabled(e => ({ ...e, peak: !e.peak }))}
          onStats={() => setStatsRule({ marker: 'Пік', title: 'Пік-години', tone: 'warm' })}
          impact={enabled.peak && rules.peak ? `+${rules.peak.markup_pct}%` : null}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2">Дні тижня</p>
              <DaysToggle activeColor={WARM} value={rules.peak?.days ?? ['fri', 'sat']} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { hours: [16, 20], markup_pct: 15 }), days: v })} />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <RuleInput label="З (год)" value={rules.peak?.hours[0] ?? 16} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { days: ['fri', 'sat'], markup_pct: 15 }), hours: [v, rules.peak?.hours[1] ?? 20] })} />
              <RuleInput label="До (год)" value={rules.peak?.hours[1] ?? 20} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { days: ['fri', 'sat'], markup_pct: 15 }), hours: [rules.peak?.hours[0] ?? 16, v] })} />
              <RuleInput label="Надбавка %" value={rules.peak?.markup_pct ?? 15} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { days: ['fri', 'sat'], hours: [16, 20] }), markup_pct: v })} />
            </div>
          </div>
        </PricingRuleCard>

        <SectionHeader label="Заповнити вікна" tone="cool" />
        {discountPreview != null && <PreviewRow tone="cool" adj={discountPreview} />}

        <PricingRuleCard
          icon={TrendingDown}
          tone="cool"
          title="Тихий час"
          hint="Приваблюй клієнтів у непопулярний час"
          isEnabled={enabled.quiet}
          onToggle={() => setEnabled(e => ({ ...e, quiet: !e.quiet }))}
          onStats={() => setStatsRule({ marker: 'Тихий час', title: 'Тихий час', tone: 'cool' })}
          impact={enabled.quiet && rules.quiet ? `-${rules.quiet.discount_pct}%` : null}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2">Дні тижня</p>
              <DaysToggle activeColor={COOL} value={rules.quiet?.days ?? ['mon', 'tue', 'wed']} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { hours: [9, 13], discount_pct: 10 }), days: v })} />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <RuleInput label="З (год)" value={rules.quiet?.hours[0] ?? 9} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { days: ['mon', 'tue', 'wed'], discount_pct: 10 }), hours: [v, rules.quiet?.hours[1] ?? 13] })} />
              <RuleInput label="До (год)" value={rules.quiet?.hours[1] ?? 13} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { days: ['mon', 'tue', 'wed'], discount_pct: 10 }), hours: [rules.quiet?.hours[0] ?? 9, v] })} />
              <RuleInput label="Знижка %" value={rules.quiet?.discount_pct ?? 10} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { days: ['mon', 'tue', 'wed'], hours: [9, 13] }), discount_pct: v })} />
            </div>
          </div>
        </PricingRuleCard>

        <PricingRuleCard
          icon={Bird}
          tone="cool"
          title="Рання бронь"
          hint="Стимулюй планувати наперед"
          isEnabled={enabled.early_bird}
          onToggle={() => setEnabled(e => ({ ...e, early_bird: !e.early_bird }))}
          onStats={() => setStatsRule({ marker: 'Рання бронь', title: 'Рання бронь', tone: 'cool' })}
          impact={enabled.early_bird && rules.early_bird ? `-${rules.early_bird.discount_pct}%` : null}
        >
          <div className="grid grid-cols-2 gap-3">
            <RuleInput label="Днів наперед" value={rules.early_bird?.days_ahead ?? 14} onChange={(v: any) => patch('early_bird', { ...(rules.early_bird ?? { discount_pct: 7 }), days_ahead: v })} />
            <RuleInput label="Знижка %" value={rules.early_bird?.discount_pct ?? 7} onChange={(v: any) => patch('early_bird', { ...(rules.early_bird ?? { days_ahead: 14 }), discount_pct: v })} />
          </div>
        </PricingRuleCard>

        <PricingRuleCard
          icon={Zap}
          tone="cool"
          title="Остання хвилина"
          hint="Заповнюй слоти в останній момент"
          isEnabled={enabled.last_minute}
          onToggle={() => setEnabled(e => ({ ...e, last_minute: !e.last_minute }))}
          onStats={() => setStatsRule({ marker: 'Остання хвилина', title: 'Остання хвилина', tone: 'cool' })}
          impact={enabled.last_minute && rules.last_minute ? `-${rules.last_minute.discount_pct}%` : null}
        >
          <div className="grid grid-cols-2 gap-3">
            <RuleInput label="Годин до слоту" value={rules.last_minute?.hours_ahead ?? 4} onChange={(v: any) => patch('last_minute', { ...(rules.last_minute ?? { discount_pct: 20 }), hours_ahead: v })} />
            <RuleInput label="Знижка %" value={rules.last_minute?.discount_pct ?? 20} onChange={(v: any) => patch('last_minute', { ...(rules.last_minute ?? { hours_ahead: 4 }), discount_pct: v })} />
          </div>
        </PricingRuleCard>
      </div>

      <SaveButton saving={saving} saved={saved} onSave={handleSave} error={saveError} />

      <PricingRuleStatsSheet rule={statsRule} onClose={() => setStatsRule(null)} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const PricingHero = React.memo(({ currentStep, closeTour, nextStep, enabledCount, extraEarned, savedSlots }: any) => {
  const [activeChip, setActiveChip] = useState<number | null>(null);

  const showEarned = extraEarned > 0;
  const showSlots  = (savedSlots ?? 0) > 0;
  const showResult = showEarned || showSlots;

  // Карет тултіпа під сіткою чіпів: центр відповідної третини.
  const caretLeft = activeChip === 0 ? '16.66%' : activeChip === 1 ? '50%' : '83.33%';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.05 }}
      className={cn('relative bento-card p-5', currentStep === 0 && 'tour-glow z-40 scale-[1.02] transition-all')}
    >
      <AnchoredTooltip
        isOpen={currentStep === 0}
        onClose={closeTour}
        title="Смарт-ціноутворення"
        text="Автоматично заповнюйте 'вікна' у графіку."
        position="bottom"
        primaryButtonText="Далі →"
        onPrimaryClick={nextStep}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-2xl bg-primary/[0.07] flex items-center justify-center shrink-0">
            <ArrowUpDown size={20} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="heading-serif text-xl text-foreground leading-tight text-balance">Ціни, що працюють без тебе</h1>
            <p className="text-[13px] text-muted-foreground/70 mt-1 leading-snug text-pretty">
              Знижки заповнюють тихі вікна, надбавки додають у пік, поки ти зайнятий клієнтом.
            </p>
          </div>
        </div>
        <span className={cn('shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap', enabledCount > 0 ? 'bg-primary/12 text-primary' : 'bg-secondary text-muted-foreground/60')}>
          {enabledCount > 0 ? `${enabledCount} ${pluralUk(enabledCount, 'активне', 'активних', 'активних')}` : 'Вимкнено'}
        </span>
      </div>

      {showResult && (
        <div
          className="mt-4 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
          style={{ background: tint(COOL, 9), border: `0.5px solid ${tint(COOL, 28)}` }}
        >
          <TrendingUp size={15} style={{ color: COOL }} className="shrink-0" />
          <p className="text-xs text-foreground leading-snug">
            {showEarned && (
              <>Динамічні ціни вже додали <span className="font-bold text-foreground">+{kopToUah(extraEarned)} ₴</span></>
            )}
            {showEarned && showSlots && <span className="text-muted-foreground/50"> · </span>}
            {showSlots && (
              <>{showEarned ? 'врятували' : 'Динамічні ціни врятували'} <span className="font-bold text-foreground">{savedSlots} {pluralUk(savedSlots, 'слот', 'слоти', 'слотів')}</span></>
            )}
          </p>
        </div>
      )}

      <div className="mt-4">
        <div className="grid grid-cols-3 gap-2">
          {INFO_CHIPS.map(({ icon: Icon, label }, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={activeChip === i}
              aria-label={`${label}: пояснення`}
              onClick={() => setActiveChip(prev => (prev === i ? null : i))}
              className={cn(
                'flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border text-center transition-colors cursor-pointer active:scale-[0.97]',
                activeChip === i ? 'bg-primary/10 border-primary/30' : 'bg-secondary/40 border-border'
              )}
            >
              <Icon size={14} className="text-primary" />
              <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {activeChip !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="relative mt-2.5 rounded-2xl bg-secondary/60 border border-border px-3.5 py-3">
                <span
                  className="absolute -top-[5px] size-2.5 rotate-45 bg-secondary/60 border-l border-t border-border"
                  style={{ left: caretLeft, transform: 'translateX(-50%) rotate(45deg)' }}
                />
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{INFO_CHIPS[activeChip].desc}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
PricingHero.displayName = 'PricingHero';

const SectionHeader = ({ label, tone }: { label: string; tone: 'warm' | 'cool' }) => (
  <div className="flex items-center gap-2 px-1 pt-3 pb-0.5">
    <span className="size-1.5 rounded-full shrink-0" style={{ background: tone === 'warm' ? WARM : COOL }} />
    <span className="text-sm font-semibold text-foreground">{label}</span>
  </div>
);

const PreviewRow = ({ tone, adj }: { tone: 'warm' | 'cool'; adj: number }) => {
  const color = tone === 'warm' ? WARM : COOL;
  return (
    <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5 mx-0.5" style={{ background: tint(color, 8) }}>
      <span className="text-[11px] text-muted-foreground">приклад</span>
      <span className="text-xs font-semibold text-foreground tabular-nums">
        {PREVIEW_BASE} ₴ <span className="text-muted-foreground/45 mx-0.5">→</span> <span className="font-bold text-foreground">{adj} ₴</span>
      </span>
    </div>
  );
};

const PricingRuleCard = React.memo(({ icon: Icon, tone, title, hint, isEnabled, onToggle, onStats, impact, children }: any) => {
  const color = tone === 'warm' ? WARM : COOL;
  return (
    <div
      className="bento-card overflow-hidden transition-all"
      style={isEnabled ? { borderColor: `color-mix(in srgb, ${color} 32%, var(--border))` } : undefined}
    >
      <div className="w-full flex items-center gap-2.5 px-4 py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left select-none active:scale-[0.99] transition-transform duration-100 ease-out"
        >
          <div className="size-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: tint(color, 13) }}>
            <Icon size={19} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{title}</p>
              {impact && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-foreground" style={{ background: tint(color, 18) }}>
                  {impact}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground/60 truncate">{hint}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onStats}
          aria-label={`Статистика: ${title}`}
          className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-secondary/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <BarChart3 size={16} />
        </button>
        <button
          type="button"
          aria-pressed={isEnabled}
          aria-label="Увімкнути правило"
          onClick={onToggle}
          className="relative w-11 h-6 rounded-full transition-colors shrink-0"
          style={{ background: isEnabled ? color : 'var(--border)' }}
        >
          <motion.div animate={{ x: isEnabled ? 21 : 2 }} className="absolute top-1 size-4 rounded-full bg-white shadow-sm" />
        </button>
      </div>
      <AnimatePresence mode="popLayout">
        {isEnabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-4 p-4 rounded-2xl bg-secondary/40 border border-border/80">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
PricingRuleCard.displayName = 'PricingRuleCard';

const RuleInput = ({ label, value, onChange }: any) => (
  <div>
    <p className="text-[10px] font-medium text-muted-foreground mb-1">{label}</p>
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      aria-label={label}
      className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
    />
  </div>
);

const SaveButton = ({ saving, saved, onSave, error }: any) => (
  <div className="mt-2">
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onSave}
      disabled={saving}
      className="w-full flex items-center justify-center gap-2 bg-[var(--btn-primary-bg)] disabled:opacity-50 text-[var(--accent-on)] font-bold rounded-2xl py-4 shadow-lg cursor-pointer transition-all hover:opacity-90"
    >
      {saving ? 'Зберігаємо…' : saved ? <><CheckCircle2 size={16} /> Збережено!</> : 'Зберегти зміни'}
    </motion.button>
    {error && <p className="text-xs text-center text-red-500 mt-2">{error}</p>}
  </div>
);
