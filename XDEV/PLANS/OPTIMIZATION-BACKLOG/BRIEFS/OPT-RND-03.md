# OPT-RND-03 — ReviewsPage: layout на необмеженому списку

**Тип:** MOTION
**Пріоритет:** P1
**Статус:** DRAFT
**Спеціаліст-скіли:** `fixing-motion-performance`

---

## Поточний стан
`src/components/master/reviews/ReviewsPage.tsx:317-325`:
```
<AnimatePresence mode="popLayout">
  {visible.map((r, i) => (
    <motion.div key={r.id} layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
      exit={{opacity:0,scale:0.97}} transition={{ delay: Math.min(i*0.04,0.3) }} ...>
```
`visible` (`:60`) — повний відфільтрований/відсортований масив без пагінації/slice. Кожна картка має `layout` (per-frame measure/reflow всіх сусідів) під `popLayout`. Зміна фільтра → layout-анімація по всьому списку. Найгірший list-offender застосунку.

## Ціль
Обмежити рендер: пагінація або віртуалізація (`useWindowVirtualizer`, reuse з `ClientsPage`). Прибрати per-card `layout` (лишити opacity/y вхід). Прибрати або зменшити stagger-delay для довгих списків.

## Файли, які чіпаю
- `src/components/master/reviews/ReviewsPage.tsx:60,317-325` — обмежити `visible`, прибрати `layout`.

## Ризики / що може зламатись
- Фільтр/сорт-переходи стануть менш «плинними» без `layout` — узгодити прийнятність (own-eyes).
- Перетин з OPT-DB-06 (той самий екран, обмеження запиту) — робити разом: обмежити і дані, і рендер.
- `mode="popLayout"` при видаленні картки (модерація) — переконатись, що exit-анімація ще коректна.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Список не робить layout-reflow всіх карток на фільтрі/сорті.
- [ ] На майстрі з сотнями відгуків скрол/фільтр плавні (own-eyes).

## Відкриті питання до тебе
1. Пагінація «показати ще» чи повна віртуалізація? Для відгуків схиляюсь до віртуалізації (reuse ClientsPage).
