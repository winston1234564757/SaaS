'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown } from 'lucide-react';
import { Section } from '@/components/ui/Section';
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

  // Вербальна оцінка + калібрований тон (пара ≥5:1 на світлому; статус-токени провалюють 4.5).
  let statusText = 'Добре';
  let verdictColor = 'var(--text-primary)';   // текст-вердикт (велике bold)
  let ringColor = 'var(--primary)';           // графічний штрих кільця
  if (score >= 90) {
    statusText = 'Відмінно';
    verdictColor = '#0B6B2E';
    ringColor = 'var(--success)';
  } else if (score < 60) {
    statusText = 'Потребує уваги';
    verdictColor = 'var(--error)';
    ringColor = 'var(--error)';
  }

  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const metrics = [
    { label: 'Утримання клієнтів', val: retention_score },
    { label: 'Дисципліна записів', val: noshow_score },
    { label: 'Середній чек', val: ticket_score },
    { label: 'Завантаженість', val: occupancy_score },
  ];

  return (
    <Section
      title="Здоров'я бізнесу"
      icon={Activity}
      action={
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer active:scale-[0.95] transition-all shrink-0"
        >
          {expanded ? 'Сховати' : 'Деталі'}
          <ChevronDown size={12} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      }
    >
      <div className="flex items-center gap-5">
        {/* Домінанта — score-кільце */}
        <div className="relative size-20 flex-shrink-0 flex items-center justify-center">
          <svg className="size-full -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r={radius} stroke="var(--secondary)" strokeWidth={strokeWidth} fill="transparent" />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              stroke={ringColor}
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
            <span className="metric-value text-xl leading-none text-foreground">{score}</span>
            <span className="text-[9px] text-text-sub mt-0.5">зі 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold leading-none select-none" style={{ color: verdictColor }}>
            {statusText}
          </p>
          <p className="text-[11px] text-text-sub mt-1.5 leading-normal">
            Живий пульс за 5 ключових метрик твого бізнесу.
          </p>
        </div>
      </div>

      {/* Диференційоване тіло — 5 метрик-смуг */}
      <AnimatePresence mode="popLayout">
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="border-t border-border/40 mt-4 pt-4 flex flex-col gap-3"
          >
            {metrics.map((metric, i) => (
              <div key={metric.label} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-text-sub">{metric.label}</span>
                  <span className="metric-value text-foreground">{metric.val}<span className="text-text-sub"> / 100</span></span>
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
    </Section>
  );
}
