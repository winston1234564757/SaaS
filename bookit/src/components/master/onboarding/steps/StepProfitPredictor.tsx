'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Zap, Lock, Crown } from 'lucide-react';

/* ── Animated counter hook ──────────────────────────────────────── */
function useCountUp(target: number, duration = 400): number {
  const [displayed, setDisplayed] = useState(target);
  const rafRef  = useRef<number>(0);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const startTime = performance.now();

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayed(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return displayed;
}

/* ── Props ──────────────────────────────────────────────────────── */
interface StepProfitPredictorProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  basePrice: number;
  emptySlots: number;
  flashDealsEnabled: boolean;
  isPro: boolean;
  saving: boolean;
  onEmptySlotsChange: (v: number) => void;
  onFlashDealsEnabledChange: (v: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}

/* ── Component ──────────────────────────────────────────────────── */
export function StepProfitPredictor({
  direction,
  slideVariants,
  transition,
  basePrice,
  emptySlots,
  flashDealsEnabled,
  isPro,
  saving,
  onEmptySlotsChange,
  onFlashDealsEnabledChange,
  onSave,
  onBack,
}: StepProfitPredictorProps) {
  const monthlyLoss = emptySlots * basePrice * 4;
  const animatedLoss = useCountUp(monthlyLoss);
  const pct = ((emptySlots - 1) / 14) * 100;

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-5 cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft size={13} /> Назад
        </button>

        <h2 className="font-display text-2xl font-semibold text-foreground leading-tight mb-1">
          Порахуємо приховані гроші
        </h2>
        <p className="text-sm text-muted-foreground/60">
          Скільки пустих вікон у тебе буває на тиждень?
        </p>
      </div>

      {/* ── Slider ── */}
      <div className="px-6 pb-4">
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs text-muted-foreground/60">1 вікно</span>
          <div className="text-center">
            <span className="font-display text-4xl font-bold text-foreground">{emptySlots}</span>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">вікон/тиждень</p>
          </div>
          <span className="text-xs text-muted-foreground/60">15 вікон</span>
        </div>

        {/* Custom slider */}
        <div className="relative h-6 flex items-center">
          {/* Track background */}
          <div className="absolute inset-x-0 h-2 rounded-full bg-peach" />
          {/* Filled track */}
          <div
            className="absolute left-0 h-2 rounded-full transition-all duration-100"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(to right, #C05B5B, #E08070)',
            }}
          />
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={emptySlots}
            onChange={e => onEmptySlotsChange(Number(e.target.value))}
            className="absolute inset-x-0 w-full h-2 opacity-0 cursor-pointer z-10"
          />
          {/* Custom thumb */}
          <div
            className="absolute w-5 h-5 rounded-full bg-secondary shadow-md border-2 border-destructive pointer-events-none transition-all duration-100"
            style={{ left: `calc(${pct}% - ${pct * 0.12}px)` }}
          />
        </div>
      </div>

      {/* ── Loss display ── */}
      <div className="mx-6 mb-5 rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-5 text-center">
          <p className="text-xs font-semibold text-destructive/70 uppercase tracking-wider mb-2">
            Ти недоотримуєш щомісяця
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <motion.span
              key={animatedLoss}
              className="font-display font-bold tabular-nums"
              style={{ fontSize: 48, lineHeight: 1, color: '#C05B5B' }}
            >
              {animatedLoss.toLocaleString('uk-UA')}
            </motion.span>
            <span className="text-2xl font-bold text-destructive">₴</span>
          </div>
          <p className="text-sm text-destructive/80 mt-2 font-medium">
            {emptySlots} вікон × {basePrice} ₴ × 4 тижні
          </p>
        </div>

        {/* Progress bar — shows potential to recover */}
        <div className="px-5 pb-4">
          <div className="flex justify-between text-[10px] text-destructive/60 mb-1">
            <span>Поточні втрати</span>
            <span>Можна повернути з Flash Deals ⚡</span>
          </div>
          <div className="h-1.5 rounded-full bg-peach-deep">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #C05B5B, #5C9E7A)' }}
              initial={{ width: '100%' }}
              animate={{ width: flashDealsEnabled ? '20%' : '100%' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <AnimatePresence>
            {flashDealsEnabled && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] text-success font-semibold mt-1.5 text-right"
              >
                ↑ Flash Deals покриють до 80% втрат
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Flash Deals card ── */}
      <div className="mx-6 mb-3 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFFBF0 0%, #FDF6E3 50%, #FBF0D8 100%)',
          border: '1.5px solid #E8C97A',
          boxShadow: '0 4px 20px rgba(168, 126, 0, 0.10)',
        }}
      >
        <div className="px-5 pt-5 pb-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #F0C040, #C99020)' }}
              >
                <Zap size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-sage-dark">Flash Deals</p>
                <p className="text-[10px] text-sage-dark">Автопродаж вільних годин</p>
              </div>
            </div>

            {/* Toggle */}
            <button
              type="button"
              onClick={() => onFlashDealsEnabledChange(!flashDealsEnabled)}
              className="relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 cursor-pointer mt-1"
              style={{ background: flashDealsEnabled ? '#C99020' : '#D4C5C0' }}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-secondary shadow-sm"
                animate={{ left: flashDealsEnabled ? '28px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <p className="text-xs text-sage-dark/80 leading-relaxed">
            Система автоматично розпродасть «гарячі» вікна зі знижкою — ти не сидиш без діла, клієнти не йдуть до конкурентів.
          </p>

          {/* Starter limitation */}
          {!isPro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-warning/50"
            >
              <div className="flex items-start gap-2">
                <Lock size={13} className="text-sage-dark mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-sage-dark font-semibold">
                    Безкоштовний тариф: 2 флеш-акції на місяць
                  </p>
                  <p className="text-[10px] text-sage-dark/80 mt-0.5">
                    Оновіться до Pro для необмеженого автопродажу вікон
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pro badge */}
          {isPro && (
            <div className="mt-3 pt-3 border-t border-warning/50 flex items-center gap-2">
              <Crown size={13} className="text-warning shrink-0" />
              <p className="text-[11px] text-sage-dark font-semibold">
                Pro активний — необмежені Flash Deals включено
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col gap-2 px-6 pb-6 pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 cursor-pointer active:scale-95 bg-primary text-primary-foreground shadow-lg shadow-sage/35"
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
            : <><Check size={16} /> Завершити налаштування</>}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="w-full py-2 text-sm text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer active:scale-95 transition-all"
        >
          Назад
        </button>
      </div>
    </motion.div>
  );
}
