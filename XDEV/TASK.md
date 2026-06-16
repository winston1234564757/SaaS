# TASK.md — Поточні задачі

> Оновлюється після кожної ітерації Sprint-04.
> **Updated:** 2026-06-16 | **[РЕСТРУКТУРИЗАЦІЯ: іт. 16-22 → ##ClientDesign]**

---

## Активний спринт

**Sprint-04** — 37 задач (one task = one vercel --prod deploy)
**Прогрес:** 18/37 ✅
**Повний план:** `XDEV/PLANS/SPRINT-04-BACKLOG/SPRINT-04-PLAN.md`
**Живий трекер:** `XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md`
**Handoff:** `XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md`
**Transition prompt:** `XDEV/PLANS/SPRINT-04-BACKLOG/TRANSITION_PROMPT.md`

| Прогрес | Поточна задача |
|---|---|
| **18/37** ✅ | **T-QA-explore** — /explore: фото h-[192px]→h-[134px] (-30%) + теги в scrollable strip |

---

## ✅ Виконано (Sprint-04) — Підтверджено

| Іт | ID | Назва | Commit |
|----|----|-------|--------|
| 1 | T01 | Frost тема: всі клієнти → міграція | `490a108` |
| 2 | T02 | In-app сповіщення: unread кольорові + z-index | `b7c1d25` `2746e21` |
| 3 | T03 | Портфоліо → Сторіс: редірект замість drawer | `55ce2f9` |
| 4 | T04 | Мобайл магазин: кнопка "Додати товар" + toggle уніфікація | `df27107` `3c26ff6` |
| 5 | T05 | Клієнти (список): стандартизація кнопок + smart кнопка | `c239ae4` |
| 6 | T06 | Меню > Система > Студія: redesign + alpha/beta | `875f512` |
| 7 | T07 | Записи мобайл: safe area top + widget-card controls | `224b0f9` `0167e17` |
| 8 | T08 | Дашборд: tooltip safe area (кліп на краях) | `acce085` `5a5971f` |
| 9 | T09 | Мобайл послуги: кнопка + toggle a11y + компакт + sep | `99cbd6c` `decf6fd` |
| 10 | T10 | Портфоліо: кольори стандарт + mobile photo actions | `69f072e` `438a2f7` |
| 11 | T11 | GrowthHub мобайл: tab layout redesign | `fae6e9a` |
| 12 | T12 | Профіль: відпустка/вихідні overlap fix (3 таби) | `8533ce4` `1af1b3e` |
| 13 | T13 | Записи: баг буферу 10 хв між записами | `9b5fdde` |
| 14 | T14 | Конструктор сторіс (ПК+мобайл): розширення робочої зони | `6cc91f2` `0fa2aab` |
| 15 | T15 | Сповіщення: каскад Push→TG + тексти + PWA deep link | `51f0ba7` `f2b24bf` |
| 22.1 | T-QA-bookings | /my/bookings: 6 QA fixes | `731ea92` |
| 33 | T32 | Smart Slots: авто Flash Deal при скасуванні | `e7645f9` |
| 34 | T33 | Лендинг: повна консистентність тарифів | `e01e138` `e2b3bd1` |

---

## ▶ NEXT — QA Sprint + Клієнтська Зона

| Іт | ID | Назва | Статус |
|----|----|-------|--------|
| 22.2 | **T-QA-explore** | **/explore: фото h-[192px]→h-[134px] (-30%) + теги в strip** | **▶ NEXT** |
| 22.3 | T-QA-chat | /my/messages: Мої майстри + UX fixes | ⬜ |
| 22.4 | T-QA-navbar | MyBottomNav FAB redesign | ⬜ |
| 23 | T-phone | /my/setup/phone: onboarding redesign з нуля | ⬜ |
| 24 | T24 | Клієнтська зона: desktop layout — всі 8 сторінок | ⬜ |

---

## ⬜ Інші задачі Sprint-04 (pending)

| ID | Назва | Статус |
|----|-------|--------|
| T18 | Оптимізація завантаження сторінки послуг | ⬜ |
| T22 | Стандартизація завантаження фото (всі сутності) | ⬜ |
| T23 | Онбординг тур: persona simulation + brainstorm + spec | ⬜ |
| T25 | dashboard/settings (ПК): повний redesign | ⬜ |
| T28 | Розхідники: бізнес-аналіз + persona sim + spec | ⬜ |
| T29 | Розхідники: міграції + серверна логіка | ⬜ |
| T30 | Розхідники: UX/UI реалізація | ⬜ |
| T31 | Smart Design System: Context-Adaptive UI | ⬜ |

---

## ##ClientDesign — Потрібне Повне Переосмислення UX/UI

> ⚠️ Над цими задачами велась робота в ітераціях 16–22 (коміти існують), але бажаний дизайн-результат не досягнуто.
> Повне переосмислення по процесу `CLIENT_ZONE_REDESIGN.md` (Phase 0→5).
> Backend /my/messages ✅ — тільки UI переробляти. Profile schema ✅ — тільки UI переробляти.

| Іт | ID | Назва | Статус | Ref Commit |
|----|----|-------|--------|-----------|
| 16 | T16-redo | /explore + клієнтський навбар: повний редизайн | ⬜ redo | `3e151e5` |
| 17 | T17-redo | /my/masters + loyalty + notifications: redesign | ⬜ redo | `830acd4` |
| 17b | T-card-redo | Картка майстра (MasterCard + MasterListCard) | ⬜ redo | `a9c5b5b` |
| 18 | T-bookings-redo | /my/bookings: premium redesign + review + "Записатись знову" | ⬜ redo | `9118000` |
| 20 | T-profile-redo | /my/profile: Identity Card redesign (schema ✅) | ⬜ redo | `4e8d0c5` |
| 21 | T-chat-redo | /my/messages: UI redesign + keyboard UX (backend ✅) | ⬜ redo | `e3273aa` |

---

## Завершені спринти

| Спринт | Дата | Результат |
|---|---|---|
| Sprint-03 (18 tasks) | 2026-06-09/12 | ✅ Complete (18/18) |
| Sprint-02 (25 tasks) | 2026-06-08/09 | ✅ Complete |
| IRP (8 phases A–H) | 2026-06-07/08 | ✅ Security, Frost-only, wizard, no-emoji, a11y, audit |
| Theme Polish Sprint | 2026-05-19 | ✅ Всі 3 теми відполіровані |

---

## ⚠️ Pending (cross-sprint)
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions)
- Vercel Pro → cron `0 * * * *` для check-uncompleted
