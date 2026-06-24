# M-DASH-03 — Дашборд: "Вільно сьогодні" scroll UX → motion-полиш слотів

**Тип:** MOTION (Тір 1) · **Статус:** DONE · commit `4d6c2dcf` + tweak `762461a3` (deploy READY на prod)

---

## DONE — рішення

Скрол-UX задачі = 0 нового коду (вже покрито G-PWA-02 ScrollStrip, підтверджено). Vitos розширив → motion-полиш груп слотів.

**Реалізовано** у `frost/FreeSlotsWidget.tsx` (фінальні числа після фідбеку "стрибає" → −50% швидкості, tweak `762461a3`):
- `groupStagger` (`staggerChildren 0.12, delayChildren 0.06`) + `groupItem` (`opacity 0→1, y 8→0`, spring `duration 0.6, bounce 0` — без overshoot за вимогою) — поза компонентом, `as const`. (Початково 0.08/0.04/0.4 — відчувалось різко, уповільнено на 50%.)
- Контейнер груп → `motion.div`, `key={selectedService?.id}` → remount = replay `initial→animate` на load + кожній зміні послуги (підтверджене розгалуження).
- `useReducedMotion()` → `initial={reduceMotion ? false : 'hidden'}` — миттєвий показ без трансформів.
- Тільки групи стагеряться (3 елементи); чипи всередині зʼявляються разом (підтверджене розгалуження). Лише `opacity`+`y`.

**Скіл `emilkowalski-motion` валідував:** stagger лише малих груп (3 ок), єдина моушн-мова, transform/opacity, reduced-motion fallback.

**Перевірка:** tsc 0 · build clean · deploy READY. Візуальний QA — на проді (рішення Vitos).

---

### (нижче — оригінальний бриф)
**Скіл:** `emilkowalski-motion` → `impeccable (animate)` → перевірка на моб.
**Файл:** `bookit/src/components/master/dashboard/widgets/frost/FreeSlotsWidget.tsx` (тільки Frost — єдина активна тема)

---

## Контекст: оригінальний scroll UX уже закрито

Скрол-вимоги M-DASH-03 (стрілки / перемикачі / крихти-прогрес) **повністю покрито парасолькою G-PWA-02** — селектор послуг уже на `ScrollStrip` (рядок 108). Підтверджено кодом + drawer'ом G-PWA-02. Нового скрол-коду не потрібно.

Vitos обрав розширити задачу: **додати staggered reveal груп слотів** (net-new MOTION поза оригінальним ТЗ).

## Ціль (референс відчуття)

Коли слоти зʼявляються (після завантаження + при зміні послуги), групи **Ранок / День / Вечір** проявляються каскадом — спокійний Frost-editorial: мʼякий fade + невеликий y-rise, БЕЗ bounce-стрибків. Відчуття «контент проявляється», не «вистрілює».

## Технічне рішення (узгоджено з dashboard-animation-system)

- Контейнер груп (рядок 134, `flex flex-col gap-3`) → `motion.div` з `variants={groupStagger}`, `initial="hidden" animate="visible"`.
- Кожна група (рядок 136) → `motion.div variants={groupItem}`.
- Варіанти **поза компонентом, `as const`**:
  ```tsx
  const groupStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } } as const;
  const groupItem = {
    hidden:  { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, duration: 0.45, bounce: 0.06 } },
  } as const;
  ```
- **Reduced-motion:** `useReducedMotion()` → якщо true, y=0 + staggerChildren=0 (миттєвий показ). Обовʼязково.
- **Replay-тригер:** `key={selectedService?.id}` на контейнері — remount → повтор `initial→animate` при кожній зміні послуги (рішення A/B нижче).

## Що НЕ чіпаю

- ScrollStrip-селектор (вже працює).
- Сітку `grid-cols-4` всередині групи (вертикальний потік, не скрол).
- Footer-кнопки Flash/Сторіс, лоадер, empty-стан ("Розклад заповнено").
- Жодного нового UI-тексту → humanizer N/A.

## Гейти

`emilkowalski-motion` (узгодити spring) → `impeccable (animate)` (аудит руху) → tsc → перевірка на мобільному в'юпорті → build (батч).

## Відкриті розгалуження → QA (1 батч)

1. **Гранулярність:** тільки групи (3 елементи) vs групи + легкий каскад чипів усередині.
2. **Тригер повтору:** лише перше завантаження vs повтор і при кожній зміні послуги.
