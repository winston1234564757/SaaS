'use client';

import { useState, useMemo } from 'react';
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
import { useTour } from '@/lib/hooks/useTour';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';
import { DESTINATION_TOURS } from '@/components/master/onboarding/destinationTours';
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
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';
import {
  format,
  parseISO,
  startOfWeek,
  eachDayOfInterval,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { uk } from 'date-fns/locale';

import { BookingDetailsModal } from './BookingDetailsModal';

type ViewMode = 'list' | 'timeline' | 'focus';
type TimeRange = 'day' | 'week' | 'month';

const SPRING = { type: 'spring' as const, duration: 0.35, bounce: 0 };

// Uses local date parts to avoid UTC drift in UTC+ timezones
const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// humanized
const BOOKINGS_STEPS: TourStep[] = [
  {
    title: 'Записи',
    text: 'Всі записи в одному місці — день, тиждень або місяць. Переключай вигляд як зручно.',
    tourKey: 'bok-header',
  },
  {
    title: 'Статистика',
    text: 'Виручка, кількість записів і завантаженість — завжди перед очима.',
    tourKey: 'bok-stats',
  },
  {
    title: 'Список записів',
    text: 'Клікни на запис щоб переглянути деталі, підтвердити або скасувати.',
    tourKey: 'bok-list',
  },
  {
    title: 'Записи готові',
    text: 'Новий запис — кнопка вгорі. Таймлайн покаже твій день по годинах.',
  },
];

export function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { masterProfile } = useMasterContext();

  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('bookings_v1', BOOKINGS_STEPS.length + 1, {
    initialSeen: !!(seenTours?.['bookings_v1']),
    masterId: masterProfile?.id ?? '',
  });
  const nextTours = DESTINATION_TOURS.filter(d => !seenTours?.[d.tourKey] && d.tourKey !== 'bookings_v1').slice(0, 3).map(d => ({ icon: d.icon, label: d.label, href: d.href }));
  // humanized — navigator step
  const dynamicSteps: TourStep[] = [...BOOKINGS_STEPS, { title: 'Записи розібрали', text: 'Є ще де походити.', isNavigator: true, links: nextTours }];

  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  const view = (searchParams.get('view') ?? 'list') as ViewMode;
  const timeRange = (searchParams.get('range') ?? 'day') as TimeRange;
  const anchor = useMemo(() => {
    const d = searchParams.get('date');
    if (d) { try { return parseISO(d); } catch { /* ignore */ } }
    return new Date();
  }, [searchParams]);
  const statusFilter = searchParams.get('status') ?? 'all';

  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [preselectedTime, setPreselectedTime]               = useState<string | undefined>();
  const [preselectedDate, setPreselectedDate]               = useState<string | undefined>();
  const [preselectedClientId, setPreselectedClientId]       = useState<string | undefined>();
  const [preselectedClientName, setPreselectedClientName]   = useState<string | undefined>();
  const [preselectedClientPhone, setPreselectedClientPhone] = useState<string | undefined>();

  const setUrl = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) p.delete(k); else p.set(k, v);
    });
    router.replace(`?${p.toString()}`, { scroll: false });
  };

  useUrlActionBus('booking:create', ({ clientId, date, startTime }) => {
    setPreselectedClientId(clientId);
    setPreselectedDate(date);
    setPreselectedTime(startTime);
    if (date) setUrl({ date });
    setFormOpen(true);
  });

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
    return toLocalDateStr(d);
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
    return toLocalDateStr(d);
  }, [anchor, timeRange]);

  const { bookings, stats, isLoading } = useBookingsDashboardLogic(dateFrom, dateTo);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch =
        b.client_name.toLowerCase().includes(search.toLowerCase()) ||
        b.client_phone.includes(search);
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

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
    const dateStr = toLocalDateStr(anchor);
    if (action === 'booking') {
      setPreselectedDate(dateStr);
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
    const end   = timeRange === 'week' ? endOfWeek(anchor, { weekStartsOn: 1 })   : endOfMonth(anchor);
    return eachDayOfInterval({ start, end });
  }, [anchor, timeRange]);

  const navigate = (dir: 1 | -1) => {
    const d = new Date(anchor);
    if (timeRange === 'day') d.setDate(d.getDate() + dir);
    else if (timeRange === 'week') d.setDate(d.getDate() + dir * 7);
    else { d.setDate(1); d.setMonth(d.getMonth() + dir); }
    setUrl({ date: toLocalDateStr(d) });
  };

  const dayWorkHours = useMemo(() => {
    const wh = masterProfile?.working_hours as unknown as Record<string, { is_working: boolean; start_time: string; end_time: string }> | null;
    const key = DAY_KEYS[anchor.getDay()];
    return {
      workStart:    wh?.[key]?.is_working ? wh[key].start_time : '09:00',
      workEnd:      wh?.[key]?.is_working ? wh[key].end_time   : '18:00',
      isWorkingDay: wh?.[key]?.is_working ?? true,
    };
  }, [masterProfile?.working_hours, anchor]);

  const rangeLabel = useMemo(() => {
    if (timeRange === 'day') return format(anchor, 'EEEE d MMMM', { locale: uk });
    if (timeRange === 'month') return format(anchor, 'LLLL yyyy', { locale: uk });
    const from = parseISO(dateFrom);
    const to   = parseISO(dateTo);
    return `${format(from, 'd MMM', { locale: uk })} — ${format(to, 'd MMM', { locale: uk })}`;
  }, [anchor, timeRange, dateFrom, dateTo]);

  const [prevNavLabel, nextNavLabel] =
    timeRange === 'day'
      ? ['Попередній день', 'Наступний день']
      : timeRange === 'week'
      ? ['Попередній тиждень', 'Наступний тиждень']
      : ['Попередній місяць', 'Наступний місяць'];

  const trLabels: Record<TimeRange, string> = { day: 'День', week: 'Тиж', month: 'Місяць' };
  const trLabelsMobile: Record<TimeRange, string> = { day: 'День', week: 'Тиж', month: 'Міс' };

  return (
    <div className="flex flex-col gap-6 lg:gap-10 pb-32 [overflow-x:clip]">
      {/* 1. Header & Quick Switcher */}
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex items-end justify-between" data-tour-key="bok-header">
          <div className="flex flex-col">
            <h1
              className="text-[60px] lg:text-[100px] text-foreground font-display"
              style={{
                fontFamily: 'var(--font-great-vibes, cursive)',
                fontWeight: 400,
                lineHeight: 0.85,
              }}
            >
              Записи
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground/60 ml-2 lg:ml-4 mt-2 lg:mt-4 font-medium">
              Керування розкладом та аналітика
            </p>
          </div>

          <div className="flex gap-3 mb-1">
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="group relative flex items-center gap-2 px-5 py-3 rounded-[20px] bg-foreground text-background font-bold text-sm shadow-xl shadow-black/10 transition-colors hover:scale-105 active:scale-[0.95] cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Plus size={18} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">Новий запис</span>
            </button>
          </div>
        </div>

        <div data-tour-key="bok-stats">
          <DashboardWidgets stats={stats} isLoading={isLoading} />
        </div>
      </div>

      {/* 2. Controls — Mobile */}
      <div className="lg:hidden widget-card p-4 flex flex-col gap-3">

        {/* Top row: Range + View */}
        <div className="flex items-center justify-between gap-2">

          {/* Time Range Switcher */}
          <div className="flex bg-secondary/30 border border-border p-1 rounded-xl">
            {(['day', 'week', 'month'] as const).map(r => (
              <button
                key={r}
                type="button"
                aria-pressed={timeRange === r}
                onClick={() => setUrl({ range: r })}
                className={`px-3 min-h-[44px] flex items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wider active:scale-[0.88] cursor-pointer transition-colors duration-150 ${
                  timeRange === r
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground/60'
                }`}
              >
                {trLabels[r]}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div className="flex p-1 rounded-xl bg-secondary/30 border border-border">
            {(
              [
                { id: 'list'     as const, icon: <LayoutList size={14} />, label: 'Список' },
                { id: 'timeline' as const, icon: <Clock size={14} />,      label: 'Таймлайн' },
                { id: 'focus'    as const, icon: <Zap size={14} />,        label: 'Фокус' },
              ] as const
            ).map(m => (
              <button
                key={m.id}
                type="button"
                aria-pressed={view === m.id}
                aria-label={m.label}
                onClick={() => setUrl({ view: m.id })}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg active:scale-[0.88] cursor-pointer transition-colors duration-150 ${
                  view === m.id ? 'bg-secondary text-primary shadow-sm' : 'text-muted-foreground/60'
                }`}
              >
                {m.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Search input — always visible */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ім'я або телефон клієнта..."
            aria-label="Пошук клієнта за ім'ям або телефоном"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border text-sm focus:bg-secondary focus:ring-4 focus:ring-primary/5 transition duration-150 outline-none font-medium"
          />
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            aria-label={prevNavLabel}
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary rounded-lg text-muted-foreground active:scale-[0.88] cursor-pointer transition-colors duration-150"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-foreground capitalize">{rangeLabel}</span>
          <button
            type="button"
            aria-label={nextNavLabel}
            onClick={() => navigate(1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary rounded-lg text-muted-foreground active:scale-[0.88] cursor-pointer transition-colors duration-150"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 3. Main Desktop Custom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

        {/* Sidebar (Desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-[104px]">

          <div className="widget-card p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-1">
                Пошук клієнта
              </p>
              <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors duration-150" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Ім'я або телефон..."
                  aria-label="Пошук клієнта за ім'ям або телефоном"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/60 border border-border text-sm focus:bg-secondary focus:ring-4 focus:ring-primary/5 transition duration-150 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-1">
                Статус запису
              </p>
              <DropdownMenu
                align="left"
                triggerClassName="w-full px-4 py-3 rounded-2xl bg-secondary/60 border border-border text-sm focus:bg-secondary focus:ring-4 focus:ring-primary/5 transition duration-150 outline-none font-bold cursor-pointer flex justify-between items-center"
                trigger={
                  <>
                    <span>
                      {statusFilter === 'all'       ? 'Усі статуси'   :
                       statusFilter === 'pending'   ? 'Очікують'      :
                       statusFilter === 'confirmed' ? 'Підтверджені'  :
                       statusFilter === 'completed' ? 'Завершені'     : 'Скасовані'}
                    </span>
                    <ChevronRight size={16} className="rotate-90 text-muted-foreground/40" />
                  </>
                }
                items={[
                  { label: 'Усі статуси',  icon: <div className="w-4" />,                               onClick: () => setUrl({ status: null }) },
                  { label: 'Очікують',     icon: <div className="size-2 rounded-full bg-warning" />,    onClick: () => setUrl({ status: 'pending' }) },
                  { label: 'Підтверджені', icon: <div className="size-2 rounded-full bg-success" />,    onClick: () => setUrl({ status: 'confirmed' }) },
                  { label: 'Завершені',    icon: <div className="size-2 rounded-full bg-primary" />,    onClick: () => setUrl({ status: 'completed' }) },
                  { label: 'Скасовані',   icon: <div className="size-2 rounded-full bg-destructive" />, onClick: () => setUrl({ status: 'cancelled' }) },
                ]}
              />
            </div>
          </div>

          <SharePageCard />
        </div>

        {/* Central Block */}
        <div className="lg:col-span-9 flex flex-col gap-6">

          {/* Command Bar (Desktop) */}
          <div className="hidden lg:flex widget-card p-4 lg:p-6 flex-col lg:flex-row items-center justify-between gap-4">

            {/* View Switcher */}
            <div className="flex p-1.5 rounded-[20px] bg-secondary/30 border border-border backdrop-blur-sm w-full lg:w-auto">
              {(
                [
                  { id: 'list'     as const, icon: <LayoutList size={16} />, label: 'Список' },
                  { id: 'timeline' as const, icon: <Clock size={16} />,      label: 'Таймлайн' },
                  { id: 'focus'    as const, icon: <Zap size={16} />,        label: 'Фокус' },
                ] as const
              ).map(m => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={view === m.id}
                  onClick={() => setUrl({ view: m.id })}
                  className={`flex-1 lg:flex-none lg:px-6 flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold active:scale-[0.88] cursor-pointer transition-colors duration-150 ${
                    view === m.id
                      ? 'bg-secondary text-primary shadow-md'
                      : 'text-muted-foreground/60 hover:text-muted-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {m.icon}
                    <span>{m.label}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Date Navigation & Range Switcher */}
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">

              {/* Time Range Switcher (desktop) */}
              <div className="flex bg-secondary/30 p-1.5 rounded-[20px] border border-border">
                {(['day', 'week', 'month'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={timeRange === r}
                    onClick={() => setUrl({ range: r })}
                    className={`px-4 min-h-[44px] flex items-center justify-center rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-[0.88] cursor-pointer transition-colors duration-150 ${
                      timeRange === r
                        ? 'bg-foreground text-background shadow-lg'
                        : 'text-muted-foreground/40 hover:text-muted-foreground'
                    }`}
                  >
                    {trLabelsMobile[r]}
                  </button>
                ))}
              </div>

              {/* Date Navigator (desktop) */}
              <div className="flex items-center gap-4 px-4 py-2.5 rounded-[20px] bg-secondary/60 border border-border shadow-sm">
                <button
                  type="button"
                  aria-label={prevNavLabel}
                  onClick={() => navigate(-1)}
                  className="p-1.5 rounded-xl hover:bg-secondary hover:text-primary transition-colors duration-150 active:scale-[0.88] cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-foreground capitalize min-w-[120px] text-center">
                  {rangeLabel}
                </span>
                <button
                  type="button"
                  aria-label={nextNavLabel}
                  onClick={() => navigate(1)}
                  className="p-1.5 rounded-xl hover:bg-secondary hover:text-primary transition-colors duration-150 active:scale-[0.88] cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Main View Area */}
          <div className="min-h-[500px] lg:widget-card lg:p-6" data-tour-key="bok-list">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-40"
                  transition={SPRING}
                >
                  <div className="size-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                </motion.div>
              ) : filteredBookings.length === 0 && view !== 'timeline' ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6 py-20"
                  transition={SPRING}
                >
                  <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center">
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
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={SPRING}
                >
                  {view === 'list' && (
                    <div className="flex flex-col gap-10">
                      {groupedBookings.map(([date, dayBookings]) => (
                        <div key={date} className="flex flex-col gap-5">
                          <div className="flex items-center gap-4 px-2">
                            <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em] whitespace-nowrap">
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
                    <div className="min-h-[600px]">
                      {timeRange === 'day' ? (
                        <VerticalTimeline
                          bookings={bookings}
                          date={toLocalDateStr(anchor)}
                          workStart={dayWorkHours.workStart}
                          workEnd={dayWorkHours.workEnd}
                          isWorkingDay={dayWorkHours.isWorkingDay}
                          bufferMinutes={masterProfile?.working_hours?.buffer_time_minutes ?? 0}
                          breaks={masterProfile?.working_hours?.breaks ?? []}
                          onOpportunityClick={(time) => { setOpportunityTime(time); setOpportunityOpen(true); }}
                        />
                      ) : timeRange === 'week' ? (
                        <PeriodAnalyticsView
                          bookings={bookings}
                          days={daysInRange}
                          onDayClick={(date) => setUrl({ date: toLocalDateStr(date), range: 'day' })}
                        />
                      ) : (
                        <MonthlyAnalyticsView
                          bookings={bookings}
                          month={anchor}
                          onDayClick={(date) => setUrl({ date: toLocalDateStr(date), range: 'day' })}
                          onWeekClick={(date) => setUrl({ date: toLocalDateStr(date), range: 'week' })}
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

      {/* 4. Overlays */}
      <ManualBookingForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setPreselectedTime(undefined);
          setPreselectedDate(undefined);
          setPreselectedClientId(undefined);
          setPreselectedClientName(undefined);
          setPreselectedClientPhone(undefined);
        }}
        initialTime={preselectedTime}
        initialDate={preselectedDate ?? toLocalDateStr(anchor)}
        initialClientId={preselectedClientId}
        initialClientName={preselectedClientName}
        initialClientPhone={preselectedClientPhone}
      />

      <OpportunityMenu
        isOpen={opportunityOpen}
        onClose={() => setOpportunityOpen(false)}
        time={opportunityTime}
        onAction={handleOpportunityAction}
      />

      <BookingDetailsModal />

      <TourBanner steps={dynamicSteps} currentStep={currentStep} onNext={nextStep} onClose={closeTour} />
    </div>
  );
}
