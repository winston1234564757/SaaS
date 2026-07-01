'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, ExternalLink, MapPinOff } from 'lucide-react';

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  /** Display value shown in the search input (e.g. "Київ, вул. Хрещатик, 1") */
  address: string;
  /** Deep-link to open the location in an external maps app (fallback + convenience) */
  mapsHref?: string | null;
  /** city = parsed locality, streetAddress = route + street_number */
  onChange: (coords: LatLng, city: string, streetAddress: string) => void;
}

/** Shared premium fallback shown when the map can't render (no key / load error). */
function MapFallback({ title, hint, mapsHref }: { title: string; hint: string; mapsHref?: string | null }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-secondary to-accent/[0.04]" style={{ height: 220 }}>
      {/* faint map-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.5] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center px-6">
        <div className="size-11 rounded-2xl bg-surface/80 border border-border flex items-center justify-center shadow-sm">
          <MapPinOff size={20} className="text-text-sub" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-[11px] text-text-sub mt-0.5 max-w-[240px]">{hint}</p>
        </div>
        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold hover:opacity-90 active:scale-[0.95] transition-all"
          >
            <ExternalLink size={12} /> Відкрити в Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

interface GoogleMapMarker {
  position: google.maps.LatLng | google.maps.LatLngLiteral | null;
  addListener(event: string, handler: () => void): google.maps.MapsEventListener;
}

const DEFAULT_CENTER: LatLng = { lat: 50.4501, lng: 30.5234 }; // Kyiv
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const HAS_MAPS_KEY = !!MAPS_API_KEY;

// Singleton loader — load the script once per page, avoid duplicate injections
let scriptPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (typeof google !== 'undefined' && google.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&language=uk`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // reset so next mount can retry
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Parses Google address_components into normalized city + street address. */
function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): { city: string; streetAddress: string } {
  const get = (...types: string[]) =>
    types.map(t => components.find(c => c.types.includes(t))?.long_name ?? '').find(Boolean) ?? '';
  const city = get('locality', 'administrative_area_level_2', 'administrative_area_level_1');
  const route = get('route');
  const number = get('street_number');
  const streetAddress = [route, number].filter(Boolean).join(', ');
  return { city, streetAddress };
}

export function LocationPicker(props: Props) {
  // --- Graceful degradation: no API key → premium placeholder + working deep-link ---
  if (!HAS_MAPS_KEY) {
    return (
      <MapFallback
        title="Карта тимчасово недоступна"
        hint={props.address ? props.address : 'Заповни адресу — клієнти зможуть побудувати маршрут.'}
        mapsHref={props.mapsHref}
      />
    );
  }

  return <LocationPickerMap {...props} />;
}

function LocationPickerMap({ value, address, mapsHref, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catch Google Maps billing/auth failures (BillingNotEnabledMapError, InvalidKeyMapError, etc)
  useEffect(() => {
    window.gm_authFailure = () => {
      setError('Google Maps: помилка авторизації (перевірте API ключ або білінг)');
      setLoading(false);
    };
    return () => { delete window.gm_authFailure; };
  }, []);

  // Initialize map + autocomplete after Google Maps loads
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !inputRef.current) return;

        const center = value ?? DEFAULT_CENTER;
        const zoom = value ? 16 : 13;

        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          mapId: 'bookit_location_picker',
        });

        // Advanced Marker for better performance + customisation
        const mapsWithMarker = google.maps as unknown as {
          marker?: { AdvancedMarkerElement?: typeof google.maps.marker.AdvancedMarkerElement };
        };
        const AdvancedMarkerElement = mapsWithMarker.marker?.AdvancedMarkerElement;

        let marker: GoogleMapMarker | null = null;

        /** Reverse geocodes a LatLng and fires onChange(coords, city, streetAddress). */
        function geocodeLatLng(latLng: google.maps.LatLng) {
          const coords = { lat: +latLng.lat().toFixed(6), lng: +latLng.lng().toFixed(6) };
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              const { city: c, streetAddress: a } = parseAddressComponents(
                results[0].address_components ?? []
              );
              const display = [c, a].filter(Boolean).join(', ') || results[0].formatted_address;
              if (inputRef.current) inputRef.current.value = display;
              onChange(coords, c, a);
            } else {
              onChange(coords, '', '');
            }
          });
        }

        function placeMarker(pos: google.maps.LatLng) {
          if (marker) {
            (marker as any).position = pos;
          } else if (AdvancedMarkerElement) {
            const advMarker = new AdvancedMarkerElement({ map, position: pos, gmpDraggable: true });
            marker = advMarker as any;
            advMarker.addListener('dragend', () => {
              const p = advMarker.position as google.maps.LatLngLiteral;
              if (p) {
                geocodeLatLng(new google.maps.LatLng(p.lat, p.lng));
              }
            });
          } else {
            // Fallback to legacy Marker
            const legacyMarker = new google.maps.Marker({ map, position: pos, draggable: true });
            marker = legacyMarker as any;
            legacyMarker.addListener('dragend', () => {
              const p = legacyMarker.getPosition();
              if (p) {
                geocodeLatLng(p);
              }
            });
          }
          markerRef.current = marker as google.maps.marker.AdvancedMarkerElement;
        }

        if (value) placeMarker(new google.maps.LatLng(value.lat, value.lng));

        // Click on map → place/move pin + reverse geocode
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          placeMarker(e.latLng);
          geocodeLatLng(e.latLng);
        });

        mapRef.current = map;

        // Places Autocomplete wired to the search input
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current!, {
          fields: ['geometry', 'formatted_address', 'address_components'],
          componentRestrictions: { country: 'ua' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const loc = place.geometry.location;
          const coords = { lat: +loc.lat().toFixed(6), lng: +loc.lng().toFixed(6) };
          const components = place.address_components;

          const { city: c, streetAddress: a } = components?.length
            ? parseAddressComponents(components)
            : { city: '', streetAddress: place.formatted_address ?? '' };

          const display = [c, a].filter(Boolean).join(', ') || (place.formatted_address ?? '');
          map.setCenter(loc);
          map.setZoom(17);
          placeMarker(loc);
          if (inputRef.current) inputRef.current.value = display;
          onChange(coords, c, a);
        });

        autocompleteRef.current = autocomplete;
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити Google Maps. Перевірте API ключ.');
        setLoading(false);
      });

    return () => { cancelled = true; };
  // Intentional: init once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. reset button)
  useEffect(() => {
    if (!mapRef.current || !value) return;
    const pos = new google.maps.LatLng(value.lat, value.lng);
    mapRef.current.setCenter(pos);
    if (markerRef.current) {
      markerRef.current.position = pos;
    }
  }, [value]);

  // Map failed to load (billing/auth/network) → premium fallback + working deep-link
  if (error) {
    return <MapFallback title="Карта тимчасово недоступна" hint={address || 'Заповни адресу — клієнти зможуть побудувати маршрут.'} mapsHref={mapsHref} />;
  }

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          defaultValue={address}
          placeholder="Пошук адреси..."
          aria-label="Пошук адреси"
          className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-foreground placeholder:text-text-sub bg-secondary border border-border transition-all duration-200 focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Map container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-inner-sm" style={{ height: 240 }}>
        <div ref={containerRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-accent/[0.04]">
            <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <Loader2 size={18} className="animate-spin text-accent relative" />
            <span className="text-[11px] font-bold text-text-sub relative">Завантаження карти…</span>
          </div>
        )}
      </div>

      {/* Coords hint */}
      <p className="text-[11px] text-text-sub text-center">
        {value
          ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} · перетягни маркер для уточнення`
          : 'Знайди адресу або натисни на карті'}
      </p>
    </div>
  );
}
