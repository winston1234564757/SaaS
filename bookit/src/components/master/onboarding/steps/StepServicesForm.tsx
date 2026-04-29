'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2,
  Sparkles, Leaf, Palette, Scissors, Paintbrush,
  Feather, Eye, Droplets, Microscope, PenLine,
  Hand, Zap, Waves, Dumbbell, Gem, type LucideIcon,
} from 'lucide-react';
import { CATEGORY_TEMPLATES, CATEGORY_GROUPS } from '@/lib/constants/onboardingTemplates';
import { inputCls } from './types';

/* ── Icon mapping ─────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  nails:       Sparkles,
  pedicure:    Leaf,
  nail_art:    Palette,
  hair:        Scissors,
  hair_color:  Paintbrush,
  barbershop:  Scissors,
  hair_care:   Feather,
  brows:       Feather,
  lashes:      Eye,
  makeup:      Droplets,
  cosmetology: Microscope,
  pmu:         PenLine,
  massage:     Hand,
  depilation:  Zap,
  spa:         Waves,
  fitness:     Dumbbell,
  tattoo:      PenLine,
  piercing:    Gem,
};

/* Per-group tints */
const GROUP_TINTS: Record<string, { bg: string; iconColor: string }> = {
  nails: { bg: '#FDE8E8', iconColor: '#C0726A' },
  hair:  { bg: '#FBF0DC', iconColor: '#A07840' },
  face:  { bg: '#E4F0EE', iconColor: '#5A8E8A' },
  body:  { bg: '#E4EBF5', iconColor: '#5A7AAE' },
  art:   { bg: '#EAE6E3', iconColor: '#6B5550' },
};

/* Tier config */
const TIER_CONFIG = {
  express:  { label: 'Базовий',  accent: '#C0927A', barColor: '#F5E0D5' },
  standard: { label: 'Стандарт', accent: '#789A99', barColor: '#E0EFEE' },
  premium:  { label: 'Преміум',  accent: '#A07820', barColor: '#FBF3DC' },
} as const;

/* ── Slide variants ───────────────────────────────────────────── */
const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -60 }),
};

/* ── Props ─────────────────────────────────────────────────────── */
interface StepServicesFormProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  serviceCategoryId: string;
  serviceBasePrice: string;
  selectedServiceTypes: Record<string, boolean>;
  saving: boolean;
  onServiceCategoryIdChange: (v: string) => void;
  onServiceBasePriceChange: (v: string) => void;
  onSelectedServiceTypesChange: (v: Record<string, boolean>) => void;
  onSave: () => void;
  onBack: () => void;
}

/* ── Component ─────────────────────────────────────────────────── */
export function StepServicesForm({
  direction,
  slideVariants: outerSlideVariants,
  transition,
  serviceCategoryId,
  serviceBasePrice,
  selectedServiceTypes,
  saving,
  onServiceCategoryIdChange,
  onServiceBasePriceChange,
  onSelectedServiceTypesChange,
  onSave,
  onBack,
}: StepServicesFormProps) {
  const getInitialGroupIdx = () => {
    if (!serviceCategoryId) return 0;
    const idx = CATEGORY_GROUPS.findIndex(g => g.categories.includes(serviceCategoryId));
    return idx >= 0 ? idx : 0;
  };

  const [groupIdx, setGroupIdx] = useState(getInitialGroupIdx);
  const [swipeDir, setSwipeDir] = useState<1 | -1>(1);

  const activeGroup = CATEGORY_GROUPS[groupIdx];
  const tints       = GROUP_TINTS[activeGroup.id] ?? GROUP_TINTS.face;
  const groupCats   = activeGroup.categories.map(id => CATEGORY_TEMPLATES[id]).filter(Boolean);
  const template    = serviceCategoryId ? CATEGORY_TEMPLATES[serviceCategoryId] : null;
  const basePriceNum = parseFloat(serviceBasePrice) || 0;

  const canPrev = groupIdx > 0;
  const canNext = groupIdx < CATEGORY_GROUPS.length - 1;

  function goPrev() {
    if (!canPrev) return;
    setSwipeDir(-1);
    setGroupIdx(i => i - 1);
  }
  function goNext() {
    if (!canNext) return;
    setSwipeDir(1);
    setGroupIdx(i => i + 1);
  }

  const toggleType = (type: string) =>
    onSelectedServiceTypesChange({ ...(selectedServiceTypes || {}), [type]: !selectedServiceTypes?.[type] });

  const isSaveDisabled =
    saving || !serviceCategoryId || !serviceBasePrice ||
    (!selectedServiceTypes?.express && !selectedServiceTypes?.standard && !selectedServiceTypes?.premium);

  return (
    <motion.div
      custom={direction}
      variants={outerSlideVariants}
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
          Сфера діяльності
        </h2>
        <p className="text-sm text-muted-foreground/60">
          Оберіть напрямок — ми згенеруємо базовий прайс
        </p>
      </div>

      {/* ── Category carousel nav ── */}
      <div className="flex items-center gap-3 px-6 pb-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-25 active:scale-95 transition-all"
          style={canPrev
            ? { background: tints.bg, color: tints.iconColor }
            : { background: 'rgba(255,255,255,0.5)', color: '#C5B0AB' }
          }
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        {/* Group label — animated */}
        <div className="flex-1 overflow-hidden text-center">
          <AnimatePresence mode="wait" custom={swipeDir}>
            <motion.p
              key={activeGroup.id}
              custom={swipeDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="font-display text-2xl font-semibold"
              style={{ color: tints.iconColor }}
            >
              {activeGroup.label}
            </motion.p>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-25 active:scale-95 transition-all"
          style={canNext
            ? { background: tints.bg, color: tints.iconColor }
            : { background: 'rgba(255,255,255,0.5)', color: '#C5B0AB' }
          }
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pb-4">
        {CATEGORY_GROUPS.map((g, i) => (
          <button
            key={g.id}
            type="button"
            onClick={() => { setSwipeDir(i > groupIdx ? 1 : -1); setGroupIdx(i); }}
            className="rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width:  i === groupIdx ? 20 : 6,
              height: 6,
              background: i === groupIdx ? tints.iconColor : '#D4C5C0',
            }}
          />
        ))}
      </div>

      {/* ── Swipeable card grid ── */}
      <div className="px-6 pb-6 pt-1">
        <AnimatePresence mode="wait" custom={swipeDir}>
          <motion.div
            key={activeGroup.id}
            custom={swipeDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40 && info.velocity.x < -100) goNext();
              else if (info.offset.x > 40 && info.velocity.x > 100) goPrev();
            }}
            className="grid grid-cols-2 gap-3 cursor-grab active:cursor-grabbing select-none"
          >
            {groupCats.map(cat => {
              const isSelected = serviceCategoryId === cat.id;
              const Icon = CATEGORY_ICONS[cat.id] ?? Sparkles;
              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => onServiceCategoryIdChange(cat.id)}
                  whileTap={{ scale: 0.96 }}
                  className="relative flex flex-col items-center justify-center gap-2 py-3.5 rounded-3xl transition-colors duration-200 cursor-pointer text-center"
                  style={isSelected
                    ? {
                        background: tints.bg,
                        outline: `2px solid ${tints.iconColor}`,
                        outlineOffset: '2px',
                        boxShadow: `0 4px 20px ${tints.iconColor}28`,
                      }
                    : { background: 'rgba(255,255,255,0.65)' }
                  }
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: isSelected ? tints.iconColor : tints.bg }}
                  >
                    <Icon size={18} strokeWidth={1.8} color={isSelected ? '#fff' : tints.iconColor} />
                  </div>

                  <span
                    className="text-xs font-semibold leading-tight px-1"
                    style={{ color: isSelected ? '#2C1A14' : '#6B5750' }}
                  >
                    {cat.label}
                  </span>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: tints.iconColor }}
                    >
                      <Check size={11} strokeWidth={3} className="text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Price + Tier section ── */}
      <AnimatePresence>
        {template && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-6 mb-5">
              <div className="flex-1 h-px bg-secondary/80" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
                Ціноутворення
              </span>
              <div className="flex-1 h-px bg-secondary/80" />
            </div>

            <div className="px-6 pb-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Ціна за{' '}
                  <span className="text-foreground">{template.baseName.toLowerCase()}</span>
                  {' '}(грн)
                </label>
                <input
                  type="number"
                  value={serviceBasePrice}
                  onChange={e => onServiceBasePriceChange(e.target.value)}
                  placeholder="500"
                  min="0"
                  className={inputCls}
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Стандартна процедура — Базовий і Преміум розраховуються автоматично
                </p>
              </div>

              <AnimatePresence>
                {basePriceNum > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col gap-2.5"
                  >
                    <p className="text-xs font-semibold text-muted-foreground">
                      Ваш прайс-лист — вимкніть зайве:
                    </p>

                    {(['express', 'standard', 'premium'] as const).map(type => {
                      const def     = template[type];
                      const cfg     = TIER_CONFIG[type];
                      const price   = Math.round(basePriceNum * def.priceMult);
                      const isSel   = !!selectedServiceTypes?.[type];
                      const h       = def.time;
                      const timeStr = h < 60
                        ? `${h} хв`
                        : h % 60 === 0 ? `${h / 60} год` : `${Math.floor(h / 60)} год ${h % 60} хв`;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleType(type)}
                          className="flex items-center gap-0 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer text-left"
                          style={{
                            background: isSel ? '#fff' : 'rgba(255,255,255,0.45)',
                            boxShadow: isSel ? '0 2px 12px rgba(44,26,20,0.07)' : 'none',
                            opacity: isSel ? 1 : 0.55,
                          }}
                        >
                          <div
                            className="w-1 self-stretch shrink-0"
                            style={{ background: isSel ? cfg.accent : 'transparent' }}
                          />
                          <div className="flex items-center gap-3 flex-1 px-4 py-3.5">
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                              style={isSel
                                ? { borderColor: cfg.accent, background: cfg.accent }
                                : { borderColor: '#D4C5C0', background: 'transparent' }
                              }
                            >
                              {isSel && <Check size={10} strokeWidth={3.5} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-snug">{def.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground/60">{timeStr}</span>
                                <span
                                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                  style={{ color: cfg.accent, background: cfg.barColor }}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                            </div>
                            <span
                              className="text-base font-bold shrink-0 tabular-nums"
                              style={{ color: cfg.accent }}
                            >
                              {price} ₴
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Actions ── */}
      <div className="flex flex-col gap-2 px-6 pb-6">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaveDisabled}
          className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #789A99 0%, #5C7E7D 100%)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(120,154,153,0.35)',
          }}
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
            : <><Check size={16} /> Далі</>}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="w-full py-2 text-sm text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer active:scale-95 transition-all"
        >
          Скасувати
        </button>
      </div>
    </motion.div>
  );
}
