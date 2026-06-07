'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, ChevronDown, Info } from 'lucide-react';
import { type BusinessHealth } from '@/lib/supabase/hooks/useAnalyticsExtras';

interface BusinessHealthScoreWidgetProps {
  health?: BusinessHealth;
}

export function BusinessHealthScoreWidget({ health }: BusinessHealthScoreWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  if (!health) return null;

  const {
    score = 80,
    retention_score = 80,
    noshow_score = 95,
    ticket_score = 80,
    occupancy_score = 70,
  } = health;

  // Вербальна оцінка на основі score
  let statusText = 'Добре';
  let statusColor = 'var(--primary)';
  if (score >= 90) {
    statusText = 'Відмінно';
    statusColor = 'var(--success)';
  } else if (score < 60) {
    statusText = 'Потребує уваги';
    statusColor = 'var(--error)';
  }

  // Розрахунок параметрів SVG-кола
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bento-card p-5 flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="size-4 text-success" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Здоров'я бізнесу</h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer active:scale-[0.95] transition-all"
        >
          {expanded ? 'Сховати деталі' : 'Детальніше'}
          <ChevronDown size={12} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* Анімований SVG Progress Ring */}
        <div className="relative size-20 flex-shrink-0 flex items-center justify-center">
          <svg className="size-full -rotate-90" aria-hidden="true">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="var(--secondary)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              stroke={statusColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-foreground">{score}</span>
            <span className="text-[9px] text-muted-foreground/50">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground/60 leading-none">Живий пульс</p>
          <p className="text-lg font-bold text-foreground mt-1 select-none" style={{ color: statusColor }}>
            {statusText}
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-1 leading-normal">
            Інтегральний показник на основі 5 ключових метрик вашого бізнесу.
          </p>
        </div>
      </div>

      {/* Розгортання деталей */}
      <AnimatePresence mode="popLayout">
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="border-t border-border/10 pt-4 flex flex-col gap-3"
          >
            {[
              { label: 'Утримання клієнтів (Retention)', val: retention_score },
              { label: 'Дисципліна записів (No-Show)', val: noshow_score },
              { label: 'Середній чек (Ticket)', val: ticket_score },
              { label: 'Завантаженість (Occupancy)', val: occupancy_score },
            ].map((metric, i) => (
              <div key={i} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>{metric.label}</span>
                  <span className="font-bold text-foreground">{metric.val}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.val}%` }}
                    className="h-full bg-primary rounded-full"
                    transition={{ delay: i * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
