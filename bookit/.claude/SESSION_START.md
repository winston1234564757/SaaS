# SESSION_START.md — Прочитай перш ніж писати код

> Цей файл — швидкий старт для будь-якого AI-агента. Містить залізні правила, архітектуру проекту, дизайн-систему та поточний стан спринту.

---

## ⛔ ЗАЛІЗНІ ПРАВИЛА (порушення заборонені)

### 1. Humanizer — весь UI-текст через humanizer
Будь-який рядок що побачить користувач: кнопка, лейбл, плейсхолдер, повідомлення, заголовок, порожній стан — проходить через humanizer перед записом у файл.
- **Виключення:** `data-testid`, `aria-label`, формати `HH:mm`, технічні enum-значення (`pending`, `confirmed`)
- **Заборонені слова:** "revolutionize", "leverage", "empower", "unlock potential", "seamlessly"

### 2. Encoding перевірка перед Edit/Write
Файли з кирилицею можуть мати cp1251 mojibake. Перевіряти через binary read перед записом.
- mojibake: `b'\xd0\xa0\xc2' in raw` або `b'\xd1\x80\xc2' in raw`
- curly quotes: `b'\xe2\x80\x9c' in raw` або `b'\xe2\x80\x99' in raw`
- Якщо dirty → XDEV/ENCODING_FIX_PROMPT.md, потім редагувати

### 3. MemPalace — обов'язковий на старті
- **Старт сесії:** `mempalace_status` (огляд)
- **Перед рішенням:** `mempalace_search "query"` (пошук релевантних drawers)
- **Після важливого фіксу:** `mempalace_add_drawer` (зберегти знання)

---

## 🚀 СТАРТ СЕСІЇ (робочий цикл)

```
1. mempalace_status → огляд palace (18,261 drawers)
2. mempalace_search "ключові слова задачі" → релевантний контекст
3. Прочитати bookit/.claude/SESSION_START.md + XDEV/TASK.md (поточний спринт)
4. XDEV/SKILL_PROTOCOL.md → Decision Tree → знайти скіл
5. bookit/.claude/CLARIFICATION_FRAMEWORK.md → 3-5 питань
6. Оголосити скіл → виконати → QA
7. mempalace_add_drawer якщо важливе рішення/фікс
```

---

## 🧠 КАРТА СКІЛІВ (як вибрати)

| Тип задачі | Primary скіл | Secondary |
|---|---|---|
| Новий UI компонент/сторінка | design-taste-frontend | emil-design-eng (motion) |
| Аудит дизайну | impeccable | — |
| Анімації / Framer Motion | emil-design-eng | — |
| Складний UX | ui-ux-pro-max | design-taste-frontend |
| Копірайтинг / текст | humanizer | — |
| React/Next.js логіка | senior-frontend | code-reviewer |
| Backend/API/DB | senior-backend | code-reviewer |
| Безпека | code-reviewer → security-review | — |
| Скріншот → код | image-to-code | senior-frontend |
| Редизайн існуючого | redesign-existing-projects | impeccable |
| Next.js routing/RSC | nextjs-best-practices | code-reviewer |
| Великий файл (>200 рядків) | [основний] + full-output-enforcement | — |

### Обов'язкові ланцюги:
```
ДИЗАЙН: clarify → design-taste-frontend → [emil-design-eng?] → impeccable → humanizer → QA
ТЕКСТ:   драфт → humanizer → записати у файл
КОД:     clarify → senior-frontend/backend → [simplify?] → code-reviewer → QA
```

---

## 🏗️ ПРО ПРОЕКТ (BookIT)

**BookIT** — преміальний український SaaS для майстрів б'юті-індустрії.
*Позиціювання: "Твій розумний link in bio, який заробляє гроші."*

### Три зони:
| Зона | Роути | Auth |
|---|---|---|
| **B2B Master** | `/dashboard/**`, `/onboarding/**` | Required — master role |
| **B2C Client** | `/my/**` | Required — client role |
| **Public** | `/[slug]`, `/explore`, `/studio/[slug]`, `/r/[code]` | Anonymous OK |

### Tech Stack:
- **Next.js 16** App Router + Turbopack, **React 19**, React Compiler enabled
- **TypeScript** strict (`noImplicitAny: true`)
- **Tailwind CSS v4**: `@import "tailwindcss"` в globals.css — без `tailwind.config.ts`
- **TanStack Query v5**: `isPending` (не `isLoading`) для mutations
- **Supabase** (PostgreSQL + RLS + Realtime + Storage)
- **Framer Motion v12.35.1**, **vaul** для drawers, **Zustand v5**, **Zod v4**, **nuqs**

### Routing Guard:
`src/proxy.ts` → `export async function proxy(request: NextRequest)`. НЕ `middleware.ts`.
`src/middleware.ts` re-exportує `proxy`.

### Supabase Client Hierarchy:
```
src/lib/supabase/
  client.ts   — singleton browser client
  server.ts   — SSR client via cookies (Server Components & Actions)
  admin.ts    — ONLY service_role_key (API routes + cron only)
  context.tsx — MasterProvider/MasterContext
  safeQuery.ts — safeQuery/safeMutation wrappers
```

---

## 🎨 ДИЗАЙН-СИСТЕМА (джерело правди: src/app/globals.css)

### 3 Теми:
| Токен | Blossom (Light) | Studio (Dark) | Frost (Ice) |
|---|---|---|---|
| `--background` | `#DDD5C6` | `#0E1D21` | `#EFF2FF` |
| `--accent` | `#A8896A` | `#D3A376` | `#0F172A` |
| `--surface` | `rgba(255,255,255,0.62)` | `rgba(30,76,90,0.94)` | `rgba(218,226,255,0.90)` |
| `--text-primary` | `#28201A` | `#E0B4B2` | `#0F172A` |

### Layout (однаковий):
- Cards: `24px` · Buttons: `100px` (pill) · Inputs: `100px` (pill)
- Topbar: `60px` · Bottom nav: `76px` · Sidebar: `280px`
- Body font: **Geist Sans** / DM Sans (НЕ Inter)
- Display/heading: **Cormorant Garamond** (НЕ Playfair Display)
- Іконки: **Lucide React** тільки — **NO emoji** в UI (абсолютна заборона)
- `business_name` завжди пріоритетніше за `full_name`

### Typography класи:
`greeting-script`, `heading-serif`, `font-service`, `metric-value`, `accent-breathe`
- Заборонено: `font-black`, `font-light`, `fontFamily: 'Playfair Display'`, `fontFamily: 'Inter'`

### Анімації (Framer Motion):
- `mode="wait"` заборонено → завжди `mode="popLayout"`
- `type: 'spring' as const` — обов'язково `as const` в variants
- Spring: `duration: 0.35-0.7, bounce: 0-0.12`
- `active:scale-[0.95]` на всіх кнопках
- Tab indicator: `layoutId="tab-indicator-<unique>"`
- Calendar: y-базовані variants (не x — ламає tooltips)
- DashboardLayout: `background: 'transparent'` (не `var(--background)`)

### Action Button Colors (per theme):
| Theme | Стиль |
|---|---|
| Blossom | `background: var(--hero-card-bg)` = `#28201A` |
| Studio | `background: var(--accent)` = `#D3A376` |
| Frost | `group-hover` overlay + `active:scale-[0.95]` |

---

## 🚫 КРИТИЧНІ АНТИПАТЕРНИ (написані кров'ю)

| Що НЕ можна | Правильно |
|---|---|
| `any` тип | Типи з `src/types/database.ts` |
| `n === 1 ? 'запис' : 'записів'` | `pluralUk(n, 'запис', 'записи', 'записів')` |
| `{svc.emoji}` в UI | Тільки Lucide React іконки |
| `mode="wait"` в AnimatePresence | завжди `mode="popLayout"` |
| `user/isLoading` в deps onAuthStateChange | тільки `[supabase, fetchProfile]` |
| Inline `createClient(SERVICE_ROLE_KEY)` | тільки `createAdminClient()` |
| Raw Zod/Postgres помилки в UI | завжди `parseError(err)` |
| `window.location.reload()` | TanStack Query invalidation |
| `Math.random()` для токенів | `generateSecureToken()` |
| `console.log` з OTP/id/токенами | заборонено |
| `getSession()` в queryFn | deadlock — заборонено |
| `invalidateQueries()` без аргументів | явний queryKey |
| Lucide icons з `style` prop | обгорнути в `<span style={{color}}>` |
| `"use client"` на layout без initialUser | Server Component з props |
| `transition-colors` + `transition-transform` на 1 елементі | тільки одна transition |

### staleTime норми:
- Dashboard stats: 1 min · Analytics: 5 min · Services/Products: 10 min · Notifications: 30 sec · Bookings: 2 min

---

## 📁 КЛЮЧОВІ ФАЙЛИ (швидкий пошук)

| Що | Шлях |
|---|---|
| CSS токени 3 тем | `src/app/globals.css` (рядки 1-500) |
| Tailwind @theme bridge | `src/app/globals.css` (рядки 15-35) |
| Proxy/Guard | `src/proxy.ts` |
| Supabase client | `src/lib/supabase/client.ts` |
| Supabase server | `src/lib/supabase/server.ts` |
| Supabase admin | `src/lib/supabase/admin.ts` |
| MasterProvider | `src/lib/supabase/context.tsx` |
| TanStack hooks | `src/lib/supabase/hooks/` |
| Notification orchestrator | `src/lib/notifications/NotificationOrchestrator.ts` |
| notifMap (21 подій) | `src/lib/notifications/constants/notifMap.ts` |
| Slot engine | `src/lib/utils/smartSlots.ts` |
| Dynamic pricing | `src/lib/utils/dynamicPricing.ts` |
| Billing (Monobank) | `src/lib/billing/MonoProvider.ts` |
| Pricing functions | `src/lib/billing/pricing.ts` |
| URL Action Bus | `src/lib/actions/UrlActionBus.ts` |
| Create booking | `src/lib/actions/createBooking.ts` |
| Plural helper | `src/lib/utils/pluralUk.ts` |
| Error helper | `src/lib/utils/errors.ts` → `parseError(err)` |
| Token generator | `src/lib/utils/token.ts` → `generateSecureToken()` |
| Clock (debug) | `src/lib/utils/now.ts` → `getNow()` |
| Dashboard layout | `src/components/master/DashboardLayout.tsx` |
| Auth callback | `src/app/auth/callback/` |
| Send SMS OTP | `src/app/api/auth/send-sms/route.ts` |
| Verify SMS OTP | `src/app/api/auth/verify-sms/route.ts` |

---

## 🗄️ БАЗА ДАНИХ (Supabase PostgreSQL)

### Основні таблиці:
- `profiles` — всі юзери: `full_name`, `phone`, `role`, `telegram_chat_id`
- `master_profiles` — бізнес-профіль: `slug`, `business_name`, `working_hours` (jsonb), `pricing_rules` (jsonb), `theme`
- `client_master_relations` — CRM: `total_visits`, `total_spent`, `average_check`, `is_vip`
- `services` — послуги: `duration`, `price` (копійки!), `category`, `is_active`
- `products` — товари: `price`, `stock`, `stock_alert_threshold`
- `bookings` — записи: `slot_date`, `slot_time`, `total_duration`, `total_price` (копійки), `status`
- `booking_services` — деталі мульти-сервіс
- `notifications` — in-app нотифікації
- `push_subscriptions` — VAPID підписки
- `broadcasts`, `broadcast_recipients`, `broadcast_links`, `phone_discounts` — маркетинг
- `flash_deals` — flash-акції
- `loyalty_programs` — програми лояльності
- `referrals`, `master_alliances`, `master_referrals` — реферали
- `payments`, `master_subscriptions`, `billing_events` — білінг
- `studio_members` — студії
- `portfolio_items`, `portfolio_item_photos`, `portfolio_item_reviews` — портфоліо
- `reviews` — відгуки
- `orders`, `order_items` — магазин
- `sms_otps`, `sms_verify_attempts`, `sms_ip_logs` — безпека

### Правила:
- Всі ціни в **копійках** (integers)
- RLS обов'язково на кожній новій таблиці
- RPC функції → `SECURITY DEFINER`, `REVOKE PUBLIC`, `GRANT TO service_role`
- VM (virtual email) for SMS OTP: `phone.replace('+', '') + '@bookit.app'`

---

## 🧪 КОМАНДИ

Всі з `bookit/`:
```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest
npm run test:watch   # Vitest watch
npm run test:e2e     # Seed + Playwright
npx vitest run src/lib/billing/pricing.test.ts  # один тест
npx tsc --noEmit     # TypeScript check
npx supabase db push # DB migrations
```

---

## 📋 PRE-DEPLOY CHECKLIST

- [ ] `src/proxy.ts` експортує `proxy` (не middleware.ts)
- [ ] RLS увімкнений на нових таблицях + policies
- [ ] Monobank webhook: Ed25519 строга верифікація (не soft-mode)
- [ ] Cron routes: перший рядок `Authorization: Bearer {CRON_SECRET}`
- [ ] `createAdminClient()` тільки в admin-only операціях
- [ ] Немає `console.log` з паролями/OTP/токенами
- [ ] PWA manifest валідний, іконки 192×192 + 512×512
- [ ] Міграції застосовані (`npx supabase db push`)

---

## 🔄 ПОТОЧНИЙ СПРИНТ (CSS Variable Refactor)

**Статус:** Триває заміна hardcoded стилів на семантичні CSS-токени для 3 тем (Blossom/Studio/Frost).

**Mapping rules (основні):**
| Hardcoded | Семантичний |
|---|---|
| `bg-white/60` | `bg-secondary/60` |
| `rounded-3xl` (картки) | `rounded-xl` |
| `rounded-2xl` (кнопки/інпути) | `rounded-lg` |
| `border-white/80` | `border-border` |
| `bg-[#E8D0C8]` | `bg-peach` |
| `#789A99` | `bg-sage` |
| Inline `rgba(255,255,255,0.92)` | `color-mix(in srgb, var(--background) 92%, transparent)` |

**Що залишилось (Batches 5-11):**
- 🔴 Batch 5: loading.tsx (однотипні файли — швидкий replace_all)
- 🔴 Batch 6: Dashboard core (changelog, BentoGrid, Greeting, QuickActions, TodaySchedule, TopBar)
- 🟡 Batch 7: Shared UI (BottomSheet, BookingWizard, BottomNav)
- 🟡 Batch 8: Master features (bookings, clients, billing, analytics)
- 🟢 Batch 9: Client pages (/my/**)
- 🟢 Batch 10: Landing pages
- 🟢 Batch 11: Error/legal pages

---

## 📚 ПОВНА КАРТА ДОКУМЕНТАЦІЇ

| Файл | Про що |
|---|---|
| `XDEV/CLAUDE.md` | Головний файл — архітектура, дизайн, anti-patterns |
| `XDEV/IRON_RULES.md` | Абсолютні правила (Humanizer, Encoding, MemPalace) |
| `XDEV/SKILL_PROTOCOL.md` | Decision Tree для вибору скіла |
| `XDEV/UX_STANDARDS.md` | Преміальні UX стандарти |
| `XDEV/AI_DEVELOPER.md` | Залізна конституція розробки |
| `XDEV/AI_ONBOARDING.md` | Вхідний брифінг |
| `XDEV/BOOKIT.md` | Бізнес-логіка |
| `XDEV/XDEV_PROTOCOL.md` | Як читати XDEV папку |
| `XDEV/HANDOFF.md` | Handoff CSS Variable Refactor |
| `XDEV/TASK.md` | Поточний спринт |
| `XDEV/AGENT_QUICKSTART.md` | Cheatsheet (стисло) |
| `XDEV/MAPS/SYSTEM_MAP.md` | Повна архітектура (роути, hooks, DB, API) |
| `XDEV/MAPS/UI_MAP.md` | Ієрархія компонентів |
| `XDEV/MAPS/MODALS_MAP.md` | Реєстр модалок/sheets |
| `XDEV/MAPS/DEEP_LINK_MAP.md` | URL-навігація |
| `XDEV/MAPS/NOTIFICATION_MAP.md` | NotificationOrchestrator v7 |
| `XDEV/MAPS/REFERRAL_MAP.md` | Реферальні механіки |
| `XDEV/MAPS/BUTTON_ACTION_MAP.md` | Кнопки та URL Action Bus |
| `bookit/.claude/CLARIFICATION_FRAMEWORK.md` | 3-5 питань перед скілом |
| `bookit/.claude/HUMANIZER_GUIDE.md` | Детальний гайд humanizer |
| `bookit/.claude/SKILL_GUIDE.md` | Старий гайд скілів |
| `bookit/.claude/ONBOARDING_PROMPT.md` | Старий онбординг-промт |
| `bookit/graphify-out/GOD_NODES.md` | Топ-30 god nodes кодової бази |

---

## 💡 ПОРАДИ ДЛЯ ЕФЕКТИВНОСТІ

1. **Grep Before Read** — спочатку Grep, потім Read з offset. Ніколи не читай файл цілком
2. **Читай існуючі компоненти** перед написанням нових — дотримуйся стилю
3. **DB-to-DOM Thinking** — проєктуй знизу вгору: DB → Server Action → UI
4. **Data Pipeline перевірка** перед рендером: чи є колонка? чи є форма? чи є Server Action?
5. **Не перечитувати** — якщо в сесії вже підтверджено, довіряй пам'яті
6. **QA-Gate** — не починай реалізацію без QA-сесії з користувачем
7. **Жодного "я просто додам"** — аналізуй повну логіку, не роби поверхневих фіксів
8. **Оновлюй XDEV** — при зміні архітектури оновлюй SYSTEM_MAP.md
