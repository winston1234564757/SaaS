# STEP NN — [Page Name] (`[URL]`)

> **Створено:** YYYY-MM-DD
> **Модель:** 🟢 Sonnet 4.6 high / 🔴 Opus 4.7 max / 🟡 Mixed
> **Статус:** 🔒 Blocked / ⏳ In progress / ✅ Complete
> **Estimated effort:** N hours
> **Source of truth (scope):** [../../MAPS/PAGE_RELEASE_ROADMAP.md#X-NN](../../MAPS/PAGE_RELEASE_ROADMAP.md)

---

## 🎯 Scope

### Pages / routes
- `[URL pattern]`
- ...

### Key files
- `src/app/[path]/page.tsx`
- `src/components/[path]/Component.tsx`
- ...

### Server Actions
- `[path]/actions.ts` → `actionName`
- ...

### DB tables / RPCs (touched)
- `table_name`
- `rpc_function_name`
- ...

### TanStack Query hooks
- `useXxx.ts` (staleTime: N)
- ...

---

## 🚦 7 Quality Gate Dimensions

### 1. Aesthetics & Themes
- [ ] [конкретна перевірка з PAGE_RELEASE_ROADMAP]
- [ ] CSS-токени теми (`var(--background)`, `var(--accent)` тощо) замість hardcoded
- [ ] `border-radius: 24px` (cards), `100px` (buttons/inputs)
- [ ] Mobile responsive (< 375px width)
- [ ] Усі 3 теми (Blossom / Studio / Frost) виглядають коректно

### 2. No-Emoji Policy
- [ ] Жодних емодзі у кнопках, заголовках, фільтрах, селекторах
- [ ] Lucide React іконки замість емодзі
- [ ] Видалити `{svc.emoji}`, `{category.emoji}` рендери

### 3. Motion & Transitions
- [ ] Spring `bounce: 0-0.12`, `duration: 0.35-0.7`
- [ ] `mode="popLayout"` для змінного контенту
- [ ] `as const` у variants
- [ ] `active:scale-[0.95]` на кнопках
- [ ] Sliding tab `layoutId="..."` (унікальний на сторінку)

### 4. Errors & Validation
- [ ] Zod schemas для всіх форм
- [ ] `parseError(err)` з `src/lib/utils/errors.ts` для toast
- [ ] Українська локалізація помилок
- [ ] Автозбереження (500ms debounce) з індикатором (якщо relevante)

### 5. A11y & Performance
- [ ] Semantic HTML5 (`<main>`, `<section>`, `<nav>`, `<button>`)
- [ ] WCAG AA contrast (`mcp__a11y__get-color-contrast`)
- [ ] `aria-label` для icon-only buttons
- [ ] `aria-invalid`, `aria-describedby` для form errors
- [ ] Нуль CLS (skeleton має ту саму висоту що контент)

### 6. Core Features (бізнес-логіка)
- [ ] [конкретна функція з PAGE_RELEASE_ROADMAP]
- [ ] [конкретна функція з PAGE_RELEASE_ROADMAP]
- [ ] DB write → revalidatePath → UI refresh
- [ ] Edge cases (порожні дані, помилка мережі, race conditions)

### 7. Tests Verification
- [ ] `e2e/tests/X.spec.ts` — green
- [ ] `src/lib/Y.test.ts` — green (якщо є unit tests)
- [ ] Manual: 3 теми × mobile/desktop checked

---

## ❓ QA-GATE Questions (для початку чату)

### Стандартний шаблон (адаптувати під крок):
1. **Scope:** вся сторінка чи окремі секції?
2. **Priority:** [найскладніший вимір] чи якийсь інший фокус?
3. **Themes:** одразу всі 3 чи по одній?
4. **Motion:** додавати/полірувати animation?
5. **Tests:** запускати E2E локально чи довіряти CI?

---

## 🛠️ Skills Chain

```
clarify (3-5 Q)
  ↓
mempalace_search "[step keywords]"
  ↓
[Primary skill: design-taste-frontend / senior-frontend / senior-backend / ...]
  ↓
[Animation skill: emil-design-eng]    (якщо motion: yes)
  ↓
impeccable (design audit)
  ↓
mcp__a11y__are-colors-accessible       (contrast check)
  ↓
humanizer (для всього UI-тексту)
  ↓
run + verify (browser test)
  ↓
code-reviewer (pre-commit)
  ↓
mempalace_add_drawer
```

---

## 📋 Pre-Coding Checklist

- [ ] SESSION_START completed (`STARTUP OK`)
- [ ] mempalace_search done
- [ ] 3-5 QA questions asked + answered
- [ ] Skill declared + invoked
- [ ] Humanizer list compiled + confirmed
- [ ] User explicit approval received
- [ ] GATE OK reply written

---

## 📤 Documentation Updates (Close-out)

Обов'язково після `STEP NN COMPLETE`:

- [ ] **STATUS.md** — статус → ✅, дата, drawer ID, commit hash
- [ ] **CHANGELOG.md** — новий entry за шаблоном
- [ ] **../../MAPS/SYSTEM_MAP.md** — нові routes/components/RPCs додано
- [ ] **../../MAPS/PAGE_RELEASE_ROADMAP.md** — статус сторінки → ✅
- [ ] **bookit/src/app/(master)/dashboard/changelog/page.tsx** — B2B entry (якщо B2B-видимо)
- [ ] **MemPalace drawer** — `mempalace_add_drawer` з ключовими рішеннями
- [ ] **Git commit** — з Co-Authored-By trailer

---

## 🔮 Handoff Note (для наступного кроку)

*Заповнюється при close-out:*

- **Prior step closed:** YYYY-MM-DD
- **Commit hash:** [hash]
- **Drawer:** [ID]
- **Open issues from this step:** [none / list]
- **Carry-over items:** [нічого / pending]
- **Next chat focus:** STEP NN+1 ([page]) — [короткий focus]

---

*Цей шаблон копіюється для кожного нового кроку. Не редагувати TEMPLATE.md — копіювати в `STEP_NN_xxx.md` і адаптувати.*
