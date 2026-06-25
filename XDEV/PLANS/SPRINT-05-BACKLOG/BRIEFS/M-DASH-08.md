# M-DASH-08 — Дашборд: «Середній чек» overlay (розбивка по послугах)

**Статус:** DONE · commit `37f8ca65`
**Тип:** feature/overlay · **Тір:** 1 · **Скіл:** `senior-frontend` · **Модель:** Sonnet · **P1** · близнюк M-DASH-07
**Файл:** `widgets/frost/InsightsRow.tsx` (`AvgCheckCard`)

---

## Поточний стан

`AvgCheckCard` (`InsightsRow.tsx:128`) показує середній чек поточного тижня (avg `total_price` по `completed`), дельту % vs минулий тиждень, і бари this/prev. **Тижневе порівняння вже на картці** → overlay не має його дублювати.

## Рішення (узгоджено founder)

Overlay = **розбивка по послугах**: що формує чек. Тап на картці → `Sheet variant=adaptive` (той самий патерн, що M-DASH-07).

Дані — read-side з уже завантажених `thisBookings` (`useBookings`, цей тиждень). Для кожного `completed`-запису ітеруємо `b.services[]`:
- `name` — назва послуги
- `count` — скільки разів зустрілась у завершених записах тижня
- `revenue` — Σ `service.price`
- `avgPrice` — `revenue / count`
- `sharePct` — частка у сумі послуг тижня

Сортування за `revenue` ↓. Рядок: назва · `count` × сер.ціна · сума + частка.

Хедер overlay: середній чек тижня (та сама цифра, що на картці) + N завершених записів — щоб overlay був самодостатній.

## Чесний нюанс
`total_price` (база середнього чека) = послуги + товари + динамічна ціна. Розбивка рахується по `service.price` → сума послуг може бути < `total_price` (товари/надбавки). Тому в overlay назвемо це «по послугах», а не «100% чека». Хедер лишає реальний avg (per booking), список = вклад послуг.

## План
1. `AvgCheckCard` → локальний `useMemo` `serviceBreakdown` із `thisBookings`.
2. Метрику/картку зробити клікабельною (`<button>` aria-haspopup/expanded), тап → `open`.
3. `<Sheet variant="adaptive" title="Середній чек цього тижня">` зі списком + хедер-зведення.
4. Порожній стан: «Завершених записів цього тижня немає».
5. UI-текст → humanizer · tsc + build.

## Ризики
- Послуга без `services[]` (порожній масив) → пропустити / «Без послуги».
- Поділ на нуль (`count=0`) — guard.

## Acceptance
- [x] Тап на «Середній чек» → overlay з розбивкою по послугах тижня (назва/к-сть/сер.ціна/частка)
- [x] Хедер: avg чек + N завершених
- [x] Порожній стан коректний
- [x] a11y button+aria · tsc 0 · build clean (2.1min)
