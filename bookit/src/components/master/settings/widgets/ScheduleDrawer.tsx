'use client';

import { motion } from 'framer-motion';
import { Drawer } from 'vaul';
import { X, Clock, Plus, Trash2, Info, RefreshCw } from 'lucide-react';
import type { Schedule, DayKey } from '../hooks/useSettingsForm';
import { DAYS_ORDER } from '../hooks/useSettingsForm';
import { cn } from '@/lib/utils/cn';

const DAYS_UA: Record<DayKey, string> = {
  mon: 'Понеділок', tue: 'Вівторок', wed: 'Середа', thu: 'Четвер', fri: 'П’ятниця', sat: 'Субота', sun: 'Неділя'
};

interface ScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  bufferTime: number;
  breaks: any[];
  retentionCycleDays: number;
  onScheduleChange: (schedule: Schedule) => void;
  onBufferChange: (val: number) => void;
  onBreaksChange: (breaks: any[]) => void;
  onRetentionCycleDaysChange: (val: number) => void;
}

export function ScheduleDrawer({
  isOpen,
  onClose,
  schedule,
  bufferTime,
  breaks,
  retentionCycleDays,
  onScheduleChange,
  onBufferChange,
  onBreaksChange,
  onRetentionCycleDaysChange,
}: ScheduleDrawerProps) {
  
  const toggleDay = (day: DayKey) => {
    onScheduleChange({
      ...schedule,
      [day]: { ...schedule[day], is_working: !schedule[day].is_working }
    });
  };

  const setDayTime = (day: DayKey, field: 'start_time' | 'end_time', val: string) => {
    onScheduleChange({
      ...schedule,
      [day]: { ...schedule[day], [field]: val }
    });
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96%] bg-background rounded-t-[32px] flex flex-col z-[70] outline-none">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
            
            <div className="max-w-2xl mx-auto space-y-10">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Робочий графік</h3>
                  <p className="text-sm text-muted-foreground">Налаштуйте ваш час для записів</p>
                </div>
                <button onClick={onClose} className="p-3 rounded-full bg-muted/40 hover:bg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Weekly Schedule */}
              <div className="space-y-3">
                {DAYS_ORDER.map((day) => (
                  <div 
                    key={day}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                      schedule[day].is_working ? "bg-secondary border-border shadow-sm" : "bg-muted/10 border-transparent opacity-60"
                    )}
                  >
                    <button
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        schedule[day].is_working ? "bg-accent" : "bg-muted-foreground/30"
                      )}
                    >
                      <motion.div
                        animate={{ x: schedule[day].is_working ? 22 : 2 }}
                        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>

                    <span className="text-sm font-bold w-20">{DAYS_UA[day]}</span>

                    {schedule[day].is_working ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={schedule[day].start_time}
                          onChange={(e) => setDayTime(day, 'start_time', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-muted/30 border border-transparent focus:bg-secondary focus:border-accent/40 outline-none text-sm font-medium"
                        />
                        <span className="text-muted-foreground/40">—</span>
                        <input
                          type="time"
                          value={schedule[day].end_time}
                          onChange={(e) => setDayTime(day, 'end_time', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-muted/30 border border-transparent focus:bg-secondary focus:border-accent/40 outline-none text-sm font-medium"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 flex-1">Вихідний</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Buffer Time */}
              <div className="p-6 rounded-3xl bg-accent/5 border border-accent/10">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-accent" />
                  <h4 className="font-bold text-sm">Час між клієнтами</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[0, 5, 10, 15, 20, 30, 45, 60].map((min) => (
                    <button
                      key={min}
                      onClick={() => onBufferChange(min)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        bufferTime === min 
                          ? "bg-accent text-white shadow-lg shadow-accent/20" 
                          : "bg-secondary border border-border text-muted-foreground hover:border-accent/30"
                      )}
                    >
                      {min === 0 ? "Без буферу" : `${min} хв`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Retention Cycle */}
              <div className="p-6 rounded-3xl bg-accent/5 border border-accent/10">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw size={16} className="text-accent" />
                  <h4 className="font-bold text-sm">Цикл повернення клієнта</h4>
                </div>
                <p className="text-xs text-muted-foreground/60 mb-4">
                  Через скільки днів клієнт вважається "неактивним" і потребує нагадування
                </p>
                <div className="flex flex-wrap gap-2">
                  {[14, 21, 30, 45, 60, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => onRetentionCycleDaysChange(days)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                        retentionCycleDays === days
                          ? 'bg-accent text-white shadow-lg shadow-accent/20'
                          : 'bg-secondary border border-border text-muted-foreground hover:border-accent/30',
                      )}
                    >
                      {days} днів
                    </button>
                  ))}
                </div>
              </div>

              {/* Breaks */}
              <div className="pb-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-muted-foreground" />
                    <h4 className="font-bold text-sm">Перерви</h4>
                  </div>
                  <button 
                    onClick={() => onBreaksChange([...breaks, { start: '13:00', end: '14:00' }])}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/10 text-accent text-xs font-bold active:scale-95 transition-all"
                  >
                    <Plus size={14} /> Додати перерву
                  </button>
                </div>

                <div className="space-y-3">
                  {breaks.length === 0 ? (
                    <div className="py-8 rounded-3xl border border-dashed border-muted flex flex-col items-center justify-center text-muted-foreground/40">
                      <Clock size={24} strokeWidth={1} className="mb-2" />
                      <p className="text-xs font-medium">Перерв не додано</p>
                    </div>
                  ) : (
                    breaks.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary border border-border">
                        <input
                          type="time"
                          value={b.start}
                          onChange={(e) => {
                            const newBreaks = [...breaks];
                            newBreaks[i].start = e.target.value;
                            onBreaksChange(newBreaks);
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-muted/20 outline-none text-sm font-bold"
                        />
                        <span className="text-muted-foreground/30">—</span>
                        <input
                          type="time"
                          value={b.end}
                          onChange={(e) => {
                            const newBreaks = [...breaks];
                            newBreaks[i].end = e.target.value;
                            onBreaksChange(newBreaks);
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-muted/20 outline-none text-sm font-bold"
                        />
                        <button 
                          onClick={() => onBreaksChange(breaks.filter((_, idx) => idx !== i))}
                          className="w-10 h-10 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
