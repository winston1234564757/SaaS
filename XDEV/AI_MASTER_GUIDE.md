# 💎 AI_MASTER_GUIDE.md — Master AI Constitution & Onboarding Guide

> Цей документ є єдиним джерелом правди (Single Source of Truth) та залізним законом для будь-якого ШІ-агента (Antigravity, Claude Code, Gemini тощо), що працює з кодовою базою BookIT.  
> Порушення будь-якого правила = критична помилка розробки.

---

## 🧠 1. ANTIGRAVITY PERSONA & AGENT MINDSET

AI-агент — це проактивний напарник (Pair Programmer) з преміальним смаком та одержимістю якістю BookIT.

### 🚀 Проактивність та мислення
- **Chain of Thought (CoT)**: ПЕРЕД будь-якою дією (читання файлу, написання коду, запуск команди) агент ЗОБОВ'ЯЗАНИЙ згенерувати детальний блок міркувань (`thought`).
- **Прозорість**: Блок міркувань має містити: аналіз поточного стану, оцінку ризиків, архітектурне обґрунтування та план дій. Жодних "магічних" фіксів без пояснення.
- **Керування невизначеністю**: Якщо задача описана неповністю, ніколи не кодуй навмання. Зупинись, сформулюй чіткі запитання та узгодь логіку з розробником.
- **Глибокий аналіз (Deep Dive)**: Перед редагуванням будь-якого файлу роби пошук (`grep`), щоб побачити всі імпорти та зв'язки. Читай код навколо зміни (offset ±20), щоб зберегти оригінальний стиль розробки BookIT.

### 💎 Філософія "Premium SaaS"
Ми будуємо преміальний продукт. Кожен UI-елемент має відчуватися як частина вишуканого iOS додатка:
- **Тактильний відгук**: Кнопки та інтерактивні елементи обов'язково мають `active:scale-[0.95]` та плавні переходи (без конфліктів анімацій).
- **Відсутність порожнечі**: Продумані стани завантаження (Skeletons) та інформативні порожні стани (Empty States).
- **Native iOS Feel**: Всі модальні вікна та шторки (drawers) мають бути реалізовані через `vaul` (компонент `@/components/ui/BottomSheet`). Використання голого `framer-motion` для шторок заборонено через конфлікти скролу.

---

## ⚡ 2. SESSION STARTUP SEQUENCE & ONBOARDING

Кожна сесія починається за фіксованим алгоритмом:

```
1. mempalace_status (MCP)             ➔ швидкий огляд palace знань
2. mempalace_search "task keywords"   ➔ пошук релевантних рішень
3. Read XDEV/BOOKIT.md                ➔ зрозумій бізнес-контекст фічі
4. Read XDEV/MAPS/SYSTEM_MAP.md       ➔ знайди розташування файлів та DB схему
5. Read XDEV/AI_MASTER_GUIDE.md       ➔ перевір стандарти, обмеження та антипатерни
6. Ask 3-5 questions (QA-GATE)        ➔ уточнення та узгодження змін перед кодуванням
7. Announce skill ➔ execute ➔ audit   ➔ виконання обраним скілом
8. Після важливого фіксу ➔ mempalace_add_drawer ➔ оновлення SYSTEM_MAP/BOOKIT/Changelog
```

### 🔴 QA-GATE: Узгодження змін перед кодуванням
Ніколи не починай реалізацію нового функціоналу або рефакторинг існуючого без QA-сесії. Це пропонування варіантів вирішення та узгодження відповідей на питання:
1. **ЩО** саме змінюємо? (файли, таблиці, RPC)
2. **ЧОМУ**? (причина багу або бізнес-вимога)
3. **ЯКЕ** рішення пропонуємо? (підхід у 2-4 реченнях, не код)
4. **ЩО** може зламатись? (суміжні компоненти, RLS, типи)
5. **ЯК** перевіримо? (SQL, manual, E2E)
*Виключення:* виправлення друкарської помилки ( typo ), додавання/видалення `console.log` для дебагу, grep-пошук.

---

## ⛔ 3. ABSOLUTE IRON RULES

1. **Humanizer** — весь UI-текст має бути гуманізований перед записом у файл (згідно з [SKILL_PROTOCOL.md](file:///C:/Users/Vitossik/SaaS/XDEV/SKILL_PROTOCOL.md)).
2. **Encoding** — перевіряти файли на cp1251 mojibake перед редагуванням (див. `IRON_RULES.md`).
3. **MemPalace** — обов'язкова робота з пам'яттю: статус на старті, пошук перед рішенням, збереження знань після фіксу.
4. **No Emoji in UI Components** — емодзі в інтерфейсі (кнопках, pills, chips, картках, рядках) заборонені. Замість них використовуються виключно Lucide React іконки.

---

## 🚨 4. CRITICAL ANTI-PATTERNS (Написано кров'ю релізів)

| Антипатерн | Чому лажа | Правильно |
|---|---|---|
| `n === 1 ? 'запис' : 'записів'` | Ad-hoc plural — не відповідає українській граматиці (2, 3, 4 ≠ many) | `pluralUk(n, 'запис', 'записи', 'записів')` з `@/lib/utils/pluralUk.ts` |
| `{svc.emoji}` у UI компонентах | Створює дешевий вигляд продукту | Тільки Lucide React іконки. Видалити будь-який `.emoji` рендер |
| `mode="wait"` в `AnimatePresence` | Zero-height flash ➔ grid reflow ➔ sticky sidebar стрибає на десктопі | **Завжди** `mode="popLayout"` для контенту, що змінює висоту |
| `type: 'spring'` без `as const` у variants | TypeScript помилка типізації variants | `{ type: 'spring' as const, ... }`. Variants — ПОЗА компонентом |
| `rgba(255,255,255,0.08)` hardcoded фони | Невидимо на Studio темі, зламано на інших темах | `color-mix(in srgb, var(--accent-on) 8%, transparent)` |
| `transition-colors` + `transition-transform` | CSS conflict — одна анімація перезапише іншу | `transition-transform` для кнопок з `active:scale-`, `transition-colors` для hover |
| `user` або `isLoading` в deps `onAuthStateChange` | Render loop ➔ мільйони ре-рендерів ➔ замороження DOM | Deps: лише `[supabase, fetchProfile]` (стабільні посилання) |
| Inline `createClient(SERVICE_ROLE_KEY)` | Service role key витікає на клієнт | Тільки `createAdminClient()` з `@/lib/supabase/admin` |
| Zod/Postgres помилки напряму в UI | Незрозуміло та лякаюче для кінцевого користувача | Всі помилки пропускати через `parseError(err)` з `src/lib/utils/errors.ts` |
| Відсутність `cursor-pointer` на інтерактивному | Користувач не розуміє, що на елемент можна клікнути | `cursor-pointer` + hover state на **кожному** `onClick`/`Link` елементі |
| `window.location.reload()` для оновлення даних | Грубе перезавантаження сторінки ламає SPA досвід | Лише TanStack Query `invalidateQueries` для конкретного `queryKey` |
| `getSession()` всередині `queryFn` | Призводить до блокування сесії (deadlock) | Supabase browser client прикріплює токен авторизації автоматично |

---

## 🛠 5. LOCKED TECH STACK

Кодова база BookIT строго обмежена наступними версіями та технологіями:

- **Framework**: Next.js 16+ App Router, React 19, React Compiler увімкнений.
- **Language**: TypeScript (strict mode, `noImplicitAny: true`).
- **Routing Guard**: `src/proxy.ts` експортує `async function proxy(request: NextRequest)`. Вся логіка захисту роутів тут (middleware.ts лише реекспортує її).
- **Styling**: Tailwind CSS v4. Тільки імпорт `@import "tailwindcss";` у `globals.css` (без `tailwind.config.ts`).
- **Data Fetching**: TanStack Query v5.
- **State Management**: Zustand v5 (локальний UI стан).
- **Database**: Supabase (PostgreSQL + RLS + Realtime + Storage).
- **Forms & Validation**: React Hook Form + Zod v4.
- **Animations**: Framer Motion v12.35.1.
- **Payments**: Monobank API (Ed25519 webhook). *WayForPay повністю видалено!*
- **Notifications**: Web Push API (VAPID) + Telegram Bot API + TurboSMS.

---

## 📂 6. KEY ARCHITECTURAL ENTITIES & PATHS

### Ключові файли та утиліти:
- **Supabase Clients Hierarchy**:
  - `src/lib/supabase/client.ts` — синглтон браузерного клієнта.
  - `src/lib/supabase/server.ts` — SSR клієнт через cookies (для Server Components & Actions).
  - `src/lib/supabase/admin.ts` — admin client з service role key (тільки для server operations/cron).
  - `src/lib/supabase/context.tsx` — MasterProvider/MasterContext (user, profile, isLoading).
  - `src/lib/supabase/safeQuery.ts` — безпечні обгортки `safeQuery/safeMutation`.
- **Notification System**: `src/lib/notifications/NotificationOrchestrator.ts` — єдина точка диспетчеризації (In-App + Push ➔ Telegram ➔ SMS).
- **URL Action Bus**: `src/lib/actions/UrlActionBus.ts` — шинопровод команд через URL параметри (`?_action=<type>`).
- **Slot Engine**: `src/lib/utils/smartSlots.ts` — алгоритм Fluid Anchor (`generateAvailableSlots`, `scoreSlots`).
- **Pricing Engine**: `src/lib/utils/dynamicPricing.ts` — `calculateDynamicPrice(basePrice, rules, slotDateTime)` в копійках.
- **Billing Pricing**: `src/lib/billing/pricing.ts` — stacking знижок (unit-tested).

### Швидкі команди (виконувати з bookit/):
```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Vitest unit tests
npx vitest run [path] # Запуск одного файлу тестів
npm run test:e2e     # Seed + Playwright e2e
npx supabase db push # Застосувати міграції до Supabase
```

---

## 📐 7. DESIGN SYSTEM & VISUAL TOKENS

### Концепт: Dashboard Editorial (Kinfolk + Aesop + Monocle)
Дашборд — це editorial space (видавничий простір), де кожен блок відчувається як сторінка дорогого журналу.
- **Живе тло**: ambient blobs (CSS @keyframes) + grain overlay (`body::after`) + vignette (`body::before`).
- **Mosaic Hub (Bento Grid)**: Асиметрична Bento-сітка (`lg:grid-cols-4`) замість нудних 2x2: Identity (`col-span-1 row-span-2`), Intelligence (`col-span-2`), Action (`col-span-1`), Metrics (`col-span-2`).
- **Dashboard Layout**: `background: 'transparent'` у `DashboardLayout` — фоновий градієнт тіла має проглядати крізь інтерфейс. Sticky sidebar offset: `top: calc(var(--topbar-height) + 24px)` (не +16px).

### Палітра кольорів (globals.css)

| Токен | Blossom (Light · Taupe) | Studio (Dark · Teal) | Frost (Lavender · Slate) |
|---|---|---|---|
| `--background` | `#DDD5C6` | `#0E1D21` | `#EFF2FF` |
| `--background-deep` | `#C9BEA8` | `#0A1417` | `#E0E5FF` |
| `--accent` | `#B8732A` | `#D3A376` | `#0F172A` |
| `--accent-on` | `#F5EDE0` | `#0E1D21` | `#F8FAFC` |
| `--accent-light` | `rgba(184,115,42,0.15)` | `rgba(211,163,118,0.14)` | `rgba(15, 23, 42, 0.08)` |
| `--accent-dark` | `#28201A` | `#E4EFF2` | `#020617` |
| `--surface` | `rgba(255,255,255,0.62)` | `rgba(30,76,90,0.94)` | `rgba(218,226,255,0.90)` |
| `--surface-hover` | `rgba(255,255,255,0.78)` | `rgba(36,88,104,0.98)` | `rgba(218,226,255,0.97)` |
| `--border` | `rgba(40,32,26,0.12)` | `rgba(103,126,138,0.28)` | `rgba(99,102,241,0.14)` |
| `--border-strong` | `rgba(40,32,26,0.20)` | `rgba(120,154,170,0.50)` | `rgba(99,102,241,0.22)` |
| `--text-primary` | `#28201A` | `#CDD8DC` | `#0F172A` |
| `--text-secondary` | `#7A7060` | `#8EA8B5` | `#475569` |
| `--text-tertiary` | `rgba(100,90,76,0.62)` | `#7E9CAA` | `rgba(15,23,42,0.45)` |
| `--hero-card-bg` | `#28201A` | `var(--accent)` (gold) | `#0F172A` (slate) |
| `--btn-primary-bg` | `#28201A` | `var(--accent)` | `#0F172A` |

### Layout & Radii Tokens (однакові для всіх тем)
- **Cards Radius**: `24px`.
- **Buttons & Inputs Radius**: `100px` (strict pill shape).
- **Sidebar Width**: `280px` · **Topbar Height**: `60px` · **Bottom Nav Height**: `76px`.

### Класи Типографіки
- `.greeting-script` — привітання: **Great Vibes** (Blossom) · **Cormorant uppercase** (Studio) · **Geist Bold** (Frost).
- `.heading-serif` — назви блоків: **Cormorant Garamond** (Blossom) · **Geist Sans 700** (Studio).
- `.font-service` / `.service-name` — назви послуг: **Cormorant Garamond 400**.
- `.metric-value` — числа, ціни: `tabular-nums`, `letter-spacing -0.02em`, `weight 600`.
- `.accent-breathe` — декоративне дихаюче підкреслення.
*Шрифти*: Geist Sans для body, Cormorant Garamond для заголовків. *Заборонено*: `font-black`, `font-light`, `font-thin`.

---

## 🎬 8. ANIMATION SYSTEM (Framer Motion v12.35.1)

### Золоті правила Emil Design Engineering:
1. **`ease-out`** для enter, **`ease-in-out`** для on-screen movement (ніколи `ease-in`).
2. Тривалість UI-анімацій: кнопки 100-160ms, dropdown/tabs 150-250ms, modals 200-500ms.
3. Анімувати від `scale(0.95)` + `opacity: 0` (ніколи від `scale(0)`).
4. Spring configs: `{ type: 'spring' as const, duration: 0.35-0.7, bounce: 0-0.12 }`.
5. TypeScript: **`as const` обов'язково** у variants, інакше виникне помилка типізації.
6. **Sliding Indicator Pattern**: Tab-перемикач реалізується через `layoutId="unique-tab-id"` на `motion.div`.
7. **Height transitions in AnimatePresence**: для контенту, що змінює висоту (наприклад, календар або таби), завжди використовувати `mode="popLayout"`. Загортати такі блоки у `<motion.div layout transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}>` для запобігання стрибків інтерфейсу.

---

## 🛡 9. SECURITY & DATA RULES

### RLS & RPC Rules
- **RLS завжди**: Кожна таблиця Supabase має увімкнений RLS. Policies перевіряються через `auth.uid()`.
- **RPC Security**: Функції з прапором `SECURITY DEFINER` повинні явно встановлювати `SET search_path = public` для запобігання підробок (search path hijacking).
- **Admin operations**: Тільки через `createAdminClient()` з `@/lib/supabase/admin`. Прописати імпорт `SERVICE_ROLE_KEY` безпосередньо в API роутах заборонено.

### Webhook & Cron Security
- **Monobank webhook**: Ed25519 підпис верифікується строго (Ed25519 signature verified strictly). Будь-який збій підпису = 403. Без soft-mode.
- **Cron handlers**: Перший рядок обробника кронів — перевірка Bearer token: `Authorization: Bearer {CRON_SECRET}`.

### SMS OTP Flow
```
POST /api/auth/send-sms ➔ rate-limit check ➔ INSERT sms_otps ➔ TurboSMS
POST /api/auth/verify-sms ➔ atomic RPC check_and_log_sms_attempt() ➔ admin.generateLink('magiclink') ➔ verifyOtp()
```
- Віртуальний email для клієнтів без email: `const virtualEmail = phone.replace('+', '') + '@bookit.app'`.

---

## 🤖 10. SKILL PROTOCOL & DESIGN PROMPTS

### 7 Core Skills Catalogue
Перед початком ітерації оберіть відповідну роль (згідно з [SKILL_PROTOCOL.md](file:///C:/Users/Vitossik/SaaS/XDEV/SKILL_PROTOCOL.md)):
1. **✍️ HUMANIZER** (Copywriting) — жива, природна українська мова, без AI-штампів.
2. **🎨 DESIGN-TASTE-FRONTEND** (UI Generation) — преміальні інтерфейси, сітки, Glassmorphism.
3. **🚀 EMIL-DESIGN-ENG** (Animations) — Emil Kowalski motion, пружини, тактильність, `layoutId`.
4. **💎 IMPECCABLE** (Design Audit) — дизайн-критика за 27 правилами BookIT.
5. **🔍 CODE-REVIEWER** (Code Quality) — TypeScript strict, RLS, preventing memory leaks.
6. **🏗️ SENIOR-FRONTEND** (Implementation) — RSC, Server Actions, TanStack Query hooks.
7. **🛡️ SECURITY-REVIEW** (Security Audit) — Monobank webhook, cron Bearer, RLS bypass checks.

### Design Prompts Guidelines:
- **Blossom Theme (iPhone AIR)**:
  `"Build [component] with iPhone AIR aesthetic: Accent var(--accent) (#B8732A), ultra-thin borders (0.5px), negative space, perfect grid alignment, zero heavy shadows, elegance over complexity"`
- **Studio Theme (Brutal Studio)**:
  `"Design [component] in Brutal Studio style: Accent var(--accent) (#D3A376), deep charcoals (#0E1D21 base), raw metallic accents, rugged, masculine, expensive high-end barbershop vibe"`
- **Frost Theme (Ice Lavender)**:
  `"Design [component] in Frost style: Accent var(--accent) (#0F172A), Background (#EFF2FF), Surface (rgba(218,226,255,0.90)), cool-colored glassmorphism, default transparent buttons with scale on active"`

---

## 🚀 11. TOKEN EFFICIENCY RULES (ОБОВ'ЯЗКОВО)

> Порушення правил = марно витрачений бюджет + повільніша відповідь.

1. **Grep Before Read — без виключень**: спочатку `Grep` ➔ отримати потрібний рядок ➔ `Read` з `offset = line - 20`, `limit = 40`. Читати файл цілком заборонено.
2. **Не перечитувати підтверджені шляхи**: якщо в поточній сесії вже перевірено логіку X — не читай її код знову.
3. **Максимум 1 читання на файл за задачу**: використовуй пам'ять або Grep.
4. **Schema-перевірка через міграції**: DB-схема перевіряється через файли `supabase/migrations/`, а не TS-код.

---

## 🧪 12. VERIFICATION PROTOCOLS

### 1. Ручний Тест (для користувача)
```markdown
## Ручний Тест: [Назва фічі/фікса]
**Передумови:**
- [ ] Опис передумов (наприклад: "Увійти як майстер")
**Кроки верифікації:**
- **Крок 1**: Перейти на [URL], натиснути [Кнопку].
- **Очікуємо**: [Опис преміального результату].
- [ ] Успішно
**Мобільна перевірка:**
- [ ] BottomSheet (vaul) адаптується під мобільні (375px).
```

### 2. SQL Тест (для DB-змін)
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'назва_таблиці';
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'назва_таблиці';
```

### 3. E2E Тест (Playwright)
- Тести лежать в `e2e/tests/`.
- Звернення до елементів — виключно через `data-testid` (не через класи чи текст).
- Обов'язковий `test.afterEach` clean up для збереження чистоти бази даних.

---

## ✅ 13. PRE-DEPLOY CHECKLIST

- [ ] `src/proxy.ts` експортує `proxy` (а не middleware.ts).
- [ ] RLS увімкнено на кожній новій Supabase таблиці.
- [ ] Нові міграції застосовано через `npx supabase db push`.
- [ ] Monobank webhook: Ed25519 верифікація підпису строго увімкнена.
- [ ] Крони: перший рядок перевіряє Bearer token (`CRON_SECRET`).
- [ ] `createAdminClient()` використовується виключно в admin-only server operations.
- [ ] Жодних `console.log` з паролями, SMS OTP-кодами або сесійними токенами.
- [ ] Pluralization: виключно через `pluralUk(...)` утиліту.
- [ ] Lucide React іконки замість емодзі у всіх UI компонентах.

---
*Останнє оновлення: 2026-06-03*
*Version: 9.0.0 (Ultimate Master Constitution)*
