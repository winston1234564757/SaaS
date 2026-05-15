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
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useRouter, useSearchParams } from 'next/navigation';
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

import { MicaModal } from '@/components/ui/MicaModal';
import { BookingDetailsModal } from './BookingDetailsModal';

import { completeBooking } from '@/app/(master)/dashboard/bookings/actions';
import { useToast } from '@/lib/toast/context';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'list' | 'timeline' | 'focus';
type TimeRange = 'day' | 'week' | 'month';


export function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const bookingId = searchParams.get('bookingId');

  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  const [view, setView] = useState<ViewMode>('list');
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [anchor, setAnchor] = useState(new Date());
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
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
    <div className="flex flex-col gap-6 lg:gap-10 pb-32">
      {/* 1. Header & Quick Switcher */}
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <h1 
              className="text-[60px] lg:text-[100px] text-foreground font-display transition-all duration-500"
              style={{
                fontFamily: 'var(--font-great-vibes, cursive)',
                fontWeight: 400,
                lineHeight: 0.85,
              }}
            >
              Записи
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground/60 ml-2 lg:ml-4 mt-2 lg:mt-4 font-medium">Керування розкладом та аналітика</p>
          </div>
          
          <div className="flex gap-3 mb-1">
             {/* Quick "New" button on desktop too, but maybe styled more premium */}
            <button
              onClick={() => setFormOpen(true)}
              className="group relative flex items-center gap-2 px-5 py-3 rounded-[20px] bg-foreground text-background font-bold text-sm shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Plus size={18} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">Новий запис</span>
            </button>
          </div>
        </div>

        {/* Pinned Top Stats Row (Desktop Only 4-col) */}
        <div className="hidden lg:block">
           <DashboardWidgets stats={stats} isLoading={isLoading} />
        </div>
        
        {/* Mobile Stats (Existing 2-col) */}
        <div className="lg:hidden">
           <DashboardWidgets stats={stats} isLoading={isLoading} />
        </div>
      </div>

      {/* 2. Controls - Sticky Mobile */}
      <div className="lg:hidden sticky top-[var(--safe-top,0px)] z-40 bg-background/80 backdrop-blur-xl border-b border-muted/10 pb-4 mb-2 -mx-4 px-4 pt-2">
        <div className="flex flex-col gap-3">
          {/* Top row: Date Switcher + Search toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-muted/10 p-1 rounded-xl">
              {['day', 'week', 'month'].map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r as TimeRange)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    timeRange === r ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground/60'
                  }`}
                >
                  {r === 'day' ? 'День' : r === 'week' ? 'Тиж' : 'Місяць'}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setView(view === 'list' ? 'timeline' : 'list')}
                className="p-2.5 rounded-xl bg-muted/5 text-muted-foreground hover:bg-muted/10 transition-colors"
              >
                {view === 'list' ? <Clock size={18} /> : <LayoutList size={18} />}
              </button>
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2.5 rounded-xl transition-colors ${searchOpen ? 'bg-primary/10 text-primary' : 'bg-muted/5 text-muted-foreground'}`}
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Search bar collapse */}
          {searchOpen && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ім'я або телефон клієнта..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/5 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                autoFocus
              />
            </div>
          )}

          {/* Date Navigator */}
          <div className="flex items-center justify-between px-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted/5 rounded-lg text-muted-foreground"><ChevronLeft size={20} /></button>
            <span className="text-sm font-bold text-foreground capitalize">{rangeLabel}</span>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-muted/5 rounded-lg text-muted-foreground"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {/* 3. Main Desktop Custom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        
        {/* Sidebar / Floating Elements (Desktop: Right or Left? Let's go Left for controls) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-[104px]">
          
          {/* Search & Filter - Floating Mica */}
          <div className="widget-card p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest px-1">Пошук клієнта</label>
              <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Ім'я або телефон..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest px-1">Статус запису</label>
              
              <DropdownMenu
                align="left"
                triggerClassName="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold cursor-pointer flex justify-between items-center"
                trigger={
                  <>
                    <span>
                      {statusFilter === 'all' ? 'Усі статуси' : 
                       statusFilter === 'pending' ? 'Очікують' : 
                       statusFilter === 'confirmed' ? 'Підтверджені' : 
                       statusFilter === 'completed' ? 'Завершені' : 'Скасовані'}
                    </span>
                    <ChevronRight size={16} className="rotate-90 text-muted-foreground/40" />
                  </>
                }
                items={[
                  { label: 'Усі статуси', icon: <div className="w-4" />, onClick: () => setStatusFilter('all') },
                  { label: 'Очікують', icon: <div className="w-2 h-2 rounded-full bg-warning" />, onClick: () => setStatusFilter('pending') },
                  { label: 'Підтверджені', icon: <div className="w-2 h-2 rounded-full bg-success" />, onClick: () => setStatusFilter('confirmed') },
                  { label: 'Завершені', icon: <div className="w-2 h-2 rounded-full bg-primary" />, onClick: () => setStatusFilter('completed') },
                  { label: 'Скасовані', icon: <div className="w-2 h-2 rounded-full bg-error" />, onClick: () => setStatusFilter('cancelled') },
                ]}
              />
            </div>
          </div>

          <SharePageCard />
        </div>

        {/* Central Dominant Block */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Main Command Bar (Integrated into Central Block) */}
          <div className="hidden lg:flex widget-card p-4 lg:p-6 flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* View Switcher */}
            <div className="flex p-1.5 rounded-[20px] bg-secondary/30 border border-white/40 backdrop-blur-sm w-full lg:w-auto">
              {[
                { id: 'list', icon: <LayoutList size={16} />, label: 'Список' },
                { id: 'timeline', icon: <Clock size={16} />, label: 'Таймлайн' },
                { id: 'focus', icon: <Zap size={16} />, label: 'Фокус' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setView(m.id as ViewMode)}
                  className={`flex-1 lg:flex-none lg:px-6 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    view === m.id ? 'bg-white shadow-md text-primary scale-105' : 'text-muted-foreground/60 hover:text-muted-foreground'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Date Navigation & Range Switcher */}
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex bg-secondary/30 p-1.5 rounded-[20px] border border-white/40">
                {['day', 'week', 'month'].map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r as TimeRange)}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      timeRange === r ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground/40 hover:text-muted-foreground'
                    }`}
                  >
                    {r === 'day' ? 'День' : r === 'week' ? 'Тиж' : 'Міс'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 px-4 py-2.5 rounded-[20px] bg-white/60 border border-white/80 shadow-sm">
                <button 
                  onClick={() => navigate(-1)} 
                  className="p-1.5 rounded-xl hover:bg-white hover:text-primary transition-all active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-foreground capitalize min-w-[120px] text-center">{rangeLabel}</span>
                <button 
                  onClick={() => navigate(1)} 
                  className="p-1.5 rounded-xl hover:bg-white hover:text-primary transition-all active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Main View Area */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-40"
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                </motion.div>
              ) : filteredBookings.length === 0 && view !== 'timeline' ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6 py-20"
                >
                  <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
                    <CalendarDays size={40} className="text-primary/20" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">Записів не знайдено</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Спробуйте інший статус або дату</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={view}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {view === 'list' && (
                    <div className="flex flex-col gap-10">
                      {groupedBookings.map(([date, dayBookings]) => (
                        <div key={date} className="flex flex-col gap-5">
                          <div className="flex items-center gap-4 px-2">
                            <span className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] whitespace-nowrap">
                              {format(parseISO(date), 'EEEE d MMMM', { locale: uk })}
                            </span>
                            <div className="h-[0.5px] w-full bg-foreground/5" />
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
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
                    <div className="widget-card p-6 min-h-[600px]">
                      {timeRange === 'day' ? (
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
                      )}
                    </div>
                  )}

                  {view === 'focus' && (
                    <div className="max-w-2xl mx-auto">
                       <SmartQueue bookings={filteredBookings} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* 4. Overlays & Toolbars */}
      
      {/* Manual Booking - Now wrapped in MicaModal on Desktop? 
          Actually the component itself handles the rendering. 
          Let's see if we need to wrap it here or inside ManualBookingForm. */}
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

      <BookingDetailsModal />
    </div>
  );
}
