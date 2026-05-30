# STEP 04 — Session 2 Compact (2026-05-30)

## ЗРОБЛЕНО ЦЮ СЕСІЮ

| Блок | Файл(и) | Статус |
|---|---|---|
| A — Revenue bug | EarningsPulseWidget.tsx: `/100` → видалено | ✅ |
| B — Real-time | useRealtimeNotifications.ts: `['busyness', id]` додано в invalidateAll | ✅ |
| C — Empty states | TodaySchedule, frost/TopServicesWidget, frost/ChannelHealthWidget, frost/InsightsRow (min-h → видалено, micro-pattern) | ✅ |
| D+E — Tour | DashboardTourContext (emptyHint, startTour), DashboardTourBanner (glow+scroll), FrostDashboard (data-tour-step 0-6), globals.css (.tour-active), AcademyPage (Пройти тур знову) | ✅ |
| F — Academy | **QA PENDING** — відповіді не отримані | ⏳ |

## БЛОК F — ACADEMY QA (потребує відповідей)

```
1. Що таке Академія?
   а) База знань (як працює кожна функція)
   б) Навчальний курс (покрокові уроки)
   в) Довідник-FAQ (як зробити X)

2. Аудиторія?
   а) Тільки нові майстри
   б) Усі (новачки + досвідчені)

3. Контент — хто наповнює?
   а) Hardcode в коді (статика)
   б) З Supabase (динамічний)

4. Структура?
   а) По функціях (Записи / CRM / Аналітика...)
   б) По цілях (Залучити клієнтів / Підвищити виручку...)
   в) По рівнях (Старт → Розвиток → Майстерність)

5. Setup Wizard зараз — куди?
   а) Лишається в Академії як секція "Почати роботу"
   б) В онбординг, з Академії прибирається
```

## ПОТОЧНИЙ СТАН КОДУ

- `total_price` в bookings = **UAH** (не копійки). Усі виджети крім EarningsPulse передавали правильно.
- `invalidateAll` тепер інвалідує: bookings, wizard-schedule, dashboard-stats, **busyness**, weekly-overview, notifications, monthly-booking-count, clients
- Tour steps: 0=Greeting, 1=AdaptiveStrip, 2=Schedule, 3=WeeklyChart, 4=QuickActions, 5=Referral, 6=Insights, 7=Academy
- `.tour-active` CSS: z-index:45, outline:2px accent, glow box-shadow
- Academy `/dashboard/academy` — поки Setup Wizard (5 карток)

## ПІСЛЯ ACADEMY — ЩО ЗАЛИШИЛОСЬ

- Commit всіх змін сесії 2
- Push на Vercel
- Backlog: B-03 (Studio BarTooltip), B-04 (Frost tooltip rounded), B-05 (Blossom font)
- Academy nav link в DashboardTopBar або MobileHub
- ClientsPage `?filter=no_review` + `?filter=at_risk` (для STEP 06)
- Theme downgrade DB write в billing webhook
