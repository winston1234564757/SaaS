# TASK.md — Поточні завдання BookIT

> Оновлено: 2026-05-16

---

## ✅ ЗАВЕРШЕНО — URL Action Bus (Command Bus) v1.0

**Всі 3 завдання виконані.**

### Архітектура
- Pattern: Command Bus via Search Params (`?_action=<type>&<payload params>`)
- Файл: `src/lib/actions/UrlActionBus.ts`
- URL cleanup: `window.history.replaceState` (truly shallow, no history entry)
- Validation: Zod strict (zero `any`)
- Idempotency guard: fingerprint ref prevents double-dispatch on re-renders

### Task 1 — Registry + Dispatcher
- ✅ `URL_ACTION_SCHEMAS` — 7 зареєстрованих типів подій з Zod-схемами
- ✅ `useUrlActionBus<T>` — generic hook, consumer-side subscription
- ✅ `buildActionUrl<T>` — helper для генерації deep-link URLs
- ✅ Registered actions:
  - `booking:create` — serviceId?, clientId?, date?, startTime?
  - `booking:reschedule` — bookingId, date?
  - `client:open` — clientId
  - `marketing:broadcast` — clientIds? (comma-sep), templateId?
  - `ui:open_drawer` — drawerId, targetId?
  - `flash:create` — serviceId?
  - `product:edit` — productId

### Task 2 — Consumer Protocol
- ✅ `PublicMasterPage.tsx` — consumer `booking:create` → авто-відкриття BookingFlow з serviceId/date/startTime
- ✅ `BookingFlow.tsx` — додано `initialDate`, `initialTime` passthrough до BookingWizard
- ✅ `BroadcastsTab.tsx` — consumer `marketing:broadcast` → авто-відкриття BroadcastEditor з prefill
- ✅ `BroadcastEditor.tsx` — `prefillClientIds?: string[]`, `prefillTemplateId?: string` props

### Task 3 — Safety Alert Interceptor
- ✅ Migration `137_client_health_notes.sql` — `health_notes TEXT`, `medical_notes TEXT` на `client_master_relations`
- ✅ `SafetyAlert.tsx` — компонент з Framer Motion, fetches health notes по clientId+masterId
- ✅ `BookingWizard.tsx` — SafetyAlert вбудовано (master mode, above steps)

---

## 🔜 НАСТУПНІ ЗАВДАННЯ

### [HIGH] Deep Link для Клієнта — /my/bookings?bookingId=
- `MyBookingsPage` має обробити `?bookingId=` (авто-скрол/фокус на записі)
- `?bookingId=&review=1` — авто-відкриття review форми
- Push і TG вже генерують ці URL (notifMap.ts) — handler відсутній

### ✅ ~~booking:create consumer на Dashboard~~ (виконано)
- `BookingsPage.tsx` → consumer `booking:create` → відкриває `ManualBookingForm` з `initialClientId`, `date`, `startTime`
- `ManualBookingForm` → `BookingWizard` → `useBookingWizardState` → `initialClientId` ініціалізує `selectedClientId`
- `SafetyAlert` Task 3 тепер повністю покритий (обидва flow)

### [MEDIUM] Vercel Pro cron перевірка
- Після оновлення до Vercel Pro: `check-uncompleted` → `0 * * * *`
- Файл: `bookit/vercel.json`

### [LOW] Broadcast → Orchestrator
- `notifyClientBroadcast()` має власну логіку каналів
- Розглянути рефакторинг під Orchestrator (не критично)

---

## 📎 Корисні посилання

- `XDEV/MAPS/NOTIFICATION_MAP.md` — повна карта системи сповіщень
- `XDEV/MAPS/SYSTEM_MAP.md` — архітектурний індекс
- `XDEV/MAPS/DEEP_LINK_MAP.md` — Deep Link Map (оновлено)
- `src/lib/actions/UrlActionBus.ts` — Action Bus (новий)
- `src/lib/notifications/NotificationOrchestrator.ts` — центральний диспетчер
- `src/lib/notifications/constants/notifMap.ts` — реєстр подій
