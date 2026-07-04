'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Clock, Moon, Lock, Sparkles } from 'lucide-react';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
import { pluralUk } from '@/lib/utils/pluralUk';

// ── Типи ─────────────────────────────────────────────────────────────────────

export interface TrialState {
  earned: number;  // копійки
  limit: number;   // копійки
  exhausted: boolean;
}

export interface QuietHoursInsight {
  count: number;
  totalUah: number;
}

interface Props {
  trial?: TrialState;
  quietHoursInsight?: QuietHoursInsight | null;
  isDrawer?: boolean;
}

// Семантичні токени (узгоджено з DynamicPricingPage): cool = заповнення, warm = заробіток.
const COOL = 'var(--success)';   // #16803C
const WARM = 'var(--warning)';   // #B45309
const STOP = 'var(--error)';     // #B91C1C — вичерпано/блок

// ── Хелпери ───────────────────────────────────────────────────────────────────

function kopToUah(kop: number): string {
  return (kop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Рампа заповнення ліміту: спокійний → теплий → стоп.
function barColor(pct: number): string {
  if (pct >= 80) return STOP;
  if (pct >= 50) return WARM;
  return COOL;
}

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const;

const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// ── Widget: тихий час ─────────────────────────────────────────────────────────

function QuietHoursWidget({ insight }: { insight: QuietHoursInsight }) {
  const label = pluralUk(insight.count, 'запис', 'записи', 'записів');
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.12 }}
      className="bento-card p-4 flex items-center gap-3"
      style={{ background: tint(COOL, 6), borderColor: tint(COOL, 20) }}
    >
      <div
        className="size-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: tint(COOL, 12) }}
      >
        <Moon size={18} style={{ color: COOL }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground mb-0.5">Тихий час приносить клієнтів</p>
        <p className="text-xs text-text-sub leading-relaxed">
          Завдяки знижкам у тихий час ви отримали{' '}
          <span className="font-bold text-foreground">{insight.count} {label}</span>{' '}
          на суму{' '}
          <span className="font-bold text-foreground">
            {insight.totalUah.toLocaleString('uk-UA')} ₴
          </span>
        </p>
      </div>
    </motion.div>
  );
}

// ── Trial Active view (Starter, ліміт не вичерпано) ───────────────────────────

function TrialActiveView({
  trial,
  quietHoursInsight,
  onUpgrade,
  isDrawer,
}: {
  trial: TrialState;
  quietHoursInsight?: QuietHoursInsight | null;
  onUpgrade: () => void;
  isDrawer?: boolean;
}) {
  const pct   = Math.min(100, Math.round((trial.earned / trial.limit) * 100));
  const color = barColor(pct);
  const earnedUah = kopToUah(trial.earned);
  const limitUah  = kopToUah(trial.limit);

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="bento-card overflow-hidden"
      >
        {/* Верхня зона */}
        <div className="px-5 pt-5 pb-4" style={{ background: tint(COOL, 7) }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: tint(COOL, 13) }}>
                <Sparkles size={16} style={{ color: COOL }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">Пробний режим</p>
                <p className="text-[11px] text-text-sub">Динамічне ціноутворення</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-foreground" style={{ background: tint(COOL, 14) }}>
              Активно
            </span>
          </div>

          {/* Картки earned / limit */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)' }}>
              <p className="text-[10px] text-text-sub mb-0.5 font-medium uppercase tracking-wide">Зароблено</p>
              <p className="text-base font-bold text-foreground">{earnedUah} ₴</p>
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)' }}>
              <p className="text-[10px] text-text-sub mb-0.5 font-medium uppercase tracking-wide">Ліміт</p>
              <p className="text-base font-bold text-text-sub">{limitUah} ₴</p>
            </div>
          </div>

          {/* Прогрес-бар */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-text-sub">Використано ліміту</span>
              <span className="text-[11px] font-bold text-foreground">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: tint(color, 16) }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </div>
        </div>

        {/* Нижня зона */}
        <div className="px-5 pb-4 pt-3.5">
          <p className="text-xs text-text-sub leading-relaxed mb-3">
            Фіча працює <strong className="text-foreground">безкоштовно</strong>.
            Коли ліміт вичерпається — клієнти побачать базові ціни.
          </p>
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-primary"
            style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--border-strong)' }}
          >
            <Zap size={12} />
            {isDrawer ? 'Активувати Pro в білінгу' : 'Перейти на Pro — ліміт зникне'}
          </button>
        </div>
      </motion.div>

      {quietHoursInsight && <QuietHoursWidget insight={quietHoursInsight} />}
    </div>
  );
}

// ── Trial Exhausted view ──────────────────────────────────────────────────────

function TrialExhaustedView({
  trial,
  quietHoursInsight,
  onUpgrade,
  isDrawer,
}: {
  trial: TrialState;
  quietHoursInsight?: QuietHoursInsight | null;
  onUpgrade: () => void;
  isDrawer?: boolean;
}) {
  const limitUah = kopToUah(trial.limit);

  return (
    <div className="p-6 flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative bento-card overflow-hidden"
      >
        {isDrawer && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle at center, ${tint(STOP, 8)} 0%, transparent 70%)`,
            filter: 'blur(10px)',
          }} />
        )}
        <div className="px-5 pt-5 pb-4 text-center flex flex-col items-center gap-3 relative z-10" style={{ background: tint(STOP, 6) }}>
          <div className="size-12 rounded-2xl flex items-center justify-center" style={{ background: tint(STOP, 10) }}>
            <Lock size={22} style={{ color: STOP }} />
          </div>
          <div>
            <h2 className="heading-serif text-lg text-foreground mb-1">Пробний ліміт вичерпано</h2>
            <p className="text-sm text-text-sub text-balance leading-relaxed max-w-xs mx-auto">
              Ви використали всі <strong>{limitUah} ₴</strong> екстра-прибутку.
              Фіча тимчасово вимкнена — клієнти бачать базові ціни.
            </p>
          </div>

          <div className="w-full">
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: tint(STOP, 12) }}>
              <div className="h-full w-full rounded-full" style={{ background: STOP }} />
            </div>
            <p className="text-[11px] text-text-sub mt-1.5 text-center">
              {kopToUah(trial.earned)} ₴ з {limitUah} ₴ — 100%
            </p>
          </div>
        </div>

        <div className="px-5 pb-4 pt-3 relative z-10">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="w-full py-3 rounded-xl text-[var(--accent-on)] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            style={{ background: 'var(--btn-primary-bg)', boxShadow: 'var(--btn-primary-shadow)' }}
          >
            <Zap size={15} />
            {isDrawer ? 'Перейти до кабінету білінгу' : 'Перейти на Pro — безлімітно'}
          </motion.button>
        </div>
      </motion.div>

      {quietHoursInsight && <QuietHoursWidget insight={quietHoursInsight} />}
    </div>
  );
}

// ── Стандартний Pro-гейт ──────────────────────────────────────────────────────

const EXAMPLES = [
  { icon: TrendingUp, tone: WARM, label: 'Пікові години',   description: 'П\'ятниця–субота 16:00–20:00 → +15% до ціни' },
  { icon: Moon,       tone: COOL, label: 'Тихі години',      description: 'Пн–Ср 09:00–13:00 → -10% для заповнення розкладу' },
  { icon: Clock,      tone: COOL, label: 'Раннє бронювання', description: 'Запис за 3+ дні → -10% для постійних клієнтів' },
  { icon: Zap,        tone: COOL, label: 'Останній момент',  description: 'Запис за 4 години → -20%, щоб не втрачати вікна' },
];

function ProGateView({ onUpgrade, isDrawer }: { onUpgrade: () => void; isDrawer?: boolean }) {
  return (
    <div className="p-6 flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative bento-card p-6 text-center flex flex-col items-center gap-3 overflow-hidden"
      >
        {isDrawer && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle at center, var(--accent-light) 0%, transparent 70%)`,
            filter: 'blur(10px)',
          }} />
        )}
        <div className="size-14 rounded-2xl flex items-center justify-center relative z-10 bg-primary/10">
          <TrendingUp size={26} className="text-primary" />
        </div>
        <div className="relative z-10">
          <h1 className="heading-serif text-xl text-foreground mb-1">Ціни, що працюють без тебе</h1>
          <p className="text-sm text-text-sub text-balance leading-relaxed max-w-xs mx-auto">
            Автоматично підвищуйте ціни в пікові години та давайте знижки в тихі,
            щоб завжди мати повний розклад.
          </p>
        </div>
        <span className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10">
          <Zap size={12} />
          Доступно в тарифі Pro
        </span>
      </motion.div>

      <div className="flex flex-col gap-3">
        {EXAMPLES.map(({ icon: Icon, tone, label, description }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: i * 0.07 }}
            className="bento-card p-4 flex items-start gap-3 opacity-80"
          >
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(tone, 13) }}>
              <Icon size={16} style={{ color: tone }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-text-sub mt-0.5">{description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.32 }}
        onClick={onUpgrade}
        className="w-full h-13 rounded-2xl text-[var(--accent-on)] font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer relative z-10"
        style={{ background: 'var(--btn-primary-bg)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        <Zap size={16} />
        {isDrawer ? 'Перейти до білінгу та активувати Pro' : 'Розблокувати динамічне ціноутворення'}
      </motion.button>
    </div>
  );
}

// ── Головний компонент ─────────────────────────────────────────────────────────

export function PricingUpgradeGate({ trial, quietHoursInsight, isDrawer }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const handleUpgrade = () => {
    if (isDrawer) {
      router.push('/dashboard/billing');
    } else {
      setModalOpen(true);
    }
  };

  const content = trial
    ? trial.exhausted
      ? <TrialExhaustedView trial={trial} quietHoursInsight={quietHoursInsight} onUpgrade={handleUpgrade} isDrawer={isDrawer} />
      : <TrialActiveView    trial={trial} quietHoursInsight={quietHoursInsight} onUpgrade={handleUpgrade} isDrawer={isDrawer} />
    : <ProGateView onUpgrade={handleUpgrade} isDrawer={isDrawer} />;

  return (
    <>
      {content}
      <UpgradePromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feature="Динамічне ціноутворення"
        description="Встановлюйте автоматичні знижки та надбавки залежно від дня тижня та часу доби. Заповнюйте тихі слоти та максимізуйте дохід у пікові години."
      />
    </>
  );
}
