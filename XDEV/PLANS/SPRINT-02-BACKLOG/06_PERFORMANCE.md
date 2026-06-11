# B-10 — Services: Повільне Завантаження

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

**Пріоритет:** P1 Performance  
**Скіл:** `senior-backend`  
**Статус:** TODO

---

## Проблема
Сторінка `/dashboard/services` повільно вантажиться. Причина невідома — потрібен аудит запитів.

---

## Файли

| Файл | Роль |
|------|------|
| `bookit/src/app/(master)/dashboard/services/page.tsx` | Server Component — завантаження даних |
| `bookit/src/components/master/services/ServicesPage.tsx` | Client Component — CRUD |
| DB: `services`, `service_categories` | Таблиці послуг |

---

## Аудит план

### Крок 1: Знайти bottleneck
1. `Read services/page.tsx` — побачити які запити робляться server-side
2. Перевірити: чи є N+1 queries (наприклад, `SELECT * FROM services` + loop `SELECT category WHERE id = X`)
3. Перевірити: чи завантажується більше даних ніж потрібно (зайві поля у SELECT)

### Крок 2: Типові проблеми
- **N+1 query**: замінити на JOIN
  ```sql
  -- ЗАМІСТЬ:
  SELECT * FROM services WHERE master_id = X;
  -- (потім для кожного: SELECT * FROM service_categories WHERE id = svc.category_id)
  
  -- КРАЩЕ:
  SELECT s.*, sc.name as category_name
  FROM services s
  LEFT JOIN service_categories sc ON s.category_id = sc.id
  WHERE s.master_id = X;
  ```
- **Missing index**: `services.master_id` має бути проіндексовано
- **Зайвий revalidate(0)**: якщо є `export const revalidate = 0` → прибрати або встановити 60s

### Крок 3: Supabase query optimization
- `select("*, service_categories(*)")` → виконується як JOIN (ефективно)
- `select("id, title, price, duration, category_id, is_active")` → вибирати тільки потрібні поля

### Очікувані фікси
1. Замінити множинні запити на один JOIN запит
2. Перевірити і додати missing indexes якщо потрібно
3. Встановити розумний `revalidate` (60s)

---

## QA
- Відкрити `/dashboard/services` — час завантаження < 1s
- Порівняти Network tab: кількість запитів до і після
- `npm run build` — перевірити що немає TypeScript помилок
