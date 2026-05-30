# 🤖 CLAUDE.md — Claude Code Instructions

> ⛔ **ЧИТАТИ ПЕРШИМ:** [IRON_RULES.md](file:///C:/Users/Vitossik/SaaS/IRON_RULES.md) (поряд з цим файлом) — абсолютні правила сесії. Encoding, humanizer, MemPalace. Порушення заборонені.

---

## ⚡ SESSION START — ПЕРШИЙ ХІД (ДО БУДЬ-ЧИМ ІНШОГО)

**Кожна нова сесія починається ТІЛЬКИ ТАК. Порядок незмінний:**

```
КРОК 1 → Виклик mempalace_status (перший tool call, без винятків)
КРОК 2 → Read XDEV/MAPS/SYSTEM_MAP.md (offset: останні 50 рядків)
КРОК 3 → Відповідь: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"
```

Без підтвердження STARTUP OK — жодного читання файлів і жодного коду.

---

## ⚡ TASK GATE — ПЕРЕД КОЖНОЮ ЗАДАЧЕЮ

**Перед будь-яким Edit/Write для нової задачі:**

```
КРОК 1 → mempalace_search по темі задачі
КРОК 2 → Задати 3-5 уточнюючих питань (QA-GATE)
КРОК 3 → Оголосити: "SKILL: [назва]" — і запустити скіл
КРОК 4 → Виписати ВСІ UI-рядки → запустити /humanizer → підтвердити
КРОК 5 → Отримати OK від користувача
```

Відповідь перед кодом: `GATE OK: search✓ | QA✓ | Skill: [name] | Humanizer: ✓`

---

Цей файл є основним вхідним документом для Claude Code (claude.ai/code) при роботі з кодовою базою BookIT.

---

## ⛔ ОБОВ'ЯЗКОВО ЧИТАТИ НА СТАРТІ СЕСІЇ

Весь детальний опис архітектури, правил кодування та дизайну знаходиться в папці `XDEV/` (шлях: `C:\Users\Vitossik\SaaS\XDEV\`). **Без прочитання XDEV — жодного коду.**

### Ключові документи XDEV:
- [AI_DEVELOPER.md](file:///C:/Users/Vitossik/SaaS/XDEV/AI_DEVELOPER.md) — **Конституція розробника:** tech stack, coding standards, database RLS, three themes (Blossom, Studio, Frost), pre-deploy checklist.
- [SKILL_PROTOCOL.md](file:///C:/Users/Vitossik/SaaS/XDEV/SKILL_PROTOCOL.md) — **Майстер-інструкція по скілах:** Decision Tree для вибору ролі перед будь-якою ітерацією розробки чи дизайну, Clarification Framework (3-5 питань).
- [UX_STANDARDS.md](file:///C:/Users/Vitossik/SaaS/XDEV/UX_STANDARDS.md) — **UX стандарти:** No-Emoji Policy, Vaul BottomSheets, анімаційні правила Emil Kowalski, колірні токени.
- [SYSTEM_MAP.md](file:///C:/Users/Vitossik/SaaS/XDEV/MAPS/SYSTEM_MAP.md) — **Архітектурна мапа:** єдине джерело технічної структури (роути, таблиці, RPC, хуки, утиліти).
- [BOOKIT.md](file:///C:/Users/Vitossik/SaaS/XDEV/BOOKIT.md) — **Профіль продукту:** візія, бізнес-логіка, реферальна та бонусна системи, Smart Slots.
- [AI_ONBOARDING.md](file:///C:/Users/Vitossik/SaaS/XDEV/AI_ONBOARDING.md) — **Вхідний брифінг:** DB-to-DOM мислення та протоколи верифікації змін (SQL, Manual, Playwright E2E).

---

## 🧠 MemPalace — Автономна Пам'ять (ОБОВ'ЯЗКОВО)

Palace містить **10,338+ drawers** з технічними рішеннями, архітектурою та зафіксованими багами цього проекту.

**ЗАЛІЗНЕ ПРАВИЛО — виконувати завжди, без винятків:**
1. **Старт сесії** ➔ одразу викликати `mempalace_status` (огляд palace)
2. **Перед будь-яким рішенням** ➔ `mempalace_search "query"` (пошук релевантних drawers)
3. **Після важливого рішення/фіксу** ➔ `mempalace_add_drawer` (зберегти знання)

---

## 🛠️ CLI Commands

Усі команди запускаються з папки `bookit/`:

```bash
cd bookit

npm run dev          # Dev server (Turbopack)
npm run build        # Production build (перевірка збірки)
npm run lint         # Run ESLint
npm test             # Run Vitest unit tests
npm run test:e2e     # Seed DB + Playwright e2e tests
npx tsc --noEmit     # TypeScript type-check

# Одиничні тести:
npx vitest run src/lib/billing/pricing.test.ts
npx playwright test tests/booking.spec.ts

# Supabase:
npx supabase db push # Застосувати локальні міграції до Supabase Cloud
```

---

## ⛔ Post-Change Protocol

Після завершення будь-якої зміни коду (фікс, фіча, рефакторинг) — **обов'язковий pipeline**:

1. **TypeScript check:** `npx tsc --noEmit` в папці `bookit/`.
2. **Build check:** `npm run build` для підтвердження успішної компіляції Next.js App Router.
3. **Run E2E tests:** `npm run test:e2e` для запобігання регресіям.
4. **MemPalace update:** Обов'язково зберегти ключові технічні рішення, виправлення помилок чи RLS-зміни через `mempalace_add_drawer`.
5. **Graphify check:** Переконатися, що граф взаємозв'язків актуальний (автоматично оновлюється хуками/комітом, за потреби запустити перегенерацію).
6. **Project Files sync:** Оновити ключові проєктні файли ([SYSTEM_MAP.md](file:///C:/Users/Vitossik/SaaS/XDEV/MAPS/SYSTEM_MAP.md), [BOOKIT.md](file:///C:/Users/Vitossik/SaaS/XDEV/BOOKIT.md) та [changelog/page.tsx](file:///C:/Users/Vitossik/SaaS/bookit/src/app/(master)/dashboard/changelog/page.tsx)) для повної синхронізації знань.

---

## ⚡ BULK EDIT PROTOCOL — Масові зміни (3+ файлів)

**Проблема:** Без Read перед Edit — відступи неправильні → edit fails → повторне читання → 3× токенів.

**Правило:**
```
1. Read ВСІ файли ПАРАЛЕЛЬНО    ← один round, нуль припущень
2. Write/Edit ВСІ ПАРАЛЕЛЬНО    ← один round, з верифікованими рядками
3. npx tsc --noEmit + build      ← один round
```

**Коли Write замість Edit:**
- Зміна торкається 3+ місць у файлі → Write повну нову версію
- 5+ однотипних файлів → Write кожен паралельно
- Edit тільки для ≤ 3 рядків з верифікованим рядком після Read

**Формула мінімуму токенів:** `rounds = 3` (Read all → Write all → Verify). Будь-яке відхилення збільшує вартість.

---

## ❓ Q&A Workflow (before any skill invocation)

Дотримуйся шаблону з [CLARIFICATION_FRAMEWORK.md](file:///C:/Users/Vitossik/SaaS/bookit/.claude/CLARIFICATION_FRAMEWORK.md):
1. Визнач тип завдання за ключовими словами (Design / Copy / Code / Motion).
2. Задай користувачу **3–5 чітких запитань** (Scope, Style, Palette, Motion, Priority).
3. Обери та оголоси відповідний скіл із [SKILL_PROTOCOL.md](file:///C:/Users/Vitossik/SaaS/XDEV/SKILL_PROTOCOL.md) на основі відповідей.
4. Проведи аудит результату перед коммітом за допомогою скілів-аудиторів (`impeccable`, `code-reviewer`, `humanizer`).

---
## ⛔ ACCESSIBILITY RULES (IRON — div→button = P1 блокер)

### Правило 1: div → button
Ніколи `onClick` на `<div>`, `<span>`, `<p>`. Тільки `<button type="button">` або `<Link>`.
`cursor-pointer` на `<div>` = red flag — виправляти одразу.

**Обов'язкові атрибути на `<button>`:**
- `type="button"` — завжди (без нього submit у формах)
- `aria-label="..."` — якщо всередині немає видимого тексту (chart bar, heatmap cell, icon-only)
- `aria-pressed={bool}` — для toggle-кнопок (tabs, chart bars, heatmap cells)

### Правило 2: Touch Targets ≥ 44px
Усі клікабельні елементи на mobile: висота ≥ 44px.
- Compact pills/chips: `py-2` мінімум — не `py-1` / `py-0.5`
- Slot chips: `py-2.5` мінімум
- Перевіряти при кожному новому компоненті з `onClick`

### Правило 3: Chart / Heatmap ARIA
- Chart bars: `aria-label={\`${dayName}: ${value}\`}` + `aria-pressed={isActive}`
- Heatmap cells: `aria-label={\`${day} ${hour}:00\`}` + `aria-pressed={isActive}`
- Tab toggles: `aria-pressed={isActive}` або `role="tab"` у tab-group

### Заборонені конструкції
```tsx
// WRONG — screen readers пропустять, клавіатура не дістане
<div onClick={fn} className="cursor-pointer">...</div>

// CORRECT
<button type="button" onClick={fn} aria-label="...">...</button>
```

---

*Останнє оновлення: 2026-05-30 · Версія: 8.3.0*
