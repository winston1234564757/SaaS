'use client';

import { MapPin, Navigation, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
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
  onCoordsChange
}: LocationWidgetProps) {
  return (
    <div className="widget-card p-6 h-full flex flex-col gap-6">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
          <MapPin size={18} />
        </div>
        <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute">Локація та адреса</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-mute uppercase tracking-widest px-1">Місто</label>
            <input
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="Київ"
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-white/80 focus:border-accent/40 outline-none text-sm transition-all shadow-inner-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-mute uppercase tracking-widest px-1">Адреса</label>
            <div className="relative">
              <input
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="Вулиця, номер будинку"
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-white/80 focus:border-accent/40 outline-none text-sm transition-all shadow-inner-sm"
              />
              <Navigation size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-mute/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-mute uppercase tracking-widest px-1">Поверх</label>
              <input
                value={floor}
                onChange={(e) => onFloorChange(e.target.value)}
                placeholder="3"
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-white/80 focus:border-accent/40 outline-none text-sm transition-all shadow-inner-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-mute uppercase tracking-widest px-1">Кабінет</label>
              <input
                value={cabinet}
                onChange={(e) => onCabinetChange(e.target.value)}
                placeholder="402"
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-white/80 focus:border-accent/40 outline-none text-sm transition-all shadow-inner-sm"
              />
            </div>
          </div>
        </div>

        {/* Google Map Picker */}
        <div className="h-[240px] md:h-auto min-h-[200px] rounded-3xl overflow-hidden border border-white/60 shadow-inner">
           <LocationPicker 
             address={address}
             value={lat && lng ? { lat, lng } : null}
             onChange={(coords) => onCoordsChange(coords.lat, coords.lng)}
           />
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-accent/5 border border-accent/10">
        <Info size={16} className="text-accent shrink-0" />
        <p className="text-[11px] font-medium text-accent/80 leading-snug">
          Позначте точне місце на карті, щоб клієнти могли побудувати маршрут до вас.
        </p>
      </div>
    </div>
  );
}
