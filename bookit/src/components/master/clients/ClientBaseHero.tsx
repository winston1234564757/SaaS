'use client';

import { motion } from 'framer-motion';
import { Send, ArrowRight } from 'lucide-react';
import { EditorialCover } from '@/components/ui/EditorialCover';
import { pluralUk } from '@/lib/utils/pluralUk';

/**
 * ClientBaseHero — темний editorial-герой сторінки «Клієнти» (С-CLI-01).
 * Домінанта поверхні: база як живий організм — загальна к-сть + пульс утримання
 * (клікабельні сегменти) + цінність. Поглинає легасі-віджет «Утримання бази».
 * Чисті props → рендериться і в `ClientsPage`, і в прев'ю власними очима без auth.
 *
 * On-dark рамп: white головне, white/70 другорядне, white/55 найтихіше (≥4.5:1 на slate).
 * Retention-тони — світлі *-300 тінти (НЕ світлотонові RETENTION_CONFIG-хекси, що
 * калібровані під світлий фон і провалюють контраст на #0F172A).
 */

export type RetentionSegId = 'active' | 'sleeping' | 'at_risk' | 'lost';

export interface BaseHeroData {
  total: number;
  counts: Record<RetentionSegId, number>;
  /** Сума total_spent усієї бази (у гривнях — total_spent уже не в копійках). */
  totalRevenue: number;
  activeSegment: string;
  onSegmentSelect: (id: RetentionSegId) => void;
  onBroadcast: () => void;
}

// On-dark тінти під кожен retention-статус (світлі, ≥4.5:1 на slate #0F172A).
const SEG: { id: RetentionSegId; label: string; tint: string }[] = [
  { id: 'active',   label: 'Активні',     tint: '#6EE7B7' }, // emerald-300
  { id: 'sleeping', label: 'Дрімають',    tint: '#5EEAD4' }, // teal-300
  { id: 'at_risk',  label: 'Під ризиком', tint: '#FCD34D' }, // amber-300
  { id: 'lost',     label: 'Втрачені',    tint: '#FDA4AF' }, // rose-300
];

function compactUah(uah: number): string {
  const v = Math.round(uah);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} млн ₴`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')} тис ₴`;
  return `${v} ₴`;
}

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const RISE = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 30 } },
};

export function ClientBaseHero({
  total, counts, totalRevenue, activeSegment, onSegmentSelect, onBroadcast,
}: BaseHeroData) {
  const needAttention = counts.at_risk + counts.lost;
  const healthy = total > 0 && counts.active / total >= 0.5;
  const glow = total === 0 ? undefined : healthy ? '#34D399' : needAttention > counts.active ? '#FB7185' : '#34D399';

  return (
    <EditorialCover glowColor={glow} className="px-6 py-7 lg:px-9 lg:py-9">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="flex flex-col gap-7">

        {/* Ідентичність + головна дія */}
        <motion.div variants={RISE} className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              Клієнтська база
            </p>
            <h1
              className="text-white leading-[0.9] mt-1"
              style={{ fontFamily: 'var(--font-great-vibes, cursive)', fontSize: 'clamp(44px, 8vw, 72px)', fontWeight: 400 }}
            >
              Клієнти
            </h1>
          </div>

          {total > 0 && (
            <motion.button
              type="button"
              onClick={onBroadcast}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white text-[#0F172A] text-sm font-bold shadow-lg shadow-black/20 hover:opacity-90 active:opacity-80 transition-opacity"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Розсилка</span>
            </motion.button>
          )}
        </motion.div>

        {/* Домінанта: скільки + цінність */}
        <motion.div variants={RISE}>
          {total === 0 ? (
            <p className="text-white/70 text-lg font-medium">
              Ще немає клієнтів — вони зʼявляться тут після першого запису.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="metric-value text-white text-[52px] lg:text-[64px] leading-none">{total}</span>
                <span className="text-white/70 text-base font-medium">
                  {pluralUk(total, 'клієнт', 'клієнти', 'клієнтів')} у базі
                </span>
              </div>
              {totalRevenue > 0 && (
                <p className="text-white/55 text-sm">
                  База принесла <span className="metric-value text-white/80">{compactUah(totalRevenue)}</span> за весь час
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Пульс утримання — смуга + клікабельні сегменти */}
        {total > 0 && (
          <motion.div variants={RISE} className="flex flex-col gap-4">
            {/* Смуга */}
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/10" aria-hidden>
              {SEG.map(s => {
                const w = (counts[s.id] / total) * 100;
                return w > 0 ? (
                  <div key={s.id} style={{ width: `${w}%`, background: s.tint }} className="first:rounded-l-full last:rounded-r-full" />
                ) : null;
              })}
            </div>

            {/* Сегменти */}
            <div className="grid grid-cols-4 gap-2">
              {SEG.map(s => {
                const isActive = activeSegment === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSegmentSelect(s.id)}
                    aria-pressed={isActive}
                    className="group flex flex-col gap-1 items-start text-left rounded-xl px-3 py-2.5 transition-all active:scale-[0.94] min-h-[44px]"
                    style={{
                      background: isActive ? `${s.tint}1f` : 'rgba(255,255,255,0.05)',
                      outline: isActive ? `1.5px solid ${s.tint}66` : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: s.tint }} />
                      <span className="metric-value text-white text-base leading-none">{counts[s.id]}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/55 leading-none">{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Actionable — зірка-сигнал */}
            {needAttention > 0 && (
              <button
                type="button"
                onClick={() => onSegmentSelect(counts.at_risk > 0 ? 'at_risk' : 'lost')}
                className="self-start inline-flex items-center gap-2 text-[13px] font-bold text-[#FCD34D] hover:text-[#FDE68A] transition-colors active:scale-[0.96]"
              >
                {needAttention} {pluralUk(needAttention, 'клієнт потребує', 'клієнти потребують', 'клієнтів потребують')} уваги
                <ArrowRight size={14} />
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </EditorialCover>
  );
}
