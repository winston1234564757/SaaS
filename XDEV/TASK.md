# 🎨 TASK.md — Design & Development Mission for BookIT

> **СТАТУС:** Фаза дизайну + розробки (Вітосе + Claude협力)
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

---

## 🚀 MISSION: BookIT Visual & Interaction Revolution

**Контекст:** Перетворити BookIT на premium SaaS з поєднанням:
- 🌬️ **"iPhone AIR"** aesthetic — легкість, простота, висока якість
- 🏢 **"Brutal Studio"** dark mode — сучасна брутальність, дороговизна, precision

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

**Не просто темна тема** — це окремий дизайн зі своєю энергією.

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

## 🛠️ Claude's Design Toolkit (Installed & Ready)

### **16 Design Skills** (Auto-Selection Enabled)

#### Priority 1 (QA & Audit)
- **impeccable** — Design audit, anti-pattern detection, quality gate ⭐
- **code-reviewer** — Code quality & security

#### Priority 2 (Generation)
- **design-taste-frontend** — Premium UI code generation
- **emil-design-eng** — Animations, micro-interactions, polish
- **image-to-code** — Convert design mockups to code
- **senior-frontend** — React/Next.js optimization
- **imagegen-frontend-web** — Web design concepts (1 image/section!)
- **imagegen-frontend-mobile** — Mobile app screens

#### Priority 3 (Style Variants)
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
Користувач: "Design a premium dashboard"
    ↓
Claude читає keywords: "design", "dashboard"
    ↓
Матчить до: design-taste-frontend (priority 2)
    ↓
Запускає /design-taste-frontend build
    ↓
Генерує код
    ↓
RUN /impeccable audit (ALWAYS!)
    ↓
RUN /a11y check (contrast)
    ↓
RUN /tailwind optimize
```

**Детальна карта:** див. `.claude/SKILL_GUIDE.md`

---

## 📋 Typical Design Workflows

### **Workflow 1: Build Premium Component**
```bash
Input: "Build a modern booking confirmation card"
1. /design-taste-frontend build
2. /impeccable polish
3. /a11y check colors
4. /tailwind optimize
→ Production code
```

### **Workflow 2: Dark Mode (Brutal Studio)**
```bash
Input: "Design dark mode for dashboard—brutal, expensive feel"
1. /industrial-brutalist-ui (style template)
2. /design-taste-frontend build
3. /impeccable audit (harsh contrast check)
4. /a11y verify (contrast for accessibility!)
→ Premium dark mode
```

### **Workflow 3: Image to Code**
```bash
Input: "Convert this Figma screenshot to code" [image]
1. /image-to-code analyze
2. /design-taste-frontend build
3. /impeccable polish
4. /tailwind optimize
→ Pixel-perfect implementation
```

### **Workflow 4: Animation Polish**
```bash
Input: "Add smooth transitions to the form"
1. /emil-design-eng add-motion
2. /impeccable check-feel
3. Implement in Framer Motion
→ Shipped
```

---

## ⚡ Quick Skill Reference

| Task | Skill | Command |
|------|-------|---------|
| Build UI | design-taste-frontend | `/design-taste-frontend build` |
| Dark Mode (Brutal) | industrial-brutalist-ui | `/industrial-brutalist-ui` |
| Audit Quality | impeccable | `/impeccable audit` |
| Add Animations | emil-design-eng | `/emil-design-eng` |
| Image to Code | image-to-code | `/image-to-code` |
| Check Contrast | a11y MCP | `/a11y check` |
| CSS Optimization | tailwind MCP | `/tailwind optimize` |
| Icons | universal-icons MCP | (auto in code) |

---

## 🎯 **QA GATE — BEFORE EVERY DESIGN FINALIZATION**

> ⭐ **CRITICAL RULE:** Do NOT finalize any design without QA session with user

### **QA Session Protocol**

**Коли Claude думає, що дизайн готовий:**

```
1. Claude готує скрін або демо

2. Claude пропонує:
   - "Вітосе, давай перевіримо дизайн перед фіналізацією"
   - Показує концепцію
   - Висвітлює ключові рішення (кольори, типографіка, spacing)
   - Пропонує варіанти чи поліпшення

3. Вітосе дає фідбек:
   - ✅ Схвалює
   - 🔄 Просить змінити (кольор, spacing, стиль)
   - 💡 Пропонує нові ідеї

4. Claude:
   - Реалізує feedback
   - Запускає /impeccable audit
   - Перепропонує (п.2)

5. Цикл повторюється доки Вітосе не скаже: "Готово!"
```

### **Що перевіряти на QA:**
- ✓ Відповідність "iPhone AIR" або "Brutal Studio"
- ✓ Колірна палітра (контраст + естетика)
- ✓ Типографіка (sans + script, розміри, гієрархія)
- ✓ Spacing & alignment (математична точність)
- ✓ Motion & feel (Animation intensity 5/10?)
- ✓ Mobile-first responsiveness
- ✓ Accessibility (a11y контраст)

---

## 📊 XDEV Reference Files

**Claude МУСИТЬ використовувати ці файли при роботі:**

### **ОБОВ'ЯЗКОВІ ДО ЧИТАННЯ**

| Файл | Розмір | Коли читати | Використання |
|------|--------|-----------|--------------|
| `AI_DEVELOPER.md` | 15K | **ПЕРЕД кожною роботою** | Залізні правила, конвенції |
| `SYSTEM_MAP.md` | 26K | **ПЕРЕД кожною роботою** | Архітектура, файли, структури |
| `BOOKIT.md` | 15K | На старті проекту + QA | Бізнес-логіка, фічі, контекст |
| `AI_ONBOARDING.md` | 16K | На старті проекту | Брифінг, місія, контекст |

### **ДОВІДНИКОВІ**

| Файл | Розмір | Коли читати | Використання |
|------|--------|-----------|--------------|
| `UI_MAP.md` | 8.3K | Перед UI роботою | Карта компонентів, структури |
| `UX_STANDARDS.md` | 1.8K | При дизайні | Правила UX, стандарти |
| `CHANGELOG.md` | 3.2K | Після ітерацій | Історія змін |
| `image.png` | 273K | Для вдохновення | Дизайн референс |

---

## 🔄 Workflow для Вітосе + Claude

### **Ітерація одного компонента:**

```
1️⃣ Вітосе: "Build booking hero with iPhone AIR feel"
   
2️⃣ Claude:
   - Читає XDEV/SYSTEM_MAP.md (архітектура)
   - Читає XDEV/AI_DEVELOPER.md (стандарти)
   - Вибирає skill: design-taste-frontend
   - Генерує дизайн & код
   
3️⃣ Claude запускає:
   - /impeccable audit
   - /a11y check colors
   - /tailwind optimize
   
4️⃣ Claude: "Вітосе, давай перевіримо героїку. Я використав:
   - Мінімалістичні лінії 0.5px
   - Велику негативну простір
   - Sans-serif основний текст
   - Script accent у назві
   - Glassmorphism на CTA
   
   Варіанти: світлий (поточний) або спробувати темнішу версію?
   Контраст: ✅ WCAG AA
   
5️⃣ Вітосе дає фідбек:
   - "Додай ще більше простору між строк"
   - "CTA кнопка—зробимо наче Brutal?"
   
6️⃣ Claude реалізує:
   - Змінює spacing
   - Запускає /industrial-brutalist-ui для CTA
   - Перепропонує дизайн
   
7️⃣ Цикл → поки не скажеш "Готово!"

8️⃣ Claude:
   - Оновлює SYSTEM_MAP.md (компонент додано)
   - Оновлює CHANGELOG.md
```

---

## 🎪 Key Rules (Golden Standards)

### **ЗАВЖДИ РОБИТИ:**
1. ✅ Читай XDEV файли перед роботою
2. ✅ Запускай `/impeccable audit` перед фіналізацією
3. ✅ Запускай `/a11y check` для кольорів
4. ✅ Пропонуй QA сесію з Вітосе (не приховуй рішення)
5. ✅ Оновлюй SYSTEM_MAP.md & CHANGELOG.md після кожної ітерації
6. ✅ Використовуй Framer Motion v12.35.1 для всіх анімацій
7. ✅ Mobile-first підхід (дизайн для мобіля спочатку)
8. ✅ Server Components за замовчуванням, `"use client"` тільки для інтерактивності

### **НІКОЛИ НЕ РОБИТИ:**
1. ❌ Не скорочуй QA сесію
2. ❌ Не вибирай стиль без узгодження з Вітосе
3. ❌ Не використовуй Emoji в дизайні (ONLY SVG)
4. ❌ Не робити тяжкі shadows (стиль "Light Air")
5. ❌ Не ігноруй SYSTEM_MAP.md перед роботою
6. ❌ Не забувай про accessibility (a11y)
7. ❌ Не робити половинчастих рішень

---

## 🏁 Success Criteria

Дизайн готовий коли:

- ✅ Видповідає "iPhone AIR" або "Brutal Studio" філософії
- ✅ Проходить `/impeccable audit` без проблем
- ✅ `a11y` контраст: WCAG AA мінімум
- ✅ Motion: 5/10 інтенсивність, smooth на Android
- ✅ Типографіка: sans + script поєднання
- ✅ Spacing: математично точний, мінімалістичний
- ✅ Вітосе схвалив на QA сесії
- ✅ SYSTEM_MAP.md & CHANGELOG.md оновлено

---

## 📞 Questions for Claude

Перед початком роботи задай собі:

1. **Яка стиль потрібна?** (Air light, Brutal dark, або обидва?)
2. **Яку палітру вибрати?** (а11y перевіримо разом)
3. **Типографіка?** (sant-serif що + script accent?)
4. **Motion?** (Потрібні анімації? Інтенсивність 5/10?)
5. **Mobile-first?** (Як виглядає на мобілі?)

---

## 🚀 Current Status

- ✅ 16 Design Skills встановлено
- ✅ 3 MCP Servers готові
- ✅ Auto-selection в `.claude/settings.json` активовано
- ✅ SKILL_GUIDE.md створено
- ✅ QA Protocol встановлено

**Ти готовий перетворити BookIT! 🎭✨**

---

**Next Step:** Вітосе просто кажеш, яку частину дизайну бозолсь攻略розпочати, і Claude автоматично вибирає ранці skills.

Приклад:
```
Вітосе: "Let's start with the master dashboard. iPhone AIR style."
Claude: [читає XDEV, вибирає skills, пропонує QA]
```

**Готово?** 🚀
