Маю всі дані. Пишу виправлений план:

  Поточний стан DB:
  - latitude, longitude — ✅ вже є (database.ts:52-53)
  - floor, cabinet — ❌ відсутні → потрібна міграція 074
  - Google Maps API key — ❌ не налаштований → план використовує Leaflet +       
  OpenStreetMap (безкоштовно, без ключа)

  ---
  PHASE 1 — Виправлений план (очікує підтвердження)

  ---
  Task 0 — Migration 074: floor + cabinet

  Що: latitude/longitude вже є. Додаємо тільки floor і cabinet.

  Файл: supabase/migrations/074_master_location_details.sql

  ALTER TABLE master_profiles
    ADD COLUMN IF NOT EXISTS floor  VARCHAR(50)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cabinet VARCHAR(50) DEFAULT NULL;

  Після: npx supabase db push + регенерація database.ts.

  ---
  Task 1 — Settings: Interactive Map Picker

  Файли:
  - Modify: src/components/master/settings/SettingsPage.tsx
  - Create: src/components/master/settings/LocationPicker.tsx

  Що робить LocationPicker:
  - react-leaflet + leaflet (OSM tiles, без API key)
  - Drag-and-drop маркер → зберігає { lat, lng } через onCoordinatesChange       
  callback
  - При першому відкритті: якщо lat/lng є в DB — центрує карту на них, інакше —  
  [50.45, 30.52] (Київ)
  - Клік по карті або drag маркера → оновлює lat/lng стейт
  - Нижче карти: два readonly інпути "Широта / Довгота" (для точного вводу)      

  Що додається в SettingsPage:
  - State: lat, lng (number | null), floor (string), cabinet (string)
  - Init з masterProfile.latitude, masterProfile.longitude, masterProfile.floor, 
  masterProfile.cabinet
  - handleSave → .update({ latitude: lat, longitude: lng, floor: floor || null,  
  cabinet: cabinet || null })
  - UI секція "Локація" з LocationPicker + два текстові інпути (поверх / кабінет)  - Dirty detection для всіх чотирьох полів

  Залежності: npm install leaflet react-leaflet + @types/leaflet

  ---
  Task 2 — Public Page: Premium Location Component

  Файли:
  - Create: src/components/public/MasterLocationCard.tsx
  - Modify: src/components/public/PublicMasterPage.tsx — замінити старий location   block
  - Modify: src/app/[slug]/page.tsx — передавати lat, lng, floor, cabinet        

  Що показує MasterLocationCard:

  ┌─────────────────────────────────────┐
  │  [Static Map Image 400×180]         │  ← OSM staticmap, centered на lat/lng  
  ├─────────────────────────────────────┤
  │  📍 вул. Хрещатик, 1               │  ← address
  │     Поверх 3 · Кабінет 12          │  ← floor + cabinet (якщо є)
  │                                     │
  │  [  🗺   Прокласти маршрут  ]        │  ← native deep link button
  └─────────────────────────────────────┘

  Static Map URL (безкоштовно, без ключа):
  https://staticmap.openstreetmap.de/staticmap.php
    ?center={lat},{lng}&zoom=16&size=400x180
    &markers={lat},{lng},red-pushpin
  Рендериться як <Image> (Next.js, width/height задані, unoptimized бо зовнішній 
  домен).

  "Прокласти маршрут" — server-side UA detection (так само як mapUrl):
  - iOS → maps://maps.apple.com/?ll={lat},{lng}&q={encodedAddress}
  - Android → comgooglemaps://?q={lat},{lng}
  - Desktop → https://www.google.com/maps?q={lat},{lng}

  Рендерити тільки якщо lat && lng (якщо майстер не заповнив — компонент не      
  з'являється, без Ghost UI).

  ---
  Scope Map — PHASE 1 (фінальний)

  PHASE 1 — Location Pipeline (DB → Settings → Public Page)

    Task 0: Migration 074                    ← floor, cabinet колонки
            supabase/migrations/074_...sql

    Task 1: Settings — LocationPicker        ← Input Layer (Leaflet OSM)
            LocationPicker.tsx               ← drag-drop pin → lat/lng
            SettingsPage.tsx                 ← +lat/lng/floor/cabinet state+save 

    Task 2: Public Page — MasterLocationCard ← Read-Only Output
            MasterLocationCard.tsx           ← static map + directions
            page.tsx                         ← передає lat/lng/floor/cabinet     
            PublicMasterPage.tsx             ← рендерить MasterLocationCard      

  ---
  Підтверджуєш план? Починаю з Task 0 (міграція)?Т