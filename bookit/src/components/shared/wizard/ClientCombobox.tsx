'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle2, X, Star } from 'lucide-react';
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
  const [query, setQuery] = useState(watchName);
  const [isPreSelected, setIsPreSelected] = useState(!!watchName);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = 'cbox-listbox';

  useEffect(() => {
    setQuery(watchName);
    if (!watchName) setIsPreSelected(false);
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
        /* Selected client chip */
        <div className="flex items-center gap-3 h-12 px-3 rounded-xl bg-success/8 border border-success/25">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{watchName}</p>
            {watchPhone && (
              <p className="text-[11px] text-text-sub leading-none mt-0.5">{watchPhone}</p>
            )}
          </div>
          <button
            type="button"
            onClick={clearPreSelected}
            aria-label="Змінити клієнта"
            className="p-1 rounded-[100px] hover:bg-accent-on/6 text-text-sub hover:text-foreground transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none" aria-hidden="true" />
          <input
            data-testid="wizard-name-input"
            type="text"
            role="combobox"
            aria-label="Пошук клієнта"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-haspopup="listbox"
            value={query}
            autoComplete="off"
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Олена Петрова або +380..."
            className={`w-full h-12 pl-9 pr-4 rounded-2xl bg-secondary/75 border text-sm text-foreground placeholder:text-text-sub focus:outline-none transition-all ${
              errors.clientName
                ? 'border-destructive focus:ring-destructive/20'
                : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
            }`}
          />
        </div>
      )}
      {errors.clientName && (
        <p className="text-destructive text-[10px] mt-1 ml-1" role="alert">{errors.clientName.message}</p>
      )}

      {showDropdown && (filtered.length > 0 || query.trim().length >= 2) && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Клієнти"
          className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-xl bg-secondary/97 border border-border shadow-lg backdrop-blur-sm overflow-hidden"
        >
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={c.client_name === watchName}
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/8 transition-colors text-left"
            >
              <div className="size-7 rounded-full bg-background flex items-center justify-center text-xs font-bold text-primary shrink-0" aria-hidden="true">
                {c.is_vip ? <Star size={12} className="fill-warning text-warning" /> : (c.client_name[0]?.toUpperCase() ?? '?')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{c.client_name}</p>
                <p className="text-[11px] text-text-sub">{c.client_phone}</p>
              </div>
              {c.is_vip && (
                <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full shrink-0">
                  VIP
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-xs text-text-sub">
              Клієнта не знайдено
            </div>
          )}
        </div>
      )}
    </div>
  );
}
