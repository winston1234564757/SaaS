# 🚀 START_PROMPT.md — Universal Session Starter

> Вступний промт для будь-якого чату на будь-якому етапі Release Roadmap.
> Copy-paste у перше повідомлення — і AI агент сам підхопить контекст активного кроку.
> **Версія:** 1.0 · **Створено:** 2026-05-27

---

## 📋 QUICK COPY-PASTE (універсальний промт)

> Скопіюй блок нижче у перше повідомлення нового чату. Працює для будь-якого з 13 кроків.

```
Старт сесії BookIT Release Roadmap.

Виконай по порядку, без пропусків:

1. mempalace_status — викликати tool (не просто згадати).
2. Прочитай файли:
   - C:\Users\Vitos\SaaS\XDEV\IRON_RULES.md
   - C:\Users\Vitos\SaaS\XDEV\RELEASE\README.md
   - C:\Users\Vitos\SaaS\XDEV\RELEASE\PROTOCOL.md
   - C:\Users\Vitos\SaaS\XDEV\RELEASE\STATUS.md
   - C:\Users\Vitos\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset: останні 60 рядків)
3. Зі STATUS.md визнач активний крок (⏳ In progress).
4. Прочитай playbook активного кроку:
   C:\Users\Vitos\SaaS\XDEV\RELEASE\STEPS\STEP_NN_*.md
5. Виконай mempalace_search "[ключові слова активної сторінки]".
6. Відповідь у форматі:

   STARTUP OK
   - Palace: [N] drawers
   - SYSTEM_MAP: current
   - Active Step: NN ([page name])
   - Model expected: [Sonnet 4.6 high / Opus 4.7 max / Mixed]
   - Carry-over: [нічого / список]
   - Next action: чекаю QA-GATE (5 уточнень) перед кодом

7. Поставити QA-GATE: 3-5 уточнюючих питань з playbook активного кроку
   через AskUserQuestion.
8. Дочекатися моєї відповіді — і тільки тоді оголосити SKILL + запустити Skill tool.

Iron Rules діють (особливо RULE 1 — нуль коду без GATE OK).
```

---

## 🎯 Що цей промт робить

| Крок | Дія | Чому |
|---|---|---|
| 1 | `mempalace_status` | RULE -1: завантажити palace overview, дізнатись скільки drawers |
| 2 | Read 5 core docs | Завантажити контекст правил, протоколу, статусу та архітектури |
| 3 | Detect active step | STATUS.md — єдине джерело правди про "де ми зараз" |
| 4 | Read step playbook | Конкретні чек-листи, scope, файли цього кроку |
| 5 | mempalace_search | Знайти попередні рішення/баги/патерни на цій сторінці |
| 6 | STARTUP OK reply | Формат що дає тобі швидкий огляд стану |
| 7 | QA-GATE | RULE 1: уточнити перед кодом (5 питань з playbook) |
| 8 | Skill declaration | RULE 2: text + Skill tool в одній відповіді |

---

## 🔄 Варіації під різні етапи

### 🆕 Якщо це початок нового кроку
Промт вище — і все. STATUS.md покаже свіжий активний крок (наприклад STEP 02 після завершення STEP 01).

### 🔁 Якщо це продовження поточного кроку (другий чат на той самий step)
Додати у промт:
```
ПРИМІТКА: Це продовження STEP NN. Минулий чат закрився без COMPLETE.
Прочитай також MemPalace drawer [drawer_id] (з STATUS.md handoff)
та git log --oneline -10 — щоб не повторювати зроблене.
Намагайся не починати з нуля.
```

### 🐛 Якщо це debug / fix (knowledge bug на завершеному кроці)
Додати у промт:
```
ПРИМІТКА: Debug-режим. Знайдено баг у STEP NN (статус ✅).
Не починай нової фічі. Фокус:
1. Прочитай drawer завершення STEP NN з STATUS.md
2. Локалізуй регресію — який коміт її вніс (git bisect / blame)
3. Запропонуй патч з мінімальним blast radius
4. Status STEP NN → ⚠️ Needs revision у STATUS.md до фіксу
```

### 🏁 Якщо це close-out (фінальний чат — реліз)
Додати у промт:
```
ПРИМІТКА: Close-out mode. Усі 13 кроків ✅ Complete.
Фокус:
1. Verify all checkbox у CHANGELOG.md
2. Run full pipeline: npx tsc --noEmit && npm run build && npm test && npm run test:e2e
3. Update bookit/src/app/(master)/dashboard/changelog/page.tsx з summary v8.3
4. Tag git release: vX.Y.Z з changelog
5. Створити фінальний MemPalace drawer "Release Roadmap COMPLETE"
```

### 🤖 Якщо це не AI-агент-сесія, а звичайне використання (user-side)
Користувач сам читає README.md → STATUS.md → STEPS/STEP_NN_*.md. Промт не потрібен.

---

## 🧭 Workflow після промта (що очікувати від AI)

```
[USER]  ← вставляє промт
   ↓
[AI]    → STARTUP OK з активним кроком
   ↓
[AI]    → AskUserQuestion з 3-5 питаннями з playbook
   ↓
[USER]  ← відповідає
   ↓
[AI]    → "SKILL: [name]" + виклик Skill tool (та сама відповідь)
   ↓
[AI]    → Humanizer list для всіх UI рядків (якщо є)
   ↓
[USER]  ← OK на план + humanizer
   ↓
[AI]    → "GATE OK: search✓ | QA✓ | Skill: X | Humanizer: ✓"
   ↓
[AI]    → код / зміни (7 Quality Gate dimensions)
   ↓
[AI]    → tsc, build, tests
   ↓
[AI]    → docs sync (STATUS, CHANGELOG, SYSTEM_MAP, drawer)
   ↓
[AI]    → "STEP NN COMPLETE" + handoff note
```

---

## 🚨 Anti-patterns промта (НЕ використовувати)

| ❌ Поганий промт | Чому погано |
|---|---|
| "Продовжуй роботу на лендінгу" | Не запускає SESSION_START, AI не прочитає STATUS.md, може почати з неправильного кроку |
| "Зроби крок 4 dashboard" | Скіп QA-GATE → порушення RULE 1 |
| "Запусти design-taste-frontend на /dashboard" | Без mempalace_search, без QA, без humanizer — порушення 3 правил |
| "Швидкий фікс емодзі" | "Швидкий" обходить QA-GATE; виключення дозволено тільки для one-char typo |

---

## ⚙️ Якщо STATUS.md показує помилку

### Скрипт самодіагностики (якщо STATUS.md незрозумілий):
```
Якщо STATUS.md показує що 2+ кроки в статусі ⏳ In progress — це регресія документації.
Дія: запитати користувача який крок є "true active" перед будь-якою роботою.

Якщо STATUS.md показує ✅ Complete для всіх 13 — це close-out режим (див. вище).

Якщо STATUS.md не існує — re-bootstrap: 
1. Створи з шаблону XDEV/RELEASE/STATUS.md (бачив XDEV/RELEASE/README.md)
2. Запитай користувача який крок active
```

---

## 🔗 Швидкі посилання

- [README.md](./README.md) — правила задачі
- [PROTOCOL.md](./PROTOCOL.md) — детальний workflow
- [STATUS.md](./STATUS.md) — активний стан
- [STEPS/](./STEPS/) — playbooks
- [../IRON_RULES.md](../IRON_RULES.md) — абсолютні правила

---

## 💡 Поради по використанню

1. **Не кастомізуй промт без потреби.** Він working as designed — будь-яка кастомізація може зламати контекстний підбір.
2. **Додавай ПРИМІТКА: блок** тільки для специфічних режимів (debug, продовження, close-out).
3. **Якщо AI пропустить SESSION_START — переривай.** Прав до RULE -1 не можна порушити.
4. **Не пиши свою задачу у тому ж повідомленні.** Спочатку промт → STARTUP OK → потім задача. Інакше AI заплутається.

---

*Версія: 1.0 · Створено: 2026-05-27 · Узгоджено з PROTOCOL.md та IRON_RULES.md*
