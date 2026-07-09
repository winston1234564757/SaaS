# OPT-DB-04 — useDashboardStats: 5000-рядковий set-diff у JS

**Тип:** DATA
**Пріоритет:** P1
**Статус:** DRAFT
**Спеціаліст-скіли:** `sql-query-optimization`

---

## Поточний стан
`src/lib/supabase/hooks/useDashboardStats.ts:77-83`:
```
supabase.from('bookings').select('client_phone')
  .eq('master_id', masterId!).lt('date', weekStart).neq('status','cancelled')
  .limit(5000);
```
Тягне до 5000 історичних phone лише щоб у JS обчислити, які з цьоготижневих phone нові (`weekNewPhones`, `:123`). Це fetch-then-filter-in-JS, що має бути в SQL. На межі 5000 число «нових клієнтів» **мовчки стає хибним**. Хук на гарячому шляху дашборду (staleTime 30с, крутиться постійно).

## Ціль
Перенести обчислення в SQL: `NOT EXISTS` / `LEFT JOIN ... IS NULL` — рахувати кількість нових клієнтів тижня в базі, повертати число, не масив phone.

## Файли, які чіпаю
- `src/lib/supabase/hooks/useDashboardStats.ts:77-123` — замінити fetch+JS-diff на RPC/запит, що віддає лічильник.
- Можливо новий RPC `get_new_clients_count(master, week_start)` (або розширити наявну dashboard-RPC, якщо є).

## [DATA] Схема пайплайну
bookings історія (< weekStart) vs bookings цього тижня → різниця множин phone → count. Рветься: множина тягнеться повністю в JS з cap 5000. RLS scoped master — зберегти.

## Ризики / що може зламатись
- Інші метрики в тому ж хуку залежать від того ж fetch — перевірити, що не ламаємо решту `useDashboardStats`.
- Семантика «новий» = phone не зустрічався до weekStart серед не-cancelled — зберегти точно.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] «Нові клієнти» рахуються в SQL, коректні понад 5000 історичних записів.
- [ ] Дашборд не тягне масив із тисяч phone.

## Відкриті питання до тебе
1. Немає — чекаю APPROVE.
