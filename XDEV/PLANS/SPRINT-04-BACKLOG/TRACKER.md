# Sprint-04 TRACKER
> Живий статус. Оновлюється після кожної ітерації (⬜→✅).
> Деталі виконаного: `HANDOFF.md` | Повний план + acceptance: `SPRINT-04-PLAN.md`

**Прогрес:** 5/30 ✅ | **Розпочато:** 2026-06-12 | **Оновлено:** 2026-06-12

| Іт | ID | Назва | Статус | Скіл | Commit | Brief |
|----|----|-------|--------|------|--------|-------|
| 1 | T01 | Frost тема: всі клієнти → міграція | ✅ | `code-reviewer` | `490a108` | rawTheme fallback '' → 'frost'; DB migration 20260609000001 |
| 2 | T02 | In-app сповіщення: unread кольорові + z-index | ✅ | `code-reviewer` | `b7c1d25` `f88b444` `185d78a` `2746e21` | text-accent unread bell; badge z-10; markAllRead on close; optimistic setQueryData; X button explicit markAllRead call |
| 3 | T03 | Портфоліо → Сторіс: редірект замість drawer | ✅ | `code-reviewer` | `55ce2f9` | drawer removed; redirect to /dashboard/marketing?tab=stories&portfolioId |
| 4 | T04 | Мобайл магазин: кнопка "Додати товар" + toggle уніфікація | ✅ | `senior-frontend` | `df27107` `3c26ff6` | inline btn + TabBtn outlined + уніфікація всіх 5 pill-тоглів: role=switch/bg-accent/44px |
| 5 | T05 | Клієнти (список): стандартизація кнопок + smart кнопка | ✅ | `code-reviewer` | `c239ae4` | MessageSquare→Sparkles; size-11 rounded-full; onSmartAction wired |
| 6 | **T06** | **Меню > Система > Студія: redesign + alpha/beta** | **▶ NEXT** | `design-taste-frontend` + `impeccable` | — | — |
| 7 | T07 | Записи мобайл: safe area top + opacity при скролі | ⬜ | `senior-frontend` + `impeccable` | — | — |
| 8 | T08 | Дашборд: tooltip safe area (кліп на краях) | ⬜ | `senior-frontend` + `impeccable` | — | — |
| 9 | T09 | Мобайл послуги: кнопка + toggle a11y + компакт + sep | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 10 | T10 | Портфоліо: кольори + mobile photo actions (3 кнопки) | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 11 | T11 | GrowthHub мобайл: tab layout redesign | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 12 | T12 | Профіль: відпустка/вихідні overlap fix (3 таби) | ⬜ | `redesign-existing-projects` + `impeccable` | — | — |
| 13 | T13 | Записи: баг буферу 10 хв між записами | ⬜ | `focused-fix` + `senior-backend` | — | — |
| 14 | T14 | Конструктор сторіс (ПК): розширення робочої зони | ⬜ | `senior-frontend` + `impeccable` | — | — |
| 15 | T15 | Сповіщення: каскад Push→TG + тексти + PWA deep link | ⬜ | `spec-driven-workflow` + `senior-backend` | — | — |
| 16 | T16 | Клієнтський навбар: redesign + Каталог + desktop notif | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 17 | T17 | /my/masters: картка майстра → як картка товару | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 18 | T18 | Оптимізація завантаження сторінки послуг | ⬜ | `performance-profiler` + `senior-backend` | — | — |
| 19 | T19 | /my/bookings: повний аудит + premium redesign | ⬜ | `impeccable` + `redesign-existing-projects` | — | — |
| 20 | T20 | /my/bookings: модалка відгуку + "Записатись знову" | ⬜ | `senior-frontend` + `humanizer` | — | — |
| 21 | T21 | Профіль клієнта: фото/IG/TG + impeccable аудит | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 22 | T22 | Стандартизація завантаження фото (всі сутності) | ⬜ | `senior-fullstack` + `impeccable` | — | — |
| 23 | T23 | Онбординг тур: persona simulation + brainstorm + spec | ⬜ | `spec-driven-workflow` + `ui-ux-pro-max` | — | — |
| 24 | T24 | Клієнтська зона: desktop layout (/my/* + /explore) | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 25 | T25 | dashboard/settings (ПК): повний redesign з нуля | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 26 | T26 | Чат: список діалогів + видалення (desktop + mobile) | ⬜ | `spec-driven-workflow` + `senior-frontend` | — | — |
| 27 | T27 | Чат: мобайл keyboard UX (Telegram-like) | ⬜ | `senior-frontend` + `emil-design-eng` | — | — |
| 28 | T28 | Розхідники: бізнес-аналіз + persona sim + spec | ⬜ | `spec-driven-workflow` + `senior-architect` | — | — |
| 29 | T29 | Розхідники: міграції + серверна логіка | ⬜ | `create-migration` + `senior-backend` | — | — |
| 30 | T30 | Розхідники: UX/UI реалізація | ⬜ | `design-taste-frontend` + `impeccable` | — | — |

---

## ⚠️ Pending post-deploy (з Sprint-03)
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions) — застосувати через Dashboard SQL Editor
- Vercel Pro → cron `0 * * * *` для check-uncompleted

## Воркфлоу: ONE TASK = ONE SESSION
1. Прочитати `HANDOFF.md` — знайти ▶ NEXT задачу
2. Startup: `mempalace_status` → `SYSTEM_MAP` → `TRACKER.md`
3. QA Gate → Skill → код → tsc → build → deploy
4. Після deploy: оновити TRACKER.md + HANDOFF.md + TRANSITION_PROMPT.md
