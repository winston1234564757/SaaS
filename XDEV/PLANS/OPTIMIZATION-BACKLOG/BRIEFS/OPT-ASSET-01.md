# OPT-ASSET-01 — Lazy-load важких drawer'ів

**Тип:** MOTION
**Пріоритет:** P1
**Статус:** DRAFT
**Спеціаліст-скіли:** `react-best-practices`

---

## Поточний стан (верифіковано 2026-07-10)
- `src/components/master/DashboardLayout.tsx:8,106` — `BookingDetailsModal` імпортується **статично** і монтується в шелі → потрапляє в бандл і монтується на **кожному** вході в дашборд, хоча відкривається зрідка.
- `ClientDetailSheet` — статичний імпорт у 4 місцях: `dashboard/widgets/frost/InsightsRow.tsx:7`, `widgets/studio/InsightsRow.tsx:8`, `widgets/shared/StatsModals.tsx:6`, `clients/ClientsPage.tsx:12`.
- `src/components/master/settings/components/ImageCropper.tsx:4` — `react-easy-crop` статично (важка ліба), хоч використовується лише в crop-drawer.

Довідково: `dynamic()` уже широко застосовано (Analytics, BookingFlow, DnD, gsap, revenue/growth під-таби) — патерн у проекті є.

## Ціль
Перевести важкі, рідко-відкривані drawer'и/ліби на `next/dynamic` (`{ ssr:false }` де доречно), за conditional-mount.

## Файли, які чіпаю
- `src/components/master/DashboardLayout.tsx:8,106` — `BookingDetailsModal` через `dynamic()`.
- 4 споживачі `ClientDetailSheet` → спільний `dynamic()`-варіант (можливо, один re-export модуль).
- `src/components/master/settings/components/ImageCropper.tsx:4` — `react-easy-crop` через `dynamic()`.

## Ризики / що може зламатись
- `BookingDetailsModal` керується глобально (`UrlActionBus`/store `flashOnCancelStore`) — dynamic-обгортка не має зламати відкриття за URL-екшеном; можливо, лишити монтування, але lazy-компонент всередині.
- `ClientDetailSheet` спільний у 6 точках (SYSTEM_MAP) — dynamic не має зламати передачу props у жодній.
- SSR: sheet'и клієнтські — `ssr:false` безпечно, але перевірити відсутність hydration-mismatch.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] BookingDetailsModal / ClientDetailSheet / ImageCropper не в початковому чанку відповідних сторінок (перевірити build-output).
- [ ] Відкриття кожного drawer'а працює (URL-екшен, кліки з віджетів, crop).

## Відкриті питання до тебе
1. Немає.

---

## [Заповнюється після DONE]
**Root cause / рішення:**
- `BookingDetailsModal` — був статичним імпортом і **завжди змонтований** у шелі (`DashboardLayout.tsx:8,106`), тобто в чанку кожного входу в дашборд. Переведено на `next/dynamic({ssr:false})` + новий `BookingDetailsModalGate`: читає `?bookingId` і монтує модалку лише при ПЕРШОМУ відкритті. Ключовий нюанс — модалка тримає `lastBooking` під час exit-анімації, тож розмонтовувати одразу після зникнення `bookingId` не можна; gate лишає її змонтованою після першого відкриття. Прапорець `everOpened` виводиться в рендері (render-phase setState), а не в `useEffect` — щоб не тригерити `react-hooks/set-state-in-effect`.
- `ImageCropper` — `react-easy-crop` переведено на `dynamic({ssr:false})` + `loading`-плейсхолдер; `Area`/`Point` лишились **type-only** імпортом (стираються). Обгортка `dynamic` втрачає `defaultProps` ліби (`aspect` ставав обов'язковим) → додано точний `LazyCropperProps` під фактичний виклик. Прибрано мертвий `useCallback`.

**Свідомо НЕ зроблено — `ClientDetailSheet` (4 споживачі):** він page-scoped (рендериться на clients/dashboard-віджетах), а не eager у шелі на кожному вході — тобто виграш істотно менший за BookingDetailsModal. Коректний lazy потребує того ж `everOpened`-gate у 4 місцях (інакше зріжеться exit-анімація), а `ClientsPage` ще й re-export'ить його для зворотної сумісності. Ризик×4 проти малого виграшу — окрема задача.

**Файли:** `src/components/master/DashboardLayout.tsx` (dynamic + `BookingDetailsModalGate`), `src/components/master/settings/components/ImageCropper.tsx` (dynamic Cropper + типізація).
**Верифікація:** TSC 0 · Build clean · ESLint clean. Розділення чанку — структурне (dynamic + умовний монтаж); **байтова дельта не заміряна** (build-вивід Next не показує First Load JS). Own-eyes (відкриття модалки/кропера) не прогнано.
**Commit:** pending.
