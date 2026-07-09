# OPT-DB-02 — get_master_clients без пагінації + refetch на кожен keystroke

**Тип:** DATA
**Пріоритет:** P0
**Статус:** DRAFT
**Спеціаліст-скіли:** `supabase-postgres-best-practices` `senior-backend`

---

## Поточний стан
RPC `get_master_clients` — `supabase/migrations/20260708000000_repo_parity_idor_bodies.sql:1072-1127`:
- CTE `last_visit_info` робить `DISTINCT ON (client_phone)` з `ORDER BY ... date DESC` по **всіх** не-cancelled booking'ах майстра.
- Фінальний `SELECT ... GROUP BY client_phone ORDER BY COUNT(*) DESC` повертає **всіх** клієнтів, без `LIMIT`/keyset.

Виклики:
- `src/lib/supabase/hooks/useClients.ts:36` (кешований React Query — ок).
- `src/app/(master)/dashboard/marketing/actions.ts:166,194,216,272` — server actions `getClientsForPicker` / `previewBroadcastRecipients`: викликаються наново на **кожну сторінку пікера / кожен keystroke пошуку**, щоразу тягнуть усіх клієнтів і `slice()` у JS (`:174,227`). Server actions не мають React Query кешу — нічого не мемоїзується між викликами.

## Ціль
Перенести фільтр + `LIMIT/OFFSET` (або keyset) у SQL/RPC. У marketing-actions прибрати fetch-then-slice: віддавати сторінку з бази. Розглянути окремий легший RPC для пікера (тільки phone+name+visits, без важких CTE).

## Файли, які чіпаю
- Нова міграція: параметризований `get_master_clients` (додати `p_limit`, `p_offset`, `p_search`) АБО новий `get_clients_for_picker`.
- `src/app/(master)/dashboard/marketing/actions.ts:166-280` — передавати page/search у RPC, прибрати JS-slice.
- `src/lib/supabase/hooks/useClients.ts:36` — узгодити сигнатуру, якщо RPC зміниться (додати дефолти, щоб не зламати).

## [DATA] Схема пайплайну
booking'и майстра → агрегація по `client_phone` (COUNT, last visit) → join `client_master_relations` → список. Рветься: O(усіх booking'ів) на кожну взаємодію пікера. RLS/`SECURITY DEFINER` — зберегти `search_path` і фільтр `p_master_id = auth-власник` (це IDOR-body міграція, не послабити перевірку власника).

## Ризики / що може зламатись
- `useClients` (CRM-сторінка) залежить від повного списку для клієнт-сайд фільтрів/віртуалізації — якщо параметризувати RPC, зберегти зворотну сумісність (дефолт = поточна поведінка) або віддати окремий RPC пікеру, CRM не чіпати.
- Це міграція з IDOR-фіксами — будь-яка зміна тіла має зберегти перевірку власника й `search_path`.
- repo-parity: DDL на проді застосовувався через Management API, не `db push` (див. `AUDIT/REPO_PARITY.md`) — нову міграцію застосовувати тим самим шляхом.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Пікер/пошук у marketing віддає сторінку з бази, без fetch-then-slice усіх клієнтів.
- [ ] CRM-сторінка (`useClients`) не зламана.
- [ ] Перевірка власника (IDOR-guard) збережена.

## Відкриті питання до тебе
1. Параметризувати наявний `get_master_clients` (ризик для CRM) чи додати окремий легкий `get_clients_for_picker`? Схиляюсь до окремого RPC.
