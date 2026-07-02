# C-NAV-01 — MyBottomNav FAB redesign

> **Тип:** MOTION (Tier 1) · **Скіли:** `emilkowalski-motion` + `design-taste-frontend` · **Модель:** Sonnet
> **Статус:** DONE ✅ — commit `ea1551b6`, TSC:0 Build:clean, локальний рендер верифіковано. Founder свапнув Каталог↔Бонуси (Каталог=слот, dial=Бонуси·Сповіщення). Очікує деплою.
> **Файл беклогу:** `MyBottomNav` FAB: Записи | Бонуси | [FAB] | Чат | Профіль; iOS-spring tap; safe area bottom.

---

## Before (поточний стан)

`src/components/client/MyBottomNav.tsx` — 5 плоских рівних слотів, без ієрархії, без FAB:
- **/my (authed):** Записи · Каталог · Чат · Сповіщення · Профіль
- **public authed:** Каталог · Записи · Профіль
- **public unauth:** Каталог · Увійти
- Кошик — умовний ДОДАТКОВИЙ слот (коли активна корзина, не на /shop)
- Активний слот: `layoutId="client-nav-active"` пілюля (SPRING 400/30) — зберігаємо
- unread DM badge на «Чат» (`useUnreadDMCount`) — зберігаємо
- `isFullscreenChat` → навбар `null` (DM-тред + support) — зберігаємо
- Маркер провалу за Законом темного блоку: **рівномірність** — 5 однакових слотів, нуль домінанти.

## Дизайн-напрям (рішення founder з QA)

Асиметрична ієрархія: **один герой-FAB** (центр, елевація) + 4 тихі слоти. FAB = **speed-dial**.

### Лейаут /my (authed)
```
Записи | Бонуси | [ FAB ] | Чат | Профіль
                    ↑ speed-dial розкривається вгору
```
- **FAB speed-dial дії** (springs-out вгору, stagger): **Каталог** (/explore) · **Сповіщення** (/my/notifications). Опційно 3-тя: **Мої майстри** (/my/masters) — на твій розсуд.
- **Бонуси** → /my/loyalty (іконка Gift). Замінює старий слот «Каталог» (Каталог переїхав у FAB).
- **Сповіщення** зникає як слот → стає дією speed-dial.
- **Чат** лишається слотом (unread DM badge зберігається).

### Лейаут public
- **authed:** Записи | [FAB] | Профіль; FAB speed-dial: Каталог · Сповіщення.
- **unauth:** Каталог | [FAB] | Увійти; FAB speed-dial: Каталог · Увійти (тригерить `NavLoginSheet`). *(Якщо для гостя speed-dial надлишковий — FAB = прямий Каталог. Уточни.)*

### Кошик
Плаваюча **піл «Кошик · N»** НАД навбаром (не слот) коли `showCart`. Не ламає 5-слот сітку. Springs-in.

---

## Motion-специфікація (одна мова, reduced-motion gated)

| Момент | Параметри |
|---|---|
| FAB press | `whileTap scale 0.90`, `TAP_POP = spring{stiffness:520, damping:16, mass:0.8}` (реюз з QuickActions — консистентність) |
| FAB icon | Plus → rotate 0→45° (стає «×») при відкритті, spring |
| Speed-dial actions out | `translateY` знизу-вгору + `opacity 0→1` + `scale 0.85→1`, stagger ~45ms, `AnimatePresence mode="popLayout"` |
| Backdrop | scrim `bg-foreground/5` (tap → close); z під speed-dial, над контентом |
| Активна пілюля | існуючий `layoutId`, SPRING 400/30 — без змін |
| Cart pill in | spring translateY/opacity |
| Reduced motion | `useReducedMotion()` → без stagger/scale/rotate, миттєво |

Тільки `transform`+`opacity` (HW-accel). Контроли 140-220ms (emil). Без нескінченних лупів у навбарі.

---

## Frost / a11y / IRON RULES

- **FAB:** `--hero-card-bg #0F172A` фон + `--accent-on #F8FAFC` іконка (єдина домінанта, single accent). Кругла pill, елевація tinted-shadow (не neon-glow).
- **Тихі слоти:** як зараз — `text-muted-foreground/50` неактивні, `text-foreground` активний.
- **a11y (RULE 6):** FAB = `<button type="button" aria-label="Швидкі дії" aria-expanded={open}>`; speed-dial дії = `<Link>`/`<button>` з aria-label; усі target ≥44px; badge `pointer-events-none`.
- **No-Emoji:** лише Lucide (Plus, Search, Bell, Gift, MessageCircle, User, ShoppingBag).
- Safe-area bottom зберігається; FAB елевація над nav поважає inset.
- Speed-dial закривається на зміну `pathname` (useEffect) + outside-tap.

---

## Файли (files_changed = files_read)

1. **`MyBottomNav.tsx`** — повний **Write** (≥5 змін: слоти, FAB, cart-pill, public-варіанти). Реюз існуючих: `useUnreadDMCount`, `useActiveCart`, `NavLoginSheet`, `isFullscreenChat`, `layoutId`.
2. **`NavSpeedDial.tsx`** (NEW) — ізольований client-leaf (design-taste: motion-ізоляція, `React.memo`): FAB-кнопка + backdrop + spring-out дії + reduced-motion.

*Топбар НЕ чіпаємо* (сповіщення пішли в speed-dial, не в хедер).

---

## Ризики / відкриті

1. **Live-badge сповіщень:** хука непрочитаних сповіщень НЕМАЄ (є лише `useUnreadDMCount`). → Сповіщення в speed-dial shipped **без live-лічильника** цей спринт (статичний пункт). Живий badge = окрема DATA-задача. *(В межах MOTION-скоупу.)*
2. **Public unauth speed-dial:** 2 пункти (Каталог+Увійти) — чи не надлишок? Fallback: FAB=прямий Каталог для гостя.
3. **Speed-dial z-index** vs sticky-контент сторінок — scrim + z-50 навбар, перевірити на /my/bookings.
4. **3-тя дія (Мої майстри)** — включати чи ні (тримати 2 чисті).

## Гейти
`emilkowalski-motion` ✓ (піднято) · далі: код → `tsc` → `impeccable (animate)` → **перевірка на моб (Playwright headless + власні очі)** → `humanizer` на будь-яку нову мікрокопі → build батчем.

## Humanizer scope
Нові/змінні видимі рядки: (нема справді нових — усі established: Записи/Бонуси/Каталог/Чат/Профіль/Сповіщення/Кошик/Увійти/Мої майстри). Якщо додам tooltip/підказку — прогоню. Інакше nav-іменники не потребують.
