# OPT-DB-07 — Кластер over-fetch (select('*') / no-bound)

**Тип:** DATA
**Пріоритет:** P2
**Статус:** DRAFT
**Спеціаліст-скіли:** `database-optimizer`

---

## Поточний стан
Кластер запитів, що беруть зайві колонки або не мають межі:
- `src/lib/supabase/hooks/useExpenses.ts:28-37` — `master_expenses.select('*')`, без явного `master_id`-предиката (лише RLS), без `.limit()`; коли `month` undefined — межі нема взагалі.
- `src/lib/supabase/hooks/useProductTransactions.ts:14` — `select('*')` (є `.limit(50)`+`product_id`, тож обмежено, але over-fetch колонок).
- `src/components/admin/ModerationHub.tsx:50` — `content_reports.select('*')` **без limit** (сусідній `reviews` на `:51` має `.limit(20)`).
- `src/components/admin/SystemLogsViewer.tsx:56` — `select('*')` (перевірити межі).
- `src/app/(master)/dashboard/revenue/expenses.actions.ts:126` — `select('*')` (перевірити межі/date).

## Ціль
Явні списки колонок замість `*`; додати `.limit()`/date-bound там, де межі нема (насамперед `useExpenses` без month, `ModerationHub`).

## Файли, які чіпаю
- 5 файлів вище — точкові правки select/limit.

## Ризики / що може зламатись
- `select('*')` → explicit columns: не пропустити колонку, яку споживач реально читає (перевірити типи/спожиток кожного).
- `useExpenses` без month — узгодити дефолтну межу (поточний місяць? останні N?), щоб не змінити семантику екрана витрат.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Жоден із 5 запитів не тягне `*`; кожен має верхню межу рядків.
- [ ] Екрани (витрати, транзакції, модерація, логи) рендеряться без регресій.

## Відкриті питання до тебе
1. Немає — кластер точкових правок, чекаю APPROVE.
