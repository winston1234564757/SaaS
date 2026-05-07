# 🎯 Clarification Framework — Smart Skill Selection via Questions

> **Нова система:** Замість простої keyword-селекції, Claude задає **3-5 уточнювальних питань** перед запуском скіла, щоб точно зрозуміти потребу.

---

## 🔄 Workflow: Prompt → Questions → Skill Selection → Execution

```
1️⃣ Користувач дає промт
   "Зробити темну тему для дашборду"
   
2️⃣ Claude НЕ запускає скіл одразу
   
3️⃣ Claude задає уточнення (3-5 питань)
   → Область: які сторінки?
   → Стиль: Brutal Studio?
   → Анімація: Так/ні?
   → Кольори: своя палітра?
   
4️⃣ Користувач відповідає
   
5️⃣ Claude вирахує точний скіл + параметри
   
6️⃣ Запускає skill з контекстом
   
7️⃣ QA сесія з користувачем
```

---

## 📋 Clarification Templates by Category

### **🎨 DESIGN TASKS** (design-taste-frontend + emil-design-eng)

**Trigger Keywords:** build, create, design, component, page, interface, dashboard, ui, theme, dark mode, light mode, redesign

**Clarification Questions:**

```
Q1: SCOPE (Область)
   "Який компонент/сторінку ми будуємо?"
   - Single component (button, card, input)?
   - Single page (dashboard, settings)?
   - Multi-page feature?
   - Full redesign theme?

Q2: AESTHETIC (Стиль)
   "Який вишуканий стиль?"
   - ☀️ iPhone AIR (light, ultra-thin, air)
   - 🌙 Brutal Studio (dark, rugged, masculine)
   - Custom pallete (своя палітра)?

Q3: COLOR PALETTE (Кольори)
   "Якщо custom — назви 3-4 основні кольори або скажи 'використовувати систему'"
   - Brand colors?
   - Accent colors?
   - Use BookIT default? (#FFE8DC peach + #789A99 sage)

Q4: MOTION & FEEL (Анімація)
   "Потрібні анімації?"
   - None (static)
   - Subtle transitions (feeling)
   - Playful micro-interactions (5/10 intensity)
   - Dramatic animations (7/10)

Q5: PRIORITY (Невідкладність)
   "Коли потрібно?"
   - ASAP (today)
   - This week
   - Next week
   - Future (plan)
```

**Example Flow:**
```
User: "Побудувати темний дашборд"

Claude:
Q1: Це редизайн всього дашборду чи певні карточки?
Q2: Brutal Studio стиль?
Q3: Яка палітра? (Своя чи дефолт?)
Q4: Хочеш анімацій переходу?
Q5: Коли потрібно?

User answers → Claude: "Запускаю /design-taste-frontend з Brutal Studio prompt + emil-design-eng для motion"
```

---

### **✍️ COPY/HUMANIZER TASKS** (humanizer)

**Trigger Keywords:** text, copy, write, humanize, landing, pricing, features, description, content, message, button, label

**Clarification Questions:**

```
Q1: TYPE OF COPY (Тип тексту)
   "Який текст гуманізуємо?"
   - Landing page hero?
   - Pricing descriptions?
   - Feature descriptions?
   - Button labels?
   - Error/success messages?
   - Email/Telegram copy?

Q2: TONE (Тон голосу)
   "Якой тон?"
   - Professional (ділова, офіційна)
   - Conversational (дружня, розмовна)
   - Playful (легка, веселка)
   - Premium (дороговизна, вибір)

Q3: AUDIENCE (Аудиторія)
   "Для кого?"
   - Masters (НГ професіонали)
   - Clients (клієнти салону)
   - Both?

Q4: CONSTRAINTS (Обмеження)
   "Які бренд-терміни зберегти?"
   - "BookIT" - обов'язково?
   - Специфічні терміни?
   - Уникати якихось слів?

Q5: LENGTH (Довжина)
   "Формат?"
   - 1-2 слова (labels)
   - Sentence (one line)
   - Paragraph (2-3 рядки)
   - Full description (paragraph+)
```

**Example Flow:**
```
User: "Гуманізуй опис тарифу"

Claude:
Q1: Який тариф? (Starter, Pro, Studio?)
Q2: Яка палітра тону? (premium чи дружній?)
Q3: Для майстрів чи клієнтів?
Q4: "BookIT" зберегти обов'язково?
Q5: Деталізовано чи коротко?

User answers → Claude: "Запускаю /humanizer з контекстом + QA сесія"
```

---

### **🔍 CODE REVIEW TASKS** (code-reviewer)

**Trigger Keywords:** review, refactor, security, quality, best practice, audit code, check, fix

**Clarification Questions:**

```
Q1: FOCUS (Фокус)
   "Що нас турбує?"
   - Security (безпека)
   - Performance (швидкість)
   - Code quality (чистота)
   - Patterns (архітектура)
   - All (комплекс)?

Q2: SCOPE (Обсяг)
   "Що рев'ювимо?"
   - Single file?
   - Module/folder?
   - Specific function?
   - Full feature?

Q3: CONTEXT (Контекст)
   "Якої області коду?"
   - Auth flow?
   - Booking logic?
   - Dashboard UI?
   - Database queries?
   - Other?

Q4: SEVERITY (Важливість)
   "Яка критичність?"
   - Blocker (не чекаємо)
   - High (ASAP)
   - Medium (this week)
   - Polish (nice to have)

Q5: OUTPUT (Формат)
   "Як виводити результат?"
   - Report + suggestions
   - Fixed code
   - Optimization hints
   - Architecture notes
```

---

### **🎬 ANIMATION/MOTION TASKS** (emil-design-eng)

**Trigger Keywords:** animate, motion, transition, micro-interaction, polish, feel, smooth

**Clarification Questions:**

```
Q1: COMPONENT (Компонент)
   "Який елемент анімуємо?"
   - Button interactions
   - Page transitions
   - List animations
   - Modal/drawer entry
   - Other?

Q2: FEEL (Відчуття)
   "Яке відчуття треба?"
   - Subtle (не кидається в очі)
   - Playful (веселка, видима)
   - Dramatic (спектакульна)
   - Tactile (дотиковий feedback)

Q3: TRIGGER (Спусок)
   "Коли анімація спрацює?"
   - On load (при відкритті)
   - On hover (при наведенні)
   - On click (при клікі)
   - On scroll (при скролі)
   - Other?

Q4: DURATION (Тривалість)
   "Як швидко?"
   - Fast (200-300ms)
   - Normal (300-500ms)
   - Slow (500-1000ms)

Q5: INTENSITY (Інтенсивність)
   "На скільки помітна?"
   - Invisible (не видна, але відчувається)
   - Subtle (3/10)
   - Medium (5/10)
   - High (7/10)
```

---

## 🤖 Claude's Auto-Clarification Logic

### **Step 1: Keyword Detection**
```javascript
const keywords = prompt.toLowerCase().split(' ');
const taskType = matchToCategory(keywords);
// taskType = 'design' | 'copy' | 'code' | 'animation' | 'mixed'
```

### **Step 2: Load Clarification Template**
```javascript
const questions = CLARIFICATION_TEMPLATES[taskType];
// questions = array of 5 questions
```

### **Step 3: Present Questions**
```
Claude: "Ясно! Допоможу побудувати [X]. 
Кілька уточнень (2 хв):"

[AskUserQuestion with 5 options]
```

### **Step 4: Analyze Answers**
```javascript
const context = {
  scope: answers.Q1,
  style: answers.Q2,
  colors: answers.Q3,
  motion: answers.Q4,
  priority: answers.Q5
};
```

### **Step 5: Skill Selection**
```javascript
const selectedSkill = calculateSkill(context);
// Наприклад:
// design + Brutal Studio + animation → design-taste-frontend + emil-design-eng
// copy + conversational → humanizer
// code + security → code-reviewer
```

### **Step 6: Launch Skill**
```
Claude: "Запускаю /[skill] з параметрами: [context]"

// Executes skill with full context
/design-taste-frontend build
  scope: "dark dashboard"
  style: "Brutal Studio"
  colors: custom
  motion: "yes"
```

### **Step 7: Deliver + QA**
```
Claude: "Готово! Давай перевіримо результат:
- Дизайн відповідає Brutal Studio? ✓
- Анімація помітна? ✓
- Контраст OK? /a11y check
- Готово для Вітос QA?"
```

---

## 📊 Mapping Answers to Skill Parameters

### **Design Context → Skill Parameters**

| Q Answer | Maps To | Skill Parameter |
|----------|---------|-----------------|
| Single component | scope=component | design-taste-frontend: component=true |
| Full page | scope=page | design-taste-frontend: page=true |
| iPhone AIR | style=light | design-taste-frontend: aesthetic="air" |
| Brutal Studio | style=dark | design-taste-frontend: aesthetic="brutal" |
| Custom colors | palette=custom | /a11y check after selection |
| Yes animations | motion=true | emil-design-eng: enabled=true |
| Fast 200ms | duration=fast | Framer Motion: duration: 0.2 |

### **Copy Context → Skill Parameters**

| Q Answer | Maps To | Skill Parameter |
|----------|---------|-----------------|
| Landing hero | type=landing | humanizer: context="landing" |
| Pricing | type=pricing | humanizer: context="pricing" |
| Professional | tone=professional | humanizer: tone="professional" |
| Conversational | tone=conversational | humanizer: tone="conversational" |
| Masters audience | audience=master | humanizer: audience="master" |
| Brief label | length=short | humanizer: maxLength=10 |

---

## 🎯 When to Skip Clarifications

- **Simple fixes**: "Fix typo in line 45"
- **Clear direction**: "Build booking form exactly like [screenshot]"
- **Follow-up to answered Q**: "Yes, add more motion" (already clarified before)
- **Pure code**: "Implement this function" (if spec is clear)

**Default**: When in doubt, ask clarifications.

---

## ✅ Quality Gate After Clarifications

After user answers, Claude ALWAYS:

1. ✓ Summarize understood context
2. ✓ Confirm skill selection
3. ✓ Show expected output
4. ✓ Ask for last tweaks before launching

```
Claude: "Зрозумів:
- Редизайн: Dark Dashboard
- Стиль: Brutal Studio
- Палітра: Custom (темне + gold)
- Анімація: Smooth transitions
- Скіл: /design-taste-frontend (Brutal prompt)
     + /emil-design-eng (transition polish)

Запускаю зараз. OK?"
```

---

## 📝 Example: Complete Flow

```
User: "Зробити темну тему"

Claude (CLARIFICATION PHASE):
[Shows 5 questions with AskUserQuestion]

Q1: Яку область редизайнимо? (dashboard, settings, all pages?)
Q2: Brutal Studio чи своя палітра?
Q3: Які основні кольори?
Q4: Анімація потрібна?
Q5: Коли готово?

User answers:
- Dashboard only
- Brutal Studio
- Deep charcoal + gold accents
- Yes, smooth transitions
- ASAP

Claude (SKILL SELECTION):
"Запускаю для DashboardDarkTheme:
- /design-taste-frontend build
  aesthetic: brutal
  palette: { primary: #1a1a1a, accent: #d4a574 }
- /emil-design-eng add-motion
  duration: 300ms
  intensity: 5/10"

[Generates code]

Claude (QA GATE):
"Результат готовий! Давай перевіримо:
- Brutal відчуття? ✓
- Контраст WCAG AA? /a11y check
- Анімація smooth?
- Готово для проду?"

User QA feedback → Iterate or Accept
```

---

**ГОТОВО ВПРОВАДЖУВАТИ! 🚀**
