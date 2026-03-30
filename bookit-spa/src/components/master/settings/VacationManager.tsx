import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Umbrella, Sun, Clock } from 'lucide-react';
import { useTimeOff, type TimeOffType, type TimeOffEntry } from '@/lib/supabase/hooks/useTimeOff';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

// ── Хелпери ───────────────────────────────────────────────────────────────────

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const result = format(new Date(y, m - 1, d), 'd MMMM yyyy', { locale: uk });
  return result;
}

function entryLabel(e: TimeOffEntry): string {
  if (e.type === 'vacation') {
    if (e.startDate === e.endDate) return formatDate(e.startDate);
    return `${formatDate(e.startDate)} — ${formatDate(e.endDate)}`;
  }
  return formatDate(e.startDate);
}

function entrySubLabel(e: TimeOffEntry): string {
  if (e.type === 'vacation')  return 'Відпустка';
  if (e.type === 'day_off')   return 'Вихідний';
  if (e.type === 'short_day') return `Короткий день · ${e.startTime}–${e.endTime}`;
  return '';
}

const TYPE_ICONS: Record<TimeOffType, React.FC<{ size?: number; className?: string }>> = {
  vacation:  Umbrella,
  day_off:   Sun,
  short_day: Clock,
};

const TYPE_COLOR: Record<TimeOffType, string> = {
  vacation:  '#789A99',
  day_off:   '#D4935A',
  short_day: '#5C9E7A',
};

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const;

// ── Компонент ─────────────────────────────────────────────────────────────────

export function VacationManager() {
  const { entries, isLoading, add, remove, isAdding, addError } = useTimeOff();

  const today = todayStr();

  // ── Форма стан ────────────────────────────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [type, setType]               = useState<TimeOffType>('day_off');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [startTime, setStartTime]     = useState('09:00');
  const [endTime, setEndTime]         = useState('14:00');

  function resetForm() {
    setShowForm(false);
    setType('day_off');
    setStartDate('');
    setEndDate('');
    setStartTime('09:00');
    setEndTime('14:00');
  }

  function isFormValid(): boolean {
    if (!startDate || startDate < today) return false;
    if (type === 'vacation' && (!endDate || endDate < startDate)) return false;
    if (type === 'short_day' && (!startTime || !endTime || startTime >= endTime)) return false;
    return true;
  }

  function handleAdd() {
    if (!isFormValid()) return;
    add({
      type,
      startDate,
      endDate: type === 'vacation' ? endDate : startDate,
      startTime: type === 'short_day' ? startTime : undefined,
      endTime:   type === 'short_day' ? endTime   : undefined,
    });
    resetForm();
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl bg-white/80 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99] transition-colors';
  const labelClass = 'text-[11px] font-medium text-[#6B5750] mb-1 block';

  // ── Типи ──────────────────────────────────────────────────────────────────
  const TYPES: { key: TimeOffType; label: string }[] = [
    { key: 'day_off',   label: 'Вихідний' },
    { key: 'vacation',  label: 'Відпустка' },
    { key: 'short_day', label: 'Короткий день' },
  ];

  return (
    <div className="flex flex-col gap-3">

      {/* ── Список активних винятків ──────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col gap-1.5">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/50 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-[#F0E4DE] flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-28 rounded bg-[#F0E4DE]" />
                <div className="h-2.5 w-16 rounded bg-[#F0E4DE]" />
              </div>
              <div className="w-6 h-6 rounded-lg bg-[#F0E4DE]" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50">
          <Umbrella size={15} className="text-[#A8928D] flex-shrink-0" />
          <p className="text-xs text-[#A8928D]">
            Запорука якісної роботи — якісний відпочинок)
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence>
            {entries.map(e => {
              const Icon = TYPE_ICONS[e.type];
              const color = TYPE_COLOR[e.type];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={SPRING}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/50"
                >
                  <span style={{ color }} className="flex-shrink-0 flex items-center"><Icon size={13} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#2C1A14] leading-tight">
                      {entryLabel(e)}
                    </p>
                    <p className="text-[11px] text-[#A8928D]">{entrySubLabel(e)}</p>
                  </div>
                  <button
                    onClick={() => remove(e.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-[#A8928D] hover:text-[#C05B5B] hover:bg-[#C05B5B]/10 transition-colors flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Форма додавання ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 p-3 rounded-2xl bg-white/60">

              {/* Перемикач типу */}
              <div>
                <p className={labelClass}>Тип</p>
                <div className="flex gap-1.5">
                  {TYPES.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key)}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                        type === t.key
                          ? 'bg-[#789A99] text-white border-[#789A99]'
                          : 'bg-white/70 text-[#6B5750] border-white/80 hover:border-[#789A99]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Поля дат */}
              {type === 'vacation' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Початок</label>
                    <input
                      type="date" value={startDate} min={today}
                      onChange={e => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Кінець</label>
                    <input
                      type="date" value={endDate} min={startDate || today}
                      onChange={e => setEndDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Дата</label>
                  <input
                    type="date" value={startDate} min={today}
                    onChange={e => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Час — тільки для короткого дня */}
              {type === 'short_day' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Початок роботи</label>
                    <input
                      type="time" value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Кінець роботи</label>
                    <input
                      type="time" value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Помилка */}
              {addError && (
                <p className="text-[11px] text-[#C05B5B]">{addError}</p>
              )}

              {/* Кнопки */}
              <div className="flex gap-2">
                <button
                  onClick={resetForm}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-[#A8928D] bg-white/60 hover:bg-white/80 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!isFormValid() || isAdding}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#789A99] text-white hover:bg-[#6B8C8B] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Зберегти
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Кнопка відкриття форми ────────────────────────────────────────── */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/60 border border-dashed border-[#C8B8B2] text-xs font-medium text-[#6B5750] hover:bg-white/80 transition-colors w-full"
        >
          <Plus size={13} className="text-[#A8928D]" />
          Додати виняток з розкладу
        </button>
      )}

    </div>
  );
}
