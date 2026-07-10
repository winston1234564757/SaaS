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
1. Немає.

---

## [Заповнюється після DONE]

**Кластер виявився вужчим, ніж записано в аудиті.** Перевірка живим кодом: із 5 пунктів реальними були **2**.

**Полагоджено:**
- `useExpenses.ts:28-31` — був `select('*')` **без межі взагалі** (єдиний консумер `ExpensesTab.tsx:65` викликає `useExpenses()` БЕЗ `month`, тож гілка з date-фільтром мертва → запит завжди повністю необмежений). Замінено на явні 8 колонок (покривають увесь тип `MasterExpense`, каст лишається валідним) + доданий `.eq('master_id', masterId!)` (планувальнику, RLS і так є) + `.limit(500)`.
- `ModerationHub.tsx:50` — `content_reports.select('*')` без `.limit()`, хоча сусідні запити мали `.limit(20)`. Додано `.limit(50)`.

**Не потребували правки (спростовано):**
- `useProductTransactions.ts:14` — вже `.eq('product_id')` + `.limit(50)`. Лишається лише over-fetch колонок на 50 рядках — не варте правки.
- `SystemLogsViewer.tsx:56` — вже `.limit(50)`.
- `expenses.actions.ts:126` (`getExpenses`) — **мертвий код**, жодного консумера. Не чіпав.

**Побічний баг — ДОВЕДЕНО на живій БД (поза скоупом, наразі недосяжний):**
`expenses.actions.ts:133` і мертва гілка `useExpenses.ts:38` будують `lte('expense_date', \`${month}-31\`)`.
Перевірено на локальному Postgres:
```
SELECT '2026-02-31'::date;  -- ERROR: date/time field value out of range
SELECT '2026-04-31'::date;  -- ERROR: date/time field value out of range
SELECT '2026-01-31'::date;  -- 2026-01-31  (ок)
```
Тобто запит впаде для **будь-якого місяця коротшого за 31 день** — лют/квіт/черв/вер/лист (5 з 12).
Зараз **недосяжно**: `useExpenses()` завжди кличеться без `month`, а `getExpenses` не має консумерів. Це міна на майбутнє.
Правильний патерн: `lt('expense_date', <1-ше число НАСТУПНОГО місяця>)` замість `lte(..., '${month}-31')`.

**Файли:** `src/lib/supabase/hooks/useExpenses.ts`, `src/components/admin/ModerationHub.tsx`.
**Верифікація:** TSC 0 · Build clean. ESLint: у `ModerationHub` 18 пре-існуючих проблем (unescaped entities, `<img>`), жодна не з цієї зміни.
**Commit:** pending.
