# 📝 Humanizer Guide — Make All Text Sound Natural

> **FOR BOOKIT:** Use humanizer on ALL text content: landing page, pricing, features, marketing, etc.

---

## 🎯 What Humanizer Does

**Removes signs of AI-generated writing** and makes text sound natural, authentic, and human-written.

### **Detects & Fixes:**

| AI Pattern | What It Looks Like | Fixed Version |
|-----------|-------------------|--------------|
| **Inflated symbolism** | "revolutionizes", "cutting-edge", "game-changing" | "helps", "makes it easy", "improves" |
| **Promotional language** | "unlock potential", "maximize revenue", "empower" | "grow your business", "earn more" |
| **Vague attributions** | "Many believe...", "It is said..." | Specific facts, direct voice |
| **Passive voice** | "can be optimized", "is considered" | "you can optimize", "we think" |
| **Em dash overuse** | Too many — like this — in text | Remove unless necessary |
| **Rule of three** | "Easy, Fast, Reliable" | Mix it up |
| **AI vocabulary** | "streamline", "leverage", "synergy", "ecosystem" | Natural words users actually say |
| **Filler phrases** | "It is important to note...", "In conclusion..." | Skip it |
| **Awkward transitions** | Clunky sentence connections | Smooth, natural flow |

---

## 🚀 Humanizer Workflow for BookIT

### **Step 1: Write the Draft**
Write naturally or let AI draft it. Don't worry about perfection.

```
Input (rough AI draft):
"BookIT revolutionizes the beauty industry by leveraging 
cutting-edge technology to empower masters and unlock 
unprecedented revenue potential through intelligent booking 
optimization."
```

### **Step 2: Run Humanizer**
```bash
/humanizer [paste your text]
```

### **Step 3: Humanizer Outputs**
```
ANALYSIS:
✗ "revolutionizes" — inflated symbolism
✗ "leveraging" — AI vocabulary (remove)
✗ "empower" — overused promotional word
✗ "unlock unprecedented" — cliché pattern
✗ "intelligent booking optimization" — vague, jargony

FIXED VERSION:
"BookIT helps beauty pros manage bookings and attract more 
clients. Masters earn more without the headache of juggling 
schedules and rescheduled appointments."
```

### **Step 4: Review & QA**
- ✅ Does it sound like a real person wrote it?
- ✅ Is it clear and specific?
- ✅ Does it speak to the user's pain point?
- ✅ No AI buzzwords?

### **Step 5: Finalize**
Accept humanizer's suggestions or tweak further.

---

## 📍 Where to Humanize in BookIT

### **PRIORITY 1 (Always Humanize)**
- ✅ **Landing page hero** — "Help beauty pros book smarter"
- ✅ **Pricing page** — Feature descriptions, benefit statements
- ✅ **Onboarding flow** — Step descriptions, welcome messages
- ✅ **Marketing emails** — Subject lines, body copy
- ✅ **Feature descriptions** — "What does this do?"

### **PRIORITY 2 (Usually Humanize)**
- ✅ **Feature cards** — "Manage clients better"
- ✅ **Error messages** — Make friendly, not robotic
- ✅ **Empty states** — "You haven't created any services yet"
- ✅ **Help text** — Tooltips, guidance
- ✅ **Button labels** — If they're verbose

### **PRIORITY 3 (Sometimes)**
- ⚠️ **System messages** — Some can be technical
- ⚠️ **Data labels** — "Customer Name" stays as-is
- ⚠️ **Numbers/prices** — Keep exact

---

## 💡 Examples by Section

### **Landing Page Hero**

**Before:**
```
"BookIT leverages intelligent algorithms to revolutionize 
the beauty industry by empowering masters with cutting-edge 
booking solutions that unlock unprecedented growth potential."
```

**After Humanizer:**
```
"BookIT helps beauty pros spend less time on admin 
and more time earning."
```

---

### **Pricing Page Feature List**

**Before:**
```
- Optimize your scheduling with advanced AI-powered insights
- Leverage real-time client analytics to maximize revenue
- Streamline your business operations with intelligent automation
```

**After Humanizer:**
```
- See who your best clients are
- Spot busy times and slow periods
- Save hours on scheduling
```

---

### **Onboarding Step Descriptions**

**Before:**
```
"Create your professional profile to establish your presence 
in the digital marketplace and maximize discoverability."
```

**After Humanizer:**
```
"Set up your profile so clients can find you."
```

---

### **Feature Card**

**Before:**
```
"This feature enables seamless synchronization of your 
appointment calendar across multiple platforms, facilitating 
optimal coordination and eliminating scheduling conflicts."
```

**After Humanizer:**
```
"Keep your schedule in sync across all your tools. 
No double-bookings."
```

---

## 🎯 Humanizer Best Practices

### **✅ DO:**
1. ✅ Humanize EVERYTHING visible to users
2. ✅ Use simple, everyday words
3. ✅ Be specific: "earn more" vs "maximize revenue"
4. ✅ Use active voice: "you can" vs "can be"
5. ✅ Write like you're talking to a friend
6. ✅ Show benefits, not features: "save time" not "time-saving solution"
7. ✅ Use short sentences
8. ✅ Be honest: "good" not "best" (unless true)

### **❌ DON'T:**
1. ❌ Use AI buzzwords: "leverage", "synergy", "ecosystem", "revolutionize"
2. ❌ Overuse promotion: "unlock", "empower", "cutting-edge"
3. ❌ Use passive voice: "can be managed" → "you can manage"
4. ❌ Write long, complex sentences
5. ❌ Be vague: "advanced features" → "real-time notifications"
6. ❌ Use em dashes excessively — or commas instead
7. ❌ Assume reader knows your jargon
8. ❌ Write like a corporate memo

---

## 🔄 Full Copywriting Workflow

```
1. Understand the goal
   "What are we trying to say? Who's reading?"

2. Write draft
   (AI is fine, don't overthink)

3. Run /humanizer
   (Claude analyzes and fixes)

4. Review fixes
   "Does this sound right?"

5. QA with Вітосе
   (User approval required!)

6. Finalize
   "Copy is ready to publish"
```

---

## 📊 Humanizer + Other Skills

### **Landing Page Workflow**

```
1. /design-taste-frontend build [hero layout]
2. Write copy (rough draft)
3. /humanizer fix [copy]
4. /impeccable audit [design + copy]
5. /a11y check [contrast]
6. QA with user
```

### **Pricing Page Workflow**

```
1. Write feature descriptions
2. /humanizer fix [all copy]
3. /design-taste-frontend build [layout]
4. /impeccable audit [overall]
5. QA with user
```

### **Marketing Email Workflow**

```
1. Write email draft
2. /humanizer fix [email body]
3. Review tone
4. Test with sample users
5. Finalize
```

---

## 🎯 Quick Checklist

Before publishing ANY text, ask:

- [ ] Is it free of AI buzzwords?
- [ ] Can a real person relate to it?
- [ ] Is it specific, not vague?
- [ ] Does it use simple words?
- [ ] Is it active voice (you, we) not passive?
- [ ] Did /humanizer approve it?
- [ ] Did user (Вітосе) approve it?

---

## 📞 When to Use Humanizer

| Situation | Use Humanizer? | Why |
|-----------|---|---|
| "Feels like a robot wrote it" | ✅ YES | This is exactly what it's for |
| "Copy is too long" | ⚠️ Maybe | Humanizer helps with clarity too |
| "Landing page text" | ✅ YES | Priority 1 |
| "Feature list" | ✅ YES | Makes users understand better |
| "Error message" | ⚠️ Maybe | If it's friendly/promotional |
| "Database table name" | ❌ NO | Keep technical |
| "Legal disclaimer" | ❌ NO | Keep exact |
| "Marketing headline" | ✅ YES | This is priority 1 |

---

## 💬 Real Bookit Examples

### **Example 1: Services Feature**

**AI Draft:**
```
"Create unlimited service offerings with flexible pricing 
tiers and duration configurations to maximize operational 
efficiency and revenue optimization."
```

**After /humanizer:**
```
"Add any service. Set your own price and duration."
```

**Why better:**
- Short, punchy
- Clear action (Add)
- No jargon
- Shows benefit (your control)

---

### **Example 2: Client Management**

**AI Draft:**
```
"Leverage advanced client segmentation and intelligent CRM 
functionality to facilitate enhanced relationship management 
and personalized communication strategies."
```

**After /humanizer:**
```
"Tag clients and send them personalized messages."
```

**Why better:**
- Specific action (Tag, send)
- Real benefit (personalization)
- No "leverage" or "facilitate"

---

### **Example 3: Pricing Tier**

**AI Draft:**
```
"Unlock advanced analytics and performance monitoring with 
our premium tier, enabling data-driven decision making and 
revenue maximization."
```

**After /humanizer:**
```
"See which clients book most, which services earn you the 
most, and when you're busiest."
```

**Why better:**
- Specific features (not "advanced analytics")
- Shows actual benefit
- Easy to understand

---

## ✨ Status

- ✅ Humanizer skill installed & configured
- ✅ Auto-selection enabled (priority 1)
- ✅ Guidelines created
- ✅ Integration with other skills documented
- ✅ Examples provided

**Use humanizer on EVERYTHING!** 🚀
