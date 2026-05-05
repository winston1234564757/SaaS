# 🎯 Bookit Design & Development Skills Guide

## Auto-Selection Logic

When a task comes in, analyze keywords and automatically select the best skill(s):

```
User Request
    ↓
Extract Keywords (design, audit, build, animate, etc.)
    ↓
Match to Skill Map (settings.json skillSelection)
    ↓
Select Primary Skill (priority 1 > 2 > 3)
    ↓
Use Secondary Skills if needed
    ↓
Always End with impeccable audit (if design task)
```

---

## 🎨 Design Skills Quick Reference

### **1. IMPECCABLE** (Priority 1 for QA)
**When to use:**
- User says: "audit", "review", "polish", "critique", "quality check"
- After any design generation (run as final step)
- To catch AI patterns and generic designs
- For accessibility & hierarchy checks

**What it does:**
- 27 deterministic anti-pattern rules
- 12-rule LLM critique pass
- UX/visual hierarchy audit
- Accessibility review

**Example:**
```
User: "This dashboard looks generic, make it better"
→ /impeccable polish
```

---

### **2. DESIGN-TASTE-FRONTEND** (Priority 2 for Code)
**When to use:**
- Building UI components
- Creating pages/dashboards
- Need "metric-based, strict component architecture"
- User says: "build", "create", "design", "component"

**What it does:**
- Premium frontend code with taste
- Strict CSS architecture
- Hardware acceleration
- Balanced design engineering

**Example:**
```
User: "Build a hero section for the landing page"
→ /design-taste-frontend build
```

---

### **3. EMIL-DESIGN-ENG** (Priority 2 for Motion)
**When to use:**
- Animation needed
- Micro-interactions
- "Polish" the UI feel
- User says: "animate", "transition", "motion", "feel"

**What it does:**
- UI polish philosophy
- Animation decisions
- Micro-interactions
- Invisible details that make software feel great

**Example:**
```
User: "Add smooth transitions to the booking flow"
→ /emil-design-eng
```

---

### **4. IMAGE-TO-CODE** (Priority 2 for Conversion)
**When to use:**
- User has a design image/screenshot
- Converting mockup to code
- User says: "from this image", "screenshot", "mockup"

**What it does:**
- Analyze design images
- Generate matching code
- Pixel-perfect conversion

**Example:**
```
User: "Convert this Figma screenshot to code" [image]
→ /image-to-code
```

---

### **5. IMAGEGEN-FRONTEND-WEB** (Secondary for Web Design)
**When to use:**
- Need to generate design concepts
- Creating landing page sections
- User says: "design inspiration", "concepts", "mockups"

**What it does:**
- Generate premium website designs
- One image per section
- Composition variety
- Conversion-aware layouts

---

### **6. IMAGEGEN-FRONTEND-MOBILE** (Secondary for Mobile)
**When to use:**
- Mobile app screens
- iOS/Android UI
- User says: "mobile", "app screen", "ios", "android"

**What it does:**
- Premium mobile app concepts
- iPhone mockups
- Multi-screen consistency
- App-native design

---

### **7. MINIMALIST-UI** (Style Option)
**When to use:**
- User wants: "clean", "minimal", "editorial", "notion-like"
- Whitespace-focused design
- Restrained color palette

---

### **8. INDUSTRIAL-BRUTALIST-UI** (Style Option)
**When to use:**
- User wants: "brutal", "mechanical", "harsh", "swiss typography"
- Data-heavy dashboards
- Raw, declassified-looking UI

---

### **9. BRANDKIT** (Brand System)
**When to use:**
- Brand identity work
- Logo systems
- Color palettes
- Brand guidelines

---

## ✍️ Copywriting & Content Skills

### **HUMANIZER** (Priority 1 for Text)
**When to use:**
- Writing landing page copy
- Pricing page descriptions
- Feature descriptions
- Any project text that feels "AI-generated"
- User says: "write", "copy", "humanize", "landing", "features"

**What it does:**
- Removes AI-generated writing patterns
- Fixes: inflated symbolism, promotional language, vague attributions
- Removes: em dash overuse, passive voice, rule-of-three patterns
- Makes text sound natural and human-written
- Based on Wikipedia's "Signs of AI writing" guide

**Example:**
```
Input: "BookIT revolutionizes the beauty industry with cutting-edge booking solutions..."
→ /humanizer fix
Output: "BookIT makes it easy for beauty pros to manage bookings and clients..."
```

---

## 🔧 Code Skills

### **CODE-REVIEWER** (Priority 1)
**When to use:**
- Code review requests
- Security audit
- Quality checks
- User says: "review", "refactor", "security"

### **SENIOR-FRONTEND** (Priority 2)
**When to use:**
- React/Next.js development
- Component architecture
- Performance optimization
- Frontend-specific tasks

### **SENIOR-BACKEND** (Priority 2)
**When to use:**
- Node.js/Express development
- Database design
- API development
- Backend-specific tasks

---

## 🔌 MCP Servers (Always Available)

### **TAILWIND MCP** (Priority 1)
**When to use:**
- Suggest Tailwind utility classes
- Optimize CSS
- Check Tailwind v4 compatibility
- ALWAYS use for CSS suggestions

**Auto-trigger:**
- User asks for CSS/styles
- After code generation (verify classes)

---

### **A11Y MCP** (Priority 1)
**When to use:**
- Check color contrast
- Verify WCAG compliance
- Accessibility audit
- ALWAYS check after design color selection

**Auto-trigger:**
- After any color/background combo
- Before shipping design
- "Design System" color validation

---

### **UNIVERSAL-ICONS MCP**
**When to use:**
- Search for icons
- Find Lucide React alternatives
- Icon selection help

---

## 📊 Decision Matrix

| Task Type | Primary Skill | Secondary | MCP |
|-----------|---------------|-----------|-----|
| **Build UI component** | design-taste-frontend | imagegen-frontend-web | tailwind, a11y |
| **Audit design** | impeccable | (none) | a11y |
| **Add animation** | emil-design-eng | (none) | (none) |
| **Convert image→code** | image-to-code | design-taste-frontend | tailwind |
| **Mobile screens** | imagegen-frontend-mobile | design-taste-frontend | a11y |
| **Design review** | impeccable | (none) | a11y |
| **Code review** | code-reviewer | (none) | (none) |
| **Optimize frontend** | senior-frontend | (none) | tailwind |
| **Write/humanize text** | humanizer | (none) | (none) |
| **Landing page copy** | humanizer | design-taste-frontend | (none) |

---

## 🚀 Typical Workflows

### **Design Complete Flow**
```
1. /design-taste-frontend build
2. /impeccable polish
3. /a11y check (contrast)
4. /tailwind optimize
→ Ready to implement
```

### **Redesign Flow**
```
1. /imagegen-frontend-web create [concept]
2. /image-to-code convert
3. /impeccable audit
4. /a11y verify
5. /tailwind finalize
→ Production code
```

### **Animation Polish**
```
1. /emil-design-eng add-motion
2. /impeccable check-feel
3. Code implementation
→ Shipped
```

### **Code Review Flow**
```
1. /code-reviewer audit
2. /a11y check (if UI)
3. /senior-frontend optimize
→ Merge-ready
```

---

## ⚡ Quick Commands

```bash
# Design audit (always do this)
/impeccable audit [component]

# Build UI
/design-taste-frontend build [name]

# Polish animations
/emil-design-eng [task]

# Check contrast
/a11y check [colors]

# Optimize CSS
/tailwind optimize

# Convert image to code
/image-to-code [image]

# Code review
/code-reviewer audit [file]
```

---

## 🎯 Key Rules

1. **Always end design work with `/impeccable audit`** — no exceptions
2. **Always check colors with `/a11y`** before shipping
3. **Optimize Tailwind classes** with `/tailwind` after implementation
4. **Use `/image-to-code` for design mockups** → pixel-perfect conversion
5. **Choose style skill early** (minimal/brutalist) to guide generation
6. **Mobile-first mindset** — test all designs on mobile first

---

## 📝 Example: Complete Design Task

**User:** "Design a modern booking confirmation page for our SaaS"

**Auto-flow:**
```
1. Analyze keywords: "design", "page" → design-taste-frontend
2. /design-taste-frontend build booking-confirmation
3. /imagegen-frontend-web [section designs]
4. /image-to-code convert mockups
5. /impeccable polish [code]
6. /a11y check [colors]
7. /tailwind optimize [classes]
8. /emil-design-eng add-transitions
→ Production-ready component
```

---

## 🔄 When Skills Conflict

**Priority order:**
1. **Impeccable** — always runs last for design (quality gate)
2. **Specific style** (brutalist/minimal) — early in generation
3. **Generic taste** (design-taste-frontend) — fallback
4. **MCP a11y** — always runs before final approval

---

**Status:** ✅ Claude now self-selects skills based on context and keywords!
