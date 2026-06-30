'use client';

import React from 'react';
import { Activity, Clock, UserX, CalendarOff, ArrowRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useLeadTimeDistribution, type LeadTimeDistribution } from '@/lib/supabase/hooks/useLeadTimeDistribution';
import { useNoShowMetrics, type NoShowMetrics, type NoShowBookingRow } from '@/lib/supabase/hooks/useNoShowMetrics';
import { useVacationImpact, type VacationImpact } from '@/lib/supabase/hooks/useVacationImpact';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { BentoCell } from '../../primitives/BentoCell';
import { HeatmapGrid, type HeatmapPoint } from '../../charts/HeatmapGrid';
import { SectionHeading } from '../OverviewTab';
import type { OverviewDetail } from '../OverviewDetailSheet';

interface BehaviorTabProps {
  start: string;
  end: string;
  isPro: boolean;
  occupancyHeatmap?: HeatmapPoint[];
  onOpenDetail: (d: OverviewDetail) => void;
}

const DOW_FULL = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота', 'Неділя'];
const grn = (kopecks: number) => Math.round(kopecks / 100);

export function BehaviorTab({ start, end, isPro, occupancyHeatmap, onOpenDetail }: BehaviorTabProps) {
  const leadQ = useLeadTimeDistribution({ start, end });
  const noShowQ = useNoShowMetrics({ start, end });
  const vacationQ = useVacationImpact({ start, end });

  if (!isPro) {
    return (
      <div className="p-8 rounded-[var(--card-radius)] bg-secondary/20 border border-border/10 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Activity className="size-12 text-primary mb-4" />
        <h3 className="heading-serif text-2xl text-foreground mb-2">Ритм бізнесу — у Pro</h3>
        <p className="text-sm text-text-sub max-w-sm">
          Підключіть Pro, щоб бачити теплову карту завантаження, час планування візитів, неявки та вартість вихідних.
        </p>
      </div>
    );
  }

  const isLoading = leadQ.isLoading || noShowQ.isLoading || vacationQ.isLoading;
  if (isLoading) {
    return <SkeletonCell variant="flat" className="h-[400px]" />;
  }

  const noShow = noShowQ.data ?? null;
  const lead = leadQ.data ?? null;
  const vacation = vacationQ.data ?? null;
  const heatmap = occupancyHeatmap ?? [];

  const hasAnyData = (noShow?.totalBookings ?? 0) > 0 || heatmap.length > 0;
  if (!hasAnyData) {
    return (
      <EmptyCell
        title="Записів ще немає"
        description="Тут зʼявиться ритм вашого бізнесу: коли ви на піку, за скільки клієнти планують візит і скільки коштують вихідні."
        icon={<Activity size={20} />}
      />
    );
  }

  return <BehaviorTabView heatmap={heatmap} lead={lead} noShow={noShow} vacation={vacation} onOpenDetail={onOpenDetail} />;
}

// ── Detail payloads ─────────────────────────────────────────────────────────

function incidentDetail(r: NoShowBookingRow): OverviewDetail {
  const isNoShow = r.status === 'no_show';
  return {
    title: r.client_name,
    eyebrow: isNoShow ? 'Неявка' : 'Скасування',
    rows: [
      { label: 'Що сталося', value: isNoShow ? 'Не зʼявився на запис' : 'Скасував запис', tone: isNoShow ? 'warning' : 'primary' },
      { label: 'Дата', value: `${r.date} · ${r.start_time.slice(0, 5)}` },
      { label: 'Телефон', value: r.client_phone },
      ...(r.cancellation_reason ? [{ label: 'Причина', value: r.cancellation_reason }] : []),
    ],
    note: 'Якщо клієнт пропускає записи регулярно, це видно в його профілі. Врахуйте це під час наступного запису.',
    cta: { label: 'Профіль клієнта', href: `/dashboard/clients?clientPhone=${encodeURIComponent(r.client_phone)}` },
  };
}

// ── View ────────────────────────────────────────────────────────────────────

/** Чиста презентація (без fetch) — для прев'ю/тестів і верифікації власними очима */
export function BehaviorTabView({
  heatmap,
  lead,
  noShow,
  vacation,
  onOpenDetail,
}: {
  heatmap: HeatmapPoint[];
  lead: LeadTimeDistribution | null;
  noShow: NoShowMetrics | null;
  vacation: VacationImpact | null;
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  // ── Пік завантаження ──
  const peak = heatmap.reduce<HeatmapPoint | null>((best, c) => (c.occupancy_pct > (best?.occupancy_pct ?? -1) ? c : best), null);
  const activeCells = heatmap.filter((c) => c.occupancy_pct > 0);
  const avgOcc = activeCells.length > 0 ? Math.round(activeCells.reduce((s, c) => s + c.occupancy_pct, 0) / activeCells.length) : 0;

  const peakDetail: OverviewDetail | null = peak
    ? {
        title: 'Пік завантаження',
        eyebrow: 'Ритм',
        hero: { label: `${DOW_FULL[peak.dow - 1]}, ${peak.hour}:00`, value: `${peak.occupancy_pct}%` },
        rows: [
          { label: 'Середня завантаженість', value: `${avgOcc}%`, tone: 'primary' },
          { label: 'Активних слотів', value: String(activeCells.length) },
        ],
        note: 'Завантаженість — частка зайнятих слотів у цей час за період. Пікові години найкраще підходять для розумної націнки.',
      }
    : null;

  // ── Lead time bars ──
  const leadBuckets = lead
    ? (() => {
        const items = [
          { label: 'У той самий день', value: lead.same_day },
          { label: '1–3 дні', value: lead.one_three_days },
          { label: '3–7 днів', value: lead.three_seven_days },
          { label: '1–2 тижні', value: lead.seven_fourteen_days },
          { label: 'Понад 2 тижні', value: lead.above_fourteen_days },
        ];
        const maxVal = Math.max(...items.map((x) => x.value), 1);
        return items.map((it) => ({
          ...it,
          pct: lead.totalBookings > 0 ? Math.round((it.value / lead.totalBookings) * 100) : 0,
          fillPct: Math.max(2, Math.round((it.value / maxVal) * 100)),
        }));
      })()
    : [];

  const leadDetail: OverviewDetail | null = lead
    ? {
        title: 'Час планування візиту',
        eyebrow: 'Поведінка',
        hero: { label: 'Середній час до запису', value: `${lead.averageDays} ${pluralUk(Math.round(lead.averageDays), 'день', 'дні', 'днів')}` },
        note: 'Скільки часу минає від моменту, коли клієнт створює запис, до самого візиту. Короткий час — клієнти планують спонтанно.',
      }
    : null;

  const incidents = noShow?.history ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      {/* ── Ряд 1: теплова карта (герой) + неявки — два високі блоки рівної висоти ── */}
      {heatmap.length > 0 && (
        <div className="lg:col-span-7 min-w-0">
          <BentoCell className="h-full p-5">
            <SectionHeading title="Теплова карта завантаження" subtitle="Рівень зайнятості по годинах та днях тижня" />
            <HeatmapGrid data={heatmap} />
          </BentoCell>
        </div>
      )}

      {noShow && noShow.totalBookings > 0 && (
        <div className="lg:col-span-5 min-w-0">
          <BentoCell className="h-full p-5">
            <SectionHeading title="Неявки та скасування" subtitle={`Від загальних ${noShow.totalBookings} ${pluralUk(noShow.totalBookings, 'запис', 'записи', 'записів')}`} />

            <div className="grid grid-cols-2 divide-x divide-border-strong/40 pb-4 border-b border-border-strong/45">
              <div className="pr-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="metric-value text-3xl font-semibold text-destructive leading-none">{noShow.noShowCount}</span>
                  <span className="text-xs font-semibold text-destructive">{noShow.noShowPct}%</span>
                </div>
                <p className="text-[11px] text-text-sub mt-1.5">Неявки — клієнт не прийшов</p>
              </div>
              <div className="pl-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="metric-value text-3xl font-semibold text-[#92400E] leading-none">{noShow.cancellationCount}</span>
                  <span className="text-xs font-semibold text-[#92400E]">{noShow.cancellationPct}%</span>
                </div>
                <p className="text-[11px] text-text-sub mt-1.5">Скасування клієнтами</p>
              </div>
            </div>

            <div className="pt-4">
              {incidents.length > 0 ? (
                <div className="flex flex-col">
                  {incidents.slice(0, 8).map((r, i) => {
                    const isNoShow = r.status === 'no_show';
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => onOpenDetail(incidentDetail(r))}
                        className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
                      >
                        <span className={cn('size-2 rounded-full flex-shrink-0', isNoShow ? 'bg-destructive' : 'bg-warning')} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{r.client_name}</span>
                            <span className={cn('text-[11px] font-medium flex-shrink-0', isNoShow ? 'text-destructive' : 'text-[#92400E]')}>
                              {isNoShow ? 'Не зʼявився' : 'Скасовано'}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-sub tabular-nums mt-0.5">{r.date} · {r.start_time.slice(0, 5)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-sub text-center py-4">Жодної неявки чи скасування за цей період. Так тримати.</p>
              )}
            </div>
          </BentoCell>
        </div>
      )}

      {/* ── Ряд 2: пік + час планування — два компактні блоки рівної висоти ── */}
      {heatmap.length > 0 && (
        <div className="lg:col-span-6 min-w-0">
          <BentoCell className="h-full p-5">
            <button
              type="button"
              onClick={() => peakDetail && onOpenDetail(peakDetail)}
              disabled={!peakDetail}
              className="text-left w-full h-full flex flex-col cursor-pointer group disabled:cursor-default"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-3">
                <Flame size={13} />
                Ваш пік
              </span>
              {peak ? (
                <>
                  <h4 className="heading-serif text-[26px] leading-tight text-foreground group-hover:text-primary transition-colors">
                    {DOW_FULL[peak.dow - 1]}
                  </h4>
                  <div className="flex items-baseline gap-2.5 mt-2">
                    <span className="metric-value font-semibold leading-[0.9] text-[clamp(2.5rem,6vw,3.5rem)] tracking-tight text-foreground">
                      {peak.occupancy_pct}%
                    </span>
                    <span className="text-sm font-medium text-text-sub mb-1.5">о {peak.hour}:00 · завантаження</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-sub py-4">Завантаженість порахується, коли зʼявляться записи.</p>
              )}

              <div className="mt-auto pt-5 grid grid-cols-2 divide-x divide-border-strong/40 rounded-2xl bg-primary/[0.05] border border-primary/10">
                <div className="pr-3 pl-3.5 py-2.5">
                  <p className="text-[10px] text-text-sub mb-0.5">Середня завантаженість</p>
                  <p className="metric-value text-[15px] font-semibold text-foreground">{avgOcc}%</p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[10px] text-text-sub mb-0.5">Активних слотів</p>
                  <p className="metric-value text-[15px] font-semibold text-foreground">{activeCells.length}</p>
                </div>
              </div>
            </button>
          </BentoCell>
        </div>
      )}

      {lead && lead.totalBookings > 0 && (
        <div className="lg:col-span-6 min-w-0">
          <BentoCell className="h-full p-5 flex flex-col">
            <button
              type="button"
              onClick={() => leadDetail && onOpenDetail(leadDetail)}
              className="text-left w-full cursor-pointer group mb-4"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-3">
                <Clock size={13} />
                Час планування візиту
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="metric-value font-semibold leading-[0.9] text-[clamp(2.25rem,5vw,3rem)] tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {lead.averageDays}
                </span>
                <span className="text-sm font-medium text-text-sub mb-1.5">
                  {pluralUk(Math.round(lead.averageDays), 'день', 'дні', 'днів')} · у середньому до запису
                </span>
              </div>
            </button>

            <div className="flex flex-col gap-3 pt-4 border-t border-border-strong/45 flex-1 justify-center">
              {leadBuckets.map((b) => (
                <div key={b.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-foreground">{b.label}</span>
                    <span className="metric-value font-semibold text-foreground tabular-nums">
                      {b.value} <span className="text-text-sub font-normal">· {b.pct}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${b.fillPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </BentoCell>
        </div>
      )}

      {/* ── Вихідні: чесний аналіз втрати (без фейк-рятувальника) ── */}
      {vacation && vacation.offSegmentsCount > 0 && (
        <div className="lg:col-span-12 min-w-0">
          <BentoCell className="p-5">
            <SectionHeading title="Вартість вихідних" subtitle="Оцінка недоотриманого доходу за заплановані вихідні та відпустки" />
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-5 md:items-center">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#92400E] mb-2">
                  <CalendarOff size={13} />
                  Недоотриманий дохід
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="metric-value text-3xl font-semibold text-foreground leading-none">
                    {formatPrice(grn(vacation.estimatedLostRevenue))}
                  </span>
                  <span className="text-[11px] text-text-sub">
                    за {vacation.totalOffDays} {pluralUk(Math.round(vacation.totalOffDays), 'вихідний день', 'вихідні дні', 'вихідних днів')}
                  </span>
                </div>
              </div>
              <div className="md:border-l md:border-border-strong/40 md:pl-5">
                <p className="text-[11px] font-semibold text-text-sub mb-2">Середній дохід за робочий день</p>
                <span className="metric-value text-3xl font-semibold text-foreground leading-none">
                  {formatPrice(grn(vacation.averageDailyRevenue))}
                </span>
              </div>
              <a
                href="/dashboard/settings#vacations"
                className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[13px] font-semibold cursor-pointer active:scale-[0.97] transition-transform self-start md:self-center flex-shrink-0"
              >
                Налаштувати вихідні
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
            <p className="text-[11px] text-text-sub leading-relaxed mt-4">
              Оцінка: середній дохід за робочий день, помножений на кількість вихідних. Це орієнтир, а не прямі збитки. Відпочинок теж потрібен.
            </p>
          </BentoCell>
        </div>
      )}
    </div>
  );
}
