# 🗺 SYSTEM MAP — BookIT Architecture

## 📂 Directory Structure

- `src/app`: Next.js App Router.
  - `(master)`: Dashboard & Master settings.
  - `[slug]`: Public booking pages.
  - `api`: Backend routes (Auth, SMS, Monobank, Cron).
- `src/components`: UI components.
  - `ui`: Base components (Button, BottomSheet, Input).
  - `master`: Components for the master dashboard.
  - `shared`: Unified components (BookingWizard, BottomNav).
- `src/lib`: Logic & Utilities.
  - `supabase`: Database clients & hooks.
  - `actions`: Server actions.
  - `utils`: Helpers (dates, pluralUk, smartSlots).

## 🔄 Key Flows

### 1. Booking Flow (`BookingWizard.tsx`)
- `ServiceSelector` → `DateTimePicker` → `ProductCart` (optional) → `ClientDetails` → `Success`.
- Uses `useBookingWizardState` for complex step logic.

### 2. CRM & Client Management
- `ClientDetailSheet.tsx`: View client history & notes.
- `saveClientNote`: Server action with phone-based persistence.

### 3. Identity & Auth
- `src/proxy.ts`: Main routing guard (replaces middleware.ts).
- SMS OTP logic with TurboSMS fallback.

## 📡 Integrations
- **Payments**: Monobank (Ed25519 signature).
- **Push**: Web Push API + TurboSMS.
- **Realtime**: Supabase Realtime for dashboard updates.

## ⚠️ Important Guards
- **z-index**: `BottomSheet` (z-50), `BottomNav` (z-40), `Toasts` (z-[100]).
- **Hydration**: Always check `mounted` before rendering client-only logic.

---
*Остання ревізія: 2026-04-30. Статус: UX Stabilization Complete.*
