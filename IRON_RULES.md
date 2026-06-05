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

**КРОК 0-A — Batch перевірка на старті задачі (до будь-якого Read/Edit):**

```powershell
# Перевірити ВСІ цільові Cyrillic файли одразу, перш ніж щось читати:
foreach ($f in @("file1.tsx","file2.tsx")) {
  $h = ([IO.File]::ReadAllBytes($f) | % { $_.ToString("X2") }) -join ""
  if ($h -match "E28099|E2809C|D0A0C2") { "DIRTY: $f" }
}
```

**КРОК 0-B — Якщо DIRTY → виправити ПЕРШИМ, через PowerShell (Edit tool заблокований):**

```powershell
$c = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
$c = $c -replace [char]0x2019,"'" -replace [char]0x201C,'"' -replace [char]0x201D,'"'
[IO.File]::WriteAllText($path, $c, [Text.Encoding]::UTF8)
```

**Хук блокує (exit 2) — не чекай на помилку, перевіряй заздалегідь.**

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

**Уроки:**
- 2026-05-29: 4 batches замість 2 = 3× токенів (неправильні відступи)
- 2026-05-30: 9 окремих Edit в BookingWizard.tsx замість 1 Write = 9× overhead. Один Write = 1 round.

```
КРОК 0 → Encoding batch-check для Cyrillic файлів (RULE 0-A) — до будь-якого Read
КРОК 1 → Read ТІЛЬКИ файли що будеш змінювати (не "для контексту")
КРОК 2 → Перевір точні рядки/відступи — не припускай
КРОК 3 → Write/Edit ВСІ файли ПАРАЛЕЛЬНО (один round)
КРОК 4 → tsc + build (один round)
```

**Вибір Write vs Edit — ВИРІШУЙ ДО ПОЧАТКУ:**

| Умова | Правильний інструмент |
|---|---|
| ≤ 3 рядки, рядок верифікований Read | `Edit` |
| ≥ 5 змін у одному файлі | `Write` (1 round замість 5+) |
| 3+ місця у файлі | `Write` (повна нова версія) |
| Однотипна зміна у 5+ файлах | `Write` для кожного паралельно |

**⚠️ 5+ Edit в одному файлі = ЗАВЖДИ WRITE. Порахуй зміни ДО початку.**

**Заборонено:**
- `Edit` без попереднього `Read`
- Розбивати на 4+ окремі повідомлення
- Читати файли "для розуміння" які не будеш змінювати

**Формула:** `files_to_change = files_to_read = files_to_write`. Не більше, не менше.

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

## RULE 7 — Read Minimum (перед кожним завданням)

**Заборонено читати файли "для контексту" якщо їх не будеш змінювати.**

```
Grep → визначити які файли містять потрібний код
Read → ТІЛЬКИ файли що будеш змінювати
files_changed = files_read (завжди рівні)
```

**Урок 2026-05-30:** Прочитав 9 wizard-файлів (BookingWizard, useBookingWizardState, усі 6 step-компонентів + types + helpers). Змінив 7. Зайві 2 Read = ~600 рядків марного контексту.

**Правило:**
- Перед Read → запитай: "Чи буду я змінювати цей файл?"
- Якщо ні → Grep або skip
- `types.ts`, `helpers.ts`, допоміжні файли → читати тільки якщо там є зміни

---

---

## RULE 8 — Impeccable Skill Workflow (обов'язково для всіх аудитів)

**Кожен impeccable аудит ВИКОНУВАТИ через скіл-воркфло, не вручну.**

```
ФАЗА 1 — critique:
  → Assessment A: sub-agent (LLM Design Review + Heuristic Scoring + Cognitive Load)
  → Assessment B: npx impeccable detect --json <target>
  → Об'єднати результати у звіт

ФАЗА 2-X — кожна наступна команда:
  → npx impeccable <command> <target> (якщо CLI існує)
  → АБО завантажити reference файл скіла і слідувати методології
  → АБО spawn sub-agent для complex analysis

ФАЗА N — mempalace_add_drawer після завершення
```

**Заборонено:**
- Sequential in-head analysis (без sub-agents, без CLI)
- Manual heuristic scoring без Assessment A/B split
- Пропуск `npx impeccable detect` коли він доступний

**Винятки:** тільки якщо середовище фізично не може spawn sub-agents (задокументувати причину).

*Версія: 8.7.0 · Оновлено: 2026-06-01*
