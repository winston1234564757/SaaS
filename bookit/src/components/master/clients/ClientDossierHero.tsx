'use client';

import { Phone, Crown, Heart, AlertTriangle, Repeat } from 'lucide-react';
import { EditorialCover } from '@/components/ui/EditorialCover';

export interface DossierHeroData {
  name: string;
  phone: string;
  retentionLabel: string;
  /** Світлий тон retention-тексту під темний фон. */
  retentionText: string;
  /** Base-hex retention для glow/тінтів. */
  retentionGlow: string;
  isVip: boolean;
  isAmbassador: boolean;
  hasAlert: boolean;
  /** Уже відформатована сума (formatPrice). */
  totalSpentLabel: string;
  showRank: boolean;
  rank: number;
  totalClients: number;
  /** 0–100. */
  spentPct: number;
  cadenceText: string | null;
  byNumbers: { label: string; value: string }[];
}

/**
 * Презентаційна темна обкладинка-герой картки клієнта (C-CLI-01). Чисті props → рендериться
 * і в `ClientDetailSheet`, і в прев'ю власними очима без auth/MasterContext.
 */
export function ClientDossierHero(d: DossierHeroData) {
  return (
    <EditorialCover glowColor={d.retentionGlow}>
      {/* Ідентичність */}
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-2xl flex items-center justify-center heading-serif text-3xl text-white bg-white/10 ring-1 ring-white/15 shrink-0">
          {d.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="heading-serif text-[26px] leading-[1.08] text-white text-balance min-w-0">
              {d.name || 'Клієнт'}
            </h2>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: d.retentionText, background: `${d.retentionGlow}26` }}
              >
                {d.retentionLabel}
              </span>
              {d.isVip && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-amber-300/15 px-2 py-0.5 rounded-full">
                  <Crown size={11} className="fill-current" />
                  VIP
                </span>
              )}
            </div>
          </div>
          <a
            href={`tel:${d.phone}`}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <Phone size={13} />
            {d.phone}
          </a>
        </div>
      </div>

      {/* Сигнали: алергія + амбасадор */}
      {(d.hasAlert || d.isAmbassador) && (
        <div className="flex flex-wrap gap-2 mt-3.5">
          {d.hasAlert && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-200 bg-rose-400/15 px-2.5 py-1 rounded-lg ring-1 ring-rose-300/20">
              <AlertTriangle size={12} />
              Застереження про здоров&apos;я
            </span>
          )}
          {d.isAmbassador && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-200 bg-emerald-400/12 px-2.5 py-1 rounded-lg ring-1 ring-emerald-300/20">
              <Heart size={12} className="fill-current" />
              Запросив вас у Bookit
            </span>
          )}
        </div>
      )}

      {/* Домінанта цінності */}
      <div className="mt-5 pt-4 border-t border-white/10">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="metric-value text-[34px] leading-none text-white">{d.totalSpentLabel}</p>
            <p className="text-[11px] text-white/55 mt-1.5">Витрачено за весь час співпраці</p>
          </div>
          {d.showRank && (
            <span className="text-xs font-bold text-white bg-white/12 px-2.5 py-1 rounded-full shrink-0">
              {d.rank} з {d.totalClients}
            </span>
          )}
        </div>
        {d.showRank && (
          <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-white/70" style={{ width: `${d.spentPct}%` }} />
          </div>
        )}
        {d.cadenceText && (
          <div className="flex items-center gap-1.5 mt-3">
            <Repeat size={13} className="text-white/50" />
            <p className="text-xs font-medium text-white/80">{d.cadenceText}</p>
          </div>
        )}
      </div>

      {/* Тихий by-numbers */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
        {d.byNumbers.map(n => (
          <div key={n.label} className="min-w-0">
            <p className="text-sm font-bold text-white/90 truncate">{n.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55 mt-0.5">{n.label}</p>
          </div>
        ))}
      </div>
    </EditorialCover>
  );
}
