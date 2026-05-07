# 🔧 XDEV Protocol — How Claude Reads & Uses This Folder

> **ДЛЯ CLAUDE:** Це інструкція про те, як використовувати файли в XDEV папці для контексту, тестування рішень і документування змін.

---

## 📋 File Structure & Purpose

### **Tier 1: MUST READ BEFORE EVERY TASK**

#### 0. `.claude/CLARIFICATION_FRAMEWORK.md` (✨ NEW! Smart Questions System)
**Коли читати:** На старті БУДЬ-ЯКОї задачі (design, copy, code)
**Що там:**
- 3-5 уточнювальних питань для кожного типу задачі
- Workflow: Prompt → Questions → User answers → Skill selection
- Templates for: design, copy, code, animation
- Mapping answers to skill parameters

**Як використовувати:**
```
1. Користувач дає промт
2. Я читаю CLARIFICATION_FRAMEWORK
3. Я визначаю тип задачі (design/copy/code/animation)
4. Я задаю 3-5 питань з шаблону
5. На основі відповідей я вибираю точний скіл
6. Я запускаю скіл З КОНТЕКСТОМ (не без контексту!)
```

**Приклад:**
```
Користувач: "Зробити темну тему"
Я: [Читаю CLARIFICATION_FRAMEWORK → design questions]
Я: "Уточню! 5 питань..." [AskUserQuestion]
Q1: Яка область? | Q2: Brutal Studio? | Q3: Кольори? | Q4: Анімація? | Q5: Коли?
Користувач: [answers]
Я: "/design-taste-frontend build { aesthetic: brutal, palette: {...} }"
```

---

#### 1. `TASK.md` (This is your mission brief)
**Коли читати:** На старті ПОВ'ЯЗАНОЇ задачі (дизайн, UI, feature)
**Що там:**
- Mission overview
- Design philosophy ("iPhone AIR", "Brutal Studio")
- Skill selection guide
- QA protocol
- Success criteria

**Як використовувати:**
```
1. Завантажити TASK.md на старті
2. Ekstrahuvaty key insights (design style, QA protocol)
3. Дотримуватись "Success Criteria"
4. Не пропускати QA сесію з користувачем
```

---

#### 2. `AI_DEVELOPER.md` (Iron Constitution)
**Коли читати:** ПЕРЕД КОЖНОЮ роботою (це залізні правила)
**Що там:**
- Iron Rule: Analyze full logic, don't do surface fixes
- Tech stack (locked)
- Coding standards (TypeScript strict, Tailwind v4, etc.)
- Database schema essentials
- Security rules
- Component conventions

**Як використовувати:**
```
1. Скануй AI_DEVELOPER.md перед початком
2. Дотримуйся "Iron Rule" — не robь поверхневих фіксів
3. Якщо не впевнен—ПИТАЙ уточнення перед роботою
4. Використовуй tech stack як reference (Next.js 16, Tailwind v4, Framer Motion)
5. Перевіряй security rules (no plaintext secrets, SHA-256 for tokens)
```

**Приклад:**
```
Раніше: Я буду просто додати кнопку в компонент
Тепер: Я прочитав AI_DEVELOPER—для кнопки потрібно:
  - TypeScript strict type
  - Tailwind v4 классы (не CSS)
  - Framer Motion для анімацій (якщо потрібна)
  - RLS перевірка на сервері (якщо потрібна)
  - UPDATE SYSTEM_MAP після додавання
```

---

#### 3. `SYSTEM_MAP.md` (Architecture Source of Truth)
**Коли читати:** ПЕРЕД кожною роботою (ДЛЯ ПЕРЕВІРКИ АРХІТЕКТУРИ)
**Що там:**
- File structure & locations
- Database schema (таблиці, migrations)
- Key functions & utilities
- API endpoints
- Dependencies & versions
- Current state of codebase

**Як використовувати:**
```
1. Скануй SYSTEM_MAP перед роботою
2. Перевіряй: "Чи існує вже цей компонент/функция?"
3. Знаходь paths до файлів: src/lib/utils/token.ts, src/lib/supabase/admin.ts
4. Перевіряй dependencies: "Чи встановлена Framer Motion?" → Дивись "Dependencies"
5. Дізнавайся про DB schema перед роботою з БД
```

**Приклад:**
```
Задача: "Add booking confirmation component"
Щоб почати, я:
1. Читаю SYSTEM_MAP
2. Знаходжу: "bookings table has columns: id, status, master_id..."
3. Знаходжу path: "src/lib/supabase/hooks/useBookings.ts"
4. Юзаю вже готовий hook замість нового запиту
```

---

### **Tier 2: READ AT START OF PROJECT/PHASE**

#### 4. `BOOKIT.md` (Business Logic & Features)
**Коли читати:** На старті проекту + під час feature development
**Що там:**
- Business logic (booking flow, referral system, pricing)
- Current iterations (1-29)
- Database schema details
- Features breakdown (Auth, Services, Bookings, Reviews, etc.)
- Important dates & deadlines

**Як використовувати:**
```
1. Перед розробкою нової фічи—читай BOOKIT.md про ту фічу
2. Розумій business logic (наприклад, как працює referral system)
3. Дізнавайся про dependencies з інших фіч
4. Перевіряй completed iterations (не повтори те, що вже зроблено)
```

---

#### 5. `AI_ONBOARDING.md` (Project Briefing)
**Коли читати:** На старті роботи з проектом
**Що там:**
- Project overview
- Reading order (CRITICAL!)
- Key context
- Milestones & phases
- How to use XDEV docs

**Як використовувати:**
```
Новий Claude? → Read AI_ONBOARDING first
Контекст до цього не знаєш? → Read AI_ONBOARDING
```

---

### **Tier 3: READ FOR SPECIFIC TASKS**

#### 6. `UI_MAP.md` (Component Structure)
**Коли читати:** Перед UI/component роботою
**Що там:**
- Component hierarchy
- Folder structure для компонентів
- Existing components
- Layout patterns

**Як використовувати:**
```
"Мені потрібна форма?"
→ Прочитай UI_MAP
→ Перевіряй: "Чи вже є form компонента?"
→ Юзай existing, або додай нову
```

---

#### 7. `UX_STANDARDS.md` (Design Rules)
**Коли читати:** При дизайні UI
**Що там:**
- Typography rules
- Spacing rules
- Color usage
- Motion guidelines
- Accessibility standards

**Як використовувати:**
```
Дизайнуєш кнопку?
→ Прочитай UX_STANDARDS
→ Дотримуйся spacing, typography, motion rules
→ Перевіряй a11y контраст
```

---

#### 8. `CHANGELOG.md` (What Changed)
**Коли читати:** Після кожної ітерації
**Що там:**
- Latest changes
- What was added/fixed
- Dates

**Як використовувати:**
```
Після завершення ітерації:
→ Оновити CHANGELOG.md
→ Записати: "Додано X компонента", "Фіксив Y баг"
```

---

## 🔄 Standard Workflow with XDEV Files

### **Перед кожною роботою:**

```
1. Читаю TASK.md (місія та правила)
2. Читаю AI_DEVELOPER.md (залізні правила)
3. Скануюю SYSTEM_MAP.md (архітектура)
4. Якщо feature work → читаю BOOKIT.md
5. Якщо UI work → читаю UI_MAP.md + UX_STANDARDS.md
6. Готуюся до роботи
```

### **Під час роботи:**

```
1. Дотримуюсь "Iron Rule" з AI_DEVELOPER
2. Запитую уточнення у користувача ПЕРЕД роботою
3. Використовую SYSTEM_MAP як reference для путей і API
4. Перевіряю UX_STANDARDS для дизайну
5. Документую рішення
```

### **Після кожної ітерації:**

```
1. Оновлюю SYSTEM_MAP.md (якщо архітектура змінилась)
2. Оновлюю CHANGELOG.md (що я додав/змінив)
3. Запускаю QA сесію з користувачем
4. Фіналізую рішення
```

---

## 💡 Examples of File Usage

### **Example 1: Adding a New Component**

**Задача:** "Add email notification settings component"

**Workflow:**
```
1. Читаю TASK.md
   → Розумію mission & QA protocol
   
2. Читаю AI_DEVELOPER.md
   → Дізнаюсь про TypeScript strict, Framer Motion, Server Components
   
3. Скануюю SYSTEM_MAP.md
   → Знаходжу existing settings components
   → Знаходжу path: src/components/master/settings/
   → Дізнаюсь про notifications table schema
   
4. Читаю UI_MAP.md
   → Перевіряю component hierarchy
   → Розумію де цей компонент має знаходитись
   
5. Читаю UX_STANDARDS.md
   → Дізнаюсь про spacing, typography для форм
   
6. Розробляю компонент:
   → TypeScript strict mode (з AI_DEVELOPER)
   → Tailwind v4 (з AI_DEVELOPER)
   → Framer Motion для анімацій
   → Юзаю existing hooks з SYSTEM_MAP
   
7. Пропоную QA:
   → Показую користувачеві дизайн
   → Розповідаю про рішення
   → Слухаю фідбек
   
8. Оновлюю документи:
   → SYSTEM_MAP.md: додаю новий компонент
   → CHANGELOG.md: записую що додав
```

---

### **Example 2: Fixing a Bug**

**Задача:** "Booking form не зберігає дані при refresh"

**Workflow:**
```
1. Читаю TASK.md
   → Дізнаюсь про QA protocol
   
2. Читаю AI_DEVELOPER.md
   → "Analyze full logic, don't do surface fixes!"
   → Буду аналізувати ВСЮ логіку booking flow
   
3. Скануюю SYSTEM_MAP.md
   → Знаходжу: src/lib/supabase/hooks/useBookings.ts
   → Знаходжу: bookings table schema
   → Дізнаюсь про TanStack Query конфіг (staleTime per hook)
   
4. Читаю BOOKIT.md
   → Дізнаюсь про booking flow (steps 1-11)
   → Розумію dependency chain
   
5. Аналізую проблему:
   → Це не просто "дані не зберігаються"
   → Це: "яка частина flow зламана?" (form state? server sync? storage?)
   → Питаю у користувача: "Коли ви кажете 'не зберігається'—що саме втрачається?"
   
6. Розв'язую по залізному правилу:
   → Аналізую ВСЮ логіку (форма → server → DB → RT update)
   → Не робив поверхневих фіксів
   → Документую причину бага
   
7. Запускаю QA сесію
   → Показую що фіксив
   → Пояснюю причину
```

---

## 📝 Special: Humanizer for All Text

**CRITICAL RULE:** All text content on BookIT (landing, pricing, features, copy, etc.) MUST be humanized.

### **Humanizer Workflow**

```
1. Write draft text (AI-generated is fine)
2. Run /humanizer
3. Humanizer detects AI patterns:
   - Inflated symbolism ("revolutionizes", "cutting-edge")
   - Promotional language
   - Passive voice
   - Rule-of-three patterns
   - AI vocabulary words
   - Em dash overuse
4. Output: Natural, human-written text
5. QA with user (always!)
```

### **Where to Humanize**
- ✅ Landing page copy
- ✅ Pricing page descriptions
- ✅ Feature descriptions
- ✅ Marketing emails
- ✅ Product descriptions
- ✅ Error messages (if promotional)
- ✅ Onboarding text
- ✅ Button labels (if verbose)

### **Example**

**Before (AI-generated):**
```
"BookIT revolutionizes the beauty industry with cutting-edge 
booking solutions that empower professionals to unlock their 
potential and maximize revenue streams."
```

**After (Humanized via /humanizer):**
```
"BookIT helps beauty pros manage bookings, attract clients, 
and earn more—without the complexity."
```

---

## 🚨 Important Rules

### **ЗАВЖДИ РОБИТИ:**
1. ✅ Читай TASK.md перед кожною дизайн-роботою
2. ✅ Читай AI_DEVELOPER.md перед БУДЬ-ЯКОЮ роботою
3. ✅ Скануй SYSTEM_MAP.md перед роботою (перевір архітектуру)
4. ✅ Питай уточнення у користувача ПЕРЕД роботою
5. ✅ Запускай QA сесію перед фіналізацією
6. ✅ Оновлюй SYSTEM_MAP.md & CHANGELOG.md після роботи
7. ✅ Дотримуйся "Iron Rule" — не робі поверхневих фіксів

### **НІКОЛИ НЕ РОБИТИ:**
1. ❌ Не скорочуй QA сесію
2. ❌ Не робі рішень без читання TASK.md / AI_DEVELOPER.md
3. ❌ Не ігноруй SYSTEM_MAP.md (це источник істини!)
4. ❌ Не забувай оновляти CHANGELOG.md і SYSTEM_MAP.md
5. ❌ Не робі поверхневих фіксів (Iron Rule!)

---

## 🎯 TL;DR (Quick Reference)

| Що потрібно зробити | Прочитай | Час |
|-------------------|---------|-----|
| Дизайн задача | TASK.md + UX_STANDARDS.md | 5 хв |
| Будь-яка робота | AI_DEVELOPER.md | 5 хв |
| Архітектурна перевірка | SYSTEM_MAP.md | 10 хв |
| Feature development | BOOKIT.md | 15 хв |
| UI work | UI_MAP.md | 5 хв |
| Component development | All above + SYSTEM_MAP | 30 хв |

---

## ✨ Status

- ✅ XDEV Protocol встановлено
- ✅ Усі файли готові до використання
- ✅ Claude знає як їх читати
- ✅ QA gate активовано

**Готово до продакшену!** 🚀
