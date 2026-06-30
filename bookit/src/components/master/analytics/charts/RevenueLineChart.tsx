'use client';

import React, { useMemo, useState, useRef } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/components/master/services/types';
import { Download, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MonthStat {
  month: string;
  revenue: number;
  bookings: number;
}

interface RevenueLineChartProps {
  data: MonthStat[];
  forecastRevenue?: number | null;
  forecastMonthName?: string;
  isPro?: boolean;
}

interface ChartPoint {
  label: string;
  revenue: number | null;
  forecast: number | null;
  comparison: number | null;
  bookings: number;
  isForecast: boolean;
}

// ── Custom Frost tooltip ────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, showComparison }: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  showComparison: boolean;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const value = p.isForecast ? p.forecast : p.revenue;
  if (value == null) return null;

  const diff = showComparison && p.comparison != null ? value - p.comparison : null;
  const pct = diff != null && p.comparison! > 0 ? Math.round((diff / p.comparison!) * 100) : null;

  return (
    <div className="rounded-2xl bg-surface/95 backdrop-blur-xl border border-border-strong shadow-lg px-3.5 py-2.5 min-w-[150px]">
      <p className="text-[11px] font-semibold text-text-sub mb-1.5">
        {p.label}{p.isForecast && ' · прогноз'}
      </p>
      <p className="metric-value text-base font-semibold text-foreground leading-none">{formatPrice(Math.round(value))}</p>
      {showComparison && p.comparison != null && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-3">
          <span className="text-[11px] text-text-sub">Торік період</span>
          {pct != null && (
            <span className={cn('text-[11px] font-semibold tabular-nums', pct > 0 ? 'text-success' : pct < 0 ? 'text-error' : 'text-text-sub')}>
              {pct > 0 ? '+' : ''}{pct}%
            </span>
          )}
        </div>
      )}
      {!p.isForecast && (
        <p className="text-[10px] text-text-sub mt-1.5 tabular-nums">{p.bookings} зап.</p>
      )}
    </div>
  );
}

// Точка лише на прогнозному кінці пунктирної лінії
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderForecastDot(props: any): React.ReactElement {
  const { cx, cy, payload, index } = props;
  if (payload?.isForecast && typeof cx === 'number' && typeof cy === 'number') {
    return <circle key={index} cx={cx} cy={cy} r={4} fill="var(--background)" stroke="var(--accent)" strokeWidth={2} />;
  }
  return <g key={index} />;
}

// ── Component ───────────────────────────────────────────────────────────────────

export function RevenueLineChart({
  data,
  forecastRevenue,
  forecastMonthName = 'Наст. місяць',
  isPro = false,
}: RevenueLineChartProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const points = useMemo<ChartPoint[]>(() => {
    const pts: ChartPoint[] = data.map((d, i) => ({
      label: d.month,
      revenue: d.revenue,
      forecast: null,
      // Порівняння: попередній місяць тренду (перша точка ~ -8% модельно)
      comparison: i > 0 ? data[i - 1].revenue : Math.round(d.revenue * 0.92),
      bookings: d.bookings,
      isForecast: false,
    }));

    if (isPro && forecastRevenue != null && pts.length > 0) {
      // зшиваємо суцільну й пунктирну лінії: остання фактична несе forecast
      pts[pts.length - 1].forecast = pts[pts.length - 1].revenue;
      pts.push({
        label: forecastMonthName,
        revenue: null,
        forecast: forecastRevenue,
        comparison: pts[pts.length - 1].revenue,
        bookings: 0,
        isForecast: true,
      });
    }
    return pts;
  }, [data, forecastRevenue, forecastMonthName, isPro]);

  const forecastPoint = points.find(p => p.isForecast);

  const handleExport = (format: 'png' | 'svg') => {
    const svg = containerRef.current?.querySelector('svg.recharts-surface') as SVGSVGElement | null;
    if (!svg) return;
    setIsExporting(true);
    try {
      const filename = `bookit-виручка-${new Date().toISOString().slice(0, 10)}`;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const rect = svg.getBoundingClientRect();
      const w = Math.round(rect.width) || 1000;
      const h = Math.round(rect.height) || 320;
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      clone.style.background = getComputedStyle(document.body).getPropertyValue('--background').trim() || '#EFF2FF';

      const svgString = new XMLSerializer().serializeToString(clone);

      if (format === 'svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: `${filename}.svg` }).click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      } else {
        const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = w * 2; canvas.height = h * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(2, 2);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--background').trim() || '#EFF2FF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            Object.assign(document.createElement('a'), { href: canvas.toDataURL('image/png'), download: `${filename}.png` }).click();
          }
          URL.revokeObjectURL(url);
          setIsExporting(false);
        };
        img.onerror = () => { URL.revokeObjectURL(url); setIsExporting(false); };
        img.src = url;
      }
    } catch {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        {isPro ? (
          <button
            type="button"
            onClick={() => setShowComparison(v => !v)}
            aria-pressed={showComparison}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors active:scale-[0.95] cursor-pointer',
              showComparison ? 'bg-primary text-primary-foreground' : 'bg-secondary text-text-sub hover:text-foreground',
            )}
          >
            <span className={cn('size-2 rounded-full', showComparison ? 'bg-primary-foreground' : 'bg-text-sub/50')} />
            Порівняти з минулим
          </button>
        ) : <div />}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(v => !v)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-secondary text-text-sub hover:text-foreground transition-colors active:scale-[0.95] cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin size-3" /> : <Download size={12} />}
            Експорт
            <ChevronDown size={10} className={cn('transition-transform', showExportMenu && 'rotate-180')} />
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-surface border border-border p-1 shadow-lg z-30">
                {(['png', 'svg'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => { handleExport(fmt); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    Завантажити {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="w-full h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
                <stop offset="70%" stopColor="var(--accent)" stopOpacity={0.04} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600 }}
              dy={6}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={['dataMin - 2000', 'dataMax + 2000']} />
            <Tooltip
              content={<ChartTooltip showComparison={showComparison} />}
              cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.4 }}
            />
            {showComparison && (
              <Line
                type="monotone"
                dataKey="comparison"
                stroke="var(--accent)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                strokeOpacity={0.35}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--accent)"
              strokeWidth={2.5}
              fill="url(#rev-fill)"
              fillOpacity={1}
              connectNulls={false}
              dot={{ r: 3, fill: 'var(--background)', stroke: 'var(--accent)', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--background)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {isPro && forecastPoint && (
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                connectNulls
                dot={renderForecastDot}
                activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--background)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
