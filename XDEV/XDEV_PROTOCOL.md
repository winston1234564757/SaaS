# 🔧 XDEV Protocol — How Claude Reads & Uses This Folder

> **ДЛЯ CLAUDE:** Це інструкція про те, як використовувати файли в папці `XDEV/` для контексту, тестування рішень і документування змін.

---

## 📋 File Structure & Purpose

Усі 8 файлів у папці `XDEV/` є важливими для роботи.Claude зобов'язаний використовувати їх відповідно до ролей:

### **Tier 1: MUST READ BEFORE EVERY TASK**

#### 0. `.claude/CLARIFICATION_FRAMEWORK.md` (✨ Smart Questions System)
- **Шлях:** [CLARIFICATION_FRAMEWORK.md](file:///C:/Users/Vitossik/SaaS/bookit/.claude/CLARIFICATION_FRAMEWORK.md)
- **Коли читати:** На старті будь-якої задачі.
- **Що там:** Шаблони 3-5 уточнювальних питань для різних типів задач (дизайн, код, текст, анімація).
- **Як використовувати:** Задати питання користувачу почергово перед оголошенням скіла.

#### 1. `TASK.md` (Mission Brief)
- **Шлях:** [TASK.md](file:///C:/Users/Vitossik/SaaS/XDEV/TASK.md)
- **Коли читати:** На початку виконання конкретної поточної задачі.
- **Що там:** Опис поточної цілі спринту та критерії успіху.

#### 2. `AI_DEVELOPER.md` (Constitution of BookIT)
- **Шлях:** [AI_DEVELOPER.md](file:///C:/Users/Vitossik/SaaS/XDEV/AI_DEVELOPER.md)
- **Коли читати:** Перед кожною роботою з кодом, базою даних чи дизайном.
- **Що там:** Стек, правила кодування, RLS, 3 теми (Blossom, Studio, Frost), антипатерни, правила економії токенів, деплой-чекліст.

#### 3. `SYSTEM_MAP.md` (Architecture Source of Truth)
- **Шлях:** [SYSTEM_MAP.md](file:///C:/Users/Vitossik/SaaS/XDEV/MAPS/SYSTEM_MAP.md)
- **Коли читати:** Перед будь-якими змінами в коді чи схемі бази даних.
- **Що там:** Мапа маршрутів, таблиць БД, RPC-функцій, TanStack Query хуків та утиліт.

---

### **Tier 2: READ AT START OF PROJECT/PHASE**

#### 4. `BOOKIT.md` (Business Logic & Features)
- **Шлях:** [BOOKIT.md](file:///C:/Users/Vitossik/SaaS/XDEV/BOOKIT.md)
- **Коли читати:** На старті нової бізнес-фічі або зміни бізнес-логіки.
- **Що там:** Опис філософії продукту, монетизації, реферальної системи, логіки Smart Slots.

#### 5. `AI_ONBOARDING.md` (Project Briefing)
- **Шлях:** [AI_ONBOARDING.md](file:///C:/Users/Vitossik/SaaS/XDEV/AI_ONBOARDING.md)
- **Коли читати:** На старті роботи з проєктом у новій сесії.
- **Що там:** Послідовність онбордингу, DB-to-DOM мислення та протокол верифікації змін.

---

### **Tier 3: READ FOR SPECIFIC TASKS**

#### 6. `SKILL_PROTOCOL.md` (Skills & Roles)
- **Шлях:** [SKILL_PROTOCOL.md](file:///C:/Users/Vitossik/SaaS/XDEV/SKILL_PROTOCOL.md)
- **Коли читати:** Перед початком ітерації для вибору правильної ролі та ланцюга.
- **Що там:** Повний каталог скілів (24+ скілів), Decision Tree для вибору ролей та обов'язкові ланцюжки виконання.

#### 7. `UX_STANDARDS.md` (Premium UX & Design Rules)
- **Шлях:** [UX_STANDARDS.md](file:///C:/Users/Vitossik/SaaS/XDEV/UX_STANDARDS.md)
- **Коли читати:** Перед будь-якою роботою з інтерфейсом (кнопки, форми, Bento-сітки, анімації).
- **Що там:** Колірні токени Blossom, Studio, Frost, No-Emoji Policy, Vaul BottomSheets, анімаційні правила Emil Kowalski.

---

## 🔄 Standard Workflow with XDEV Files

```
[Trigger Task] 
      │
      ▼
1. Read TASK.md & AI_ONBOARDING.md ➔ Зрозумій задачу та контекст сесії
      │
      ▼
2. Read AI_DEVELOPER.md & SYSTEM_MAP.md ➔ Знайди суміжні файли та перевір правила коду
      │
      ▼
3. Read SKILL_PROTOCOL.md ➔ Знайди потрібний скіл за допомогою Decision Tree
      │
      ▼
4. Run CLARIFICATION_FRAMEWORK ➔ Задай 3-5 питань користувачу
      │
      ▼
5. Оголоси скіл ➔ Execute ➔ Аудит (impeccable/code-reviewer/humanizer)
      │
      ▼
6. QA Gate & Verification ➔ Запусти ручний/SQL/E2E тест ➔ Збережи знання в MemPalace
```

---

## 🚨 Key Rules for Claude in XDEV
1. **Не пиши код без перевірки архітектури:** Завжди шукай готові утиліти чи хуки в `SYSTEM_MAP.md`.
2. **Оновлюй SYSTEM_MAP.md:** Якщо ти створюєш нову таблицю, RPC-функцію, API-роут чи великий хук — обов'язково додай його в `SYSTEM_MAP.md`.
3. **Очищуй XDEV від дублювань:** Ці файли мають залишатися чистими, структурованими та взаємопов'язаними. Не копіюй великі блоки Конституції розробника в інші файли, натомість використовуй посилання `file:///`.

---
*Останнє оновлення: 2026-05-24 · Версія: 8.2.0*
