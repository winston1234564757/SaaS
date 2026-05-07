# 🎨 TASK.md — Design & Development Mission for BookIT

> **СТАТУС:** Фаза дизайну + розробки (Вітос + Claude)
> **Остання оновлення:** 2026-05-05
> **Конвенція:** Це ЖИВИЙ ДОКУМЕНТ. Оновлюється після кожної ітерації.

---

## 📚 ПЕРШОВІДНО ЧИТАЙ (In This Order)

**⚠️ Обов'язковий порядок для Claude:**

1. **Цей файл** (TASK.md) — огляд місії
2. `AI_DEVELOPER.md` — конституція розробки (залізні правила)
3. `AI_ONBOARDING.md` — брифінг та контекст
4. `BOOKIT.md` — бізнес-логіка та фічи
5. `SYSTEM_MAP.md` — технічна архітектура (СКАНУЙ ПЕРЕД КОЖНОЮ РОБОТОЮ!)
6. `UI_MAP.md` — карта UI компонентів
7. `UX_STANDARDS.md` — стандарти UX
8. `.claude/HUMANIZER_GUIDE.md` — гайд для гуманізації текстів

---

## 🚀 MISSION: BookIT Visual & Interaction Revolution

**Контекст:** Перетворити BookIT на premium SaaS 
---
### 1. **Motion & Performance**
```
✓ Animation intensity: 7/10 (meaningful, not overwhelming)
✓ Every transition = purpose (guide eye or feedback)
✓ Optimized for low-end Android (Extreme Optimization)
✓ Bento-Air modules (modular but feels air-light)
✓ Framer Motion v12.35.1 (installed!)
```

---

### 2. **Navigation Architecture**
```
Desktop:
  - Sophisticated horizontal topbar
  - Content takes center stage
  - Blurred navigation layer (never obstructs)

Mobile/PWA:
  - Refined "Floating Island" bottom navigation
  - Native OS feel
  - Haptic-ready interactions
  - Thumb-reach ergonomics
```

---

## 🎯 The Directive (Golden Rule)

> **Do not fix. Do not iterate. REBUILD.**
>
> Every single pixel and line of code must justify its existence against the new standard.
> If it doesn't feel like a premium product from the future, it doesn't belong in BookIT.

---

## 🛠️ Claude's Toolkit (Cleaned & Ready)

### **6 Core Skills** (Auto-Selection Enabled)

#### **✍️ Copywriting (Priority 1)**
- **humanizer** — Humanize ALL text (landing, pricing, features, copy) ⭐⭐⭐

#### **🎨 Design & Audit (Priority 1)**
- **impeccable** — Design audit, anti-pattern detection, quality gate ⭐
- **code-reviewer** — Code quality & security review

#### **🚀 UI & Animation (Priority 2)**
- **design-taste-frontend** — Premium UI code generation (PRIMARY for all UI) ⭐⭐⭐
- **emil-design-eng** — Animations, micro-interactions, polish
- **senior-frontend** — React/Next.js optimization & implementation

### **3 MCP Servers** (Always Available)

- **tailwind** — CSS utilities optimization (Tailwind v4)
- **a11y** — Color contrast checks (WCAG)
- **universal-icons** — Icon search & selection

---

## 🤖 Claude's SMART Auto-Selection Workflow (NEW!)

> **ВАЖЛИВО:** Claude **НЕ запускає скіл одразу**. Замість цього **задає 3-5 уточнювальних питань** перед вибором скіла!

```
Користувач: "Зробити темну брутальну тему дашборду"
    ↓
Claude детектує: design task (keywords: dark, theme, design)
    ↓
Claude НЕ запускає скіл одразу!
    ↓
Claude задає уточнення (AskUserQuestion):
  Q1: Які сторінки/компоненти? (dashboard, settings, all?)
  Q2: Brutal Studio чи своя палітра?
  Q3: Які 3-4 основні кольори?
  Q4: Анімація потрібна? (none/subtle/playful/dramatic)
  Q5: Коли готово? (ASAP/this week/future)
    ↓
Користувач відповідає на питання
    ↓
Claude вирахує ТОЧНИЙ скіл + параметри:
  Selected: /design-taste-frontend + /emil-design-eng
  Context: { scope: 'dashboard', aesthetic: 'brutal', palette: {...}, motion: 'smooth' }
    ↓
Claude ПІДТВЕРДЖУЄ вибір:
  "Запускаю design-taste-frontend з Brutal Studio + animated transitions"
    ↓
Claude запускає skill З ПОВНИМ КОНТЕКСТОМ
    ↓
QA сесія з Вітос (перед фіналізацією)
```

**Детальна система питань:** див. `.claude/CLARIFICATION_FRAMEWORK.md`

---

## 📋 Typical Workflows (With Smart Clarifications)

### **Workflow 1: Humanize Landing Page Copy**
```bash
Input: "Гуманізуй лендинг копію"

1️⃣ Claude задає 5 питань:
   - Який текст? (hero, features, pricing?)
   - Тон голосу? (professional, conversational, playful?)
   - Для кого? (masters, clients?)
   - Специфічні терміни? (бренд-слова)
   - Довжина? (label, sentence, paragraph?)

2️⃣ Користувач відповідає

3️⃣ Claude: "/humanizer з контекстом"
   → Видаляє: "revolutionizes" → "helps"
   → Результат: природна копія

4️⃣ QA з Вітос
→ Production copy (звучить по-людськи! ✓)
```

### **Workflow 2: Build Premium Component + Copy**
```bash
Input: "Побудувати pricing page з копією"

1️⃣ Claude задає питання:
   [Design questions] + [Copy questions]

2️⃣ Користувач відповідає (5 питань × 2)

3️⃣ Claude запускає:
   - /humanizer (для копії: features, benefits)
   - /design-taste-frontend (layout з контекстом)
   - /emil-design-eng (якщо motion='yes')

4️⃣ /impeccable audit → /a11y check

5️⃣ QA з Вітос
→ Premium pricing page (дизайн + копія)
```

### **Workflow 3: Build UI + Humanize**
```bash
Input: "Побудувати booking hero"

1️⃣ Claude: "Кілька уточнень..."
   [5 design questions] + [copy tone question]

2️⃣ Користувач відповідає

3️⃣ Claude:
   - /design-taste-frontend build
   - /humanizer humanize [hero copy]
   - /emil-design-eng [if motion]

4️⃣ /impeccable audit + /a11y check

5️⃣ QA
→ Premium component (UI + human copy)
```

### **Workflow 4: Dark Mode (Brutal Studio)**
```bash
Input: "Дизайнь темну брутальну тему"

1️⃣ Claude: "Уточню детальніше..."
   Q1: Яка область? (dashboard, all pages, specific section?)
   Q2: Brutal Studio палітра? (deep charcoal + metallic?)
   Q3: Які кольори? (gold, silver, custom?)
   Q4: Анімація? (subtle transitions, dramatic?)
   Q5: Коли потрібно?

2️⃣ Користувач: "Dashboard, Brutal, dark charcoal+gold, smooth, ASAP"

3️⃣ Claude: "Запускаю design-taste-frontend з параметрами:
   aesthetic: brutal
   palette: { primary: #1a1a1a, accent: #d4a574 }
   scope: dashboard
   motion: true"

4️⃣ /design-taste-frontend build [Brutal Studio]
   /emil-design-eng add-motion (300ms transitions)
   /impeccable audit
   /a11y check (high contrast)

5️⃣ QA з Вітос
→ Premium dark mode (Brutal, animated, accessible)
```

---

## ⚡ Quick Skill Reference

| Task | Skill | Command |
|------|-------|---------|
| **Humanize Text** | humanizer | `/humanizer` |
| **Build UI Component** | design-taste-frontend | `/design-taste-frontend build` |
| **Add Animations** | emil-design-eng | `/emil-design-eng` |
| **Implement Frontend** | senior-frontend | Code implementation |
| **Audit Quality** | impeccable | `/impeccable audit` |
| **Review Code** | code-reviewer | `/code-reviewer audit` |
| **Check Contrast** | a11y MCP | `/a11y check` |
| **CSS Optimization** | tailwind MCP | `/tailwind optimize` |
| **Icons** | universal-icons MCP | (auto in code) |

---

## 📝 HUMANIZER CRITICAL RULES

> **ОБОВ'ЯЗКОВО:** Гуманізуй ВСІ тексти на BookIT

### **Humanizer Workflow**
```
1. Write draft (AI is OK)
2. Run /humanizer
3. Humanizer detects & fixes:
   ✗ "revolutionizes" → "helps"
   ✗ "leverage" → remove
   ✗ "unlock potential" → "grow"
   ✗ Passive voice → active
4. Output: Natural text
5. QA with user
```

### **Where to Humanize (PRIORITY 1)**
- ✅ Landing page hero & copy
- ✅ Pricing page descriptions
- ✅ Feature descriptions
- ✅ Marketing emails
- ✅ Onboarding text
- ✅ Button labels (if verbose)
- ✅ Error messages (friendly)

### **Example**
```
BEFORE (AI):
"BookIT revolutionizes the beauty industry by leveraging 
cutting-edge technology to empower masters and maximize 
revenue potential."

AFTER (/humanizer):
"BookIT helps beauty pros manage bookings and attract 
more clients."
```

---

## 🎯 **QA GATE — BEFORE EVERY FINALIZATION**

> ⭐ **CRITICAL RULE:** Do NOT finalize any design/copy without QA session with user

### **QA Session Protocol**

**For Design:**
```
1. Claude робить QA сесію на 8-10 питань для узгодження ідей та концепцій.
2. Claude пропонує свої власні рішення.
3. Вітос дає фідбек
4. Цикл до "Готово!"
```

**For Copy:**
```
1. Claude готує humanized текст
2. Claude пропонує: "Давай перевіримо копію"
3. Показує: "Видалив AI-штампи: 'revolutionize' → 'help'"
4. Вітос дає фідбек
5. Цикл до "Готово!"
```

### **Що перевіряти**
- ✓ Дизайн: відповідність "iPhone AIR" або "Brutal Studio"
- ✓ Копія: звучить природно, без AI-штампів
- ✓ Колірна палітра & контраст (WCAG AA)
- ✓ Типографіка (sans + script)
- ✓ Motion & feel (5/10 інтенсивність)
- ✓ Mobile-first responsiveness

---

## 📊 XDEV Reference Files

**Claude МУСИТЬ використовувати ці файли при роботі:**

### **ОБОВ'ЯЗКОВІ ДО ЧИТАННЯ**

| Файл | Коли | Для чого |
|------|------|---------|
| `AI_DEVELOPER.md` | ПЕРЕД КОЖНОЮ роботою | Залізні правила |
| `SYSTEM_MAP.md` | ПЕРЕД КОЖНОЮ роботою | Архітектура |
| `BOOKIT.md` | На старті проекту | Business logic |
| `AI_ONBOARDING.md` | На старті проекту | Брифінг |

### **ДОВІДНИКОВІ**

| Файл | Коли | Для чого |
|------|------|---------|
| `.claude/HUMANIZER_GUIDE.md` | Перед текстом | Гайд гуманізації |
| `.claude/SKILL_GUIDE.md` | Для reference | Карта skills |
| `UI_MAP.md` | Перед UI роботою | Компоненти |
| `UX_STANDARDS.md` | При дизайні | Правила UX |
| `XDEV_PROTOCOL.md` | Для reference | Як читати файли |

---

## 🔄 Workflow для Вітос + Claude

### **Приклад: Humanize Pricing Page + Design**

```
1️⃣ Вітос: "Create humanized pricing page, Brutal Studio dark mode"
   
2️⃣ Claude:
   - Читає HUMANIZER_GUIDE.md
   - Читає XDEV/SYSTEM_MAP.md
   
3️⃣ Copy fase:
   - Пише draft feature descriptions
   - Запускає /humanizer
   - Видаляє: "cutting-edge" → "flexible"
   - Видаляє: "leverage" → remove
   - Выдає: "Manage up to 500 clients"
   
4️⃣ Design fase:
   - Запускає /industrial-brutalist-ui
   - Запускає /design-taste-frontend build
   
5️⃣ QA:
   - Claude: "Вітос, давай перевіримо:
     - Копія: натуральна, без AI
     - Дизайн: Brutal, темний, дорогий
     - Контраст: WCAG AA ✅
   
6️⃣ Вітос:
   - Схвалює або просить змін
   
7️⃣ Цикл → Готово!

8️⃣ Claude:
   - Оновлює SYSTEM_MAP.md
   - Оновлює CHANGELOG.md
```

---

## 🎪 Key Rules (Golden Standards)

### **ЗАВЖДИ РОБИТИ:**
1. ✅ Читай XDEV файли перед роботою
2. ✅ **Гуманізуй ВСІ тексти** через `/humanizer`
3. ✅ Запускай `/impeccable audit` перед фіналізацією
4. ✅ Запускай `/a11y check` для кольорів
5. ✅ Пропонуй QA сесію з Вітос (ОБОВ'ЯЗКОВО!)
6. ✅ Оновлюй SYSTEM_MAP.md & CHANGELOG.md після роботи
7. ✅ Використовуй Framer Motion v12.35.1 для анімацій
8. ✅ Mobile-first підхід (мобіль спочатку)
9. ✅ Server Components за замовчуванням

### **НІКОЛИ НЕ РОБИТИ:**
1. ❌ Не скорочуй QA сесію
2. ❌ **Не публікуй AI-generated текст без /humanizer**
3. ❌ Не використовуй: "revolutionize", "leverage", "empower"
4. ❌ Не робити тяжкі shadows (Light Air)
5. ❌ Не ігноруй SYSTEM_MAP.md перед роботою
6. ❌ Не забувай про a11y контраст
7. ❌ Не робити половинчастих рішень

---

## 🏁 Success Criteria

Проект готовий коли:

- ✅ **Текст:** гуманізований через `/humanizer`, без AI-штампів
- ✅ **Дизайн:** відповідає "iPhone AIR" або "Brutal Studio"
- ✅ **Code:** пройшов `/impeccable audit`
- ✅ **A11y:** контраст WCAG AA мінімум
- ✅ **Motion:** 5/10 інтенсивність, smooth на Android
- ✅ **Copy:** Вітос схвалив на QA
- ✅ **Docs:** SYSTEM_MAP.md & CHANGELOG.md оновлено

---

## 🚀 Current Status (CLEANED)

- ✅ **6 Core Skills** (видалено 10 дублів/конфліктів)
- ✅ **3 MCP Servers** готові (tailwind, a11y, universal-icons)
- ✅ **Auto-selection** оптимізовано в settings.json
- ✅ **No conflicts** — лише чіткі paths для Claude
- ✅ **QA Protocol** встановлено
- ✅ **High accuracy** expected (менше confusion)

**Ти готовий перетворити BookIT на premium SaaS з людяними текстами! 🎭✨**

---

## 📞 Before Every Task

Claude **УСІМ задає уточнювальні питання**:

1. **Користувач дає промт** → "Зробити темну тему"
2. **Claude детектує тип** → design task
3. **Claude запитує** → 5 уточнень (AskUserQuestion)
4. **Користувач відповідає** → детальний контекст
5. **Claude вибирає скіл** → На основі відповідей
6. **Claude підтверджує** → "Запускаю design-taste-frontend з параметрами..."
7. **Claude запускає skill** → З ПОВНИМ КОНТЕКСТОМ
8. **QA сесія** → Перед фіналізацією

---

## ⚙️ Clarification Question Templates

**Для кожного типу задачі є шаблон 5 питань:**

| Тип | Питання | Гайд |
|-----|---------|------|
| **Design** | scope, aesthetic, colors, motion, priority | `.claude/CLARIFICATION_FRAMEWORK.md#design-tasks` |
| **Copy** | type, tone, audience, constraints, length | `.claude/CLARIFICATION_FRAMEWORK.md#copy-humanizer-tasks` |
| **Code** | focus, scope, context, severity, output | `.claude/CLARIFICATION_FRAMEWORK.md#code-review-tasks` |
| **Animation** | component, feel, trigger, duration, intensity | `.claude/CLARIFICATION_FRAMEWORK.md#animationmotion-tasks` |

---

**Next Step:** Вітос просто дає промт. Claude:
1. Задає 5 уточнень
2. Аналізує відповіді
3. Вибирає точний скіл + параметри
4. Запускає skill З КОНТЕКСТОМ
5. QA сесія перед фіналізацією

**Приклад:**
```
Вітос: "Зробити темну брутальну тему дашборду"

Claude: "Уточню! 5 питань..."
[AskUserQuestion: scope, aesthetic, colors, motion, priority]

Вітос відповідає: "Dashboard, Brutal, charcoal+gold, smooth, ASAP"

Claude: "Запускаю /design-taste-frontend з параметрами:
  aesthetic: brutal
  palette: charcoal + gold
  scope: dashboard
  motion: smooth"
  
[Generates code]

Claude: "Давай перевіримо результат! ✓"
```

**ГОТОВО! 🚀 Система повністю автоматизована!**
