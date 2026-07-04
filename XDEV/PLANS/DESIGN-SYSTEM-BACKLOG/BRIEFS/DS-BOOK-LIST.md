# DS-BOOK-LIST — Bookings список: контраст + eyebrows sentence-case + emoji-фікс

> Тір 2 · частина великого bookings-surface. Скоуп СВІДОМО звужено до список-в'ю (light).

## Чесний стан
`master/bookings/` = 108 hard-ban occurrences у 11 файлах, **змішані light/dark контексти**. Сліпий sed небезпечний (dark-герої в BookingDetailsModal + VerticalTimeline → text-sub на темному = dark-on-dark).

**Скоуп цієї сесії (light-only, безпечно):** список-в'ю, який founder queued:
- `BookingsPage.tsx` (16) — контейнер: header, controls, sidebar, list-render. ВЕСЬ light (widget-card/secondary).
- `BookingCard.tsx` (5+emoji) — елемент списку. Light (bento-card).
- `DashboardWidgets.tsx` (12) — stats-стрічка вгорі list-page. Light (0 dark-маркерів verified).

**Поза скоупом (окремий DS-BOOK-DASH, dark-context care):** VerticalTimeline (dark-блоки), PeriodAnalyticsView, MonthlyAnalyticsView, SmartQueue, OpportunityMenu, BookingDetailsModal (dark receipt-cover M-BOOK-05, 30 occ). Ці = Command-Center analytics/modal, ~87 occ, потребують per-file light/dark розрізнення. НЕ блендити sed'ом.

## Зроблено (light-safe)
1. **Контраст sed:** `text-muted-foreground(/NN)?` → `text-text-sub`. (У цих 3 файлах контекст суто light — verified.)
2. **Eyebrows sentence-case:** зняти `uppercase tracking-XXX` з date-роздільників/eyebrow (BookingsPage «Пошук клієнта»/«Статус запису»/date-heading, DashboardWidgets title).
3. **🔴 No-Emoji фікс:** `BookingCard` рядок ~201 `⚠️ Ризик неявки` → Lucide `AlertTriangle` (§4-бан emoji — реальна помилка).
4. `bg-muted-foreground/10` (no-show button) → `bg-secondary`; status-pill `uppercase` → sentence-case.

## Не чіпаю
Логіку/actions/URL-стан/grid/tour. Status-action-button semantic-кольори (bg-success/12 text-success — консистентний набір, icon+text). script-h1 «Записи». Dark analytics views (окремо).

## Гейти
Own-eyes: BookingCard props-only прев'ю (pending/confirmed/completed стани + high-risk emoji-фікс) Playwright. BookingsPage потребує MasterContext → grep+build. Контраст парами. TSC:0 + build. TRACKER/TRANSITION/mempalace.

## Скіли
`design-taste-frontend` → a11y → (impeccable hook авто).
