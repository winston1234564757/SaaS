'use client';

import { useState } from 'react';
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
}

// ── Хелпери ───────────────────────────────────────────────────────────────────

function kopToUah(kop: number): string {
  return (kop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function barColor(pct: number): string {
  if (pct >= 80) return '#C05B5B';
  if (pct >= 50) return '#D4935A';
  return '#5C9E7A';
}

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const;

// ── Widget: тихий час ─────────────────────────────────────────────────────────

function QuietHoursWidget({ insight }: { insight: QuietHoursInsight }) {
  const label = pluralUk(insight.count, 'запис', 'записи', 'записів');
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.12 }}
      className="bento-card p-4 flex items-center gap-3"
      style={{ background: 'rgba(120,154,153,0.06)', borderColor: 'rgba(120,154,153,0.18)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(120,154,153,0.12)' }}
      >
        <Moon size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground mb-0.5">Тихий час приносить клієнтів</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Завдяки знижкам у тихий час ви отримали{' '}
          <span className="font-bold text-foreground">{insight.count} {label}</span>{' '}
          на суму{' '}
          <span className="font-bold text-primary">
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
}: {
  trial: TrialState;
  quietHoursInsight?: QuietHoursInsight | null;
  onUpgrade: () => void;
}) {
  const pct   = Math.min(100, Math.round((trial.earned / trial.limit) * 100));
  const color = barColor(pct);
  const earnedUah = kopToUah(trial.earned);
  const limitUah  = kopToUah(trial.limit);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Trial card ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="bento-card overflow-hidden"
      >
        {/* Верхня зона з градієнтом */}
        <div
          className="px-5 pt-5 pb-4"
          style={{ background: 'linear-gradient(135deg, rgba(92,158,122,0.10) 0%, rgba(120,154,153,0.06) 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(92,158,122,0.14)' }}
              >
                <Sparkles size={16} style={{ color: '#5C9E7A' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">Пробний режим</p>
                <p className="text-[11px] text-muted-foreground/60">Динамічне ціноутворення</p>
              </div>
            </div>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(92,158,122,0.12)', color: '#5C9E7A' }}
            >
              Активно
            </span>
          </div>

          {/* Картки earned / limit */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div
              className="rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.55)' }}
            >
              <p className="text-[10px] text-muted-foreground/60 mb-0.5 font-medium uppercase tracking-wide">
                Зароблено
              </p>
              <p className="text-base font-bold text-foreground">{earnedUah} ₴</p>
            </div>
            <div
              className="rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.55)' }}
            >
              <p className="text-[10px] text-muted-foreground/60 mb-0.5 font-medium uppercase tracking-wide">
                Ліміт
              </p>
              <p className="text-base font-bold text-muted-foreground">{limitUah} ₴</p>
            </div>
          </div>

          {/* Прогрес-бар */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">Використано ліміту</span>
              <span className="text-[11px] font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, rgba(92,158,122,0.9), ${color})`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Нижня зона */}
        <div className="px-5 pb-4 pt-3.5">
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Фіча працює <strong className="text-foreground">безкоштовно</strong>.
            Коли ліміт вичерпається — клієнти побачать базові ціни.
          </p>
          <button
            onClick={onUpgrade}
            className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 transition-all"
            style={{
              color: '#789A99',
              background: 'rgba(120,154,153,0.08)',
              border: '1px solid rgba(120,154,153,0.2)',
            }}
          >
            <Zap size={12} />
            Перейти на Pro — ліміт зникне
          </button>
        </div>
      </motion.div>

      {/* ── Quiet hours widget (одразу після trial блоку) ─────────────────── */}
      {quietHoursInsight && <QuietHoursWidget insight={quietHoursInsight} />}
    </div>
  );
}

// ── Trial Exhausted view ──────────────────────────────────────────────────────

function TrialExhaustedView({
  trial,
  quietHoursInsight,
  onUpgrade,
}: {
  trial: TrialState;
  quietHoursInsight?: QuietHoursInsight | null;
  onUpgrade: () => void;
}) {
  const limitUah = kopToUah(trial.limit);

  return (
    <div className="p-6 flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="bento-card overflow-hidden"
      >
        <div
          className="px-5 pt-5 pb-4 text-center flex flex-col items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(192,91,91,0.07) 0%, rgba(212,147,90,0.04) 100%)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(192,91,91,0.10)' }}
          >
            <Lock size={22} style={{ color: '#C05B5B' }} />
          </div>
          <div>
            <h2 className="heading-serif text-lg text-foreground mb-1">Пробний ліміт вичерпано</h2>
            <p className="text-sm text-muted-foreground text-balance leading-relaxed max-w-xs mx-auto">
              Ви використали всі <strong>{limitUah} ₴</strong> екстра-прибутку.
              Фіча тимчасово вимкнена — клієнти бачать базові ціни.
            </p>
          </div>

          {/* Прогрес 100% */}
          <div className="w-full">
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(192,91,91,0.12)' }}>
              <div className="h-full w-full rounded-full" style={{ background: '#C05B5B' }} />
            </div>
            <p className="text-[11px] text-muted-foreground/60 mt-1.5 text-center">
              {kopToUah(trial.earned)} ₴ з {limitUah} ₴ — 100%
            </p>
          </div>
        </div>

        <div className="px-5 pb-4 pt-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            style={{ background: '#789A99', boxShadow: '0 4px 14px rgba(120,154,153,0.3)' }}
          >
            <Zap size={15} />
            Перейти на Pro — безлімітно
          </motion.button>
        </div>
      </motion.div>

      {quietHoursInsight && <QuietHoursWidget insight={quietHoursInsight} />}
    </div>
  );
}

// ── Стандартний Pro-гейт ──────────────────────────────────────────────────────

const EXAMPLES = [
  { icon: TrendingUp, label: 'Пікові години',      description: 'П\'ятниця–субота 16:00–20:00 → +15% до ціни' },
  { icon: Moon,       label: 'Тихі години',         description: 'Пн–Ср 09:00–13:00 → -10% для заповнення розкладу' },
  { icon: Clock,      label: 'Раннє бронювання',    description: 'Запис за 3+ дні → -10% для постійних клієнтів' },
  { icon: Zap,        label: 'Останній момент',     description: 'Запис за 4 години → -20%, щоб не втрачати вікна' },
];

function ProGateView({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="p-6 flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="bento-card p-6 text-center flex flex-col items-center gap-3"
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(120,154,153,0.15)' }}>
          <TrendingUp size={26} className="text-primary" />
        </div>
        <div>
          <h1 className="heading-serif text-xl text-foreground mb-1">Динамічне ціноутворення</h1>
          <p className="text-sm text-muted-foreground text-balance leading-relaxed max-w-xs mx-auto">
            Автоматично підвищуйте ціни в пікові години та давайте знижки в тихі —
            щоб завжди мати повний розклад.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10">
          <Zap size={12} />
          Доступно в тарифі Pro
        </span>
      </motion.div>

      <div className="flex flex-col gap-3">
        {EXAMPLES.map(({ icon: Icon, label, description }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: i * 0.07 }}
            className="bento-card p-4 flex items-start gap-3 opacity-70"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(120,154,153,0.1)' }}>
              <Icon size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.32 }}
        onClick={onUpgrade}
        className="w-full h-13 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-[0_4px_16px_rgba(120,154,153,0.35)] flex items-center justify-center gap-2"
      >
        <Zap size={16} />
        Розблокувати динамічне ціноутворення
      </motion.button>
    </div>
  );
}

// ── Головний компонент ─────────────────────────────────────────────────────────

export function PricingUpgradeGate({ trial, quietHoursInsight }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const content = trial
    ? trial.exhausted
      ? <TrialExhaustedView trial={trial} quietHoursInsight={quietHoursInsight} onUpgrade={() => setModalOpen(true)} />
      : <TrialActiveView    trial={trial} quietHoursInsight={quietHoursInsight} onUpgrade={() => setModalOpen(true)} />
    : <ProGateView onUpgrade={() => setModalOpen(true)} />;

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
