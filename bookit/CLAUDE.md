# 📘 Bookit Development Guide

**🔥 ВАЖЛИВО:** Перш ніж працювати, прочитай:
1. `.claude/SKILL_GUIDE.md` — як вибирати skills автоматично
2. `XDEV/AI_DEVELOPER.md` — конституція розробки (замість цього файлу)

---

## 🎯 Skill Auto-Selection

Claude **автоматично вибирає** skill/MCP на основі:
- Ключових слів у запиті (design, audit, build, animate...)
- Типу задачі (UI design, code review, animation...)
- Пріоритету в settings.json

**Не потрібно** вручну викликати `/impeccable` або `/design-taste-frontend` — Claude зробить це сам.

---

## 📊 Встановлені Skills (16 total)

### Design Skills
- ✅ **impeccable** — audit & polish (QA gate)
- ✅ **design-taste-frontend** — premium UI code
- ✅ **emil-design-eng** — animations & polish
- ✅ **image-to-code** — image → code conversion
- ✅ **imagegen-frontend-web** — web design concepts
- ✅ **imagegen-frontend-mobile** — mobile screens
- ✅ **minimalist-ui** — clean editorial style
- ✅ **industrial-brutalist-ui** — mechanical design
- ✅ **brandkit** — brand systems
- ✅ **high-end-visual-design** — luxury/agency style
- ✅ **gpt-taste** — elite UX/GSAP motion
- ✅ **stitch-design-taste** — semantic design systems

### Code Skills
- ✅ **code-reviewer** — quality & security
- ✅ **senior-frontend** — React/Next.js
- ✅ **senior-backend** — Node.js/APIs

### MCP Servers
- ✅ **tailwind** — CSS utilities
- ✅ **a11y** — accessibility checks
- ✅ **universal-icons** — icon search

---

## 🚀 Quick Workflows

### Build UI Component
```
"Build me a modern booking hero section"
→ Claude auto-selects: design-taste-frontend
→ Generates code + design
→ Runs impeccable audit
→ Checks a11y contrast
```

### Design Review
```
"This dashboard feels generic"
→ Claude auto-selects: impeccable
→ Audits for anti-patterns
→ Suggests improvements
```

### Animate UI
```
"Add smooth transitions to the form"
→ Claude auto-selects: emil-design-eng
→ Adds micro-interactions
→ Polishes the feel
```

---

## 🎨 When Skills Are Manual

If Claude doesn't auto-select (rare):
```bash
/impeccable audit [component]      # Design QA
/design-taste-frontend build       # Generate UI
/emil-design-eng polish            # Add animations
/image-to-code                     # Convert image
/code-reviewer audit               # Code review
```

---

## ⚡ Essential Rules

1. **Design QA Gate**: Every design ends with `/impeccable audit`
2. **A11y Always**: Check colors with `a11y` MCP before shipping
3. **Tailwind Optimization**: Use `tailwind` MCP for CSS suggestions
4. **Mobile-First**: Design for mobile first, then scale up
5. **TypeScript Strict**: All TypeScript in strict mode
6. **Server Components**: Default to Server Components, `"use client"` only for interactivity

---

## 📁 Project Structure

```
bookit/
  ├── CLAUDE.md                          ← You are here
  ├── XDEV/
  │   ├── AI_DEVELOPER.md               ← Constitution (read this!)
  │   ├── BOOKIT.md                     ← Business context
  │   ├── SYSTEM_MAP.md                 ← Tech map
  │   └── TASK.md                       ← Current task
  ├── .claude/
  │   ├── settings.json                 ← Skill auto-selection config
  │   ├── SKILL_GUIDE.md                ← Detailed skill reference
  │   └── .claude.json                  ← MCP servers config
  ├── src/
  │   ├── proxy.ts                      ← Route protection
  │   ├── lib/
  │   │   ├── utils/token.ts           ← generateSecureToken, sha256Hex
  │   │   ├── utils/pluralUk.ts        ← Ukrainian plurals
  │   │   ├── supabase/admin.ts        ← Admin client (use this!)
  │   │   └── supabase/hooks/          ← Custom hooks
  │   ├── app/                         ← Next.js App Router
  │   └── components/                  ← React components
  └── package.json                      ← Dependencies (Framer Motion v12.35.1)
```

---

## 🔗 Memory & Context

This project uses auto-memory. Key files:
- `.claude/projects/.../memory/MEMORY.md` — project context
- `.claude/projects/.../memory/feedback_*.md` — learned patterns

---

## ✨ Status

- ✅ 16 Skills installed & configured
- ✅ 3 MCP servers ready
- ✅ Auto-selection enabled in settings.json
- ✅ SKILL_GUIDE.md available for reference

**You're ready to build!** 🚀
