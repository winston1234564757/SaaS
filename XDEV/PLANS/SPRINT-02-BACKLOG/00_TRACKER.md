# SPRINT-02 TRACKER
> Sprint: Backlog → Production  
> Started: 2026-06-08  
> Source: `XDEV/BACKLOG.md`

---

## Статуси
`TODO` · `IN_PROGRESS` · `REVIEW` · `DONE` · `BLOCKED`

---

## P1 — Bugs / Critical (виконати першими)

| ID | Задача | Статус | Сесія | Скіл | Файли |
|----|--------|--------|-------|------|-------|
| B-15 | PUSH notification при кожному вході в Settings | DONE | 2026-06-08 | senior-backend | `api/push/subscribe/route.ts` |
| B-09 | Products: пусте редагування + можна замовити | DONE | 2026-06-08 | senior-frontend | `ProductEditor.tsx` |
| B-10 | Services: повільне завантаження | DONE | 2026-06-08 | senior-backend | `useServices.ts` |
| B-13 | Flash deal notifications: перевірка | DONE | 2026-06-08 | code-reviewer | `flash/actions.ts` (verified) |
| B-01 | C2B: знижка не нарахувалась + лічільник | DONE | 2026-06-08 | senior-backend | `invite/[code]/page.tsx` |

## P2 — Features / UX

| ID | Задача | Статус | Сесія | Скіл | Файли |
|----|--------|--------|-------|------|-------|
| B-06 | Free days click → BottomSheet зі слотами | DONE | 2026-06-08 | senior-frontend | `NextFreeDaysWidget.tsx`, `FrostDashboard.tsx` |
| B-11 | Portfolio → Stories: прямий перехід з pre-selection | DONE | 2026-06-08 | senior-frontend | `PortfolioItemPage.tsx`, `PortfolioPage.tsx`, `StoryGenerator.tsx` |
| B-14 | Navbar: профіль крайній правий + notifications FAB | DONE | 2026-06-08 | design-taste-frontend | `MobileHub.tsx` |
| B-03 | Dashboard: консолідація заголовків + висоти блоків | DONE | 2026-06-08 | design-taste-frontend | `TodaySchedule.tsx`, `FrostDashboard.tsx` |
| B-02 | C2B/C2C: розділення кодів + унікальні landing | DONE | 2026-06-09 | design-taste-frontend + senior-frontend | `invite/[code]/page.tsx` |

## P3 — Design / Polish

| ID | Задача | Статус | Сесія | Скіл | Файли |
|----|--------|--------|-------|------|-------|
| B-07 | Broadcast: модалка → структурована сторінка | DONE | 2026-06-08 | redesign-existing-projects | `BroadcastEditor.tsx` |
| B-08 | Settings: desktop layout overhaul | DONE | 2026-06-08 | design-taste-frontend | `SettingsPage.tsx` |
| B-04 | Dashboard: Income 40% / PeakHours 60% | DONE | 2026-06-08 | design-taste-frontend | `FrostDashboard.tsx` |
| B-12 | Story constructor: анімована стрілка вниз | DONE | 2026-06-08 | emil-design-eng | `StoryGenerator.tsx` |
| B-05 | Dashboard: referral block copy humanizer | DONE | 2026-06-08 | humanizer | `ReferralBoostWidget.tsx` |
| B-16 | Billing: Studio "в розробці" + бета-заявки | DONE | 2026-06-09 | design-taste-frontend + senior-backend | `BillingPage.tsx`, `billing/actions.ts`, `admin/beta-requests/page.tsx` |

## P4 — Desktop Layout Adaptations (9 сторінок)

| ID | Сторінка | Статус | Сесія | Складність | Що зроблено |
|----|----------|--------|-------|------------|-------------|
| D-01 | `/dashboard/billing` | DONE | 2026-06-08 | Low | Plans → `grid grid-cols-1 md:grid-cols-3` |
| D-02 | `/dashboard/reviews` | DONE | 2026-06-08 | Low | List → `grid grid-cols-1 lg:grid-cols-2 items-start` |
| D-03 | `/dashboard/growth` (3 таби) | DONE | 2026-06-08 | Medium | Hub already `md:flex-row`, no changes needed |
| D-04 | `/dashboard/revenue` (2 таби) | DONE | 2026-06-08 | Medium | Hub already `md:flex-row`, no changes needed |
| D-05 | `/dashboard/marketing` (2 таби) | DONE | 2026-06-08 | Medium | Tabs wrapper; sub-components have own layouts |
| D-06 | `/dashboard/products` | DONE | 2026-06-08 | Low | Single-col DnD adequate for product card density |
| D-07 | `/dashboard/services` | DONE | 2026-06-08 | Low | `flex flex-wrap calc` → `grid grid-cols-3` CSS grid |
| D-08 | `/dashboard/analytics` (навігація + slider) | DONE | 2026-06-08 | High | PeriodControls: `lg:flex-row` side-by-side layout |
| D-09 | `/dashboard/portfolio` (impeccable audit) | DONE | 2026-06-08 | Medium | Remove max-w-2xl; DnD grid → `grid-cols-4` on lg |

---

## Загальний прогрес
- P1 завершено: 5/5 ✅
- P2 завершено: 5/5 ✅
- P3 завершено: 6/6 ✅
- P4 завершено: 9/9 ✅
- **Всього: 25/25** ✅ SPRINT COMPLETE

---

*Оновлювати після кожної сесії. Детальні плани → відповідні файли цієї папки.*
