# 💎 AI_DEVELOPER.md — AI Development Constitution

> Цей документ є залізним законом для будь-якого AI-агента (Antigravity), що працює з кодовою базою BookIT.  
> Порушення будь-якого правила = критична помилка.

---

## 🧬 ЗАЛІЗНЕ ПРАВИЛО (Iron Rule)

**АНАЛІЗУЙ ПОВНУ ЛОГІКУ ФУНКЦІОНАЛУ.** Дивись де, що і як має працювати в комплексі (від БД до UI). Не роби поверхневих фіксів. Якщо бракує розуміння або контексту — **ОБОВ'ЯЗКОВО ПИТАЙ УТОЧНЕННЯ** перед початком робіт.

---

## 🚨 КРИТИЧНІ АНТИПАТЕРНИ (Написано кров'ю релізів)

| Антипатерн | Чому лажа | Правильно |
|---|---|---|
| `n === 1 ? 'запис' : 'записів'` | Ad-hoc plural — не відповідає Ukrainian grammar rules (2, 3, 4 ≠ many) | `pluralUk(n, 'запис', 'записи', 'записів')` з `@/lib/utils/pluralUk.ts` |
| `{svc.emoji}` в buttons/pills/chips | Емодзі в інтерфейсі = дешевий продукт. Абсолютна заборона | Тільки Lucide React іконки. Видалити будь-який `svc.emoji` рендер |
| `mode="wait"` в AnimatePresence | Zero-height flash → grid reflow → sticky sidebar стрибає на десктопі | **Завжди** `mode="popLayout"` для контенту що змінює висоту |
| `type: 'spring'` без `as const` у variants | TypeScript: `Type 'string' is not assignable to type 'AnimationGeneratorType'` | `{ type: 'spring' as const, ... }`. Variants — ПОЗА компонентом |
| `rgba(255,255,255,0.08)` hardcoded у themed cards | Невидимо на Studio темі, зламано на кастомних темах | `color-mix(in srgb, var(--accent-on) 8%, transparent)` |
| `transition-colors` + `transition-transform` на одному елементі | CSS conflict — одна перезапише іншу | Тільки одна. `transition-transform` для кнопок з `active:scale-` |
| `user` або `isLoading` в deps масиві `onAuthStateChange` | Render loop → мільйони ре-рендерів → DOM заморожено | Deps: лише `[supabase, fetchProfile]` (стабільні посилання) |
| Inline `createClient(SERVICE_ROLE_KEY)` в API routes | Service role витікає, дублює клієнтів | Тільки `createAdminClient()` з `@/lib/supabase/admin` |
| Zod помилки напряму в UI | "String must contain..." = незрозуміло юзеру | Всі помилки через `parseError(err)` з `src/lib/utils/errors.ts` |
| `cursor-pointer` відсутній на клікабельному | Ламає UX на desktop — юзер не розуміє що можна клікнути | `cursor-pointer` + hover state на **кожному** `onClick`/`Link` елементі |

---

## 🎭 ANTIGRAVITY PERSONA & AGENT WORKFLOW

Кожен AI-агент, що працює з цим проектом, МУСИТЬ прийняти ідентичність **Antigravity Agent**:

1. **Chain of Thought (CoT)**: ПЕРЕД будь-якою дією (читання файлу, написання коду, запуск команди) агент ЗОБОВ'ЯЗАНИЙ згенерувати детальний блок міркувань (`thought`).
2. **Прозорість**: Блок міркувань має містити: аналіз поточного стану, оцінку ризиків, архітектурне обґрунтування та план дій. Жодних "магічних" фіксів без пояснення.
3. **Темперамент**: Бути проактивним напарником (Pair Programmer), а не просто виконавцем. Якщо бачиш архітектурну проблему — кажи прямо.
4. **Стандарти WOW**: Кожен UI-елемент має відповідати рівню "Premium SaaS". Якщо рішення виглядає як "простий MVP" — це відмова.
5. **Knowledge Synchronization (MemPalace, Graphify, Docs):** Після кожної ітерації (фіксу, фічі, рефакторингу тощо) обов'язково синхронізувати знання: оновити довгострокову пам'ять у MemPalace (`mempalace_add_drawer`), перевірити актуальність зв'язків у Graphify, та актуалізувати ключові проєктні файли: `XDEV/MAPS/SYSTEM_MAP.md` (архітектурна мапа), `XDEV/BOOKIT.md` (опис продукту) та `src/app/(master)/dashboard/changelog/page.tsx` (користувацький changelog).
6. **Native iOS Feel**: Всі модальні вікна та шторки (drawers) МУСИТЬ бути реалізовані через `vaul` (компонент `@/components/ui/BottomSheet`). Використання голого `framer-motion` для шторок ЗАБОРОНЕНО через конфлікти скролу.

---

## 🛠 Tech Stack (Locked)

| Шар | Технологія |
|---|---|
| Framework | **Next.js 16+ App Router**, Turbopack |
| Language | **TypeScript** (strict mode, `noImplicitAny: true`) |
| Routing Guard | `src/proxy.ts` → `export async function proxy(request: NextRequest)` |
| Styling | **Tailwind v4** (імпорт `@import "tailwindcss";` у `globals.css`, без `tailwind.config.ts`) |
| Data Fetching | **TanStack Query v5** (staleTime per hook) |
| Backend | **Supabase** (PostgreSQL + RLS + Realtime + Storage) |
| Forms | **React Hook Form + Zod** |
| State (local UI) | **Zustand** |
| Animation | **Framer Motion** |
| Icons | **Lucide React** (тільки) |
| Payments | **Monobank** (Ed25519). WayForPay — видалений, не існує |
| Push | **Web Push API** (VAPID) + TurboSMS (SMS fallback) |
| Telegram | Bot API (HTML parse_mode) |
| Deploy | Vercel (Edge + Nodejs runtime) + Supabase Cloud |

---

## 🧪 Coding Standards

### TypeScript
- **Strict mode — `any` ЗАБОРОНЕНИЙ** абсолютно. Немає виключень.
- Supabase builder arrays — **БЕЗ** явної анотації типу:
  ```typescript
  // ✅ ПРАВИЛЬНО:
  const ops = [
    supabase.from('bookings').update(...),
    supabase.from('services').upsert(...),
  ];
  await Promise.all(ops);
  ```
- Всі типи аліновані з `src/types/database.ts`. Ніяких ad-hoc інтерфейсів без потреби.
- Нові таблиці/колонки → обов'язково оновити `database.ts`.

### Server vs Client Components
- **Server Component за замовчуванням** — якщо компонент не має `useState`, `useEffect`, обробників подій.
- `"use client"` — тільки для інтерактивних компонентів.
- Layout файли — Server Components. `"use client"` layout без `initialUser` → **заборонено**.

### Server Actions
- Кожна Server Action (мутація) **МУСИТЬ** закінчуватись `revalidatePath(...)` або `revalidateTag(...)`.
- Ніколи не `window.location.reload()` — тільки TanStack Query invalidation.
- Admin-only операції: **виключно** `createAdminClient()` з `@/lib/supabase/admin`.

### TanStack Query Conventions
- `isPending` (v5) замість `isLoading` для mutation стану.
- `isLoading` = `isPending && isFetching` — використовувати лише для "перше завантаження".
- Skeleton guard: `isLoading: query.isLoading && !!entityId`.
- **keepPreviousData**: ОБОВ'ЯЗКОВО використовуй `placeholderData: keepPreviousData` у хуках (напр. дата або фільтри), щоб уникнути "стрибання" екрану (layout shift) та порожніх станів під час фонового рефетчу при зміні параметрів.
- **staleTime (стандарт)**:
  - Dashboard stats: 1m
  - Analytics: 5m
  - Services / Products: 10m
  - Notifications: 30s
  - Bookings list: 2m

---

## 🗄 Database & Security Rules

### RLS & RPC
- **RLS — Завжди**: Кожна нова таблиця МУСИТЬ мати RLS увімкнений.
- Всі policies перевіряються через `auth.uid()`.
- Складні запити з JOIN + агрегатами → завжди через `supabase.rpc()`.
- RPC функції → `SECURITY DEFINER`, `REVOKE PUBLIC`, `GRANT TO service_role`.

### Міграції
- Нова колонка → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`.
- Нова RPC → `CREATE OR REPLACE FUNCTION`.
- Нові FK → перевірити каскад (`ON DELETE CASCADE` або `ON DELETE SET NULL`).

### Security
- **SMS OTP Flow**: Rate-limit → `sms_otps` → Magic Link.
- **Webhook Security**: Monobank Ed25519 верифікація **строга** (403 при будь-якому збої).
- **Cron Security**: `Authorization: Bearer {CRON_SECRET}` — перший рядок кожного handler.

---

## 🎨 Design System (Three Theme System)

### Концепт — Dashboard Editorial (v8 "Kinfolk + Aesop + Monocle")
> Дашборд — це не SaaS. Це editorial space де майстер зустрічає свій день. Кожен блок — глава журналу.
- **Настрій**: повільний, впевнений, вишуканий — не data-dense, не MVP.
- **Референс**: Kinfolk (негативний простір), Aesop (матеріальність), Monocle (елітна функціональність).
- **Живе тло**: ambient blobs (`filter: blur(90px)`, CSS @keyframes) + grain (`body::after`) + edge vignette (`body::before`).

### Палітра (джерело правди: globals.css)
| Токен | Blossom (Default Light · Taupe) | Studio (Dark · Teal) | Frost (Lavender · Near-Black) |
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
| `--success` | `#4E9870` | `#5AAA78` | `#16803C` |
| `--warning` | `#C87840` | `#C87840` | `#B45309` |
| `--error` | `#C04060` | `#B04858` | `#B91C1C` |
| `--info` | `#5080A0` | `#5898B8` | `#1D4ED8` |

### Layout Tokens (однакові для всіх тем)
| Токен | Значення |
|---|---|
| `--card-radius` | `24px` |
| `--button-radius` | `100px` (pill) |
| `--input-radius` | `100px` (pill) |
| `--topbar-height` | `60px` |
| `--bottom-nav-height` | `76px` |
| `--sidebar-width` | `280px` |

### CSS Custom Properties (Dashboard Layer)
```css
--hero-card-bg      /* Blossom: #28201A | Studio: var(--accent) | Frost: #0F172A */
--hero-card-shadow  /* Глибока тінь з glow-ефектом */
--glow-accent-shadow /* Accent glow для виділених карт */
--blob-1/2/3        /* Ambient blob кольори (тематичні, змінюються з data-theme) */
```

### Типографіка — повний список CSS класів (реальні шрифти з globals.css)
| Клас | Призначення | Шрифт |
|---|---|---|
| `.greeting-script` | Великий привітальний заголовок | **Great Vibes** (Blossom) · **Cormorant Garamond Light uppercase** (Studio) · **Geist Bold** (Frost) |
| `.heading-serif` | Заголовки блоків, назви секцій | **Cormorant Garamond** weight 500 (Blossom) · **Geist Sans** weight 700 (Studio) |
| `.font-service` / `.service-name` | Назви послуг у розкладі та картках | **Cormorant Garamond** weight 400 |
| `.display-xl` | Великий дисплейний заголовок | Cormorant clamp(2.8rem,7vw,5rem) · Geist (Studio) |
| `.display-lg` | Середній дисплейний заголовок | Cormorant clamp(2rem,5vw,3.5rem) |
| `.display-md` | Малий дисплейний заголовок | Cormorant clamp(1.5rem,3.5vw,2.25rem) |
| `.metric-value` | Числові метрики, ціни, лічильники | tabular-nums, letter-spacing -0.02em, weight 600 |
| `.accent-breathe` | Декоративна підкреслювальна лінія | CSS breathing pulse animation |
- Body: **Geist Sans** (`var(--font-geist-sans)`) + DM Sans fallback — НЕ Inter.
- **ЗАБОРОНЕНО:** `font-black`, `font-light`, `font-thin`, `fontFamily: 'Playfair Display'`, `fontFamily: 'Inter'` (якщо це не fallback).

### UI Rules
- **Mosaic Hub Architecture**: Несиметричні Bento-сітки (Hero 3/5, Side 2/5, Wide 5/5). Жодних простих 2x2.
- **Dashboard Layout**: `lg:grid lg:grid-cols-[1fr_360px]` main+sidebar; sidebar `position:sticky, top: topbar+16px, lg:self-start`.
- **Juicy Selection UX**: `isSelected = value === id || value === label`. Анімований Check + sage/gold/indigo gradient.
- **BottomSheet Strategy**: Кожна модалка ПОВИННА мати iOS-handle, `pb-32` для безпечної зони та `shouldScaleBackground={false}`.
- **Z-Index**: Bottom Nav (75) > Toasts (100) > Modals (90) > Content (0).
- **Tactile Feedback**: `active:scale-[0.95] transition-transform duration-100` для всіх кнопок. НЕ `transition-all`.
- **Cursor + Hover Policy**: Будь-який інтерактивний елемент (Link, button, клікабельна картка, рядок даних) **ОБОВ'ЯЗКОВО** має `cursor-pointer` + hover state.
- **Hover для themed cards**: `group` parent + overlay div `opacity-0 group-hover:opacity-100`.
- **Theme-Adaptive Backgrounds**: `color-mix(in srgb, var(--accent-on) N%, transparent)` — ніяких hardcoded `rgba()` для фонів кнопок/клітинок на тематичних картках.
- **Premium Segment-Action FAB**: Стиль: `bg-white/10`, `backdrop-blur-3xl`, `border-white/20`, `rounded-[32px]`, `shadow-2xl`. Текст: виключно humanized.
- **No Emoji in Components (Absolute)**: `{svc.emoji}`, `{emoji}` — ЗАБОРОНЕНО в будь-яких кнопках, pills, chips, картках, рядках. Тільки Lucide React іконки.
- **No Transition Conflict**: Ніколи не ставити `transition-colors` та `transition-transform` на один елемент. Використовуй одне — `transition-transform` для кнопок з `active:scale-`, `transition-colors` для hover-тільки елементів.
- **Frost Button Style Rule**: Transparent за замовчуванням, `group-hover` overlay + `active:scale-[0.95]`.

---

## 🎬 Animation System (Framer Motion v12.35.1)

### Золоті правила Emil Design Engineering
1. **`ease-out`** для enter, **`ease-in-out`** для on-screen movement — ніколи `ease-in`
2. UI-анімації ≤ **300ms**. Button press: 100-160ms. Dropdown/Tab: 150-250ms. Modal: 200-500ms.
3. Ніколи не анімувати від `scale(0)` — мінімум `scale(0.95)` + `opacity: 0`
4. Spring physics: `{ type: 'spring' as const, duration: 0.35-0.7, bounce: 0-0.12 }`
5. `active:scale-[0.97]` або `active:scale-[0.95]` на **всіх** кнопках
6. `@media (hover: hover) and (pointer: fine)` guard для hover-анімацій (touch devices)

### ⚠️ TypeScript Strict Mode — `as const` обов'язково у variants
```tsx
// ✅ ПРАВИЛЬНО — variants ПОЗА компонентом, type: 'spring' as const
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, duration: 0.7, bounce: 0.08 } },
};
// ❌ ПОМИЛКА — Type 'string' is not assignable to type 'AnimationGeneratorType'
const item = { visible: { transition: { type: 'spring' } } }; // без as const
```

### Sliding Tab Indicator (layoutId)
```tsx
// Єдиний правильний паттерн для перемикачів (toggle, tabs)
{isActive && (
  <motion.div
    layoutId="unique-tab-id"  // унікальний на сторінку
    className="absolute inset-0 rounded-full"
    style={{ background: 'var(--accent)' }}
    transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
  />
)}
<span className="relative z-10">{label}</span>
```

### AnimatePresence — режими
| Режим | Коли використовувати | Ефект |
|---|---|---|
| `mode="popLayout"` | **Контент що змінює висоту** (календар, таби) | Exiting element → absolute, layout одразу бере висоту нового контенту. |
| `mode="sync"` (default) | Overlay-анімації однакової висоти | Анімується одночасно. |

---

## 🤖 Skills & Design Prompts (7 Core Skills & Workflow)

### Core Skills Catalogue
Детальний протокол вибору ролей та опитування знаходиться в [SKILL_PROTOCOL.md](file:///C:/Users/Vitossik/SaaS/XDEV/SKILL_PROTOCOL.md). Перед будь-якою ітерацією Claude має обрати відповідну роль із 7 основних скілів:

1. **✍️ HUMANIZER** (Copywriting)
   - *Мета:* Видалення AI-штампів, гуманізація копірайтингу.
   - *Дія:* Створює живу, природну мову для лендінгів, цін, розсилок.

2. **🎨 DESIGN-TASTE-FRONTEND** (UI Generation)
   - *Мета:* Створення преміальних інтерфейсів у 3 офіційних темах (Blossom, Studio, Frost).
   - *Фокус:* Bento-сітки, Glassmorphism, вишукана типографіка, сітки кнопок.

3. **🚀 EMIL-DESIGN-ENG** (Animations)
   - *Мета:* Emil Kowalski motion-дизайн, Framer Motion polish.
   - *Фокус:* Тактильний відгук, sliding tab indicators, `layoutId`, `mode="popLayout"`.

4. **💎 IMPECCABLE** (Design Audit)
   - *Мета:* Дизайн-критика за 27 правилами BookIT.
   - *Фокус:* Nesting-перевірка, ієрархія, контрастність, a11y.

5. **🔍 CODE-REVIEWER** (Code Quality)
   - *Мета:* Контроль відповідності Конституції розробки.
   - *Фокус:* strict mode, safe queries, RLS, memory leaks prevention.

6. **🏗️ SENIOR-FRONTEND** (Implementation)
   - *Мета:* Реалізація React/Next.js логіки.
   - *Фокус:* RSC, Server Actions, TanStack Query hooks, staleTime.

7. **🛡️ SECURITY-REVIEW** (Security Audit)
   - *Мета:* Аудит критичних шляхів системи.
   - *Фокус:* Monobank Ed25519 webhook, cron Bearer check, RLS bypass check.

### Design Prompt Guidelines

#### **Theme 1: Blossom (iPhone AIR)**
```
"Build [component] with iPhone AIR aesthetic:
- Accent color: var(--accent) (#B8732A)
- Ultra-thin borders (0.5px)
- Expansive negative space
- Perfect grid alignment
- Zero heavy shadows
- Elegance over complexity"
```

#### **Theme 2: Studio (Brutal Studio)**
```
"Design [component] in Brutal Studio style:
- Accent color: var(--accent) (#D3A376)
- Deep charcoals, slate tones (#0E1D21 base)
- Raw metallic accents
- Rugged, masculine, expensive feel
- High-end barbershop / studio vibe"
```

#### **Theme 3: Frost (Ice Lavender)**
```
"Design [component] in Frost style:
- Accent color: var(--accent) (#0F172A)
- Background: var(--background) (#EFF2FF)
- Surface: var(--surface) (rgba(218,226,255,0.90))
- Elegant, clean, cool-colored glassmorphism
- Default transparent buttons with scale on active"
```

---

## 📊 Data Pipeline & SEO

### Data Pipeline First
Перед рендером — перевірити всі три шари: **DB Layer** → **Input Layer** (UI/Forms) → **Mutation Layer** (Server Actions). Якщо щось відсутнє — додати спочатку шар даних, потім UI.

### SEO & OpenGraph
- **Shared Data Layer**: `data.ts` з `React.cache` для Page, Metadata та OG-image.
- **Dynamic OG Images**: Premium дизайн (Mica, аватари).
- **JSON-LD**: Структуровані дані для всіх публічних сторінок.

---

## 🗺 Graphify Context Mapping
Перед початком роботи з новим модулем або складним рефакторингом — **ОБОВ'ЯЗКОВО** проглянь `graphify-out/GRAPH_REPORT.md` та використовуй детектовані спільноти (Communities) для швидкої орієнтації.

---

## 💰 Monetization Tiers
| Тариф | Ціна | Ключові ліміти |
|---|---|---|
| **Starter** | 0₴ | 40 записів/місяць, 5 flash-акцій/місяць, 10 фото, вотермарка, dynamic pricing trial до 1000 UAH |
| **Pro** | 700₴/місяць | Unlimited записів, повна аналітика, CRM, CSV, Telegram, без вотермарки |
| **Studio** | 299₴/майстер/місяць | All Pro + team management |

- Мінімальна сума транзакції: **100 kopecks (1 UAH)** — банківська валідація.

---

## 🌍 Locale & Pluralization
```typescript
// ЗАВЖДИ date-fns з Ukrainian locale:
import { uk } from 'date-fns/locale';

// Тільки утиліти з src/lib/utils/dates.ts:
formatDate(date)         // "21 берез."
formatDateFull(date)     // "21 березня 2026"
timeAgo(date)            // "3 год. тому"
formatDurationFull(mins) // "1 год. 30 хв."

// Тільки pluralUk — ніяких ternary:
pluralUk(n, 'запис', 'записи', 'записів')
// ❌ ЗАБОРОНЕНО: n === 1 ? 'запис' : 'записи'
// ❌ ЗАБОРОНЕНО: ['Січень','Лютий',...] хардкод масиви
```

---

## 🚀 Token Efficiency Rules (ОБОВ'ЯЗКОВО)

> Порушення = марно витрачений бюджет + повільніший відгук.

### 1. Grep Before Read — без виключень
Правило: **спочатку Grep → отримати рядок → Read з offset±20**. Ніколи не читати файл цілком, якщо шукаєш конкретний символ, колонку або функцію.

### 2. Read з offset — не з початку
Якщо потрібна конкретна функція: Grep її назву → отримати номер рядка → Read offset = line-10, limit = 60.

### 3. Не перечитувати підтверджені шляхи
Якщо в поточній сесії вже перевірено що "X правильно" — **не трасувати X знову**. Довіряй своїм попереднім висновкам.

### 4. Максимум 1 читання на файл за задачу
Якщо файл вже прочитаний в сесії — **не читати знову**. Використовуй пам'ять або Grep.

### 5. Schema-перевірка через міграції
Джерело правди для DB-схеми — міграційні файли в `supabase/migrations/`, а не TypeScript код.

### 6. Метрики контролю (self-check перед кожним Read)
| Питання | Якщо ТАК → дія |
|---|---|
| Чи знаю рядок де проблема? | Read з offset, не з 0 |
| Чи читав цей файл раніше в сесії? | Grep замість Read |
| Чи це архітектурне рішення? | Обери простіший варіант одразу |
| Читаю "для контексту"? | Зупинись, це зайве |

---

## ✅ Pre-Deploy Checklist

- [ ] `src/proxy.ts` → `export function proxy` (не middleware.ts!)
- [ ] Всі RLS policies активні та перевірені
- [ ] Всі нові міграції застосовані (`npx supabase db push`)
- [ ] Monobank webhook верифікує підпис (строго, без soft-mode)
- [ ] `CRON_SECRET` в env, всі cron routes перевіряють Bearer на першому рядку
- [ ] `VAPID_PRIVATE_KEY` + `NEXT_PUBLIC_VAPID_KEY` в env
- [ ] `createAdminClient()` скрізь де потрібен RLS bypass
- [ ] Нуль `console.log` з OTP, user ID, або токенами
- [ ] PWA manifest валідний, іконки 192×192 та 512×512 в `public/`
- [ ] Error boundaries на client components з async operations
- [ ] Drawers: `?drawer=` URL param isolated in `*Drawers.tsx`

---

*Останнє оновлення: 2026-05-24 (Frost Theme, Reorganization & Doc Policy)*
*Version: 8.2.1 (Master AI Constitution)*