# 📊 SKILLS AUDIT — Детальний аналіз & Cleanup Plan

> **СТАТУС:** Видалення 10 skills, залишення 6 (+ 3 MCPs)
> **Мета:** Убрати confusion, зробити Claude більш точним

---

## ✅ FINAL DECISION: 6 Skills to Keep

### **1. humanizer** (Priority 1 - Copywriting)
- ✅ ЗАЛИШИТИ — crítico для гуманізації всіх текстів
- Нема конфліктів
- Основа для landing, pricing, features, copy

### **2. impeccable** (Priority 1 - Design Audit)
- ✅ ЗАЛИШИТИ — критичний для качества дизайну
- Нема конфліктів
- Audit gate перед кожною фіналізацією

### **3. code-reviewer** (Priority 1 - Code Quality)
- ✅ ЗАЛИШИТИ — безпека та якість коду
- Спеціалізований на code review
- Нема конфліктів з іншими

### **4. design-taste-frontend** (Priority 2 - UI Generation)
- ✅ ЗАЛИШИТИ — PRIMARY skill для дизайну
- Генерує premium UI код
- Замінює: imagegen-web, imagegen-mobile, high-end, minimalist, brutalist

### **5. emil-design-eng** (Priority 2 - Animations)
- ✅ ЗАЛИШИТИ — animations, micro-interactions, feel
- Критично для Framer Motion
- Замінює: gpt-taste

### **6. senior-frontend** (Priority 2 - Implementation)
- ✅ ЗАЛИШИТИ — React/Next.js, performance optimization
- Для implementation логіки
- Нема конфліктів

---

## ❌ FINAL DECISION: 10 Skills to Remove

| # | Skill | Чому видалити | Замінюється на |
|----|-------|--------------|-----------------|
| 1 | **image-to-code** | Рідко потрібна, замість цього: design-taste це вже робить | design-taste-frontend |
| 2 | **imagegen-frontend-web** | Генерує ЛИШЕ images, не код → confusion | design-taste-frontend |
| 3 | **imagegen-frontend-mobile** | Генерує ЛИШЕ images, не код → confusion | design-taste-frontend |
| 4 | **minimalist-ui** | Дублює design-taste (можна через prompt) | design-taste-frontend |
| 5 | **industrial-brutalist-ui** | Дублює design-taste для темної теми | design-taste-frontend |
| 6 | **high-end-visual-design** | 100% дублює design-taste-frontend | design-taste-frontend |
| 7 | **gpt-taste** | Дублює emil-design-eng для motion | emil-design-eng |
| 8 | **brandkit** | Не пріоритет для BookIT зараз | (відложити) |
| 9 | **stitch-design-taste** | Занадто абстрактна для поточних потреб | (відложити) |
| 10 | **senior-backend** | Backend розробка не потрібна | (видалити) |

---

## 🔌 MCPs: All 3 Stay

```
✅ tailwind       (CSS utilities)
✅ a11y           (Color contrast, WCAG)
✅ universal-icons (Icon search)
```

---

## 🎯 Impact Analysis

### **Було (17 skills)**
```
humanizer, impeccable, code-reviewer,
design-taste-frontend, emil-design-eng, image-to-code, senior-frontend,
imagegen-frontend-web, imagegen-frontend-mobile,
minimalist-ui, industrial-brutalist-ui, high-end-visual-design, gpt-taste,
brandkit, stitch-design-taste, senior-backend
→ CONFUSION: 6 skills генерують дизайн, Claude не знає який обрати
```

### **Буде (6 skills)**
```
humanizer, impeccable, code-reviewer,
design-taste-frontend, emil-design-eng, senior-frontend
→ CLARITY: 1 PRIMARY skill для UI (design-taste-frontend)
```

---

## 📋 Cleanup Checklist

### **Step 1: Update TASK.md**
```
[ ] Змінити "17 Skills" → "6 Skills" 
[ ] Видалити всі imagegen, minimalist, brutalist, high-end, gpt, brandkit, stitch
[ ] Видалити image-to-code из Quick Reference
[ ] Видалити senior-backend
```

### **Step 2: Update settings.json**
```
[ ] Видалити skillSelection entries для 10 skills
[ ] Залишити: humanizer, impeccable, code-reviewer, design-taste-frontend, emil-design-eng, senior-frontend
```

### **Step 3: Update SKILL_GUIDE.md**
```
[ ] Видалити sections для 10 skills
[ ] Update decision matrix (fewer rows)
```

### **Step 4: Update CLAUDE.md**
```
[ ] Змінити "17 Skills" → "6 Skills"
[ ] Видалити skillы зі списку
```

### **Step 5: Update HUMANIZER_GUIDE.md**
```
[ ] Немає змін потрібно (файл про humanizer, не про design skills)
```

### **Step 6: Remove from Global Skills**
```bash
[ ] npx skills remove image-to-code --global
[ ] npx skills remove imagegen-frontend-web --global
[ ] npx skills remove imagegen-frontend-mobile --global
[ ] npx skills remove minimalist-ui --global
[ ] npx skills remove industrial-brutalist-ui --global
[ ] npx skills remove high-end-visual-design --global
[ ] npx skills remove gpt-taste --global
[ ] npx skills remove brandkit --global
[ ] npx skills remove stitch-design-taste --global
[ ] npx skills remove senior-backend --global
```

### **Step 7: Git Commit**
```bash
[ ] git add -A
[ ] git commit -m "Cleanup: Remove 10 duplicate/conflicting skills, keep 6 core skills"
```

---

## 🎯 Benefits After Cleanup

✅ **Clarity** — Claude знає точно який skill обрати
✅ **Speed** — Менше confusion, більш швидкі рішення
✅ **Quality** — Меньше помилок від conflicting skills
✅ **Focus** — 6 skills для чітких задач:
  - humanizer → copy
  - design-taste-frontend → UI
  - emil-design-eng → animations
  - impeccable → audit
  - code-reviewer → code quality
  - senior-frontend → implementation

---

## 📊 Skills Summary

```
KEEP (6):
  ✅ humanizer              (Priority 1 - Copywriting)
  ✅ impeccable             (Priority 1 - Audit)
  ✅ code-reviewer          (Priority 1 - Code Quality)
  ✅ design-taste-frontend  (Priority 1 - UI Generation)
  ✅ emil-design-eng        (Priority 2 - Animations)
  ✅ senior-frontend        (Priority 2 - Implementation)

MCP KEEP (3):
  ✅ tailwind
  ✅ a11y
  ✅ universal-icons

REMOVE (10):
  ❌ image-to-code
  ❌ imagegen-frontend-web
  ❌ imagegen-frontend-mobile
  ❌ minimalist-ui
  ❌ industrial-brutalist-ui
  ❌ high-end-visual-design
  ❌ gpt-taste
  ❌ brandkit
  ❌ stitch-design-taste
  ❌ senior-backend
```

---

**Готово до cleanup?** 🚀
