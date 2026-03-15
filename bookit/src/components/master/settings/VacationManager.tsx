'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarOff, Plus, X, Loader2, Umbrella } from 'lucide-react';
import { useVacation } from '@/lib/supabase/hooks/useVacation';

const MONTH_SHORT = ['січ','лют','бер','квіт','трав','черв','лип','серп','вер','жовт','лист','груд'];

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const days = ['нд','пн','вт','ср','чт','пт','сб'];
  return `${days[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export function VacationManager() {
  const { blockedDates, isLoading, addBlockedDate, removeBlockedDate, isAdding } = useVacation();
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function handleAdd() {
    if (!newDate || newDate < today) return;
    addBlockedDate(newDate, newReason);
    setNewDate('');
    setNewReason('');
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Список заблокованих дат */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="text-[#789A99] animate-spin" />
        </div>
      ) : blockedDates.length === 0 ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 text-center">
          <Umbrella size={16} className="text-[#A8928D] flex-shrink-0" />
          <p className="text-xs text-[#A8928D]">Вихідних та відпусток не заплановано</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence>
            {blockedDates.map(bd => (
              <motion.div
                key={bd.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/50"
              >
                <CalendarOff size={13} className="text-[#C05B5B] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2C1A14]">{formatDate(bd.date)}</p>
                  {bd.reason && (
                    <p className="text-[11px] text-[#A8928D] truncate">{bd.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => removeBlockedDate(bd.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-[#A8928D] hover:text-[#C05B5B] hover:bg-[#C05B5B]/10 transition-colors flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Форма додавання */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/60">
              <div>
                <label className="text-[11px] font-medium text-[#6B5750] mb-1 block">Дата</label>
                <input
                  type="date"
                  value={newDate}
                  min={today}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-white/80 text-xs text-[#2C1A14] outline-none focus:border-[#789A99] transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#6B5750] mb-1 block">
                  Причина <span className="text-[#A8928D] font-normal">(необов'язково)</span>
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="Відпустка, лікарня..."
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-white/80 text-xs text-[#2C1A14] placeholder-[#A8928D] outline-none focus:border-[#789A99] transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setNewDate(''); setNewReason(''); }}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-[#A8928D] bg-white/60 hover:bg-white/80 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newDate || newDate < today || isAdding}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#789A99] text-white hover:bg-[#6B8C8B] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Додати
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/60 border border-dashed border-[#C8B8B2] text-xs font-medium text-[#6B5750] hover:bg-white/80 transition-colors w-full"
        >
          <Plus size={13} className="text-[#A8928D]" />
          Додати вихідний або відпустку
        </button>
      )}
    </div>
  );
}
