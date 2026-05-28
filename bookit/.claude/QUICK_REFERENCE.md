# ⚡ QUICK REFERENCE — Speed Guide for Daily Work

**Print this. Pin it. Use it every day.**

---

## 🚀 SESSION START (60 seconds)

```
1. mempalace_status              # Load palace
2. Read CLAUDE.md                # Main rules  
3. Read XDEV/SKILL_PROTOCOL.md   # Decision Tree
4. Ask user 3-5 clarifying Qs    # (per CLARIFICATION_FRAMEWORK.md)
5. Select skill from Decision Tree
6. Launch skill with context
7. Code → test → docs → mempalace_add_drawer
```

---

## 🎯 SKILL SELECTION — Decision Tree (Ultra-Fast)

| Task Type | Skill | Why | Chain |
|---|---|---|---|
| **Design UI** | design-taste-frontend | Primary generator | → emil-design-eng → impeccable → humanizer |
| **Audit Design** | impeccable | Anti-pattern check | Standalone |
| **All Text/Copy** | humanizer | Make it natural | Every time |
| **Code Review** | code-reviewer | Quality gate | → security-review (if security) |
| **Animation** | emil-design-eng | Motion polish | Standalone |
| **React/Next** | senior-frontend | Component impl | With code-reviewer |
| **Backend/API** | senior-backend | Server logic | With code-reviewer |
| **Screenshot→Code** | image-to-code | Convert mockup | Standalone |
| **Color Contrast** | mcp__a11y__ | WCAG check | After colors |
| **Icons** | mcp__universal-icons__ | Find icon | When needed |
| **Tailwind** | mcp__tailwind__ | CSS optimize | When needed |
| **Config/Setup** | update-config | settings.json | Standalone |
| **Cron/Schedule** | schedule | Recurring tasks | Standalone |
| **Run App** | run | Dev server | Before verify |
| **Verify Fix** | verify | Manual test | After code |
| **PR Review** | review | Pull request | Standalone |

---

## 📋 CLARIFICATION TEMPLATES (Copy-Paste)

### **Design Task (5 Q)**
```
1. Scope — new component, section, page, or dashboard widget?
2. Aesthetic — premium minimalist / brutal harsh / warm editorial?
3. Colors — which theme (Blossom/Studio/Frost) or custom?
4. Motion — animations needed? (yes/no/maybe)
5. Priority — high-impact feature or polish?
```

### **Copy Task (5 Q)**
```
1. Type — button label / description / landing / message / error?
2. Tone — professional / playful / urgent / friendly / premium?
3. Audience — beauty pros / clients / both / B2B / B2C?
4. Constraints — max length / banned words / SEO focus?
5. Context — UI / marketing / notification / email?
```

### **Code Task (5 Q)**
```
1. Focus — performance / security / architecture / quality?
2. Scope — single file / component / feature / system?
3. Context — what's the issue or desired outcome?
4. Severity — critical bug / tech debt / improvement?
5. Output — code fix / audit report / refactor plan?
```

### **Animation Task (5 Q)**
```
1. Type — entrance / exit / state change / scroll?
2. Feel — snappy / bouncy / smooth / elegant?
3. Scope — single element / complex sequence?
4. Devices — desktop / mobile / both?
5. Performance — smooth on low-end devices?
```

---

## ⚡ WORKFLOWS (Proven Chains)

### **Complete Design Workflow**
```
clarify (5Q) 
→ mempalace_search
→ design-taste-frontend (build UI)
→ emil-design-eng (if motion='yes')
→ impeccable (audit)
→ mcp__a11y__ (contrast check)
→ humanizer (text polish)
→ run (browser test)
→ user QA
→ mempalace_add_drawer
```

### **Complete Code Workflow**
```
clarify (5Q)
→ mempalace_search  
→ code-reviewer (audit)
→ [fix code]
→ npm run build
→ npm run test:e2e
→ (if security critical: security-review)
→ user QA
→ Update SYSTEM_MAP.md + BOOKIT.md
→ mempalace_add_drawer
```

### **Copy Workflow**
```
clarify (5Q)
→ /humanizer { tone, audience, type }
→ Review output
→ User approval
→ Apply to UI
→ Update file
```

---

## 🔒 IRON RULES (8 Absolute Rules)

| # | Rule | Example |
|---|---|---|
| #-1 | MemPalace: status → search → drawer | `mempalace_status` on wake-up |
| #0 | Encoding check on Cyrillic Edit/Write | Check `b'\xd0\xa0\xc2'` before writing |
| #0.5 | All UI text via /humanizer | Button copy → /humanizer → file |
| #1 | QA-GATE: clarify → plan → approve → code | Never code without user alignment |
| #2 | XDEV protocol | Read SKILL_PROTOCOL.md before work |
| #3 | Skills Decision Tree | Never launch skill directly |
| #4 | No-Emoji in UI code | `<span style={{color}}><LucideIcon/></span>` |
| #5 | Full production-grade | Never lite/MVP; always premium |

---

## ✅ POST-CHANGE CHECKLIST (After Every Work)

- [ ] `npx tsc --noEmit` (TypeScript strict)
- [ ] `npm run build` (Next.js verify)
- [ ] `npm run test:e2e` (E2E tests)
- [ ] `mempalace_add_drawer` (save decision)
- [ ] Update `XDEV/SYSTEM_MAP.md` (arch sync)
- [ ] Update `XDEV/BOOKIT.md` (product sync)
- [ ] Update `changelog/page.tsx` (user-facing log)
- [ ] `git commit` with Co-Authored-By

---

## 🎨 THEME TOKENS (Frost Example)

```css
/* Frost Theme (Ice Lavender) */
--background: #EFF2FF
--accent: #0F172A (slate)
--accent-on: #F8FAFC
--text-primary: #0F172A
--text-secondary: #475569
--text-tertiary: rgba(15, 23, 42, 0.45)
--hero-card-bg: #0F172A
--btn-primary-bg: #0F172A
--surface: rgba(218, 226, 255, 0.90)

/* Same for Blossom + Studio (3 complete theme sets in globals.css) */
```

---

## 🛠️ COMMON COMMANDS (Aliases)

```bash
# Quick build
npm run build

# Quick test
npm test

# E2E full
npm run test:e2e

# Dev server
npm run dev

# Type check
tsc --noEmit

# Lint
npm run lint

# Database push
npx supabase db push

# Create migration
npx supabase migration new [name]
```

---

## 📂 KEY FILES (Bookmarks)

| File | Purpose | Read When |
|---|---|---|
| `CLAUDE.md` | Main instructions | Start of session |
| `.claude/SKILLS_REFERENCE.md` | All 30+ skills | Picking a skill |
| `.claude/ENVIRONMENT_SETUP.md` | Setup guide | First time / debug |
| `XDEV/SKILL_PROTOCOL.md` | Decision Tree | Choosing skill |
| `XDEV/AI_DEVELOPER.md` | 8 Iron Rules | Before coding |
| `XDEV/UX_STANDARDS.md` | Design rules | Before design |
| `XDEV/BOOKIT.md` | Product brief | Understanding features |
| `XDEV/SYSTEM_MAP.md` | Architecture | Before implementation |
| `XDEV/TASK.md` | Current tasks | Planning sprint |
| `.claude/CLARIFICATION_FRAMEWORK.md` | Question templates | Before skill |

---

## 🎯 DECISION TREE (Ultra-Compressed)

```
DESIGN?       → design-taste-frontend (→ emil-design-eng → impeccable)
COPY?         → humanizer
CODE?         → code-reviewer (→ security-review if needed)
ANIMATION?    → emil-design-eng
AUDIT?        → impeccable
SCREENSHOT?   → image-to-code
SETUP/CONFIG? → update-config
CRON?         → schedule
RUN APP?      → run
TEST?         → npm run test:e2e
```

---

## 💡 PRO TIPS

1. **Always mempalace_search BEFORE deciding** — there's probably a drawer with the answer
2. **Clarifications first, code never second** — 5 minutes of Q&A saves 2 hours of rework
3. **Humanizer is mandatory** — copy through it, always, no exceptions
4. **Impeccable catches what eyes miss** — always run design through it
5. **Build + test before commit** — broken builds waste everyone's time
6. **MemPalace is your memory** — save patterns, decisions, lessons
7. **XDEV is truth** — when in doubt, read the relevant XDEV file

---

## 🚨 COMMON MISTAKES (Avoid These)

| Mistake | Why It's Bad | Fix |
|---|---|---|
| Skip clarifications | Misaligned implementation | Always ask 3-5 Q first |
| Launch skill directly | Wrong skill picks | Use Decision Tree |
| Copy without humanizer | Cheap-sounding UI | ALWAYS /humanizer |
| Design without impeccable | Anti-patterns slip through | Always audit |
| Code without code-reviewer | Quality suffers | Always review |
| Skip npm run build | Broken prod builds | Always build verify |
| Forget mempalace_add_drawer | Knowledge lost | Save every decision |
| Edit Cyrillic without encoding check | Mojibake corruption | Check encoding first |

---

**Bookmark this file. Reference it every day. Master it, master the project.**

*Last updated: 2026-05-26 · Version: 8.2.2*
