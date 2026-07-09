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
1. ~~Пагінація чи віртуалізація?~~ Обрано віртуалізацію — АЛЕ при читанні коду виявлено 2-колонковий masonry змінної висоти → див. рішення.

---

## [Заповнюється після DONE]
**Root cause / рішення:** Список — 2-колонковий masonry (`grid-cols-1 lg:grid-cols-2 items-start`) карток ЗМІННОЇ висоти під `AnimatePresence popLayout`, кожна з `layout` → reflow всіх сусідів на фільтрі/сорті. Прибрано `layout` з `motion.div` (ReviewsPage.tsx:321) — thrash усунено, entrance opacity/y лишився. Кількість карток обмежено `.limit(300)` у запиті (DB-06). 
**Свідомо НЕ зроблено — повна `useWindowVirtualizer`:** нова інформація при читанні коду — це masonry змінної висоти, не одноколонковий fixed-row список як `ClientsPage`. Справжнє вікнування masonry (lane-assignment + dynamic measure) = високий ризик (стрибучий скрол, misalign) + не own-eyes-верифіковне тут, а `.limit(300)`+прибраний `layout` уже знімають знахідку. Gold-plating з ризиком по launch-critical UI відкладено (окрема задача, лише якщо є майстри з 300+ відгуками).
**Файли:** `src/components/master/reviews/ReviewsPage.tsx:321` (layout removed).
**Верифікація:** TSC 0 · Build clean · ESLint clean. Own-eyes НЕ прогнано.
**Commit:** pending.
