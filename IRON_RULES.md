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

*Версія: 8.3.0 · Оновлено: 2026-05-27*
