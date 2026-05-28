# 🎯 Bookit Skills Guide (6 Core Skills)

> **CLEANED VERSION:** 17 → 7 skills (added UI-UX-PROMAX for elite aesthetics)

---

## 🤖 Auto-Selection Logic

When a task comes in, Claude analyzes and auto-selects:

```
User Request
    ↓
Extract Keywords (humanize, build, animate, audit, code...)
    ↓
Match to Skill Map (settings.json skillSelection)
    ↓
Select Primary Skill (Priority 1 > Priority 2)
    ↓
Use Secondary Skills if needed
    ↓
Always end design with /impeccable audit
Always end text with /humanizer check
```

---

## ✍️ Copywriting Skill

### **HUMANIZER** (Priority 1)
**Removes AI-generated writing patterns. Makes text sound natural.**

**When to use:**
- Landing page copy
- Pricing page descriptions
- Feature descriptions
- Marketing emails
- Button labels (if verbose)
- Any text that sounds "AI-generated"

**What it does:**
- Detects: inflated language, AI buzzwords, passive voice
- Removes: "revolutionize", "leverage", "empower", "unlock potential"
- Converts: passive → active voice
- Makes: corporate → conversational tone

**Examples:**
```
BEFORE: "BookIT revolutionizes booking by leveraging AI technology"
AFTER: "BookIT helps beauty pros manage bookings easily"

BEFORE: "Unlock unprecedented growth potential"
AFTER: "Earn more without the complexity"
```

**Keywords that trigger this:**
- text, copy, write, humanize, landing, pricing, features, content

---

## 🎨 Design & Audit Skills

### **IMPECCABLE** (Priority 1)
**Audits design quality. Catches anti-patterns.**

**When to use:**
- After any design generation (ALWAYS before finalizing)
- Design reviews and critiques
- Checking for AI generic patterns
- Verifying visual hierarchy
- Accessibility checks

**What it does:**
- 27 deterministic anti-pattern rules
- Detects generic AI design clichés
- Reviews visual hierarchy & contrast
- Checks spacing & alignment
- WCAG accessibility review

**Example:**
```
User: "This dashboard looks generic"
→ /impeccable polish
→ "Found: card-in-card nesting, overused fonts, weak hierarchy"
→ Suggestions for improvement
```

**Keywords:** audit, review, polish, critique, quality, design review

---

### **CODE-REVIEWER** (Priority 1)
**Reviews code quality, security, best practices.**

**When to use:**
- Before committing code
- Security audits
- Code quality checks
- Performance optimization review

**What it does:**
- Code quality analysis
- Security vulnerability detection
- Best practice verification
- Performance suggestions
- TypeScript/React patterns

**Example:**
```
User: "Review the auth context code"
→ /code-reviewer audit
→ Reports: security issues, patterns, optimizations
```

**Keywords:** review, refactor, security, quality, best practice

---

## 🚀 UI & Implementation Skills

### **DESIGN-TASTE-FRONTEND** (Priority 2 - PRIMARY for UI)
**Generates premium UI code. This is the PRIMARY design generation skill.**

**When to use:**
- Building UI components
- Creating pages/dashboards
- Implementing designs
- Need premium, polished interfaces
- User says: "build", "create", "design", "component", "ui"

**What it does:**
- Premium UI code generation (React/Next.js)
- Strict CSS architecture
- Hardware acceleration
- Metric-based design rules
- Balanced component structure

**Replaces:** imagegen-web, imagegen-mobile, high-end, minimalist, brutalist
(use design-taste + prompt for style instead)

**Example:**
```
User: "Build a modern booking form with iPhone AIR aesthetic"
→ /design-taste-frontend build
→ Generates premium UI code with Air philosophy
→ Ultra-thin, spacious, elegant
```

**Keywords:** build, create, component, design, ui, interface, dashboard, page

---

### **EMIL-DESIGN-ENG** (Priority 2)
**Animations, micro-interactions, polish. Makes UI feel premium.**

**When to use:**
- Adding animations/transitions
- Micro-interactions needed
- Polishing the "feel" of the UI
- Framer Motion implementation
- User says: "animate", "transition", "motion", "feel", "polish"

**What it does:**
- Animation decision-making
- Framer Motion code
- Micro-interactions
- Invisible details that make software feel great
- UI polish philosophy

**Example:**
```
User: "Add smooth transitions to the booking flow"
→ /emil-design-eng add-motion
→ Adds Framer Motion animations
→ Implements micro-interactions
→ Polish & feel improvements
```

**Keywords:** animate, motion, micro-interaction, transition, polish, feel

---

### **UI-UX-PROMAX** (Priority 1 - Elite Aesthetics)
**Ultimate design quality. "Parisian Atelier" & "Quiet Luxury" standards.**

**When to use:**
- High-end landing pages & dashboards
- When the user asks for "Premium", "Elite", or "Atelier" style
- Re-designing generic components into "ProMax" versions
- Applying advanced typographic pairings (Playfair + Inter)

**What it does:**
- Enforces the **Parisian Atelier** editorial aesthetic
- Implements **Quiet Luxury** principles (spaciousness, thin borders, elegance)
- Expert typography: pairs JetBrains Mono (data) with Playfair Display (headers)
- Pixel-perfect bento-grid orchestration (asymmetric, balanced)
- Advanced color theory: uses the Blossom/Studio palettes with precision

**Example:**
```
User: "Upgrade this profile card to ProMax style"
→ /ui-ux-promax audit + redesign
→ Applies: 0.5px borders, Mica-glass blur, JetBrains Mono numbers
→ Result: A high-end, gallery-grade UI element
```

**Keywords:** promax, elite, luxury, atelier, premium design, high-end

---

### **SENIOR-FRONTEND** (Priority 2)
**React/Next.js implementation, performance optimization.**

**When to use:**
- Implementing designs in code
- React component architecture
- Performance optimization
- Next.js best practices
- Frontend logic & state management

**What it does:**
- React/Next.js component scaffolding
- Performance optimization
- Bundle analysis
- Best practice patterns
- State management guidance

**Example:**
```
User: "Implement the dashboard page"
→ /senior-frontend implement
→ Uses: Server Components, React patterns, performance best practices
```

**Keywords:** frontend, react, nextjs, component, performance, implementation

---

## 🔌 MCP Servers (Always Available)

### **TAILWIND** (Priority 1)
**CSS utilities optimization for Tailwind v4.**

**When to use:**
- Suggesting CSS classes
- Optimizing styles
- Tailwind v4 compatibility
- Responsive design

**Always use for:** CSS suggestions, style optimization

---

### **A11Y** (Priority 1)
**Color contrast checks, WCAG accessibility.**

**When to use:**
- After color selection
- Design finalization
- Accessibility verification

**Always use:** Before finalizing any design with colors

---

### **UNIVERSAL-ICONS** (Priority 2)
**Icon search and selection from universal icon sets.**

**When to use:**
- Finding icons
- Icon selection suggestions
- Lucide React alternatives

---

## 📊 Decision Matrix

| Task | Primary Skill | Secondary | MCP |
|------|---------------|-----------|-----|
| **Humanize text** | humanizer | (none) | (none) |
| **Build UI component** | design-taste-frontend | emil-design-eng | tailwind, a11y |
| **Add animations** | emil-design-eng | (none) | (none) |
| **Implement React** | senior-frontend | (none) | tailwind |
| **Audit design** | impeccable | (none) | a11y |
| **Review code** | code-reviewer | (none) | (none) |
| **Check colors** | a11y MCP | (none) | (none) |
| **Optimize CSS** | tailwind MCP | (none) | (none) |
| **Find icons** | universal-icons MCP | (none) | (none) |

---

## 🎯 Typical Workflows

### **Humanize Landing Page Copy**
```
1. Write draft
2. /humanizer remove-AI-patterns
3. Review natural text
4. QA with user
→ Production copy
```

### **Build Premium Dashboard**
```
1. /design-taste-frontend build [dashboard]
2. /emil-design-eng add-motion (optional)
3. /impeccable audit
4. /a11y check [colors]
5. /tailwind optimize
6. QA with user
→ Production code
```

### **Code Review & Optimize**
```
1. /code-reviewer audit [file]
2. Fix issues
3. /senior-frontend optimize
4. Final review
→ Ready to merge
```

### **Design + Copy Complete Page**
```
1. /humanizer fix [copy]
2. /design-taste-frontend build [design]
3. /impeccable audit
4. /a11y verify
5. /tailwind optimize
→ Production page
```

---

## ⚡ Quick Command Reference

```bash
# Copywriting
/humanizer [text]                  # Humanize text

# Design
/design-taste-frontend build       # Build UI
/emil-design-eng add-motion        # Add animations
/impeccable audit                  # Audit design

# Code
/code-reviewer audit [file]        # Review code
/senior-frontend implement         # React implementation

# A11y & CSS
/a11y check [colors]               # Check contrast
/tailwind optimize [classes]       # Optimize CSS
```

---

## 🎪 Important Notes

### **NO MANUAL SELECTION NEEDED**
Claude auto-selects skills based on keywords. You don't need to type `/design-taste-frontend` — just say "Build a hero section" and Claude knows!

### **ALWAYS AUDIT**
- Design tasks → `/impeccable audit` (ALWAYS!)
- Text tasks → `/humanizer` (ALWAYS!)
- Code → `/code-reviewer` (ALWAYS!)

### **CHAIN SKILLS**
Many workflows use 3-4 skills in sequence:
```
humanizer → design-taste-frontend → impeccable → a11y → tailwind
```

### **MCP HELPERS**
Use MCP servers for specific, focused tasks:
- tailwind: when generating CSS
- a11y: when selecting colors
- universal-icons: when finding icons

---

## ✨ Key Differences from Old Version

| Old (17 Skills) | New (6 Skills) | Benefit |
|-----------------|---------------|----|
| 6 design skills | 1 PRIMARY (design-taste) | No confusion |
| image-gen only | design-taste (code) | Actionable |
| Multiple audit | 1 audit (impeccable) | Clear QA |
| Complex routing | Simple keywords | Fast selection |
| Conflicts | No overlaps | High accuracy |

---

**READY TO USE THESE 6 SKILLS EFFECTIVELY!** 🚀
