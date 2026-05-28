# ⚙️ ENVIRONMENT_SETUP — Complete Development Environment Configuration

**Date:** 2026-05-26  
**Version:** 8.2.2  
**Status:** ✅ Fully Configured

---

## 🎯 What's Been Set Up

### 1. **Development Hooks** ✅
Located: `C:\Users\Vitossik\SaaS\.claude\hooks\`

| Hook | Purpose | Trigger |
|---|---|---|
| `dev_rules_hook.py` | Validates IRON RULES on prompt submit | UserPromptSubmit |
| `edit_rules_hook.py` | Validates Edit/Write before execution | PreToolUse (Edit\|Write) |
| `post_edit_hook.py` | Checks encoding after file changes | PostToolUse (Edit\|Write) |
| `graphify_hook.py` | Auto-updates graph on Glob/Grep | PreToolUse (Glob\|Grep) |

**Status:** ✅ Created & Active

---

### 2. **Skills Master Catalog** ✅
File: `bookit/.claude/SKILLS_REFERENCE.md`

**Coverage:**
- **Tier 1 (Mandatory):** humanizer, code-reviewer, impeccable
- **Tier 2 (Design):** design-taste-frontend, emil-design-eng, imagegen (web/mobile)
- **Tier 3 (Code):** senior-frontend, senior-backend, nextjs-best-practices, claude-api
- **Tier 3 (Security):** security-review
- **Tier 4 (Infra):** update-config, schedule, loop
- **Tier 4 (Verification):** run, verify, review

**Total:** 30+ skills with Decision Tree, chains, examples

**Status:** ✅ Created & Indexed

---

### 3. **Enhanced settings.json** ✅
File: `bookit/.claude/settings.json`

**Enhancements:**
- **Iron Rules section:** 8 mandatory rules embedded
- **Skill Catalog:** All 30+ skills with trigger keywords, priority, chains
- **MCP Servers:** mempalace, supabase, tailwind, a11y, universal-icons
- **Graphify Config:** Auto-graph integration (optional)
- **Clarification Framework:** 5 question templates per task type (design/copy/code/animation/infra)
- **Recommended Workflows:** 6 complete skill chains (design, copy, code, animation, review, infra)
- **Guidelines:** 12 always-use rules, 3 design philosophies, 3 code philosophies
- **Permissions:** Global allowlist (npm, git, supabase), safe Write paths, blockList
- **Project Metadata:** Paths, architecture files, quick-start checklist

**Status:** ✅ Updated & Active

---

### 4. **Graphify Hooks Configuration** ✅

**How It Works:**
```
Glob/Grep tool use
  → graphify_hook.py runs silently
  → Optional: captures file patterns
  → Optional: updates GRAPH_REPORT.md

Edit/Write tool use
  → edit_rules_hook.py validates encoding
  → post_edit_hook.py logs changes
  → Optional: prepares for post-session graphify update
```

**Note:** Graphify is Obsidian-indexed; **use MemPalace + SYSTEM_MAP.md for navigation** instead.

**Status:** ✅ Configured (silent mode)

---

## 📋 QUICK START CHECKLIST

### **On Session Start**
- [ ] 1. Read `CLAUDE.md` (main instructions)
- [ ] 2. Call `mempalace_status` (palace overview)
- [ ] 3. Call `mempalace_search "query"` (find relevant drawers)
- [ ] 4. Read `XDEV/SKILL_PROTOCOL.md` (Decision Tree)
- [ ] 5. If code task: read `XDEV/AI_DEVELOPER.md` (8 iron rules)
- [ ] 6. If design task: read `XDEV/UX_STANDARDS.md` (3 themes, rules)
- [ ] 7. Review `.claude/CLARIFICATION_FRAMEWORK.md` (question templates)

### **Before Writing Code**
- [ ] 1. Clarify with user (3-5 questions)
- [ ] 2. `mempalace_search` for similar patterns
- [ ] 3. Select skill from `XDEV/SKILL_PROTOCOL.md` Decision Tree
- [ ] 4. Grep relevant files (token efficiency: read only what you need)
- [ ] 5. Code with **TypeScript strict** (no `any`)
- [ ] 6. Run: `npx tsc --noEmit && npm run build`
- [ ] 7. Run: `npm run test:e2e`
- [ ] 8. `code-reviewer` audit
- [ ] 9. Update docs: `XDEV/SYSTEM_MAP.md`, `XDEV/BOOKIT.md`, `changelog/page.tsx`
- [ ] 10. `mempalace_add_drawer` (save decision)

### **Before Creating Design**
- [ ] 1. Ask 5 clarification questions (per `.claude/CLARIFICATION_FRAMEWORK.md`)
- [ ] 2. Analyze answers + XDEV context
- [ ] 3. `mempalace_search` for design precedents
- [ ] 4. `/design-taste-frontend` (primary UI generator)
- [ ] 5. `/emil-design-eng` (if motion needed)
- [ ] 6. `/impeccable` (audit anti-patterns)
- [ ] 7. `/mcp__a11y__are_colors_accessible` (check WCAG AA/AAA)
- [ ] 8. `/humanizer` (all text labels)
- [ ] 9. `/run` → verify in browser
- [ ] 10. User QA approval
- [ ] 11. `mempalace_add_drawer` (save design decision)

---

## 🛠️ Common Commands

### **Development**
```bash
cd bookit

# Start dev server
npm run dev

# Build verification
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Tests
npm test
npm run test:e2e
```

### **Database**
```bash
# Apply migrations
npx supabase db push

# Create migration
npx supabase migration new [migration_name]
```

### **Code Quality**
```bash
# Lint single file
npx eslint src/file.tsx

# Type check
npx tsc --noEmit

# Test single file
npx vitest run src/lib/utils.test.ts
```

---

## 📂 Key File Structure

```
C:\Users\Vitossik\SaaS\
├── CLAUDE.md                        ← Main instructions
├── XDEV/
│   ├── SKILL_PROTOCOL.md           ← Decision Tree (20+ skills)
│   ├── AI_DEVELOPER.md             ← 8 Iron Rules
│   ├── UX_STANDARDS.md             ← Design rules (3 themes, No-Emoji)
│   ├── BOOKIT.md                   ← Product brief
│   ├── TASK.md                     ← Current sprint tasks
│   └── MAPS/
│       ├── SYSTEM_MAP.md           ← Architecture index
│       ├── REFERRAL_MAP.md
│       └── ...
├── bookit/
│   ├── .claude/
│   │   ├── settings.json           ← THIS FILE (master config)
│   │   ├── SKILLS_REFERENCE.md     ← All 30+ skills catalog
│   │   ├── CLARIFICATION_FRAMEWORK.md
│   │   └── hooks/
│   │       ├── dev_rules_hook.py
│   │       ├── edit_rules_hook.py
│   │       ├── post_edit_hook.py
│   │       └── graphify_hook.py
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
└── memory/
    ├── MEMORY.md                   ← Memory index
    └── [18K+ drawers]              ← MemPalace knowledge base
```

---

## 🔐 IRON RULES — Always Remember

### **Rule #-1: MemPalace MANDATORY**
```
Every session:
  1. mempalace_status (load palace)
  2. mempalace_search "query" (before decisions)
  3. mempalace_add_drawer (after important fixes)
```

### **Rule #0: Encoding Check**
```
Before Edit/Write Cyrillic files:
  Check: b'\xd0\xa0\xc2' in raw
  Never write Cyrillic in text-mode
  Reference: XDEV/ENCODING_FIX_PROMPT.md
```

### **Rule #0.5: Humanizer MANDATORY**
```
All UI text through /humanizer:
  ✅ buttons, labels, messages, copy
  ❌ aria-label, data-testid, date formats
```

### **Rule #1: QA-GATE (No Code Without Alignment)**
```
ALWAYS: clarify → plan → approval → code
Never: "I trust you, just do it" (without alignment)
```

### **Rule #2: XDEV Protocol**
```
Before ANY work:
  1. Read SKILL_PROTOCOL.md (Decision Tree)
  2. Read relevant XDEV file (AI_DEVELOPER, UX_STANDARDS, etc.)
  3. Clarify with user (3-5 questions)
  4. Select skill from Decision Tree
```

### **Rule #3: Skills Decision Tree**
```
NEVER launch skill directly
ALWAYS: Clarify → Analyze → Confirm → Launch
```

### **Rule #4: No-Emoji in UI Code**
```
❌ {service.emoji} in buttons, pills, chips
✅ Lucide React icons with style prop
✅ Wrapped: <span style={{color}}><LucideIcon /></span>
```

### **Rule #5: Full Production-Grade**
```
NEVER: "lite version" or "MVP approach"
ALWAYS: Premium quality from day 1
```

---

## 🚀 First Task Workflow

**Scenario:** User says "Design the Frost theme buttons for Task 1"

### **Step-by-Step:**

1. **Detect:** This is a design task (keywords: "design", "buttons")

2. **Clarify:** Ask 5 questions (via AskUserQuestion):
   ```
   Q1: Scope — new component, section, or full widget?
   Q2: Aesthetic — which style (premium/minimal/brutal)?
   Q3: Colors — Frost theme palette confirmed?
   Q4: Motion — animations/transitions needed?
   Q5: Priority — high-impact or polish?
   ```

3. **User Answers:** E.g., "Buttons under cards, Frost theme, large with fill, no animation, high-priority"

4. **Confirm Selection:**
   ```
   Launching /design-taste-frontend because you need 
   premium UI buttons (Frost theme, filled style). 
   Context: scope=buttons, theme=Frost, animation=no, priority=high
   ```

5. **Execute Chain:**
   ```
   design-taste-frontend → impeccable → a11y → humanizer → run → QA
   ```

6. **Post-Work:**
   ```
   ✅ npm run build (verify)
   ✅ mempalace_add_drawer (save decision)
   ✅ Update XDEV/SYSTEM_MAP.md + BOOKIT.md
   ✅ Update changelog/page.tsx
   ```

---

## 📞 Support & Questions

- **Skills unclear?** → Read `.claude/SKILLS_REFERENCE.md`
- **Decision Tree?** → Read `XDEV/SKILL_PROTOCOL.md`
- **Design rules?** → Read `XDEV/UX_STANDARDS.md`
- **Code standards?** → Read `XDEV/AI_DEVELOPER.md`
- **Clarification template?** → Read `.claude/CLARIFICATION_FRAMEWORK.md`
- **Architecture?** → Read `XDEV/MAPS/SYSTEM_MAP.md`

---

## ✅ Environment Status

| Component | Status | Location |
|---|---|---|
| **Hooks** | ✅ Created | `.claude/hooks/` |
| **Skills Catalog** | ✅ Complete | `.claude/SKILLS_REFERENCE.md` |
| **settings.json** | ✅ Enhanced | `bookit/.claude/settings.json` |
| **Graphify Config** | ✅ Active | Inside settings.json |
| **Clarification Framework** | ✅ Embedded | settings.json + file |
| **XDEV docs** | ✅ Ready | `XDEV/` folder |
| **MemPalace** | ✅ 18K+ drawers | `.claude/memory/` |

**🎉 Development environment is fully configured and ready for work!**

---

*Last updated: 2026-05-26 · Version: 8.2.2 · Protocol: XDEV + Iron Rules + MemPalace*
