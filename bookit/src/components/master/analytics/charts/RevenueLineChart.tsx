'use client';

import React, { useMemo, useState, useRef } from 'react';
import { formatPrice } from '@/components/master/services/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, ChevronDown, Loader2 } from 'lucide-react';

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

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 26 };

export function RevenueLineChart({
  data,
  forecastRevenue,
  forecastMonthName = 'Наст. місяць',
  isPro = false,
}: RevenueLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Об'єднуємо дані з прогнозом для розрахунку сітки
  const points = useMemo(() => {
    const pts = data.map((d, i) => ({
      label: d.month,
      value: d.revenue,
      bookings: d.bookings,
      isForecast: false,
      index: i,
    }));

    if (isPro && forecastRevenue !== undefined && forecastRevenue !== null && pts.length > 0) {
      pts.push({
        label: forecastMonthName,
        value: forecastRevenue,
        bookings: 0,
        isForecast: true,
        index: pts.length,
      });
    }

    return pts;
  }, [data, forecastRevenue, forecastMonthName, isPro]);

  const maxVal = useMemo(() => {
    const max = Math.max(...points.map((p) => p.value), 1000);
    return max * 1.15; // додаємо 15% зазору зверху
  }, [points]);

  const width = 500;
  const height = 150;
  const containerHeight = 160; // matches h-[160px] CSS class
  const paddingX = 30;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Розрахунок координат поточного періоду
  const coords = useMemo(() => {
    if (points.length === 0) return [];
    return points.map((p, i) => {
      const x = paddingX + (i * chartWidth) / (points.length - 1);
      const y = paddingY + chartHeight - (p.value / maxVal) * chartHeight;
      return { x, y, ...p };
    });
  }, [points, chartWidth, chartHeight, maxVal]);

  // Розрахунок порівняльних координат (MoM зсув)
  const comparisonCoords = useMemo(() => {
    if (coords.length === 0) return [];
    return coords.map((c, i) => {
      let compValue = 0;
      let isSynthetic = false;

      if (c.isForecast) {
        // Для прогнозованої точки порівнянням є остання фактична точка
        const lastActual = coords[coords.length - 2];
        compValue = lastActual ? lastActual.value : 0;
      } else if (i > 0) {
        // Значення за попередній місяць з поточного тренду
        compValue = coords[i - 1].value;
      } else {
        // Для першої точки моделюємо попередній місяць (-8%)
        compValue = c.value * 0.92;
        isSynthetic = true;
      }

      const compY = paddingY + chartHeight - (compValue / maxVal) * chartHeight;
      return {
        x: c.x,
        y: compY,
        value: compValue,
        label: c.label,
        isSynthetic,
      };
    });
  }, [coords, chartHeight, maxVal]);

  // Створення шляху (Path) для основної лінії
  const linePath = useMemo(() => {
    const actualCoords = coords.filter((c) => !c.isForecast);
    if (actualCoords.length < 2) return '';
    return actualCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
      .join(' ');
  }, [coords]);

  // Створення шляху (Path) для лінії порівняння (MoM)
  const comparisonPath = useMemo(() => {
    const actualCompCoords = comparisonCoords.filter((_, i) => !points[i]?.isForecast);
    if (actualCompCoords.length < 2) return '';
    return actualCompCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
      .join(' ');
  }, [comparisonCoords, points]);

  // Створення шляху (Path) для лінії прогнозу
  const forecastPath = useMemo(() => {
    if (!isPro || coords.length < 2) return '';
    const lastActual = coords[coords.length - 2];
    const forecastPt = coords[coords.length - 1];
    if (!lastActual || !forecastPt) return '';
    return `M ${lastActual.x} ${lastActual.y} L ${forecastPt.x} ${forecastPt.y}`;
  }, [coords, isPro]);

  // Створення замкненого шляху для градієнтного залиття під графіком
  const fillPath = useMemo(() => {
    const actualCoords = coords.filter((c) => !c.isForecast);
    if (actualCoords.length < 2) return '';
    const first = actualCoords[0];
    const last = actualCoords[actualCoords.length - 1];
    const baseLineY = paddingY + chartHeight;
    return `${linePath} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
  }, [coords, linePath, chartHeight]);

  // Нативний клієнтський експорт графіка в PNG чи SVG
  const handleExport = (format: 'png' | 'svg') => {
    if (!svgRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = svgRef.current;
      const filename = `bookit-chart-${new Date().toISOString().slice(0, 10)}`;

      // Створюємо клон SVG елемента для експорту та задаємо статичні розміри
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('width', '1000');
      svgClone.setAttribute('height', '320');
      
      // Замінюємо кольори CSS змінних на статичні HSL/HEX токени для відображення поза веб-додатком
      const computedStyle = getComputedStyle(document.body);
      const accentColor = computedStyle.getPropertyValue('--accent').trim() || '#A8896A';
      const textColor = computedStyle.getPropertyValue('--text-primary').trim() || '#28201A';
      const borderColor = computedStyle.getPropertyValue('--border').trim() || '#E5E7EB';
      const backgroundColor = computedStyle.getPropertyValue('--background').trim() || '#DDD5C6';
      
      svgClone.style.backgroundColor = backgroundColor;

      const replaceCssVariables = (element: Element) => {
        const stroke = element.getAttribute('stroke');
        const fill = element.getAttribute('fill');
        
        if (stroke && stroke.includes('var(--accent)')) element.setAttribute('stroke', accentColor);
        else if (stroke && stroke.includes('var(--text-primary)')) element.setAttribute('stroke', textColor);
        else if (stroke && stroke.includes('var(--border)')) element.setAttribute('stroke', borderColor);
        
        if (fill && fill.includes('var(--accent)')) element.setAttribute('fill', accentColor);
        else if (fill && fill.includes('url(#chart-fill-gradient)')) {
          element.setAttribute('fill', accentColor);
          element.setAttribute('fill-opacity', '0.12');
        }
        
        for (let i = 0; i < element.children.length; i++) {
          replaceCssVariables(element.children[i]);
        }
      };
      
      replaceCssVariables(svgClone);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);

      if (format === 'svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${filename}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      } else {
        // PNG експорт
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1000;
          canvas.height = 320;
          const context = canvas.getContext('2d');
          
          if (context) {
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            
            const png = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = png;
            downloadLink.download = `${filename}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }
          URL.revokeObjectURL(url);
        };
        image.src = url;
      }
    } catch (error) {
      console.error('Error exporting chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col gap-4">
      {/* Керування графіком: Порівняння та Експорт */}
      <div className="flex justify-between items-center">
        {isPro ? (
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-[0.95] ${
              showComparison
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={`size-2 rounded-full ${showComparison ? 'bg-primary-foreground animate-pulse' : 'bg-muted-foreground/50'}`} />
            Порівняння MoM
          </button>
        ) : (
          <div />
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-[0.95] disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin size-3" /> : <Download size={12} />}
            Експорт
            <ChevronDown size={10} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-secondary border border-border p-1 shadow-lg z-30">
                <button
                  type="button"
                  onClick={() => {
                    handleExport('png');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-primary/10 transition-colors"
                >
                  Завантажити PNG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExport('svg');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-primary/10 transition-colors"
                >
                  Завантажити SVG
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SVG Графік */}
      <div className="w-full h-[160px] relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label="Графік доходу за обраний період"
        >
          <defs>
            {/* Градієнт під лінією */}
            <linearGradient id="chart-fill-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Горизонтальні лінії сітки */}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = paddingY + (i * chartHeight) / 3;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--border)"
                strokeWidth={0.5}
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Заливка градієнтом */}
          {fillPath && (
            <path d={fillPath} fill="url(#chart-fill-gradient)" className="transition-all duration-500" />
          )}

          {/* Пунктирна лінія порівняння MoM */}
          {showComparison && comparisonPath && (
            <path
              d={comparisonPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              className="transition-all duration-500"
            />
          )}

          {/* Основна лінія графіка */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />
          )}

          {/* Лінія прогнозу (Pro) */}
          {isPro && forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )}

          {/* Точки на графіку та зони наведення */}
          {coords.map((c, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i}>
                {/* Точка поточного періоду */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={c.isForecast ? 3.5 : 4}
                  fill={c.isForecast ? 'transparent' : 'var(--accent)'}
                  stroke={c.isForecast ? 'var(--accent)' : 'var(--background)'}
                  strokeWidth={2}
                  className="transition-all duration-200"
                />

                {/* Точка порівняльного періоду */}
                {showComparison && comparisonCoords[i] && (
                  <circle
                    cx={comparisonCoords[i].x}
                    cy={comparisonCoords[i].y}
                    r={3}
                    fill="transparent"
                    stroke="var(--accent)"
                    strokeOpacity={0.5}
                    strokeWidth={1.5}
                    className="transition-all duration-200"
                  />
                )}

                {/* Ефект наведення (активний маркер) */}
                {isHovered && (
                  <>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={8}
                      fill="var(--accent)"
                      fillOpacity={0.15}
                      className="pointer-events-none"
                    />
                    {showComparison && comparisonCoords[i] && (
                      <circle
                        cx={comparisonCoords[i].x}
                        cy={comparisonCoords[i].y}
                        r={7}
                        fill="var(--accent)"
                        fillOpacity={0.08}
                        className="pointer-events-none"
                      />
                    )}
                  </>
                )}

                {/* Інтерактивна вертикальна зона для спрощення наведення */}
                <rect
                  x={c.x - 20}
                  y={0}
                  width={40}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onTouchStart={() => setHoveredIdx(i)}
                />
              </g>
            );
          })}
        </svg>

        {/* Тултіп (Tooltip) */}
        <AnimatePresence mode="popLayout">
          {hoveredIdx !== null && coords[hoveredIdx] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              transition={{ duration: 0.12 }}
              className="absolute bg-secondary border border-border rounded-xl p-3 shadow-lg text-[11px] leading-tight pointer-events-none z-10 min-w-[140px]"
              style={{
                left: `${(coords[hoveredIdx].x / width) * 100}%`,
                top: `${Math.round((coords[hoveredIdx].y / height) * containerHeight) - 60}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <p className="font-bold text-foreground mb-1">{coords[hoveredIdx].label}</p>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground/80">Поточний:</span>
                  <span className="text-success font-bold">
                    {formatPrice(coords[hoveredIdx].value)}
                  </span>
                </div>

                {showComparison && comparisonCoords[hoveredIdx] && (
                  <>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-muted-foreground/80">Минулий:</span>
                      <span className="text-muted-foreground font-semibold">
                        {formatPrice(comparisonCoords[hoveredIdx].value)}
                      </span>
                    </div>

                    <div className="border-t border-border/20 my-1" />

                    <div className="flex justify-between items-center gap-4">
                      <span className="text-muted-foreground/80">Різниця:</span>
                      {(() => {
                        const curVal = coords[hoveredIdx].value;
                        const prevVal = comparisonCoords[hoveredIdx].value;
                        const diff = curVal - prevVal;
                        const pct = prevVal > 0 ? Math.round((diff / prevVal) * 100) : 0;
                        const isPositive = diff >= 0;
                        const isZero = diff === 0;

                        return (
                          <span className={`font-bold flex items-center gap-0.5 ${
                            isZero ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive'
                          }`}>
                            {!isZero && (isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
                            {isZero ? '' : isPositive ? '+' : ''}
                            {pct}%
                          </span>
                        );
                      })()}
                    </div>
                  </>
                )}
                
                {!coords[hoveredIdx].isForecast && (
                  <p className="text-[10px] text-muted-foreground mt-1 border-t border-border/10 pt-1">
                    {coords[hoveredIdx].bookings} зап.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Підписи по осі X */}
      <div className="flex justify-between px-[20px] text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
        {coords.map((c, i) => (
          <span key={i} className={c.isForecast ? 'text-accent' : ''}>
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
