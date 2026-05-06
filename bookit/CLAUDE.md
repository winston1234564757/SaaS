# 📘 Bookit Development Guide

**🔥 ВАЖЛИВО:** Перш ніж працювати, прочитай (в порядку):
1. `.claude/HUMANIZER_GUIDE.md` — гайд для гуманізації текстів
2. `.claude/SKILL_GUIDE.md` — як вибирати skills автоматично
3. `XDEV/TASK.md` — місія, дизайн, rules
4. `XDEV/AI_DEVELOPER.md` — конституція розробки

---

## 🎯 Skill Auto-Selection

Claude **автоматично вибирає** skill на основі:
- Ключових слів у запиті (humanize, build, animate, audit...)
- Типу задачі (copywriting, UI design, code review...)
- Пріоритету в settings.json

**Не потрібно** вручну викликати skills — Claude зробить це сам!

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

## 🚀 Quick Workflows

### **Humanize Text (Copy, Landing, Pricing)**
```
User: "Write humanized copy for pricing page"
→ Claude auto-selects: humanizer
→ Removes AI patterns
→ Outputs natural text
→ QA with user
```

### **Build Premium UI Component**
```
User: "Build a modern booking form"
→ Claude auto-selects: design-taste-frontend
→ Generates premium UI code
→ Runs /impeccable audit
→ Checks /a11y contrast
→ QA with user
```

### **Design + Humanize (Complete Page)**
```
User: "Design & write pricing page, iPhone AIR style"
→ /humanizer (copy)
→ /design-taste-frontend (layout)
→ /impeccable (audit)
→ /a11y (contrast)
→ QA with user
```

### **Add Animations**
```
User: "Add smooth transitions to the booking flow"
→ Claude auto-selects: emil-design-eng
→ Adds Framer Motion animations
→ /impeccable check-feel
→ QA with user
```

### **Code Review**
```
User: "Review the AuthContext code"
→ Claude auto-selects: code-reviewer
→ Reviews code quality & security
→ Suggests improvements
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
