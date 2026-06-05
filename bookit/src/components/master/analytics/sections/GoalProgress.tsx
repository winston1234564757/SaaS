'use client';

import React, { useState, useEffect } from 'react';
import { Target, Edit2 } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { motion } from 'framer-motion';

interface GoalProgressProps {
  currentRevenue: number; // в копійках
  initialTarget?: number; // в гривнях, за замовчуванням 50 000 ₴
}

export function GoalProgress({ currentRevenue, initialTarget = 50000 }: GoalProgressProps) {
  const [target, setTarget] = useState(initialTarget);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(initialTarget));

  // Завантажуємо ціль із localStorage
  useEffect(() => {
    const saved = localStorage.getItem('analytics-monthly-goal');
    if (saved) {
      setTarget(Number(saved));
      setInputVal(saved);
    }
  }, []);

  const currentRevenueUah = Math.round(currentRevenue / 100);
  const pct = target > 0 ? Math.min(100, Math.round((currentRevenueUah / target) * 100)) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(inputVal.replace(/\D/g, ''));
    if (num > 0) {
      setTarget(num);
      localStorage.setItem('analytics-monthly-goal', String(num));
      setIsEditing(false);
    }
  };

  const radius = 34;
  const circumference = 2 * Math.PI * radius; // ~213.6
  const strokeOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col justify-between h-full min-h-[180px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Ціль місяця</p>
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-20 px-2 py-0.5 text-xs border border-border-strong rounded-md bg-secondary text-foreground focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Зб.
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 mt-1 select-none">
              <span className="text-sm font-bold text-foreground">{formatPrice(target)}</span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground/50 hover:text-primary active:scale-90 transition-all cursor-pointer"
              >
                <Edit2 size={10} />
              </button>
            </div>
          )}
        </div>

        <div className="size-8 rounded-xl bg-success/10 flex items-center justify-center text-success flex-shrink-0">
          <Target size={16} />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2">
        {/* SVG Ring Progress */}
        <div className="relative size-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="var(--border)"
              strokeWidth={5}
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="rgba(78, 152, 112, 0.8)" // success
              strokeWidth={5}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-foreground select-none">
            {pct}%
          </div>
        </div>

        <div className="flex-1 text-xs select-none">
          <p className="text-muted-foreground/60 leading-normal">Виконано:</p>
          <p className="font-bold text-foreground text-sm mt-0.5">{formatPrice(currentRevenueUah)}</p>
          {pct >= 100 ? (
            <p className="text-[10px] font-bold text-success mt-1 leading-tight">Ціль досягнута! 🎉</p>
          ) : (
            <p className="text-[10px] text-muted-foreground/50 mt-1 leading-tight">
              Залишилось: {formatPrice(Math.max(0, target - currentRevenueUah))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
