# OPT-DB-06 — useReviews: unbounded + дубль-запит pending

**Тип:** DATA
**Пріоритет:** P1
**Статус:** DRAFT
**Спеціаліст-скіли:** `tanstack-query`

---

## Поточний стан
`src/lib/supabase/hooks/useReviews.ts`:
- `:52-56` — `reviews.select(...).eq('master_id',...).order('created_at', desc)` без `.limit()` → тягне всі відгуки майстра.
- `:70-75` — окремий запит `reviews-pending` за `is_published=false` — строга підмножина першого результату, зайвий round-trip.

## Ціль
Додати `.limit()`/пагінацію до основного запиту; `pending` вивести в пам'яті з уже завантаженого списку (фільтр `is_published===false`), прибрати другий запит.

## Файли, які чіпаю
- `src/lib/supabase/hooks/useReviews.ts:52-75` — limit + derive pending in-memory.
- Споживач (ReviewsPage) — узгодити, якщо потрібна пагінація UI (перетин з OPT-RND-03, який теж чіпає ReviewsPage — робити разом).

## [DATA] Схема пайплайну
reviews(master) → published/hidden/pending розкладка. Рветься: повний список + дубль на підмножину. RLS scoped master.

## Ризики / що може зламатись
- Якщо pending виводимо з обмеженого списку — переконатись, що `.limit()` не відсіче непубліковані (сортування desc за датою; pending можуть бути старими). Можливо, окремий лічильник pending лишити RPC-запитом, а список обмежити.
- Перетин із OPT-RND-03 (обидва чіпають ReviewsPage) — узгодити пагінацію/віртуалізацію спільно.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Основний запит обмежений; немає дубль-round-trip на підмножину.
- [ ] Лічильник/список pending коректний (враховано ризик обрізання).

## Відкриті питання до тебе
1. ~~Об'єднати з RND-03?~~ Так, зроблено разом.

---

## [Заповнюється після DONE]
**Root cause / рішення:** Головний запит `useReviews` тягнув усі відгуки майстра без межі. Додано `.limit(300)` (useReviews.ts:57). Дубль-запит `reviews-pending` СВІДОМО лишено: якби pending виводився з обмеженого головного списку, непубліковані відгуки поза вікном 300 губились би; pending — малий moderation-set (тільки `is_published=false`), тож окремий unbounded-запит там прийнятний і коректний. Прибирати його ціною коректності сенсу немає.
**Файли:** `src/lib/supabase/hooks/useReviews.ts:57` (`.limit(300)`).
**Верифікація:** TSC 0 · Build clean · ESLint clean.
**Commit:** pending.
