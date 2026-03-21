'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, Search, Download, Lock } from 'lucide-react';
import { BookingCard } from './BookingCard';
import { ManualBookingForm } from './ManualBookingForm';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { useMasterContext } from '@/lib/supabase/context';
import type { BookingStatus } from '@/types/database';

const STATUS_UA: Record<string, string> = {
  pending: 'Очікує', confirmed: 'Підтверджено',
  completed: 'Завершено', cancelled: 'Скасовано', no_show: 'Не прийшов',
};

function exportToCsv(bookings: BookingWithServices[], label: string) {
  const headers = ['Дата', 'Час початку', 'Час кінця', 'Клієнт', 'Телефон', 'Послуга', 'Ціна', 'Статус'];
  const rows = bookings.map(b => [
    b.date, b.start_time, b.end_time,
    `"${b.client_name}"`, b.client_phone,
    `"${b.services.map(s => s.name).join('; ')}"`,
    b.total_price, STATUS_UA[b.status] ?? b.status,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookings-${label.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 10;

type ViewMode = 'day' | 'week' | 'month';

const STATUS_FILTERS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Всі'           },
  { value: 'pending',   label: 'Очікують'      },
  { value: 'confirmed', label: 'Підтверджені'  },
  { value: 'completed', label: 'Завершені'     },
  { value: 'cancelled', label: 'Скасовані'     },
];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  return r;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const UA_DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];
const UA_MONTHS = [
  'Січень','Лютий','Березень','Квітень','Травень','Червень',
  'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень',
];

export function BookingsPage() {
  const [view, setView] = useState<ViewMode>('day');
  const [anchor, setAnchor] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { masterProfile } = useMasterContext();
  const isPro = masterProfile?.subscription_tier === 'pro' || masterProfile?.subscription_tier === 'studio';

  const { dateFrom, dateTo, label } = useMemo(() => {
    if (view === 'day') {
      const d = toISO(anchor);
      const day = anchor.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
      return { dateFrom: d, dateTo: d, label: day };
    }
    if (view === 'week') {
      const start = startOfWeek(anchor);
      const end = addDays(start, 6);
      const label = `${start.getDate()} — ${end.getDate()} ${UA_MONTHS[end.getMonth()]}`;
      return { dateFrom: toISO(start), dateTo: toISO(end), label };
    }
    // month
    const start = startOfMonth(anchor);
    const end = endOfMonth(anchor);
    return {
      dateFrom: toISO(start),
      dateTo: toISO(end),
      label: `${UA_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`,
    };
  }, [view, anchor]);

  const _bk = useBookings(dateFrom, dateTo);
  const bookings: BookingWithServices[] = _bk.bookings ?? [];
  const { isLoading, error } = _bk;

  const filtered = useMemo(() => {
    let result = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.client_name.toLowerCase().includes(q) || b.client_phone.includes(q)
      );
    }
    return result;
  }, [bookings, statusFilter, search]);

  // Скидаємо пагінацію при зміні фільтрів
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [dateFrom, dateTo, statusFilter, search]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Групуємо по даті для week/month
  const grouped = useMemo(() => {
    if (view === 'day') return null;
    const map = new Map<string, typeof filtered>();
    visibleItems.forEach(b => {
      const arr = map.get(b.date) ?? [];
      arr.push(b);
      map.set(b.date, arr);
    });
    return map;
  }, [visibleItems, view]);

  function navigate(dir: 1 | -1) {
    setAnchor(prev => {
      if (view === 'day')   return addDays(prev, dir);
      if (view === 'week')  return addDays(prev, dir * 7);
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  }

  const today = toISO(new Date());
  const isToday = dateFrom === today && dateTo === today;

  const totalRevenue = filtered
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Хедер */}
      <div id="tour-bookings-header" className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Записи</h1>
        <p className="text-sm text-[#A8928D]">Керуйте розкладом і статусами</p>

        {/* Перемикач виду */}
        <div className="flex gap-2 mt-4">
          {(['day', 'week', 'month'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-2xl text-xs font-medium transition-all ${
                view === v ? 'bg-[#789A99] text-white' : 'bg-white/60 text-[#6B5750] hover:bg-white/80'
              }`}
            >
              {v === 'day' ? 'День' : v === 'week' ? 'Тиждень' : 'Місяць'}
            </button>
          ))}
        </div>

        {/* Навігація */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#2C1A14] capitalize">{label}</p>
            {isToday
              ? <p className="text-[11px] text-[#789A99] font-medium">Сьогодні</p>
              : (
                <button
                  onClick={() => setAnchor(new Date())}
                  className="text-[11px] text-[#789A99] font-medium hover:underline"
                >
                  Повернутись до сьогодні
                </button>
              )
            }
          </div>
          <button
            onClick={() => navigate(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Помилка завантаження */}
      {error && (
        <div className="bento-card p-3 flex items-start gap-2 border border-[#D4935A]/40 bg-[#FFF7F0]">
          <div className="mt-0.5 text-[#D4935A]">
            <AlertTriangle size={16} />
          </div>
          <div className="text-xs text-[#6B5750]">
            <p className="font-semibold">Не вдалося завантажити записи.</p>
            <p className="mt-0.5">
              Перезавантажте сторінку. Якщо проблема повторюється, перевірте підключення до мережі або права доступу (RLS).
            </p>
          </div>
        </div>
      )}

      {/* Пошук */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8928D]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Пошук за клієнтом або телефоном..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
        />
      </div>

      {/* Фільтр статусів + Export */}
      <div id="tour-bookings-filter" className="flex items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 flex-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-[#789A99] text-white'
                  : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* CSV Export (Pro) */}
        {isPro ? (
          <button
            onClick={() => exportToCsv(filtered, label)}
            disabled={filtered.length === 0}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 border border-white/80 text-xs font-medium text-[#6B5750] hover:bg-white transition-all disabled:opacity-40"
          >
            <Download size={12} /> CSV
          </button>
        ) : (
          <button
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 border border-white/80 text-xs font-medium text-[#A8928D] cursor-not-allowed"
            title="Тільки для Pro"
            disabled
          >
            <Lock size={11} /> CSV
          </button>
        )}
      </div>

      {/* Статистика */}
      {filtered.length > 0 && (
        <div className="flex gap-2">
          <div className="flex-1 bento-card p-3 text-center">
            <p className="text-lg font-bold text-[#2C1A14]">{filtered.length}</p>
            <p className="text-[11px] text-[#A8928D]">записів</p>
          </div>
          {totalRevenue > 0 && (
            <div className="flex-1 bento-card p-3 text-center">
              <p className="text-lg font-bold text-[#5C9E7A]">{totalRevenue.toLocaleString('uk-UA')} ₴</p>
              <p className="text-[11px] text-[#A8928D]">завершені</p>
            </div>
          )}
        </div>
      )}

      {/* Список */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bento-card p-10 flex flex-col items-center gap-3"
          >
            <Loader2 size={24} className="text-[#789A99] animate-spin" />
            <p className="text-sm text-[#A8928D]">Завантаження записів...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bento-card p-10 flex flex-col items-center gap-3 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-[#F5E8E3] flex items-center justify-center">
              <CalendarDays size={26} className="text-[#A8928D]" />
            </div>
            <p className="text-sm font-semibold text-[#2C1A14]">Записів немає</p>
            <p className="text-xs text-[#A8928D]">Поділіться своєю сторінкою, щоб отримати перші записи</p>
          </motion.div>
        ) : view === 'day' ? (
          <motion.div key="day-list" className="flex flex-col gap-3">
            {visibleItems.map((b, i) => (
              <Suspense key={b.id}>
                <BookingCard booking={b} index={i} />
              </Suspense>
            ))}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="w-full py-3 rounded-2xl bg-white/70 border border-white/80 text-sm font-medium text-[#789A99] hover:bg-white transition-colors"
              >
                Показати ще ({filtered.length - visibleCount})
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="grouped-list" className="flex flex-col gap-4">
            {[...grouped!.entries()].map(([date, items]) => {
              const d = new Date(date);
              const dayName = UA_DAYS[(d.getDay() + 6) % 7];
              const dayNum = d.getDate();
              const month = UA_MONTHS[d.getMonth()];
              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <p className="text-xs font-semibold text-[#6B5750] capitalize">
                      {dayName}, {dayNum} {month}
                    </p>
                    <div className="flex-1 h-px bg-[#F5E8E3]" />
                    <span className="text-[11px] text-[#A8928D]">{items.length} зап.</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {items.map((b, i) => (
                      <Suspense key={b.id}>
                        <BookingCard booking={b} index={i} />
                      </Suspense>
                    ))}
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="w-full py-3 rounded-2xl bg-white/70 border border-white/80 text-sm font-medium text-[#789A99] hover:bg-white transition-colors"
              >
                Показати ще ({filtered.length - visibleCount})
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 22 }}
        whileTap={{ scale: 0.94 }}
        id="tour-bookings-manual"
        onClick={() => setFormOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#789A99] text-white shadow-lg flex items-center justify-center z-30 hover:bg-[#6B8C8B] transition-colors"
        style={{ boxShadow: '0 4px 20px rgba(120, 154, 153, 0.4)' }}
      >
        <Plus size={24} />
      </motion.button>

      <ManualBookingForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
