'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle2, X } from 'lucide-react';
import { useClients, type ClientRow } from '@/lib/supabase/hooks/useClients';
import type { FieldErrors } from 'react-hook-form';
import type { BookingClientData } from '@/lib/validations/booking';

interface ClientComboboxProps {
  errors: FieldErrors<BookingClientData>;
  watchName: string;
  watchPhone: string;
  setValue: (field: keyof BookingClientData, value: string, opts?: { shouldValidate?: boolean }) => void;
  onClientSelect: (client: ClientRow | null) => void;
}

export function ClientCombobox({ errors, watchName, watchPhone, setValue, onClientSelect }: ClientComboboxProps) {
  const { clients, isLoading } = useClients();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(watchName); // ← init від watchName, не від ''
  const [isPreSelected, setIsPreSelected] = useState(!!watchName); // ← true якщо prefill
  const containerRef = useRef<HTMLDivElement>(null);

  // Синхронізуємо query з watchName при кожній зміні (важливо для prefill через resetForm)
  useEffect(() => {
    setQuery(watchName);
    setIsPreSelected(!!watchName);
  }, [watchName]);

  const filtered = query.trim().length >= 1
    ? clients.filter(c =>
        c.client_name.toLowerCase().includes(query.toLowerCase()) ||
        c.client_phone.includes(query)
      ).slice(0, 7)
    : [];

  const showDropdown = open && query.trim().length >= 1 && !isLoading;

  function handleChange(val: string) {
    setQuery(val);
    setIsPreSelected(false);
    setValue('clientName', val, { shouldValidate: true });
    onClientSelect(null);
  }

  function clearPreSelected() {
    setIsPreSelected(false);
    setQuery('');
    setValue('clientName', '', { shouldValidate: false });
    setValue('clientPhone', '', { shouldValidate: false });
    onClientSelect(null);
  }

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('380') && digits.length >= 12) return '+' + digits.slice(0, 12);
    if (digits.startsWith('38') && digits.length >= 11)  return '+' + digits.slice(0, 12);
    if (digits.startsWith('0') && digits.length >= 10)   return '+38' + digits.slice(0, 10);
    if (digits.length === 9)                              return '+380' + digits;
    return raw;
  }

  function handleSelect(c: ClientRow) {
    setQuery(c.client_name);
    setIsPreSelected(true);
    setValue('clientName', c.client_name, { shouldValidate: true });
    setValue('clientPhone', normalizePhone(c.client_phone), { shouldValidate: true });
    onClientSelect(c);
    setOpen(false);
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {isPreSelected ? (
        /* ── Клієнт вже обраний — показуємо чіп ── */
        <div className="flex items-center gap-3 h-12 px-3 rounded-xl bg-success/8 border border-success/25">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{watchName}</p>
            {watchPhone && (
              <p className="text-[11px] text-muted-foreground/60 leading-none mt-0.5">{watchPhone}</p>
            )}
          </div>
          <button
            type="button"
            onClick={clearPreSelected}
            className="p-1 rounded-lg hover:bg-black/6 text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
            title="Змінити клієнта"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* ── Search input ── */
        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
          <input
            data-testid="wizard-name-input"
            type="text"
            value={query}
            autoComplete="off"
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Олена Петрова або +380..."
            className={`w-full h-12 pl-9 pr-4 rounded-xl bg-white/75 border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all ${
              errors.clientName
                ? 'border-destructive focus:ring-[#C05B5B]/20'
                : 'border-white/80 focus:border-primary focus:ring-2 focus:ring-[#789A99]/20'
            }`}
          />
        </div>
      )}
      {errors.clientName && (
        <p className="text-destructive text-[10px] mt-1 ml-1">{errors.clientName.message}</p>
      )}

      {showDropdown && (filtered.length > 0 || query.trim().length >= 2) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-2xl bg-white/97 border border-[#F0DDD8] shadow-xl backdrop-blur-sm overflow-hidden">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/8 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {c.is_vip ? '⭐' : (c.client_name[0]?.toUpperCase() ?? '?')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{c.client_name}</p>
                <p className="text-[11px] text-muted-foreground/60">{c.client_phone}</p>
              </div>
              {c.is_vip && (
                <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full shrink-0">
                  VIP
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-xs text-muted-foreground/60">
              Новий клієнт:{' '}
              <span className="font-semibold text-foreground">{query.trim()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
