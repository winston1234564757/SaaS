# 🎨 TASK.md — Design & Development Mission for BookIT

> **СТАТУС:** Фаза дизайну + розробки (Вітосе + Claude)
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

**Контекст:** Перетворити BookIT на premium SaaS з поєднанням:
- 🌬️ **"iPhone AIR"** aesthetic — легкість, простота, висока якість
- 🏢 **"Brutal Studio"** dark mode — сучасна брутальність, дороговизна, precision
- ✍️ **Human-Centered Copy** — гуманізовані тексти без AI-штампів

---

## 🎨 Design Philosophy & Standards

### 1. **"iPhone AIR" Aesthetic (Light Mode)**
```
✓ Ultra-thin borders (0.5px)
✓ Expansive negative space
✓ Perfect grid alignment
✓ Glassmorphism only where it adds value
✓ Subtle contrast, stroke-based definitions
✓ Zero heavy shadows
✓ Elegance over complexity
```

**Колори (Light):**
- Background: Alabaster white, sophisticated grays
- Accent: Refined, minimal
- Feeling: Infinite space, luxury air gallery

---

### 2. **"Brutal Studio" Dark Mode**
```
✓ Deep charcoals, slate tones
✓ Raw metallic accents
✓ Rugged, masculine, expensive feel
✓ Not a simple inversion—complete mood shift
✓ High-end barbershop / private studio vibe
```

**Не просто темна тема** — це окремий дизайн зі своєю енергією.

---

### 3. **Typography & Signature**
```
✓ Sans-serif (sharp, modern) + Cursive/Script (headings, accents)
✓ Mandatory blend = premium identity signature
✓ Custom-crafted SVG iconography ONLY
✓ Zero Emojis
✓ High-quality visual language
```

---

### 4. **Motion & Performance**
```
✓ Animation intensity: 5/10 (meaningful, not overwhelming)
✓ Every transition = purpose (guide eye or feedback)
✓ Optimized for low-end Android (Extreme Optimization)
✓ Bento-Air modules (modular but feels air-light)
✓ Framer Motion v12.35.1 (installed!)
```

---

### 5. **Navigation Architecture**
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
> Every single pixel and line of code must justify its existence against the **"iPhone AIR"** standard.
> If it doesn't feel like a premium product from the future, it doesn't belong in BookIT.

---

## 🛠️ Claude's Toolkit (Installed & Ready)

### **17 Total Skills** (Auto-Selection Enabled)

#### **✍️ Copywriting (Priority 1)**
- **humanizer** — Humanize ALL text (landing, pricing, features, copy) ⭐⭐⭐

#### **🎨 Design Skills (16 total)**

##### Priority 1 (QA & Audit)
- **impeccable** — Design audit, anti-pattern detection, quality gate ⭐
- **code-reviewer** — Code quality & security

##### Priority 2 (Generation)
- **design-taste-frontend** — Premium UI code generation
- **emil-design-eng** — Animations, micro-interactions, polish
- **image-to-code** — Convert design mockups to code
- **senior-frontend** — React/Next.js optimization
- **imagegen-frontend-web** — Web design concepts (1 image/section!)
- **imagegen-frontend-mobile** — Mobile app screens

##### Priority 3 (Style Variants)
- **minimalist-ui** — Editorial, clean, whitespace-focused
- **industrial-brutalist-ui** — Mechanical, Swiss, sharp contrast ← FOR "BRUTAL STUDIO"
- **high-end-visual-design** — Luxury/agency-level design
- **gpt-taste** — Elite UX + GSAP motion
- **brandkit** — Brand identity systems
- **stitch-design-taste** — Semantic design systems

### **3 MCP Servers** (Always Available)

- **tailwind** — CSS utilities optimization (Tailwind v4)
- **a11y** — Color contrast checks (WCAG)
- **universal-icons** — Icon search & selection

---

## 🤖 Claude's Auto-Selection Workflow

Claude **автоматично вибирає** skill на основі:

```
Користувач: "Write humanized copy for pricing page"
    ↓
Claude читає keywords: "write", "copy", "pricing"
    ↓
Матчить до: humanizer (priority 1)
    ↓
Запускає /humanizer
    ↓
Видаляє AI-штампи: "revolutionizes" → "helps"
    ↓
Выдає природній текст
    ↓
QA з Вітосе
```

**Детальна карта:** див. `.claude/SKILL_GUIDE.md`

---

## 📋 Typical Workflows

### **Workflow 1: Humanize Landing Page Copy**
```bash
Input: "Write landing hero copy"
1. Write draft
2. /humanizer remove-AI-patterns
3. Review natural text
4. QA with user
→ Production copy (sounds human!)
```

### **Workflow 2: Build Premium Component + Copy**
```bash
Input: "Build pricing page with humanized copy"
1. /humanizer fix [features copy]
2. /design-taste-frontend build [layout]
3. /impeccable audit
4. /a11y check
5. QA with user
→ Premium pricing page
```

### **Workflow 3: Build UI + Humanize**
```bash
Input: "Build booking hero with human copy"
1. /design-taste-frontend build [design]
2. Write hero copy
3. /humanizer humanize [copy]
4. /impeccable audit
5. /a11y check
→ Premium component
```

### **Workflow 4: Dark Mode (Brutal Studio)**
```bash
Input: "Design dark mode—brutal feel, human copy"
1. /industrial-brutalist-ui (style)
2. /design-taste-frontend build
3. /humanizer fix [copy]
4. /impeccable audit
→ Premium dark mode
```

---

## ⚡ Quick Skill Reference

| Task | Skill | Command |
|------|-------|---------|
| **Humanize Text** | humanizer | `/humanizer` |
| **Write Copy** | humanizer | `/humanizer` |
| Build UI | design-taste-frontend | `/design-taste-frontend build` |
| Dark Mode (Brutal) | industrial-brutalist-ui | `/industrial-brutalist-ui` |
| Audit Quality | impeccable | `/impeccable audit` |
| Add Animations | emil-design-eng | `/emil-design-eng` |
| Image to Code | image-to-code | `/image-to-code` |
| Check Contrast | a11y MCP | `/a11y check` |
| CSS Optimization | tailwind MCP | `/tailwind optimize` |
| Icons | universal-icons MCP | (auto in code) |

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
1. Claude готує скрін/демо
2. Claude пропонує: "Давай перевіримо дизайн"
3. Показує рішення (кольори, spacing, motion)
4. Вітосе дає фідбек
5. Цикл до "Готово!"
```

**For Copy:**
```
1. Claude готує humanized текст
2. Claude пропонує: "Давай перевіримо копію"
3. Показує: "Видалив AI-штампи: 'revolutionize' → 'help'"
4. Вітосе дає фідбек
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

## 🔄 Workflow для Вітосе + Claude

### **Приклад: Humanize Pricing Page + Design**

```
1️⃣ Вітосе: "Create humanized pricing page, Brutal Studio dark mode"
   
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
   - Claude: "Вітосе, давай перевіримо:
     - Копія: натуральна, без AI
     - Дизайн: Brutal, темний, дорогий
     - Контраст: WCAG AA ✅
   
6️⃣ Вітосе:
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
5. ✅ Пропонуй QA сесію з Вітосе (ОБОВ'ЯЗКОВО!)
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
- ✅ **Copy:** Вітосе схвалив на QA
- ✅ **Docs:** SYSTEM_MAP.md & CHANGELOG.md оновлено

---

## 🚀 Current Status

- ✅ **17 Skills** встановлено (1 copywriting + 16 design)
- ✅ **3 MCP Servers** готові
- ✅ **Auto-selection** активовано в settings.json
- ✅ **Humanizer** інтегровано (priority 1)
- ✅ **QA Protocol** встановлено
- ✅ **Guides** створено (SKILL_GUIDE, HUMANIZER_GUIDE, XDEV_PROTOCOL)

**Ти готовий перетворити BookIT на premium SaaS з людяними текстами! 🎭✨**

---

## 📞 Before Every Task

Задай собі:

1. **Потрібен текст?** → `/humanizer`
2. **Потрібен дизайн?** → Який стиль? (Air/Brutal?)
3. **Потрібна копія?** → Draft → `/humanizer` → QA
4. **Все готово?** → `/impeccable audit` → `/a11y check` → QA

---

**Next Step:** Вітосе просто каже що розпочати, Claude автоматично вибирає skills (humanizer, design, audit), запускає гайди, запропонує QA.

**Приклад:**
```
Вітосе: "Humanize the landing page and redesign the hero"
Claude: [читає HUMANIZER_GUIDE + XDEV, вибирає /humanizer + /design-taste-frontend, пропонує QA]
```

**Готово? 🚀**
