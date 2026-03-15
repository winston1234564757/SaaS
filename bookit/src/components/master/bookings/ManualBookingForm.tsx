'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useServices } from '@/lib/supabase/hooks/useServices';
import type { Service } from '@/components/master/services/types';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ManualBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DAY_SHORT = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];
const MONTH_SHORT = ['січ','лют','бер','квіт','трав','черв','лип','серп','вер','жовт','лист','груд'];
const DOW_MAP = ['sun','mon','tue','wed','thu','fri','sat'];

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

function get14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function buildSlots(bookedSet: Set<string>, startH = 9, endH = 18) {
  const slots: { time: string; available: boolean }[] = [];
  for (let h = startH; h < endH; h++) {
    for (const m of [0, 30]) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ time, available: !bookedSet.has(time) });
    }
  }
  return slots;
}

const inputCls = "w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none transition-all focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20";

export function ManualBookingForm({ isOpen, onClose, onSuccess }: ManualBookingFormProps) {
  const { masterProfile } = useMasterContext();
  const { services }: { services: Service[] } = useServices();
  const qc = useQueryClient();

  const [serviceId, setServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Off-day dates for the 14-day strip (from schedule_templates + schedule_exceptions)
  const [offDayDates, setOffDayDates] = useState<Set<string>>(new Set());
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const days = get14Days();
  const activeServices = services.filter(s => s.active);
  const selectedService = activeServices.find(s => s.id === serviceId);

  // Load off-day data when form opens
  useEffect(() => {
    if (!isOpen) return;

    setServiceId(activeServices[0]?.id ?? '');
    setSelectedDate(null);
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setNotes('');
    setError('');
    setOffDayDates(new Set());
    setScheduleLoading(true);

    if (!masterProfile?.id) { setScheduleLoading(false); return; }

    const supabase = createClient();
    const from = toISO(days[0]);
    const to   = toISO(days[days.length - 1]);

    Promise.all([
      // All schedule templates → find non-working weekdays
      supabase
        .from('schedule_templates')
        .select('day_of_week, is_working')
        .eq('master_id', masterProfile.id),
      // One-off day-off exceptions in the 14-day window
      supabase
        .from('schedule_exceptions')
        .select('date')
        .eq('master_id', masterProfile.id)
        .eq('is_day_off', true)
        .gte('date', from)
        .lte('date', to),
    ]).then(([tmplRes, excRes]) => {
      // Which weekdays are non-working?
      const nonWorkingDows = new Set<string>(
        (tmplRes.data ?? [])
          .filter((r: any) => r.is_working === false)
          .map((r: any) => r.day_of_week as string)
      );

      const offDates = new Set<string>();
      // Map non-working weekdays to actual dates in the strip
      days.forEach(d => {
        if (nonWorkingDows.has(DOW_MAP[d.getDay()])) offDates.add(toISO(d));
      });
      // Add one-off exceptions
      (excRes.data ?? []).forEach((r: any) => offDates.add(r.date as string));

      setOffDayDates(offDates);
      setScheduleLoading(false);
    });
  }, [isOpen]);

  // Load time slots when date is selected
  useEffect(() => {
    if (!selectedDate || !masterProfile?.id) return;

    // Already a known day off — clear slots
    if (offDayDates.has(toISO(selectedDate))) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);
    setSelectedTime('');
    const supabase = createClient();
    const dayOfWeek = DOW_MAP[selectedDate.getDay()];
    const dateStr = toISO(selectedDate);

    Promise.all([
      // Template: hours + break + is_working
      supabase
        .from('schedule_templates')
        .select('start_time, end_time, is_working, break_start, break_end')
        .eq('master_id', masterProfile.id)
        .eq('day_of_week', dayOfWeek)
        .single(),
      // Existing bookings for this date
      supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('master_id', masterProfile.id)
        .eq('date', dateStr)
        .neq('status', 'cancelled'),
      // One-off exception (may override hours or mark day off)
      supabase
        .from('schedule_exceptions')
        .select('is_day_off, start_time, end_time')
        .eq('master_id', masterProfile.id)
        .eq('date', dateStr)
        .maybeSingle(),
    ]).then(([schedRes, bookRes, excRes]) => {
      const tpl = schedRes.data;
      const exc = excRes.data;

      // Day off check (catch race condition)
      const isDayOff = exc?.is_day_off === true || (tpl ? !tpl.is_working : false);
      if (isDayOff) {
        setOffDayDates(prev => new Set([...prev, dateStr]));
        setSlots([]);
        setSlotsLoading(false);
        return;
      }

      // Working hours: exception overrides template
      const startH = exc?.start_time
        ? parseInt(exc.start_time.slice(0, 2))
        : tpl ? parseInt(tpl.start_time.slice(0, 2)) : 9;
      const endH = exc?.end_time
        ? parseInt(exc.end_time.slice(0, 2))
        : tpl ? parseInt(tpl.end_time.slice(0, 2)) : 18;

      const bookedSet = new Set<string>();

      // Existing bookings
      (bookRes.data ?? []).forEach((b: { start_time: string; end_time: string }) => {
        const [sh, sm] = b.start_time.slice(0, 5).split(':').map(Number);
        const [eh, em] = b.end_time.slice(0, 5).split(':').map(Number);
        let cur = sh * 60 + sm;
        const end = eh * 60 + em;
        while (cur < end) {
          bookedSet.add(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
          cur += 30;
        }
      });

      // Break time
      if (tpl?.break_start && tpl?.break_end) {
        const [bsh, bsm] = tpl.break_start.slice(0, 5).split(':').map(Number);
        const [beh, bem] = tpl.break_end.slice(0, 5).split(':').map(Number);
        let cur = bsh * 60 + bsm;
        const end = beh * 60 + bem;
        while (cur < end) {
          bookedSet.add(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
          cur += 30;
        }
      }

      setSlots(buildSlots(bookedSet, startH, endH));
      setSlotsLoading(false);
    });
  }, [selectedDate, masterProfile?.id, offDayDates]);

  async function handleSave() {
    if (!selectedService || !selectedDate || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
      setError('Заповніть всі обовʼязкові поля');
      return;
    }
    setSaving(true);
    setError('');

    const supabase = createClient();
    const dateStr = toISO(selectedDate);
    const [sh, sm] = selectedTime.split(':').map(Number);
    const endMin = sh * 60 + sm + selectedService.duration;
    const endTime = `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;

    const { data: booking, error: err } = await supabase
      .from('bookings')
      .insert({
        master_id: masterProfile!.id,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        date: dateStr,
        start_time: selectedTime,
        end_time: endTime,
        status: 'confirmed',
        total_services_price: selectedService.price,
        total_price: selectedService.price,
        notes: notes.trim() || null,
        source: 'manual',
      })
      .select().single();

    if (!err && booking) {
      await supabase.from('booking_services').insert({
        booking_id: booking.id,
        service_id: selectedService.id,
        service_name: selectedService.name,
        service_price: selectedService.price,
        duration_minutes: selectedService.duration,
      });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['weekly-overview'] });
    }

    setSaving(false);
    if (err) {
      setError('Помилка збереження. Спробуйте ще раз.');
    } else {
      onSuccess?.();
      onClose();
    }
  }

  const canSave = !!serviceId && !!selectedDate && !!selectedTime && clientName.trim().length >= 2 && clientPhone.trim().length >= 9;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Новий запис">
      <div className="flex flex-col gap-5">

        {/* Послуга */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">Послуга *</p>
          <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
            {activeServices.map(s => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all ${
                  serviceId === s.id
                    ? 'bg-[#789A99]/10 border-[#789A99]/40'
                    : 'bg-white/60 border-white/80 hover:bg-white/80'
                }`}
              >
                <span className="text-xl flex-shrink-0">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2C1A14] truncate">{s.name}</p>
                  <p className="text-xs text-[#A8928D]">{s.duration} хв · {s.price.toLocaleString('uk-UA')} ₴</p>
                </div>
                {serviceId === s.id && (
                  <div className="w-4 h-4 rounded-full bg-[#789A99] flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Дата */}
        <div>
          <p className="text-xs font-medium text-[#6B5750] mb-2">Дата *</p>
          {scheduleLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="text-[#789A99] animate-spin" />
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {days.map((d, i) => {
                const isSelected = selectedDate?.toDateString() === d.toDateString();
                const isToday    = d.toDateString() === new Date().toDateString();
                const isOff      = offDayDates.has(toISO(d));
                return (
                  <button
                    key={i}
                    disabled={isOff}
                    onClick={() => { if (!isOff) { setSelectedDate(d); setSelectedTime(''); } }}
                    className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl flex-shrink-0 min-w-[48px] transition-all ${
                      isOff
                        ? 'bg-white/40 border border-dashed border-[#E8D5CF] cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#789A99] text-white shadow-[0_4px_14px_rgba(120,154,153,0.35)]'
                        : 'bg-white/70 border border-white/80 text-[#2C1A14] hover:bg-white/90'
                    }`}
                  >
                    <span className={`text-[10px] font-medium ${isOff ? 'text-[#C8B8B2]' : isSelected ? 'text-white/80' : 'text-[#A8928D]'}`}>
                      {isToday && !isOff ? 'Сьогодні' : DAY_SHORT[d.getDay()]}
                    </span>
                    <span className={`text-sm font-bold leading-none ${isOff ? 'text-[#C8B8B2]' : ''}`}>
                      {d.getDate()}
                    </span>
                    {isOff ? (
                      <span className="text-[9px] font-semibold text-[#C8B8B2] bg-[#F0E4DE] rounded-full px-1 py-0.5 leading-none">
                        вих.
                      </span>
                    ) : (
                      <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#A8928D]'}`}>
                        {MONTH_SHORT[d.getMonth()]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Час */}
        {selectedDate && (
          <div>
            <p className="text-xs font-medium text-[#6B5750] mb-2">Час *</p>
            {offDayDates.has(toISO(selectedDate)) ? (
              <div className="flex flex-col items-center gap-1.5 py-5 rounded-2xl bg-[#F5E8E3]/60 border border-dashed border-[#E8D5CF]">
                <span className="text-xl">😴</span>
                <p className="text-sm font-semibold text-[#6B5750]">Вихідний день</p>
                <p className="text-xs text-[#A8928D]">Оберіть інший день</p>
              </div>
            ) : slotsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={18} className="text-[#789A99] animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-5 rounded-2xl bg-[#F5E8E3]/60 border border-dashed border-[#E8D5CF]">
                <span className="text-xl">📅</span>
                <p className="text-sm font-semibold text-[#6B5750]">Немає доступних слотів</p>
                <p className="text-xs text-[#A8928D]">Всі слоти зайняті або день вихідний</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      !slot.available
                        ? 'bg-white/30 text-[#C8B8B2] cursor-not-allowed line-through'
                        : selectedTime === slot.time
                        ? 'bg-[#789A99] text-white'
                        : 'bg-white/70 border border-white/80 text-[#2C1A14] hover:bg-white/90'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Клієнт */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Ім'я клієнта *</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="Олена Петрова" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Телефон *</label>
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
              placeholder="+380 XX XXX XX XX" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Нотатки</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Побажання клієнта або нотатки для себе..."
              rows={2} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {error && <p className="text-xs text-[#C05B5B] text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            canSave && !saving
              ? 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
              : 'bg-[#E8D5CF] text-[#A8928D] cursor-not-allowed'
          }`}
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Збереження...</> : 'Зберегти запис'}
        </button>
      </div>
    </BottomSheet>
  );
}
