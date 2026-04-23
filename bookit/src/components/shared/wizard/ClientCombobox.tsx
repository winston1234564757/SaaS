'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useClients, type ClientRow } from '@/lib/supabase/hooks/useClients';
import type { FieldErrors } from 'react-hook-form';
import type { BookingClientData } from '@/lib/validations/booking';

interface ClientComboboxProps {
  errors: FieldErrors<BookingClientData>;
  watchName: string;
  setValue: (field: keyof BookingClientData, value: string, opts?: { shouldValidate?: boolean }) => void;
  onClientSelect: (client: ClientRow | null) => void;
}

export function ClientCombobox({ errors, watchName, setValue, onClientSelect }: ClientComboboxProps) {
  const { clients, isLoading } = useClients();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query when form resets
  useEffect(() => {
    if (!watchName) setQuery('');
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
    setValue('clientName', val, { shouldValidate: true });
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
      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
        <input
          data-testid="wizard-name-input"
          type="text"
          value={query}
          autoComplete="off"
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Олена Петрова або +380..."
          className={`w-full h-12 pl-9 pr-4 rounded-xl bg-white/75 border text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none transition-all ${
            errors.clientName
              ? 'border-[#C05B5B] focus:ring-[#C05B5B]/20'
              : 'border-white/80 focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20'
          }`}
        />
      </div>
      {errors.clientName && (
        <p className="text-[#C05B5B] text-[10px] mt-1 ml-1">{errors.clientName.message}</p>
      )}

      {showDropdown && (filtered.length > 0 || query.trim().length >= 2) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-2xl bg-white/97 border border-[#F0DDD8] shadow-xl backdrop-blur-sm overflow-hidden">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#789A99]/8 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-[#FFE8DC] flex items-center justify-center text-xs font-bold text-[#789A99] shrink-0">
                {c.is_vip ? '⭐' : (c.client_name[0]?.toUpperCase() ?? '?')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#2C1A14] truncate">{c.client_name}</p>
                <p className="text-[11px] text-[#A8928D]">{c.client_phone}</p>
              </div>
              {c.is_vip && (
                <span className="text-[10px] font-bold text-[#D4935A] bg-[#D4935A]/10 px-1.5 py-0.5 rounded-full shrink-0">
                  VIP
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-xs text-[#A8928D]">
              Новий клієнт:{' '}
              <span className="font-semibold text-[#2C1A14]">{query.trim()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
