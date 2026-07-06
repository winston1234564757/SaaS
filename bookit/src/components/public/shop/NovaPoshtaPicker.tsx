'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Building2, Check, Loader2, X, Search } from 'lucide-react';
import { searchNpCities, getNpWarehouses } from '@/lib/actions/novaPoshta';
import type { NpCity, NpWarehouse } from '@/lib/novaposhta/client';
import { cn } from '@/lib/utils/cn';

export interface NpSelection {
  cityRef: string;
  cityName: string;
  warehouseRef: string;
  warehouseName: string;
}

/**
 * Nova Poshta destination picker (M-SHOP-05): city autocomplete → branch select.
 * Replaces the free-text address field in shop checkout so the order carries a
 * precise NP city + warehouse (Ref + readable name). Read-only NP lookups via
 * server actions; the API key stays server-side.
 */
export function NovaPoshtaPicker({ onChange }: { onChange: (sel: NpSelection | null) => void }) {
  // City search
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<NpCity[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [city, setCity] = useState<NpCity | null>(null);

  // Warehouse
  const [warehouses, setWarehouses] = useState<NpWarehouse[]>([]);
  const [whQuery, setWhQuery] = useState('');
  const [whOpen, setWhOpen] = useState(false);
  const [whLoading, setWhLoading] = useState(false);
  const [warehouse, setWarehouse] = useState<NpWarehouse | null>(null);

  const cityBox = useRef<HTMLDivElement>(null);
  const whBox = useRef<HTMLDivElement>(null);

  // Emit selection upward whenever both parts are chosen.
  useEffect(() => {
    if (city && warehouse) {
      onChange({ cityRef: city.ref, cityName: city.name, warehouseRef: warehouse.ref, warehouseName: warehouse.name });
    } else {
      onChange(null);
    }
  }, [city, warehouse, onChange]);

  // Debounced city search.
  useEffect(() => {
    if (city) return; // already chosen — don't re-search
    const q = cityQuery.trim();
    if (q.length < 2) { setCities([]); return; }
    setCityLoading(true);
    const t = setTimeout(async () => {
      const res = await searchNpCities(q);
      setCities(res);
      setCityLoading(false);
    }, 300);
    return () => { clearTimeout(t); setCityLoading(false); };
  }, [cityQuery, city]);

  // Debounced warehouse search within the chosen city.
  useEffect(() => {
    if (!city) return;
    setWhLoading(true);
    const t = setTimeout(async () => {
      const res = await getNpWarehouses(city.ref, whQuery.trim());
      setWarehouses(res);
      setWhLoading(false);
    }, 300);
    return () => { clearTimeout(t); setWhLoading(false); };
  }, [city, whQuery]);

  // Close dropdowns on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (cityBox.current && !cityBox.current.contains(e.target as Node)) setCityOpen(false);
      if (whBox.current && !whBox.current.contains(e.target as Node)) setWhOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pickCity = useCallback((c: NpCity) => {
    setCity(c);
    setCityOpen(false);
    setCityQuery(c.name);
    setWarehouse(null);
    setWhQuery('');
  }, []);

  const resetCity = useCallback(() => {
    setCity(null);
    setCityQuery('');
    setCities([]);
    setWarehouse(null);
    setWarehouses([]);
    setWhQuery('');
  }, []);

  const fieldCls = 'w-full pl-11 pr-9 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-text-sub outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div className="flex flex-col gap-2.5">
      {/* City */}
      <div className="relative" ref={cityBox}>
        <MapPin size={16} className="absolute left-4 top-3.5 text-text-sub pointer-events-none" />
        <input
          type="text"
          value={cityQuery}
          onChange={e => { setCityQuery(e.target.value); setCityOpen(true); if (city) resetCity(); }}
          onFocus={() => setCityOpen(true)}
          placeholder="Місто"
          aria-label="Місто доставки Нової Пошти"
          className={fieldCls}
        />
        {city ? (
          <button type="button" onClick={resetCity} aria-label="Змінити місто" className="absolute right-3 top-3 size-6 rounded-full bg-background flex items-center justify-center text-text-sub active:scale-90 transition-transform">
            <X size={13} />
          </button>
        ) : cityLoading ? (
          <Loader2 size={15} className="absolute right-3.5 top-3.5 animate-spin text-text-sub" />
        ) : null}

        {cityOpen && !city && cities.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
            {cities.map(c => (
              <button
                type="button"
                key={c.ref}
                onClick={() => pickCity(c)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-secondary transition-colors border-b border-border/40 last:border-0"
              >
                <MapPin size={14} className="text-text-sub shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-foreground truncate">{c.name}</span>
                  {c.area && <span className="block text-[11px] text-text-sub truncate">{c.area} обл.</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Warehouse — only after a city is chosen */}
      {city && (
        <div className="relative" ref={whBox}>
          {warehouse ? <Building2 size={16} className="absolute left-4 top-3.5 text-primary pointer-events-none" />
                     : <Search size={16} className="absolute left-4 top-3.5 text-text-sub pointer-events-none" />}
          <input
            type="text"
            value={warehouse ? warehouse.name : whQuery}
            onChange={e => { setWarehouse(null); setWhQuery(e.target.value); setWhOpen(true); }}
            onFocus={() => setWhOpen(true)}
            placeholder="Відділення або поштомат"
            aria-label="Відділення Нової Пошти"
            className={cn(fieldCls, warehouse && 'font-medium')}
          />
          {whLoading
            ? <Loader2 size={15} className="absolute right-3.5 top-3.5 animate-spin text-text-sub" />
            : warehouse && <Check size={16} className="absolute right-3.5 top-3.5 text-primary" />}

          {whOpen && !warehouse && (
            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
              {warehouses.length === 0 ? (
                <p className="px-4 py-3 text-xs text-text-sub">{whLoading ? 'Пошук…' : 'Відділень не знайдено'}</p>
              ) : warehouses.map(w => (
                <button
                  type="button"
                  key={w.ref}
                  onClick={() => { setWarehouse(w); setWhOpen(false); }}
                  className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-secondary transition-colors border-b border-border/40 last:border-0"
                >
                  <Building2 size={14} className="text-text-sub shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{w.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
