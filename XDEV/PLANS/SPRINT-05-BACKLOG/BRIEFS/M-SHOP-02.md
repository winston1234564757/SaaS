# M-SHOP-02 — Магазин: картки товарів у стилі маркетплейсу

**Статус:** DONE · commit `4d428d28` · deploy READY · очікує візуального QA founder
**Тип:** REDESIGN (layout) · **Тір:** 1 · **Пріоритет:** P1
**Скіли:** `design-taste-frontend` + `impeccable (layout)` · **Модель:** Sonnet
**Близнюк:** `M-SVC-02` (картки послуг маркетплейс + 2 режими) — патерн уже відпрацьований і на проді.

---

## Before (поточний стан)

`src/components/master/products/ProductCard.tsx` — компактний **горизонтальний рядок**:
- фото/іконка 64px зліва → інфо-колонка справа;
- рядок 1: назва (`truncate`) + тогл активності;
- рядок 2: піл-категорія + піл-залишок (колір за кількістю);
- рядок 3: ціна + дії (Поповнити `RefreshCw`, Редагувати `Pencil`);
- повнокарткова `<button>`-підкладка (z-0 sibling) → `onOpenStats` (Аналітика продажів overlay);
- drag-handle на фото (hover).

Рендериться у `ProductsPage.tsx`, таб `products`, контейнер `flex flex-col gap-3` (вертикальний список), DnD reorder.

**Проблема (з беклогу):** товарний рядок виглядає як «службовий список», не як вітрина. Послуги вже отримали marketplace-вигляд (фото-зверху плитка + icon-fallback + 2 режими) — товари мають дзеркалити, бо це буквально вітрина магазину.

---

## After (напрям)

Перенести патерн `ServiceCard.tsx` 1:1 на товари, з поправкою на товарну специфіку (залишок).

**`view` проп (`'grid' | 'list'`)** на `ProductCard`, спільні блоки дій (`actions` + `toggle`) — нуль дублювання.

**Grid (плитка):** `bento-card p-0 flex flex-col` → фото `aspect-[16/10]` зверху (`Image fill object-cover` АБО Frost-градієнт `from-primary/12 via-accent/8` + `ProductIcon` 40px center) → контент (назва `line-clamp-2`, піл-категорія, ціна `metric-value text-lg`) → footer-дії `mt-auto border-t`. **Залишок** — піл-оверлей top-right на фото (колір STOCK_COLOR), drag-handle top-left на hover.

**List:** flex-row `items-stretch` → мініатюра 60px self-stretch → контент flex-1 (назва на всю ширину `line-clamp-2`; категорія + залишок-піл) → правий стовпчик `items-end` (ціна над діями).

**Перемикач режимів** у лівому сайдбарі `ProductsPage` (`LayoutGrid`/`List`, `aria-pressed`, `role=group`), показ лише коли `products.length > 0`, **persistence `localStorage['products_view']`** (читання в useEffect post-mount → без hydration mismatch). Контейнер: `view==='list' ? flex flex-col gap-2 : grid md:grid-cols-2 gap-3`. DnD обгортає обидва (Draggable лишається).

**Збереження інваріантів:** тогл активності, Поповнити, Редагувати, drag reorder, `onOpenStats`, opacity-55 для неактивних, SkeletonList — усе працює без змін бекенду/хуків/RPC.

---

## Файли (files_changed = files_read)

| Файл | Зміна |
|------|-------|
| `ProductCard.tsx` | **Write** (повна переробка під grid/list + `view` проп) |
| `ProductsPage.tsx` | **Edit** (перемикач режимів у сайдбарі + localStorage + контейнер за `view`) |

ConsumableCard (розхідники) — **поза скоупом** (окремий тип, не вітрина).

---

## Відкриті розгалуження → QA (рішення founder)

1. **Тап по тілу картки.** Зараз: повнокарткова кнопка → Аналітика. У послуг: тіло → Редактор, плюс окрема Eye-кнопка прев'ю. Що робимо для товарів?
2. **2 режими (grid/list) + перемикач + localStorage** — як у послуг? Чи лишити лише новий marketplace-grid?
3. **Залишок у grid** — піл-оверлей на фото чи в контентній зоні під назвою?

---

## Ризики

- **Конфлікт повнокарткового stats-overlay з тап-зонами.** У grid буде фото-кнопка (drag) + контент-кнопка + footer-кнопки. Повнокарткова z-0 підкладка під усім — лишити лише як «решта площі = stats», або прибрати на користь явної кнопки (див. QA#1). Вкладені `<button>` = невалідний HTML — рознести як у ServiceCard (sibling, не parent).
- DnD: grid-режим + `@hello-pangea/dnd` — Draggable у grid-контейнері працює, але треба перевірити `provided.placeholder` у grid (services тримали list для DnD; перевірити чи services-grid теж DnD). _Перевірю в коді ServicesPage перед реалізацією._

---

## Гейти (Tier 1)

`design-taste-frontend` → `impeccable (layout)` → `tsc --noEmit` → `build`. Humanizer: новий UI-текст мінімальний (можливо aria-labels — технічні, без humanizer). Encoding-check перед Write.
