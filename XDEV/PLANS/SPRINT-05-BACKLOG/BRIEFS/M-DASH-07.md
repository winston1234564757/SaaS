# M-DASH-07 — Дашборд: «Скасування» overlay хто/коли

**Статус:** DONE · commit `b970066a`
**Тип:** REDESIGN/feature (overlay) · **Тір:** 1 · **Скіл:** `senior-frontend` · **Модель:** Sonnet · **P1**
**Файли:** `widgets/frost/CancellationRateWidget.tsx` · `widgets/shared/hooks/useCancellationRate.ts` (розширити)

---

## Поточний стан

Віджет `CancellationRateWidget` показує лише **відсоток** скасувань цього тижня + дельту до минулого + 2 CTA (Розсилка / Пропозиція). Тап нічого не відкриває.

`useCancellationRate` → `useBookings(week)` рахує `cancelled / valid * 100`. Дані тягнуться, але select **не містить** `status_changed_at` і `cancellation_reason`.

## Реальність даних (важливо)

| Потрібно | Джерело | Примітка |
|---|---|---|
| Коли скасовано | `status_changed_at` | момент cancel (cancelled — термінальний статус) |
| Хто скасував | `cancellation_reason` | **інференс**: `'client_requested'` → Клієнт; `null`/інше → Ви (майстер) |
| Кого/що | `client_name` + `services` | вже є в `useBookings` |

**Немає** полів `cancelled_by`/`cancelled_at`. «Хто» — інференс, не точний лог. Це межа даних, не баг.

## План

1. `useCancellationRate` → додати `status_changed_at, cancellation_reason` у select `useBookings` (`useBookings.ts` BookingRow + select), повертати масив скасованих записів тижня (`cancelledList`): `{ id, client_name, service, status_changed_at, who: 'client'|'master' }`, відсортований за часом скасування ↓.
2. `CancellationRateWidget` → зробити метрику клікабельною (`<button>`, a11y: `aria-haspopup`, `aria-expanded`); тап відкриває overlay зі списком скасувань тижня.
3. Кожен рядок: ім'я клієнта · послуга · «Клієнт/Ви скасував(ла)» · відносний час («2 дні тому» через наявний util або дата).
4. Порожній стан: «Цього тижня скасувань немає».
5. UI-текст → `humanizer`.

## Ризики
- `status_changed_at` може бути `null` для старих записів → фолбек на `date` або «—».
- Overlay не має перекривати CTA / вилазити за екран → позиціювання як наявні патерни (useRef + getBoundingClientRect) або vaul.
- M-DASH-08 («Середній чек» overlay) — близнюк, патерн переюзовується.

## Acceptance
- [x] Тап на метриці «Скасування» → overlay зі списком цьоготижневих скасувань (хто/коли/що)
- [x] Порожній стан коректний
- [x] a11y: button + aria, target ≥44px
- [x] tsc 0 · build clean (3.1min)

## Рішення (DONE)
- `useBookings.ts` + `useBookingById.ts`: select +`status_changed_at`, +`cancellation_reason` (другий — бо `BookingWithServicesAndProducts extends BookingWithServices`, tsc зловив).
- `useCancellationRate.ts`: `cancelledList: CancelledEntry[]` — скасування тижня, сорт за часом ↓; `by` інференс із `cancellation_reason`.
- `CancellationRateWidget.tsx`: метрика → `<button>` (aria-haspopup/expanded/label), `Sheet` variant=adaptive (vaul bottom моб / dialog десктоп), рядок CalendarX + клієнт + послуга + timeAgo + ініціатор; порожній стан.
- Переюз: спільний `ui/Sheet`, `timeAgo`, `pluralUk`. Нуль міграцій/backend/RLS.
- Validated вживу founder («все є»).
- **Близнюк M-DASH-08** («Середній чек») — той самий патерн overlay.
