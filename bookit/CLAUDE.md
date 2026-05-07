# 📘 Bookit Development Guide

**🔥 ВАЖЛИВО:** Перш ніж працювати, прочитай (в порядку):
1. `.claude/CLARIFICATION_FRAMEWORK.md` — ✨ NEW! 5 питань перед запуском скіла
2. `.claude/HUMANIZER_GUIDE.md` — гайд для гуманізації текстів
3. `.claude/SKILL_GUIDE.md` — як вибирати skills автоматично
4. `XDEV/TASK.md` — місія, дизайн, rules
5. `XDEV/AI_DEVELOPER.md` — конституція розробки

---

## 🎯 SMART Skill Auto-Selection (with Clarifications!)

Claude **НЕ вибирає скіл одразу**. Замість цього:

1. **Детектує тип задачі** (design, copy, code, animation)
2. **Задає 3-5 уточнювальних питань** (AskUserQuestion)
3. **Аналізує відповіді** та вирахує точний скіл
4. **Підтверджує вибір** перед запуском
5. **Запускає skill З КОНТЕКСТОМ**
6. **QA сесія** з користувачем

**Не потрібно** вручну викликати skills — Claude запитає все, що потрібно!

---

## 📊 Встановлені Skills (6 Core Skills)

### **Copywriting (Priority 1)**
- ✅ **humanizer** — Humanize ALL text (landing, pricing, features, copy) ⭐

### **Design & Audit (Priority 1)**
- ✅ **impeccable** — Design audit, anti-patterns, quality gate ⭐
- ✅ **code-reviewer** — Code quality, security, best practices

### **UI & Implementation (Priority 2)**
- ✅ **design-taste-frontend** — Premium UI code generation (PRIMARY) ⭐⭐⭐
- ✅ **emil-design-eng** — Animations, micro-interactions, polish
- ✅ **senior-frontend** — React/Next.js, implementation, performance

### **MCP Servers (Always Available)**
- ✅ **tailwind** — CSS utilities optimization (Tailwind v4)
- ✅ **a11y** — Color contrast checks (WCAG)
- ✅ **universal-icons** — Icon search & selection

---

## 🚀 Quick Workflows (Smart Clarifications First!)

### **Humanize Text (Copy, Landing, Pricing)**
```
User: "Гуманізуй текст для тарифів"

Claude: "Уточню! 🎯"
[Asks 5 questions via AskUserQuestion]
  Q1: Який текст? (hero, description, benefits?)
  Q2: Тон голосу? (professional, conversational?)
  Q3: Для кого? (masters, clients?)
  Q4: Терміни для збереження?
  Q5: Довжина? (label, sentence, paragraph?)

User answers → Claude: "/humanizer з контекстом"
→ Видаляє AI-штампи
→ Природна копія
→ QA з Вітос
```

### **Build Premium UI Component**
```
User: "Побудувати booking form"

Claude: "Уточню деталі! 🎯"
[Asks 5 design questions]
  Q1: Яка область? (component, page, full flow?)
  Q2: Який стиль? (iPhone AIR, Brutal Studio?)
  Q3: Палітра? (BookIT default чи custom?)
  Q4: Анімація потрібна?
  Q5: Коли готово?

User answers → Claude: "/design-taste-frontend build + /impeccable audit"
→ Premium UI код
→ /a11y контрас перевірка
→ QA з Вітос
```

### **Design + Humanize (Complete Page)**
```
User: "Дизайн та копія для pricing page, iPhone AIR"

Claude: "Уточню дизайн+копію! 🎯"
[Design questions] + [Copy questions]

User answers both

Claude:
  - /humanizer (копія)
  - /design-taste-frontend (layout)
  - /emil-design-eng (if motion)
  - /impeccable audit
  - /a11y контраст

→ Premium pricing page (дизайн + людяна копія)
→ QA з Вітос
```

### **Dark Mode (Brutal Studio Theme)**
```
User: "Зробити темну брутальну тему"

Claude: "Деталізую Brutal редизайн! 🎯"
[Asks 5 design questions]
  Q1: Яка область? (dashboard, all, specific?)
  Q2: Brutal Studio палітра?
  Q3: Кольори? (deep charcoal + ?)
  Q4: Анімація? (smooth, dramatic?)
  Q5: Коли?

User: "Dashboard, Brutal, dark+gold, smooth, ASAP"

Claude: "/design-taste-frontend build
  aesthetic: brutal
  palette: { primary: #1a1a1a, accent: #d4a574 }
  /emil-design-eng (transitions)"

→ Dark Brutal theme (animated, accessible)
→ /impeccable + /a11y
→ QA з Вітос
```

### **Code Review**
```
User: "Перевір код AuthContext"

Claude: "Уточню review! 🎯"
[Asks 5 code questions]
  Q1: Що турбує? (security, perf, quality?)
  Q2: Область? (file, function, module?)
  Q3: Контекст? (auth, booking, analytics?)
  Q4: Критичність? (blocker, high, medium?)
  Q5: Output формат? (report, fixed code?)

User answers → Claude: "/code-reviewer audit"
→ Report + suggestions
→ User reviews
```

---

## ⚡ When Skills Are Manual

Rarely needed (Claude auto-selects!), but if needed:

```bash
/humanizer humanize [text]        # Humanize copy
/design-taste-frontend build      # Build UI
/emil-design-eng add-motion       # Add animations
/impeccable audit [component]     # Audit design
/code-reviewer audit [file]       # Review code
/a11y check [colors]              # Check contrast
/tailwind optimize [classes]      # Optimize CSS
```

---

## 🎨 Design Philosophy

### **"iPhone AIR" (Light Mode)**
- Ultra-thin borders (0.5px)
- Expansive negative space
- Perfect grid alignment
- Zero heavy shadows
- Elegance over complexity

### **"Brutal Studio" (Dark Mode)**
- Deep charcoals, slate tones
- Raw metallic accents
- Rugged, masculine, expensive feel
- High-end barbershop / studio vibe

---

## 🎯 Essential Rules

1. **Humanize EVERYTHING** — all text goes through `/humanizer`
2. **Design QA Gate** — every design ends with `/impeccable audit`
3. **A11y Always** — check colors with `a11y` MCP
4. **Tailwind Only** — no custom CSS, use Tailwind v4
5. **Framer Motion** — all animations use v12.35.1
6. **Mobile-First** — design for mobile first, then scale up
7. **TypeScript Strict** — all code in strict mode
8. **Server Components** — default to SC, `"use client"` only for interactivity

---

## 📁 Key Files

```
XDEV/
  ├── TASK.md                  ← Mission, design rules, skills
  ├── SKILLS_AUDIT.md          ← Why we kept 6 skills (cleanup analysis)
  ├── AI_DEVELOPER.md          ← Constitution (read before work!)
  ├── SYSTEM_MAP.md            ← Architecture (read before work!)
  └── BOOKIT.md                ← Business logic

.claude/
  ├── HUMANIZER_GUIDE.md       ← How to humanize text
  ├── SKILL_GUIDE.md           ← Detailed skill reference
  ├── settings.json            ← Auto-selection config
  └── XDEV_PROTOCOL.md         ← How to use XDEV files
```

---

## ✨ Status

- ✅ **6 Core Skills** (cleaned up, no conflicts)
- ✅ **3 MCP Servers** ready
- ✅ **Auto-selection** enabled
- ✅ **QA gates** in place (design + copy)
- ✅ **High accuracy** expected (no confusion)

**You're ready to build premium BookIT!** 🚀
