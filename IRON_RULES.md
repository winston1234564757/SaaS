# IRON RULES — Порушення заборонені
> Абсолютний пріоритет. Виконується завжди, без винятків, без спрощень.

---

## RULE -1 — SESSION START (перший хід кожної сесії)

**Виконати в першій відповіді, до будь-чого іншого:**

1. `mempalace_status` — викликати як tool call (не просто згадати)
2. `Read XDEV/MAPS/SYSTEM_MAP.md` (offset: ~останні 50 рядків)
3. Написати: `STARTUP OK: Palace [N] drawers | SYSTEM_MAP current`

Без STARTUP OK — жодного коду, жодних file reads для задач.

---

## RULE 0 — Encoding Guard (перед кожним Edit/Write з кирилицею)

**Хук вже блокує (exit 2) — але якщо хук не спрацював:**

```python
with open(path, 'rb') as f: raw = f.read()
dirty = b'\xd0\xa0\xc2' in raw or b'\xe2\x80\x9c' in raw or b'\xe2\x80\x99' in raw
if dirty: → FIX FIRST via XDEV/ENCODING_FIX_PROMPT.md
```

---

## RULE 0.5 — Humanizer (перед будь-яким UI-текстом у файлі)

**Порядок роботи — без винятків:**

1. Визначити ВСІ рядки що побачить користувач (кнопки, toast, label, placeholder, empty state, заголовки)
2. Виписати їх у відповідь
3. Викликати `/humanizer` з цим списком
4. Після підтвердження — записати у файл
5. Написати: `HUMANIZER: confirmed for [список рядків]`

**Технічні винятки** (humanizer не потрібен): `aria-label`, `data-testid`, формати дат (`HH:mm`), технічні статуси (`pending`, `confirmed`, `cancelled`), назви змінних.

**Хук** (`humanizer_guard_hook.py`) виведе попередження якщо кирилиця знайдена в UI-контексті — підтвердити або пояснити.

---

## RULE 1 — QA-GATE (перед кожною задачею)

**Послідовність для кожної задачі:**

```
1. mempalace_search "[тема задачі]"  ← перед читанням файлів
2. Задати 3-5 питань користувачу (scope, approach, constraints)
3. Оголосити "SKILL: [назва]" → запустити скіл
4. Humanizer для UI-тексту (RULE 0.5)
5. Отримати явне OK від користувача
6. Тільки тоді → читати файли → писати код
```

Відповідь перед кодом: `GATE OK: search✓ | QA✓ | Skill: [name] | Humanizer: ✓/pending`

---

## RULE 2 — Skills Decision Tree (перед кожною ітерацією)

**Оголошення скілу — обов'язкова перша лінія відповіді на задачу:**

| Тип задачі | Основний скіл | Аудит-скіл |
|------------|---------------|------------|
| UI/Design  | `design-taste-frontend` | `impeccable` |
| Animation  | `emil-design-eng` | `code-reviewer` |
| Backend    | `senior-backend` | `code-reviewer` |
| Frontend   | `senior-frontend` | `code-reviewer` |
| Copy/Text  | `humanizer` | — |
| Refactor   | `senior-frontend` | `impeccable` |

Запуск через `Skill` tool — не просто назвати в тексті.

---

## RULE 3 — Post-Change Protocol (після кожної зміни коду)

**Обов'язковий pipeline після завершення задачі:**

```
1. npx tsc --noEmit              (у папці bookit/)
2. npm run build                  (підтвердження компіляції)
3. mempalace_add_drawer           (зберегти технічні рішення)
4. SYSTEM_MAP.md update           (нові роути, утиліти, компоненти)
5. changelog/page.tsx             (якщо B2B-видима зміна)
```

---

## RULE 4 — Framer Motion Anti-Patterns (завжди)

```
mode='wait'    → ЗАВЖДИ замінювати на mode='popLayout'
spring без as const  → { type: 'spring', ... } as const
emoji в UI     → ЗАБОРОНЕНО (тільки Lucide React icons)
AnimatePresence без mode → завжди вказувати mode='popLayout'
```

---

## RULE 5 — Bulk Edit Protocol (масові зміни у 3+ файлах)

**Урок отриманий 2026-05-29:** масові аніма-зміни коштували 3× більше токенів через припущення про відступи та 4 batches замість 2.

```
КРОК 1 → Read ВСІ цільові файли ПАРАЛЕЛЬНО (один round)
КРОК 2 → Перевір точні рядки/відступи — не припускай
КРОК 3 → Write/Edit ВСІ файли ПАРАЛЕЛЬНО (один round)
КРОК 4 → tsc + build (один round)
```

**Вибір інструменту:**

| Умова | Правильний інструмент |
|---|---|
| Зміна ≤ 3 рядки, рядок перевірений Read | `Edit` |
| Зміна > 5 рядків або 3+ місця у файлі | `Write` (повна нова версія) |
| Однотипна зміна у 5+ файлах | `Write` для кожного паралельно |

**Заборонено:**
- `Edit` без попереднього `Read` (відступи будуть неправильні → failed edit → повторне читання → зайві токени)
- Розбивати масові зміни на 4+ окремі повідомлення: imports batch → headingY batch → blur batch → special batch
- Припускати однаковий JSX-відступ у всіх файлах (нестинг JSX різний)

**Формула:** `N_reads + N_writes = мінімум` — читай все одразу, пиши все одразу.

---

## RULE 6 — Accessibility Guard (при кожному `onClick`)

**Симптом:** `cursor-pointer` на `<div>` = миттєвий рефактор перед будь-яким іншим кодом.

| Елемент | Правило |
|---|---|
| `<div onClick>` | ❌ ЗАБОРОНЕНО — замінити на `<button type="button">` |
| `<span onClick>` | ❌ ЗАБОРОНЕНО — замінити на `<button type="button">` |
| Будь-який `<button>` | ✅ `type="button"` обов'язковий |
| Compact pill/chip | ✅ `py-2` мінімум (≥ 44px touch target) |
| Chart bar / heatmap cell | ✅ `aria-label` + `aria-pressed` |
| Toggle button | ✅ `aria-pressed={isActive}` |

**Пам'ятка аудиту:** `/impeccable audit` виявляє `div onClick` → fix → re-audit до score ≥ 16/20.

---

*Версія: 8.5.0 · Оновлено: 2026-05-30*
