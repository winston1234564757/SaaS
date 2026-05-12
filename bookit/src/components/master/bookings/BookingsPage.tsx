'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  LayoutList,
  Clock,
  Zap,
} from 'lucide-react';

import { useMasterContext } from '@/lib/supabase/context';
import { useBookingsDashboardLogic } from './hooks/useBookingsDashboardLogic';
import { DashboardWidgets } from './dashboard/DashboardWidgets';
import { VerticalTimeline } from './dashboard/VerticalTimeline';
import { SmartQueue } from './dashboard/SmartQueue';
import { BookingCard } from './BookingCard';
import { PeriodAnalyticsView } from './dashboard/PeriodAnalyticsView';
import { MonthlyAnalyticsView } from './dashboard/MonthlyAnalyticsView';
import { ManualBookingForm } from './ManualBookingForm';
import { SharePageCard } from '@/components/master/dashboard/SharePageCard';
import { OpportunityMenu } from './dashboard/OpportunityMenu';
import { useRouter } from 'next/navigation';
import { 
  format, 
  isPast, 
  parseISO, 
  isSameDay, 
  addDays, 
  startOfWeek, 
  eachDayOfInterval, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth 
} from 'date-fns';
import { uk } from 'date-fns/locale';

import { completeBooking } from '@/app/(master)/dashboard/bookings/actions';
import { useToast } from '@/lib/toast/context';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'list' | 'timeline' | 'focus';
type TimeRange = 'day' | 'week' | 'month';


export function BookingsPage() {
  const router = useRouter();
  const { masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  const [view, setView] = useState<ViewMode>('list');
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [anchor, setAnchor] = useState(new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formOpen, setFormOpen] = useState(false);
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>();
  
  const [opportunityOpen, setOpportunityOpen] = useState(false);
  const [opportunityTime, setOpportunityTime] = useState('');

  const dateFrom = useMemo(() => {
    const d = new Date(anchor);
    if (timeRange === 'week') {
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    } else if (timeRange === 'month') {
      d.setDate(1);
    }
    return d.toISOString().split('T')[0];
  }, [anchor, timeRange]);

  const dateTo = useMemo(() => {
    const d = new Date(anchor);
    if (timeRange === 'week') {
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + 6);
    } else if (timeRange === 'month') {
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
    }
    return d.toISOString().split('T')[0];
  }, [anchor, timeRange]);

  const { bookings, stats, isLoading } = useBookingsDashboardLogic(dateFrom, dateTo);

  const now = new Date();


  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.client_name.toLowerCase().includes(search.toLowerCase()) || 
                           b.client_phone.includes(search);
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  // Grouping for list view
  const groupedBookings = useMemo(() => {
    const groups: Record<string, typeof filteredBookings> = {};
    filteredBookings.forEach(b => {
      if (!groups[b.date]) groups[b.date] = [];
      groups[b.date].push(b);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBookings]);

  const handleOpportunityAction = (action: 'booking' | 'flash' | 'story') => {
    setOpportunityOpen(false);
    const dateStr = anchor.toISOString().split('T')[0];

    if (action === 'booking') {
      setPreselectedTime(opportunityTime);
      setFormOpen(true);
    } else if (action === 'flash') {
      router.push(`/dashboard/flash?date=${dateStr}&time=${opportunityTime}`);
    } else if (action === 'story') {
      router.push(`/dashboard/marketing?tab=stories&mode=free_slots&date=${dateStr}`);
    }
  };

  const daysInRange = useMemo(() => {
    if (timeRange === 'day') return [anchor];
    const start = timeRange === 'week' ? startOfWeek(anchor, { weekStartsOn: 1 }) : startOfMonth(anchor);
    const end = timeRange === 'week' ? endOfWeek(anchor, { weekStartsOn: 1 }) : endOfMonth(anchor);
    return eachDayOfInterval({ start, end });
  }, [anchor, timeRange]);

  const navigate = (dir: 1 | -1) => {
    setAnchor(prev => {
      const d = new Date(prev);
      if (timeRange === 'day') d.setDate(d.getDate() + dir);
      else if (timeRange === 'week') d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const rangeLabel = useMemo(() => {
    if (timeRange === 'day') return format(anchor, 'EEEE d MMMM', { locale: uk });
    if (timeRange === 'month') return format(anchor, 'LLLL yyyy', { locale: uk });
    
    const from = parseISO(dateFrom);
    const to = parseISO(dateTo);
    return `${format(from, 'd MMM', { locale: uk })} — ${format(to, 'd MMM', { locale: uk })}`;
  }, [anchor, timeRange, dateFrom, dateTo]);

  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* 1. Header & Quick Switcher */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <h1 className="text-6xl text-foreground -mb-2" style={{ fontFamily: 'var(--font-great-vibes)' }}>
              Записи
            </h1>
            <p className="text-xs text-muted-foreground/60 ml-12 mt-2">Керування розкладом та аналітика</p>
          </div>
          <div className="flex gap-2 mb-1">
            <button
              onClick={() => setFormOpen(true)}
              className="p-2.5 rounded-2xl bg-foreground text-background border border-foreground shadow-lg shadow-black/10 transition-all active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>


        {/* Bento Widgets */}
        <DashboardWidgets stats={stats} isLoading={isLoading} />
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="flex flex-col gap-3">
        {/* View Switcher */}
        <div className="flex p-1.5 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-sm">
          {[
            { id: 'list', icon: <LayoutList size={16} />, label: 'Список' },
            { id: 'timeline', icon: <Clock size={16} />, label: 'Таймлайн' },
            { id: 'focus', icon: <Zap size={16} />, label: 'Фокус' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setView(m.id as ViewMode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                view === m.id ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white/60 p-2 rounded-2xl border border-white/80">
          <div className="flex gap-1">
            {['day', 'week', 'month'].map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r as TimeRange)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === r ? 'bg-foreground text-background' : 'text-muted-foreground/40 hover:text-muted-foreground'
                }`}
              >
                {r === 'day' ? 'День' : r === 'week' ? 'Тиж' : 'Міс'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 hover:text-primary transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-xs font-bold text-foreground capitalize w-24 text-center">{rangeLabel}</span>
            <button onClick={() => navigate(1)} className="p-1 hover:text-primary transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Клієнт, послуга, телефон..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none"
          />
        </div>

      </div>

      {/* 3. Main View Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </motion.div>
          ) : filteredBookings.length === 0 && view !== 'timeline' ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-10"
            >
              <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                <CalendarDays size={32} className="text-muted-foreground/20" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Записів не знайдено</p>
              <SharePageCard />
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'list' && (
                <div className="flex flex-col gap-8">
                  {groupedBookings.map(([date, dayBookings]) => (
                    <div key={date} className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 px-1">
                        <span className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest whitespace-nowrap">
                          {format(parseISO(date), 'EEEE d MMMM', { locale: uk })}
                        </span>
                        <div className="h-px w-full bg-muted-foreground/10" />
                      </div>
                      <div className="flex flex-col gap-3">
                        {dayBookings.map((b, i) => (
                          <BookingCard
                            key={b.id}
                            booking={b}
                            index={i}
                            showDate={timeRange !== 'day'}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view === 'timeline' && (
                timeRange === 'day' ? (
                  <VerticalTimeline
                    bookings={bookings}
                    date={anchor.toISOString().split('T')[0]}
                    workStart={(() => {
                      const wh = masterProfile?.working_hours as Record<string, { is_working: boolean; start_time: string; end_time: string }> | null;
                      const key = DAY_KEYS[anchor.getDay()];
                      return wh?.[key]?.is_working ? wh[key].start_time : '09:00';
                    })()}
                    workEnd={(() => {
                      const wh = masterProfile?.working_hours as Record<string, { is_working: boolean; start_time: string; end_time: string }> | null;
                      const key = DAY_KEYS[anchor.getDay()];
                      return wh?.[key]?.is_working ? wh[key].end_time : '18:00';
                    })()}
                    isWorkingDay={(() => {
                      const wh = masterProfile?.working_hours as Record<string, { is_working: boolean; start_time: string; end_time: string }> | null;
                      const key = DAY_KEYS[anchor.getDay()];
                      return wh?.[key]?.is_working ?? true;
                    })()}
                    bufferMinutes={(masterProfile?.working_hours as any)?.buffer_time_minutes ?? 0}
                    breaks={(masterProfile?.working_hours as any)?.breaks ?? []}
                    onOpportunityClick={(time) => { setOpportunityTime(time); setOpportunityOpen(true); }}
                  />
                ) : timeRange === 'week' ? (
                  <PeriodAnalyticsView
                    bookings={bookings}
                    days={daysInRange}
                    onDayClick={(date) => { setAnchor(date); setTimeRange('day'); }}
                  />
                ) : (
                  <MonthlyAnalyticsView
                    bookings={bookings}
                    month={anchor}
                    onDayClick={(date) => { setAnchor(date); setTimeRange('day'); }}
                    onWeekClick={(date) => { setAnchor(date); setTimeRange('week'); }}
                  />
                )
              )}

              {view === 'focus' && (
                <SmartQueue bookings={filteredBookings} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Overlays & Toolbars */}
      <ManualBookingForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setPreselectedTime(undefined); }}
        initialTime={preselectedTime}
        initialDate={anchor.toISOString().split('T')[0]}
      />

      <OpportunityMenu 
        isOpen={opportunityOpen}
        onClose={() => setOpportunityOpen(false)}
        time={opportunityTime}
        onAction={handleOpportunityAction}
      />
    </div>
  );
}
