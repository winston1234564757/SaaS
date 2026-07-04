'use client';

import Image from 'next/image';
import { MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';

interface Props {
  location: string;
  mapUrl: string | null;
  lat: number | null;
  lng: number | null;
  floor: string | null;
  cabinet: string | null;
}

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const HAS_MAPS_KEY = !!GMAPS_KEY;

function buildStaticMapUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '16',
    size: '600x300',
    scale: '2',
    markers: `color:0x789A99|${lat},${lng}`,
    key: GMAPS_KEY,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function MasterLocationCard({ location, mapUrl, lat, lng, floor, cabinet }: Props) {
  const [staticMapError, setStaticMapError] = useState(false);

  // Only renders when we have precise coordinates (no Ghost UI for text-only addresses)
  if (!lat || !lng) return null;

  // --- Graceful degradation: no API key OR static map failed (billing) → text-only card ---
  if (!HAS_MAPS_KEY || staticMapError) {
    return (
      <div className="bento-card px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{location}</p>
            {(floor || cabinet) && (
              <p className="text-[12px] text-text-sub mt-0.5">
                {[floor && `${floor} поверх`, cabinet && `каб. ${cabinet}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        {mapUrl && (
          <a
            href={mapUrl}
            target={mapUrl.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 shrink-0 h-10 px-4 rounded-xl text-[13px] font-bold text-[var(--accent-on)] bg-[var(--btn-primary-bg)] shadow-sm hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Navigation size={13} />
            Маршрут
          </a>
        )}
      </div>
    );
  }

  const staticMapUrl = buildStaticMapUrl(lat, lng);

  const details: string[] = [];
  if (floor) details.push(`${floor} поверх`);
  if (cabinet) details.push(`каб. ${cabinet}`);
  const detailsLine = details.join(' · ');

  return (
    <div className="bento-card overflow-hidden p-0">
      {/* Static map */}
      <div className="relative w-full" style={{ height: 160 }}>
        <Image
          src={staticMapUrl}
          alt={`Карта: ${location}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 600px"
          loading="lazy"
          unoptimized
          onError={() => setStaticMapError(true)}
        />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
      </div>

      {/* Address row + CTA */}
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {location}
            </p>
            {detailsLine && (
              <p className="text-[12px] text-text-sub mt-0.5">{detailsLine}</p>
            )}
          </div>
        </div>

        {mapUrl && (
          <a
            href={mapUrl}
            target={mapUrl.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 shrink-0 h-10 px-4 rounded-xl text-[13px] font-bold text-[var(--accent-on)] bg-[var(--btn-primary-bg)] shadow-sm hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Navigation size={13} />
            Маршрут
          </a>
        )}
      </div>
    </div>
  );
}
