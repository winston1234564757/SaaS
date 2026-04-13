'use client';
// src/components/shared/wizard/ServiceSelector.tsx
import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Check } from 'lucide-react';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';
import { fmt, slide } from './helpers';
import type { WizardService } from './types';

interface ServiceSelectorProps {
  services: WizardService[];
  selectedServices: WizardService[];
  onToggle: (sv: WizardService) => void;
  mode: 'client' | 'master';
  partners: Array<{ id: string; name: string; slug: string; emoji: string; category?: string }>;
  direction: number;
  durationOverride: number | null;
  totalDuration: number;
  effectiveDuration: number;
  totalServicesPrice: number;
  onDurationOverrideChange: (v: number | null) => void;
  onClearTime: () => void;
  onContinue: () => void;
}

export function ServiceSelector({
  services,
  selectedServices,
  onToggle,
  mode,
  partners,
  direction,
  durationOverride,
  totalDuration,
  effectiveDuration,
  totalServicesPrice,
  onDurationOverrideChange,
  onClearTime,
  onContinue,
}: ServiceSelectorProps) {
  const categories = useMemo(() => [...new Set(services.map(s => s.category))], [services]);
  const canGoToDatetime = selectedServices.length > 0;

  return (
    <motion.div key="services" custom={direction} variants={slide}
      initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.2, ease: 'easeInOut' }}>

      {categories.map(cat => (
        <div key={cat} className="mb-5">
          <p className="text-[11px] font-bold text-[#A8928D] uppercase tracking-widest mb-2">{cat}</p>
          <div className="space-y-2">
            {services.filter(s => s.category === cat).map(svc => {
              const sel = selectedServices.some(s => s.id === svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => onToggle(svc)}
                  className={`flex items-start gap-3 px-4 pt-4 pb-4 rounded-2xl border text-left w-full transition-colors ${
                    sel
                      ? 'bg-[#789A99]/10 border-[#789A99]/40'
                      : 'bg-white/60 border-white/80 hover:border-[#789A99]/25 hover:bg-white/80'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,210,194,0.4)' }}
                  >
                    {svc.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2C1A14]">{svc.name}</p>
                    <p className="text-xs text-[#A8928D] flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {formatDurationFull(svc.duration)}
                    </p>

                    {/* ── CSS grid accordion (jump-free, no JS measurement) ── */}
                    {svc.description && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateRows: sel ? '1fr' : '0fr',
                          transition: 'grid-template-rows 0.9s ease',
                        }}
                      >
                        <div style={{ overflow: 'hidden', minHeight: 0 }}>
                          <div className="pt-2 pr-2 pb-0.5">
                            <p
                              className="text-xs text-[#6B5750] leading-relaxed"
                              style={{
                                opacity: sel ? 1 : 0,
                                transition: 'opacity 0.3s ease 0.3s',
                              }}
                            >
                              {svc.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 flex-shrink-0 mt-0.5">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#2C1A14]">{fmt(svc.price)}</p>
                      {svc.popular && (
                        <span className="text-[9px] font-semibold text-[#789A99]">популярне</span>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      sel ? 'bg-[#789A99] border-[#789A99]' : 'border-[#C8B8B2] bg-white/60'
                    }`}>
                      {sel && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Recommended Partners Section (Cartel) */}
      {partners.length > 0 && (
        <div className="mt-8 mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[11px] font-bold text-[#A8928D] uppercase tracking-widest">
              Рекомендуємо також
            </p>
            <span className="text-[10px] font-semibold text-[#789A99] bg-[#789A99]/10 px-2 py-0.5 rounded-full">
              Наші партнери
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
            {partners.map(p => (
              <Link
                key={p.id}
                href={`/${p.slug}`}
                className="flex-shrink-0 w-[140px] bento-card p-3 flex flex-col items-center text-center gap-2 hover:bg-white/90 active:scale-95 transition-all scroll-ml-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F5E8E3] flex items-center justify-center text-2xl mb-1">
                  {p.emoji}
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-xs font-bold text-[#2C1A14] truncate">{p.name}</p>
                  <p className="text-[10px] text-[#A8928D] truncate lowercase italic">{p.category}</p>
                </div>
                <div className="mt-1 text-[10px] font-bold text-[#789A99] border-t border-[#E8D0C8] pt-2 w-full">
                  Дивитись →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mode === 'master' && (
        <div
          style={{
            display: 'grid',
            gridTemplateRows: selectedServices.length > 0 ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.28s ease',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div
              className="mb-5"
              style={{
                opacity: selectedServices.length > 0 ? 1 : 0,
                transition: 'opacity 0.2s ease 0.05s',
              }}
            >
              <label className="text-xs font-medium text-[#6B5750] mb-1.5 flex items-center gap-1.5">
                <Clock size={11} className="text-[#789A99]" />
                Нестандартна тривалість, хв
                <span className="font-normal text-[#A8928D]">(необов'язково)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={5} max={480} step={5}
                  value={durationOverride ?? ''}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    onDurationOverrideChange(isNaN(v) ? null : Math.min(480, Math.max(5, v)));
                    onClearTime();
                  }}
                  placeholder={String(totalDuration)}
                  className="w-24 px-3 py-2 rounded-xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20"
                />
                {durationOverride !== null && (
                  <button onClick={() => { onDurationOverrideChange(null); onClearTime(); }}
                    className="text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors">
                    Скинути
                  </button>
                )}
                <span className="text-xs text-[#A8928D]">
                  {durationOverride !== null ? `стандарт: ${totalDuration}хв` : 'за послугами'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection summary chip — CSS grid accordion, no jump */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: selectedServices.length > 0 ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.28s ease',
        }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div className="pb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#789A99]/8 border border-[#789A99]/20"
              style={{
                opacity: selectedServices.length > 0 ? 1 : 0,
                transition: 'opacity 0.2s ease 0.05s',
              }}
            >
              <div className="flex -space-x-1 flex-shrink-0">
                {selectedServices.slice(0, 3).map(s => <span key={s.id}>{s.emoji}</span>)}
              </div>
              <p className="text-xs text-[#6B5750] flex-1 min-w-0 break-words leading-tight">
                <span className="font-semibold text-[#2C1A14]">
                  {selectedServices.length === 1 ? selectedServices[0].name : pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])}
                </span>
                <span className="ml-1 text-[#A8928D]">· {formatDurationFull(effectiveDuration)} · {fmt(totalServicesPrice)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 pt-3 pb-1 bg-gradient-to-t from-[rgba(255,248,244,1)] to-transparent">
        <button
          disabled={!canGoToDatetime}
          onClick={onContinue}
          className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
            canGoToDatetime
              ? 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
              : 'bg-[#E8D5CF] text-[#A8928D] cursor-not-allowed'
          }`}
        >
          {canGoToDatetime
            ? `Далі · ${pluralize(selectedServices.length, ['послуга', 'послуги', 'послуг'])} · ${fmt(totalServicesPrice)}`
            : 'Обери послугу'}
        </button>
      </div>
    </motion.div>
  );
}
