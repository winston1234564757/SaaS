'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  /** Display value shown in the search input (e.g. "Київ, вул. Хрещатик, 1") */
  address: string;
  /** city = parsed locality, streetAddress = route + street_number */
  onChange: (coords: LatLng, city: string, streetAddress: string) => void;
}

const DEFAULT_CENTER: LatLng = { lat: 50.4501, lng: 30.5234 }; // Kyiv
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const HAS_MAPS_KEY = !!MAPS_API_KEY;

// Singleton loader — load the script once per page, avoid duplicate injections
let scriptPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
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
  // --- Graceful degradation: no API key → premium disabled placeholder ---
  if (!HAS_MAPS_KEY) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/30 border border-white/40 border-dashed">
          <MapPin size={16} className="text-[#A8928D] shrink-0" />
          <div>
            <p className="text-xs font-medium text-[#6B5750]">
              {props.address || 'Адреса не вказана'}
            </p>
            <p className="text-[11px] text-[#A8928D] mt-0.5">
              Інтеграція з картою очікує активації API
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <LocationPickerMap {...props} />;
}

function LocationPickerMap({ value, address, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catch Google Maps billing/auth failures (BillingNotEnabledMapError, InvalidKeyMapError, etc)
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setError('Google Maps: помилка авторизації (перевірте API ключ або білінг)');
      setLoading(false);
    };
    return () => { delete (window as any).gm_authFailure; };
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
        const { AdvancedMarkerElement } = (google.maps as any).marker ?? {};

        let marker: any = null;

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
            marker.position = pos;
          } else if (AdvancedMarkerElement) {
            marker = new AdvancedMarkerElement({ map, position: pos, gmpDraggable: true });
            marker.addListener('dragend', () => {
              const p = marker.position as google.maps.LatLngLiteral;
              geocodeLatLng(new google.maps.LatLng(p.lat, p.lng));
            });
          } else {
            // Fallback to legacy Marker
            marker = new google.maps.Marker({ map, position: pos, draggable: true });
            marker.addListener('dragend', () => {
              geocodeLatLng((marker as google.maps.Marker).getPosition()!);
            });
          }
          markerRef.current = marker;
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
          const components = (place as any).address_components as
            | google.maps.GeocoderAddressComponent[]
            | undefined;

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
      (markerRef.current as any).position = pos;
    }
  }, [value]);

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          defaultValue={address}
          placeholder="Пошук адреси..."
          className="w-full pl-8 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 text-[#2C1A14] placeholder-[#A8928D] outline-none focus:ring-2 focus:ring-[#789A99]/40"
        />
      </div>

      {/* Map container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/60" style={{ height: 220 }}>
        <div ref={containerRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 size={20} className="animate-spin text-[#789A99]" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs text-[#C05B5B] text-center px-4">
            {error}
          </div>
        )}
      </div>

      {/* Coords hint */}
      {value ? (
        <p className="text-[11px] text-[#A8928D] text-center">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)} · Перетягніть маркер для уточнення
        </p>
      ) : (
        <p className="text-[11px] text-[#A8928D] text-center">
          Знайдіть адресу або натисніть на карті
        </p>
      )}
    </div>
  );
}
