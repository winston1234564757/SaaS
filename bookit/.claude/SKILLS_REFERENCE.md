# 🎯 SKILLS REFERENCE — Complete Catalog (v8.2)

> **Статус:** Master catalog for all 20+ available skills  
> **Updated:** 2026-05-26  
> **Protocol:** Use SKILL_PROTOCOL.md Decision Tree + CLARIFICATION_FRAMEWORK.md (3-5 questions) BEFORE launching any skill

---

## 🏆 TIER 1: CRITICAL MANDATORY SKILLS (Use Without Delay)

### 1. **humanizer** ★★★★★
- **Role:** Copywriter / AI Text Humanizer
- **When:** EVERY UI text (buttons, labels, messages, headings)
- **Exceptions:** aria-label, data-testid, date formats, console.log
- **Process:** Ask clarifications → Launch with tone/audience → Review → QA
- **Banned Words:** "revolutionize", "leverage", "empower", "unlock", "seamlessly"

### 2. **code-reviewer** ★★★★★
- **Role:** Security & Code Quality Auditor
- **When:** Pre-commit code reviews, security audit, refactoring validation
- **Focus Areas:** OWASP top 10, RLS violations, SQL injection, XSS, bundle bloat
- **Output:** Report or fixed code with explanations

### 3. **impeccable** ★★★★★
- **Role:** Design Critic / QA Gate
- **When:** AFTER any design generation (design-taste-frontend output)
- **Detects:** 27 anti-patterns (card-in-card, weak hierarchy, generic fonts, contrast, shadows)
- **Chain:** design-taste-frontend → impeccable → humanizer → user QA

---

## 🎨 TIER 2: DESIGN & UI (Use Via Decision Tree)

### 4. **design-taste-frontend** ★★★★★
- **Role:** Senior UI/UX Engineer (PRIMARY UI Generator)
- **When:** New components, pages, dashboard widgets, full redesigns
- **Styles:** 3 themes (Blossom/Studio/Frost), Kinfolk+Aesop+Monocle editorial aesthetic
- **Parameters:** aesthetic, palette, scope, animation_yes/no, theme
- **Chain:** clarify → design-taste-frontend → emil-design-eng (if motion) → impeccable

### 5. **emil-design-eng** ★★★★
- **Role:** Motion Engineer (Animation Specialist)
- **When:** Framer Motion animations, micro-interactions, transition polish
- **Rules:** mode="popLayout" (not "wait"), spring bounce 0–0.12, duration 300ms, layoutId for tabs
- **Philosophy:** Details that make UI feel alive — invisible motion

### 6. **redesign-existing-projects** ★★★★
- **Role:** Existing UI Upgrade Specialist
- **When:** Redesigning existing components/pages (not new builds)
- **vs. design-taste-frontend:** Respects current structure; enhances incrementally

### 7. **high-end-visual-design** ★★★★
- **Role:** Premium Agency Designer
- **When:** Landing pages, marketing sites, high-end product UX
- **Output:** Expensive-looking UI (fonts, shadows, spacing, animations)

### 8. **minimalist-ui** ★★★
- **Role:** Clean Editorial Style Designer
- **When:** Minimalist aesthetic (warm monochrome, editorial, typographic contrast)
- **vs. design-taste-frontend:** Specific style; design-taste-frontend is broader

### 9. **industrial-brutalist-ui** ★★★
- **Role:** Brutalist Aesthetic Designer
- **When:** Bold, harsh, expensive-looking brutalist design

---

## 📸 TIER 2: IMAGE GENERATION (No Code Output)

### 10. **imagegen-frontend-web** ★★★★
- **Role:** Web UI Mockup Generator
- **When:** Conceptual screenshots, designs, user flows (NOT code)
- **Output:** High-quality PNG mockups only

### 11. **imagegen-frontend-mobile** ★★★★
- **Role:** Premium Mobile App Screen Generator
- **When:** iOS/Android screen concepts, flows, prototypes
- **Output:** Screens in iPhone mockup frame, clean hierarchy, readable text

### 12. **image-to-code** ★★★★
- **Role:** Screenshot → Code Converter
- **When:** Have screenshot/mockup → need implementation
- **Input:** Image file
- **Output:** Production-grade React/HTML/CSS code

---

## 💻 TIER 3: CODE & BACKEND

### 13. **senior-frontend** ★★★★★
- **Role:** Frontend Architect (React/Next.js/TypeScript)
- **When:** Component implementation, state management, performance optimization
- **Topics:** Hooks, Server Components, TanStack Query, Tailwind, responsive design
- **Overlap:** design-taste-frontend generates UI; senior-frontend implements production code

### 14. **senior-backend** ★★★★
- **Role:** Backend Architect (API, Database, Server Actions)
- **When:** API design, Supabase RLS, Server Actions, data fetching
- **Topics:** Database design, RPC functions, webhooks, security

### 15. **nextjs-best-practices** ★★★★
- **Role:** Next.js Expert (App Router, SSR, ISR, caching)
- **When:** Routing architecture, Server Components, data fetching patterns
- **vs. senior-frontend:** Focused on Next.js specifics (not general React)

### 16. **claude-api** ★★★
- **Role:** Claude API / Anthropic SDK Expert
- **When:** Building Claude-powered features, prompt caching, tool use
- **Topics:** Prompt caching, streaming, tool_use, Managed Agents

---

## 🔒 TIER 3: SECURITY & QUALITY

### 17. **security-review** ★★★★
- **Role:** Security Auditor (API, RLS, webhooks)
- **When:** Security audit of API endpoints, RLS rules, webhook handlers
- **vs. code-reviewer:** Focused deep-dive on security (code-reviewer is general)

### 18. **full-output-enforcement** ★★
- **Role:** Unabridged Code Generation (Override Truncation)
- **When:** Need complete code without LLM cutoff (add to main skill)
- **Example:** `/full-output-enforcement + design-taste-frontend` for large component

---

## 🎛️ TIER 4: INFRASTRUCTURE & CONFIG

### 19. **update-config** ★★★
- **Role:** settings.json / hooks / env configuration
- **When:** Setup Claude Code hooks, permissions, environment variables
- **Examples:** "allow npm commands", "set DEBUG=true", "add bq permission"

### 20. **keybindings-help** ★★
- **Role:** Customize keyboard shortcuts (~/.claude/keybindings.json)
- **When:** Rebind keys, add chord shortcuts, customize submit key

### 21. **schedule** ★★★
- **Role:** Scheduled Remote Agents (cron jobs)
- **When:** Setup recurring tasks, cron-based automation
- **Examples:** "run check-deploy every 5 minutes", "remind me tomorrow at 3pm"

### 22. **loop** ★★★
- **Role:** Recurring Prompt Loop (Self-Paced)
- **When:** Poll for status, run task repeatedly with self-paced intervals
- **vs. schedule:** schedule = fixed cron; loop = dynamic re-invocation

---

## 🧪 TIER 4: VERIFICATION & REVIEW

### 23. **verify** ★★★★
- **Role:** Manual Verification (Run App & Observe)
- **When:** Confirm a fix works in browser, test feature manually
- **Input:** Runs app locally; you observe behavior
- **Output:** "Works" / "Bug found" report

### 24. **run** ★★★
- **Role:** Launch & Drive Project (CLI/Server/Web/Mobile)
- **When:** Start dev server, see app running, verify changes
- **Detection:** Auto-detects project type (Next.js, React, Node, etc.)

### 25. **review** ★★★★
- **Role:** Pull Request Review
- **When:** Review code in PR, audit commits, check merge safety

---

## 🧠 TIER 5: SPECIALIZED DOMAIN SKILLS

### 26. **supabase:supabase** (MCP)
- **Role:** Supabase Database Operations
- **When:** execute_sql, list_tables, apply_migration
- **Integration:** Direct DB access via MCP server

### 27. **supabase:supabase-postgres-best-practices** (MCP)
- **Role:** PostgreSQL & RLS Best Practices
- **When:** Design RLS policies, optimize queries

### 28. **mcp__tailwind__*** (MCP) — 7 Tailwind utilities
- **Functions:** convert_css_to_tailwind, generate_color_palette, get_tailwind_colors, search_tailwind_docs, install_tailwind
- **When:** CSS → Tailwind conversion, color generation, config setup

### 29. **mcp__a11y__*** (MCP) — 3 Accessibility utilities
- **Functions:** are_colors_accessible (WCAG AA/AAA), get_color_contrast, use_light_or_dark
- **When:** Contrast validation, color pairing for accessibility

### 30. **mcp__universal-icons__*** (MCP) — Icon Search
- **Functions:** search_icons, get_icon (10 collections: Lucide, Material, Heroicons, Phosphor, FontAwesome, etc.)
- **When:** Find the right icon from any collection

---

## 🌍 TIER 5: PLUGIN SKILLS (Specialized Aesthetics)

### 31. **brandkit** ⭐
- Role: Brand system & guidelines

### 32. **design-taste-frontend** (with styles):
- `design-taste-frontend:stitch-design-taste` — Stitched aesthetic
- `design-taste-frontend:gpt-taste` — Alternative aesthetic

### 33. **high-end-visual-design** (for premium)
### 34. **minimalist-ui** (for editorial)
### 35. **industrial-brutalist-ui** (for harsh aesthetic)

---

## 📋 DECISION TREE — Skill Selection Flowchart

```
TASK ARRIVES
│
├─ DESIGN / UI / COMPONENT / PAGE?
│  ├─ Need IMAGES (not code)? ➔ imagegen-frontend-web/mobile
│  ├─ Have SCREENSHOT? ➔ image-to-code
│  ├─ AUDIT existing UI? ➔ impeccable
│  ├─ ANIMATIONS / MOTION? ➔ emil-design-eng
│  ├─ REDESIGN existing? ➔ redesign-existing-projects
│  ├─ NEW UI (most tasks) ➔ design-taste-frontend
│  └─ Specific style? ➔ minimalist-ui / high-end / brutalist
│
├─ TEXT / COPY?
│  └─ ALWAYS ➔ humanizer
│
├─ CODE / IMPLEMENTATION?
│  ├─ React/Next.js components ➔ senior-frontend
│  ├─ Backend/API/Server Actions ➔ senior-backend
│  ├─ Next.js routing/caching ➔ nextjs-best-practices
│  ├─ CODE REVIEW / SECURITY ➔ code-reviewer OR security-review
│  └─ Claude API / Agents ➔ claude-api
│
├─ VERIFY / TEST?
│  ├─ Run app manually ➔ run + verify
│  └─ Review PR ➔ review
│
├─ CONFIG / SETUP?
│  ├─ settings.json, hooks ➔ update-config
│  ├─ Keybindings ➔ keybindings-help
│  ├─ Cron jobs ➔ schedule
│  └─ Recurring loops ➔ loop
│
└─ INFRA / DATABASE?
   ├─ Supabase operations ➔ supabase:supabase
   └─ RLS / PostgreSQL ➔ supabase:supabase-postgres-best-practices
```

---

## 🔗 RECOMMENDED SKILL CHAINS

### For Design Task (Comprehensive)
```
clarify (3-5 Q) 
→ design-taste-frontend (build UI)
→ emil-design-eng (add motion)
→ impeccable (audit anti-patterns)
→ mcp__a11y__ (check contrast)
→ humanizer (text polish)
→ user QA
```

### For Code Review Task
```
clarify (3-5 Q)
→ code-reviewer (audit code)
→ security-review (deep security)
→ senior-frontend OR senior-backend (fix issues)
→ npm run test:e2e (verify)
→ user QA
```

### For Copy/Landing Page
```
clarify (3-5 Q)
→ design-taste-frontend (layout)
→ humanizer (all text)
→ impeccable (audit)
→ mcp__a11y__ (contrast)
→ verify (run in browser)
→ user QA
```

### For Animation Polish
```
clarify (animation specifics)
→ emil-design-eng (motion)
→ impeccable (check feel)
→ verify (browser test)
→ user QA
```

---

## ⚡ QUICK REFERENCE (By Keyword)

| Keyword | Skill(s) |
|---|---|
| button, label, text, copy | **humanizer** |
| audit, quality, anti-pattern | **impeccable** |
| design, component, ui, dashboard | **design-taste-frontend** |
| animation, motion, transition | **emil-design-eng** |
| react, frontend, hooks | **senior-frontend** |
| api, backend, database, rpc | **senior-backend** |
| next.js, routing, ssg, ssr | **nextjs-best-practices** |
| security, rls, webhook | **security-review** OR **code-reviewer** |
| code review, refactor | **code-reviewer** |
| screenshot → code | **image-to-code** |
| ui mockup | **imagegen-frontend-web** OR **imagegen-frontend-mobile** |
| contract, contrast, a11y | **mcp__a11y__are_colors_accessible** |
| tailwind, css | **mcp__tailwind__convert_css_to_tailwind** |
| icon, lucide | **mcp__universal-icons__search_icons** |
| run app, verify | **run** + **verify** |
| setup, config, env | **update-config** |
| cron, schedule | **schedule** |

---

## 🚀 USAGE EXAMPLES

### Example 1: Design a New Dashboard Widget
```
Prompt: "Design a stats widget for the Frost theme"

→ Detect: Design task
→ Ask 5 Q: scope, colors, icons, animation, layout
→ Select: design-taste-frontend (scope=widget, theme=Frost, animation=maybe)
→ Launch: /design-taste-frontend
→ QA: /impeccable → /mcp__a11y__ → /humanizer → user QA
```

### Example 2: Fix a Bug & Review Code
```
Prompt: "Fix the calendar animation stutter on Day change"

→ Detect: Code + Motion
→ Ask 5 Q: what stutter, when, device, fix approach, testing
→ Chain: code-reviewer → fix code → emil-design-eng (motion polish) → verify → user QA
```

### Example 3: Humanize All Buttons on Dashboard
```
Prompt: "Make all dashboard buttons sound natural and premium"

→ Detect: Humanizer task
→ Ask 3 Q: tone, audience, language
→ Launch: /humanizer with { tone: "premium", audience: "beauty business" }
→ Review → Apply to all button texts → QA
```

---

## ⚠️ GOLDEN RULES

1. **ALWAYS ASK CLARIFICATIONS FIRST** — 3–5 questions before skill launch
2. **HUMANIZER IS MANDATORY** — ALL UI text (except aria-label, dates, console)
3. **IMPECCABLE IS QA GATE** — Every design output must pass audit
4. **DECISION TREE HONORED** — No skill launched outside Decision Tree path
5. **CHAINS MATTER** — design-taste-frontend alone ≠ complete; add emil-design-eng + impeccable
6. **VERIFY BEFORE COMMIT** — Run app, test manually, don't trust tests alone
7. **CODE REVIEW IS NOT OPTIONAL** — All code goes through code-reviewer before main

---

**Master this catalog → Master the project 🎯**
