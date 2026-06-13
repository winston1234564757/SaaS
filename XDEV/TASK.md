# TASK.md — Поточні задачі

> Оновлюється після кожної ітерації Sprint-04.
> **Updated:** 2026-06-13 (T11 ✅ T12 ▶)

---

## Активний спринт

**Sprint-04** — 30 ітерацій (one task = one vercel --prod deploy)
**Повний план:** `XDEV/PLANS/SPRINT-04-BACKLOG/SPRINT-04-PLAN.md`
**Живий трекер:** `XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md`
**Handoff:** `XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md`
**Transition prompt:** `XDEV/PLANS/SPRINT-04-BACKLOG/TRANSITION_PROMPT.md`

| Прогрес | Поточна задача |
|---|---|
| **11/30** ✅ | **T12** — Профіль: відпустка/вихідні overlap fix (3 таби) |

### Виконано (Sprint-04)
| Іт | ID | Назва | Commit |
|----|----|-------|--------|
| 1 | T01 | Frost тема: всі клієнти → міграція | `490a108` |
| 2 | T02 | In-app сповіщення: unread кольорові + z-index | `b7c1d25` `f88b444` `185d78a` `2746e21` |
| 3 | T03 | Портфоліо → Сторіс: редірект замість drawer | `55ce2f9` |
| 4 | T04 | Мобайл магазин: кнопка "Додати товар" + toggle уніфікація | `df27107` `3c26ff6` |
| 5 | T05 | Клієнти (список): стандартизація кнопок + smart кнопка | `c239ae4` |
| 6 | T06 | Меню > Система > Студія: redesign + alpha/beta | `875f512` |
| 7 | T07 | Записи мобайл: safe area top + widget-card controls | `224b0f9` `5be8ae1` `cc50914` `0167e17` |
| 8 | T08 | Дашборд: tooltip safe area (кліп на краях) | `acce085` |
| 9 | T09 | Мобайл послуги: кнопка + toggle a11y + компакт + sep | `99cbd6c` |
| 10 | T10 | Портфоліо: кольори стандарт + mobile photo actions | `69f072e` `39cc4e9` `3cb5502` `438a2f7` |

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
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql`
- Vercel Pro → cron `0 * * * *` для check-uncompleted
