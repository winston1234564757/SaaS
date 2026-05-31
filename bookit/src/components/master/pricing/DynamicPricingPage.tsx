'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';
import { savePricingRules } from '@/app/(master)/dashboard/pricing/actions';
import { useMasterContext } from '@/lib/supabase/context';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import {
  TrendingUp, TrendingDown, Clock, Bird, Zap,
  CheckCircle2, Layers, ArrowUpDown,
} from 'lucide-react';
import { PricingUpgradeGate } from '@/components/master/pricing/PricingUpgradeGate';

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

const INFO_CHIPS = [
  { icon: Layers,      label: 'Стекінг',    hint: 'Правила накладаються одне на одне' },
  { icon: TrendingDown, label: 'Мax -30%',  hint: 'Нижня межа знижки від ціни' },
  { icon: TrendingUp,   label: 'Мax +50%',  hint: 'Верхня межа надбавки від ціни' },
];

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
        onClick={() => onChange(value.includes(d.key) ? value.filter(x => x !== d.key) : [...value, d.key])}
        className={cn(
          'min-w-[36px] min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer active:scale-[0.88] transform-gpu',
          value.includes(d.key)
            ? 'text-white shadow-sm'
            : 'bg-secondary/40 text-muted-foreground border-border hover:border-current/40 hover:bg-secondary/60'
        )}
        style={value.includes(d.key) ? { background: activeColor, borderColor: activeColor } : {}}
      >
        {d.label}
      </button>
    ))}
  </div>
));

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
  const [enabled, setEnabled] = useState({
    peak:        !!initial?.peak,
    quiet:       !!initial?.quiet,
    early_bird:  !!initial?.early_bird,
    last_minute: !!initial?.last_minute,
  });

  if (masterLoading) {
    return (
      <div className="flex flex-col gap-5 p-6 animate-pulse">
        <div className="h-40 bg-secondary/40 border border-border/40 rounded-3xl" />
        <div className="h-64 bg-secondary/40 border border-border/40 rounded-3xl" />
      </div>
    );
  }

  // Handle Paywall/Gate logic
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
        <PricingHeader 
          currentStep={currentStep} 
          closeTour={closeTour} 
          nextStep={nextStep} 
          enabledCount={enabledCount} 
        />
      )}

      <div className={cn('relative flex flex-col gap-3', currentStep === 1 && 'tour-glow z-40 scale-[1.02] transition-all duration-500')}>
        <AnchoredTooltip
          isOpen={currentStep === 1}
          onClose={closeTour}
          title="Динамічні знижки"
          text="Встановіть знижку на 'незручні' години, щоб стимулювати клієнтів бронювати порожній час."
          position="bottom"
          primaryButtonText="Зрозуміло"
          onPrimaryClick={nextStep}
        />

        <PricingRuleCard 
          id="peak" 
          icon={TrendingUp} 
          color="#D4935A" 
          title="Пік-години" 
          hint="Підвищуй ціну в популярний час"
          isEnabled={enabled.peak}
          onToggle={() => setEnabled(e => ({ ...e, peak: !e.peak }))}
          impact={enabled.peak && rules.peak ? `+${rules.peak.markup_pct}%` : null}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2">Дні тижня</p>
              <DaysToggle activeColor="#D4935A" value={rules.peak?.days ?? ['fri', 'sat']} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { hours: [16,20], markup_pct: 15 }), days: v })} />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <RuleInput label="З (год)" value={rules.peak?.hours[0] ?? 16} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], markup_pct: 15 }), hours: [v, rules.peak?.hours[1] ?? 20] })} />
              <RuleInput label="До (год)" value={rules.peak?.hours[1] ?? 20} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], markup_pct: 15 }), hours: [rules.peak?.hours[0] ?? 16, v] })} />
              <RuleInput label="Надбавка %" value={rules.peak?.markup_pct ?? 15} onChange={(v: any) => patch('peak', { ...(rules.peak ?? { days: ['fri','sat'], hours: [16,20] }), markup_pct: v })} />
            </div>
          </div>
        </PricingRuleCard>

        <PricingRuleCard 
          id="quiet" 
          icon={TrendingDown} 
          color="#789A99" 
          title="Тихий час" 
          hint="Приваблюй клієнтів у непопулярний час"
          isEnabled={enabled.quiet}
          onToggle={() => setEnabled(e => ({ ...e, quiet: !e.quiet }))}
          impact={enabled.quiet && rules.quiet ? `-${rules.quiet.discount_pct}%` : null}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2">Дні тижня</p>
              <DaysToggle activeColor="#789A99" value={rules.quiet?.days ?? ['mon', 'tue', 'wed']} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { hours: [9,13], discount_pct: 10 }), days: v })} />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <RuleInput label="З (год)" value={rules.quiet?.hours[0] ?? 9} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], discount_pct: 10 }), hours: [v, rules.quiet?.hours[1] ?? 13] })} />
              <RuleInput label="До (год)" value={rules.quiet?.hours[1] ?? 13} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], discount_pct: 10 }), hours: [rules.quiet?.hours[0] ?? 9, v] })} />
              <RuleInput label="Знижка %" value={rules.quiet?.discount_pct ?? 10} onChange={(v: any) => patch('quiet', { ...(rules.quiet ?? { days: ['mon','tue','wed'], hours: [9,13] }), discount_pct: v })} />
            </div>
          </div>
        </PricingRuleCard>

        <PricingRuleCard 
          id="early_bird" 
          icon={Bird} 
          color="#5C9E7A" 
          title="Рання бронь" 
          hint="Стимулюй планувати наперед"
          isEnabled={enabled.early_bird}
          onToggle={() => setEnabled(e => ({ ...e, early_bird: !e.early_bird }))}
          impact={enabled.early_bird && rules.early_bird ? `-${rules.early_bird.discount_pct}%` : null}
        >
          <div className="grid grid-cols-2 gap-3">
            <RuleInput label="Днів наперед" value={rules.early_bird?.days_ahead ?? 14} onChange={(v: any) => patch('early_bird', { ...(rules.early_bird ?? { discount_pct: 7 }), days_ahead: v })} />
            <RuleInput label="Знижка %" value={rules.early_bird?.discount_pct ?? 7} onChange={(v: any) => patch('early_bird', { ...(rules.early_bird ?? { days_ahead: 14 }), discount_pct: v })} />
          </div>
        </PricingRuleCard>

        <PricingRuleCard 
          id="last_minute" 
          icon={Zap} 
          color="#C05B5B" 
          title="Остання хвилина" 
          hint="Заповнюй слоти в останній момент"
          isEnabled={enabled.last_minute}
          onToggle={() => setEnabled(e => ({ ...e, last_minute: !e.last_minute }))}
          impact={enabled.last_minute && rules.last_minute ? `-${rules.last_minute.discount_pct}%` : null}
        >
          <div className="grid grid-cols-2 gap-3">
            <RuleInput label="Годин до слоту" value={rules.last_minute?.hours_ahead ?? 4} onChange={(v: any) => patch('last_minute', { ...(rules.last_minute ?? { discount_pct: 20 }), hours_ahead: v })} />
            <RuleInput label="Знижка %" value={rules.last_minute?.discount_pct ?? 20} onChange={(v: any) => patch('last_minute', { ...(rules.last_minute ?? { hours_ahead: 4 }), discount_pct: v })} />
          </div>
        </PricingRuleCard>
      </div>

      <SaveButton saving={saving} saved={saved} onSave={handleSave} error={saveError} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const PricingHeader = React.memo(({ currentStep, closeTour, nextStep, enabledCount }: any) => (
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-2xl bg-primary/14 flex items-center justify-center shrink-0">
          <ArrowUpDown size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="heading-serif text-xl text-foreground leading-tight">Ціноутворення</h1>
          <p className="text-sm text-muted-foreground/60">Автоматичне коригування цін</p>
        </div>
      </div>
      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', enabledCount > 0 ? 'bg-primary/12 text-primary' : 'bg-secondary text-muted-foreground/60')}>
        {enabledCount > 0 ? `${enabledCount} активних` : 'Вимкнено'}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 mt-4">
      {INFO_CHIPS.map(({ icon: Icon, label, hint }) => (
        <div key={label} title={hint} className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl bg-secondary/40 border border-border text-center">
          <Icon size={14} className="text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  </motion.div>
));

const PricingRuleCard = React.memo(({ icon: Icon, color, title, hint, isEnabled, onToggle, impact, children }: any) => (
  <div className={cn('bento-card overflow-hidden border-l-4 transition-all', isEnabled ? 'border-l-current' : 'border-l-transparent')} style={{ borderLeftColor: isEnabled ? color : 'transparent' }}>
    <button type="button" aria-pressed={isEnabled} className="w-full flex items-center gap-3 px-4 py-4 select-none active:scale-[0.98] transition-transform duration-100 ease-out" onClick={onToggle}>
      <div className="size-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon size={19} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {impact && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{impact}</span>}
        </div>
        <p className="text-xs text-muted-foreground/60 truncate">{hint}</p>
      </div>
      <div className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ background: isEnabled ? color : 'var(--border)' }}>
        <motion.div animate={{ x: isEnabled ? 21 : 2 }} className="absolute top-1 size-4 rounded-full bg-white shadow-sm" />
      </div>
    </button>
    <AnimatePresence mode="popLayout">
      {isEnabled && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="mx-4 mb-4 p-4 rounded-2xl bg-secondary/40 border border-border/80">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

const RuleInput = ({ label, value, onChange }: any) => (
  <div>
    <p className="text-[10px] font-medium text-muted-foreground mb-1">{label}</p>
    <input 
      type="number" 
      value={value} 
      onChange={e => onChange(Number(e.target.value))}
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
      {saving ? 'Зберігаємо…' : saved ? <><CheckCircle2 size={16}/> Збережено!</> : 'Зберегти зміни'}
    </motion.button>
    {error && <p className="text-xs text-center text-red-500 mt-2">{error}</p>}
  </div>
);
