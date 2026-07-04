'use client';

import { MapPin, Building2, DoorClosed, ExternalLink } from 'lucide-react';
import { LocationPicker } from '../LocationPicker';

interface LocationWidgetProps {
  city: string;
  address: string;
  floor: string;
  cabinet: string;
  lat: number | null;
  lng: number | null;
  onCityChange: (val: string) => void;
  onAddressChange: (val: string) => void;
  onFloorChange: (val: string) => void;
  onCabinetChange: (val: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
}

const FIELD =
  'w-full px-4 py-3.5 rounded-2xl bg-secondary border border-border focus:border-accent/40 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all shadow-inner-sm';
const LABEL = 'text-[10px] font-bold text-text-sub px-1';

export function LocationWidget({
  city,
  address,
  floor,
  cabinet,
  lat,
  lng,
  onCityChange,
  onAddressChange,
  onFloorChange,
  onCabinetChange,
  onCoordsChange,
}: LocationWidgetProps) {
  const composed = [city, address].filter(Boolean).join(', ');
  const extras = [floor && `поверх ${floor}`, cabinet && `каб. ${cabinet}`].filter(Boolean).join(' · ');

  // Deep-link that works regardless of the embedded map (coords first, else address text)
  const mapsHref =
    lat != null && lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : composed
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(composed)}`
        : null;

  return (
    <div className="widget-card p-6 h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] text-text-sub leading-none mb-1">Локація</h3>
            <p className="text-[10px] text-text-sub/80">Так клієнти будують маршрут до тебе</p>
          </div>
        </div>
        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-[11px] font-bold text-foreground hover:border-accent/30 active:scale-[0.95] transition-all shrink-0"
          >
            <ExternalLink size={13} className="text-accent" />
            <span className="hidden sm:inline">Відкрити в картах</span>
            <span className="sm:hidden">Карти</span>
          </a>
        )}
      </div>

      {/* Composed address preview — the identity of this place */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/[0.06] to-transparent border border-border/60 px-4 py-3.5">
        {composed ? (
          <>
            <p className="heading-serif text-lg text-foreground leading-tight">{composed}</p>
            {extras && <p className="text-xs text-text-sub mt-0.5">{extras}</p>}
          </>
        ) : (
          <p className="text-sm text-text-sub">Адресу ще не вказано — познач місце на карті або заповни поля нижче.</p>
        )}
      </div>

      {/* Form + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Address form */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="space-y-1.5">
            <label htmlFor="loc-city" className={LABEL}>Місто</label>
            <input id="loc-city" value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="Київ" aria-label="Місто" className={FIELD} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="loc-address" className={LABEL}>Адреса</label>
            <input id="loc-address" value={address} onChange={(e) => onAddressChange(e.target.value)} placeholder="Вулиця, номер будинку" aria-label="Адреса" className={FIELD} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="loc-floor" className={`${LABEL} flex items-center gap-1`}><Building2 size={11} className="text-accent" /> Поверх</label>
              <input id="loc-floor" value={floor} onChange={(e) => onFloorChange(e.target.value)} placeholder="3" aria-label="Поверх" className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="loc-cabinet" className={`${LABEL} flex items-center gap-1`}><DoorClosed size={11} className="text-accent" /> Кабінет</label>
              <input id="loc-cabinet" value={cabinet} onChange={(e) => onCabinetChange(e.target.value)} placeholder="402" aria-label="Кабінет" className={FIELD} />
            </div>
          </div>
        </div>

        {/* Map hero */}
        <div className="lg:col-span-7">
          <LocationPicker
            address={address}
            value={lat != null && lng != null ? { lat, lng } : null}
            mapsHref={mapsHref}
            onChange={(coords, pickedCity, pickedStreet) => {
              onCoordsChange(coords.lat, coords.lng);
              // Sync back so the map search / pin drag fills the form fields
              if (pickedCity) onCityChange(pickedCity);
              if (pickedStreet) onAddressChange(pickedStreet);
            }}
          />
        </div>
      </div>
    </div>
  );
}
