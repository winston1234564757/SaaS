# M-BOOK-03 — Записи: верхні віджети клікабельні + overlay

> Статус: **DRAFT** (чекає підтвердження плану через QA)
> Тип: **feature/overlay** · Тір 1 · Модель: Sonnet · P1 · Фаза 2
> Скіл: `senior-frontend`
> Файли: `dashboard/DashboardWidgets.tsx` (+ можливо `hooks/useBookingsDashboardLogic.ts` для 2 проміжних полів) · BookingsPage передає `bookings` у DashboardWidgets

---

## Контекст
4 верхні віджети на `/dashboard/bookings` (`DashboardWidgets.tsx`) зараз статичні `WidgetCard` (div):
1. **Заповненість** — `occupancyRate%` (зайнято / робочий час)
2. **Прогноз** — `forecastRevenue ₴` (confirmed + pending до кінця періоду)
3. **Лояльність** — `retentionRate%` + `returningClientsCount`
4. **Ефективність** — `efficiencyRate%` + `lostMinutes`

**Патерн (як M-DASH-07/08):** метрика → `<button>` (aria-haspopup/expanded/label, ≥44px) → спільний `Sheet variant="adaptive"` (vaul bottom моб / dialog десктоп). **Нуль нових запитів** — усе з `stats` + сирих `bookings` (хук уже їх повертає; BookingsPage має `bookings` у скоупі → прокинути в DashboardWidgets).

## План overlay'їв (усе derivable)
1. **Заповненість** → «Як рахується»: великий %, прогрес-бар, Зайнято (год) vs Робочий час (год) vs Вільно (год), записів у періоді. *Треба експонувати 2 поля з хука: `totalBookedMinutes`, `totalWorkingMinutes` (вже рахуються — лише додати у return + інтерфейс).*
2. **Прогноз** → розбивка: Підтверджено (N · сума) + Очікує (M · сума) = forecast. Рахується з `bookings` (filter confirmed/pending → Σ total_price).
3. **Лояльність** → Постійні vs Нові (числа+%), список постійних (групування `bookings` по `client_phone`, count>1, з ім'ям + к-ть візитів, сорт ↓).
4. **Ефективність** → Втрати часу: efficiencyRate, lostMinutes (год/хв), список скасувань (клієнт · час · втрачено хв) з `bookings` filter cancelled. Семантичний близнюк M-DASH-07 (але на сторінці bookings, фокус = втрачений час).

## Переюз
`ui/Sheet` (adaptive), `formatPrice`, `pluralUk`, `formatDurationFull` (год/хв), `timeAgo`. Спільний під-компонент рядка-розбивки в межах файлу.

## Ризики
- 4 overlay'ї = найбільший за обсягом крок M-BOOK. Мітигація: спільна обгортка `MetricSheet` + `WidgetCard` приймає опційний `onClick`/`detail`.
- `client_phone` як ключ ретеншну (хук так рахує) — список постійних той самий критерій, без розбіжності з цифрою віджета.
- a11y: кнопка ≥44px, aria-*; контраст нових текстів (mcp__a11y) — нейтральні токени.

## Acceptance
- [ ] 4 віджети — клікабельні кнопки (a11y), tap → adaptive Sheet.
- [ ] Кожен overlay: змістовна розбивка з наявних даних, без нових запитів/міграцій.
- [ ] Порожні стани (немає скасувань / немає постійних).
- [ ] TSC 0 · Build clean · a11y ок · humanizer на новому copy.

## Рішення founder (QA, 2026-06-26)
1. **Глибина = мій план** (розбивка + списки). **Скоуп = всі 4.**
2. **Усі елементи в overlay'ях клікабельні → ведуть на свій main-елемент:**
   - **Лояльність:** клієнт → `router.push('/dashboard/clients?clientPhone=<phone>')` (ClientsPage:117 уже відкриває профіль із цього параметра — НЕ рендеримо ClientDetailSheet інлайн, не резолвимо ClientRow).
   - **Ефективність:** скасований запис → `router.push('?bookingId=<id>')` (BookingDetailsModal на цій сторінці, як BookingCard.openModal).
   - **Прогноз:** майбутні записи (confirmed+pending) списком, кожен → `?bookingId=<id>`.
   - **Заповненість:** агрегат (години) — інформаційний, без навігації (нема окремого елемента).
   - Перед навігацією Sheet закривається (`setOpen(false)`).

## + M-BOOK-04 (одразу, founder) — кнопка «Новий запис»
Беклогове «div→button» застаріле: BookingsPage:246 **вже `<button>`**, але `<span hidden sm:inline>` ховає текст на мобілці → icon-only без назви. Фікс (Тір 0): текст видимий завжди + `aria-label="Новий запис"`. Окремий рядок у TRACKER (M-BOOK-04 ✅).
