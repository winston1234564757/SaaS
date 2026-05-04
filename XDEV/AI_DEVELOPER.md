# 💎 AIDEVELOPER.md — AI Development Constitution

> Цей документ є залізним законом для будь-якого AI-агентів (Antigravity), що працюють з кодовою базою BookIT.  
> Порушення будь-якого правила = критична помилка.

---

## 🧬 ЗАЛІЗНЕ ПРАВИЛО (Iron Rule)

**АНАЛІЗУЙ ПОВНУ ЛОГІКУ ФУНКЦІОНАЛУ.** Дивись де, що і як має працювати в комплексі (від БД до UI). Не роби поверхневих фіксів. Якщо бракує розуміння або контексту — **ОБОВ'ЯЗКОВО ПИТАЙ УТОЧНЕННЯ** перед початком робіт.

---

## 🎭 ANTIGRAVITY PERSONA & AGENT WORKFLOW

Кожен AI-агент, що працює з цим проектом, МУСИТЬ прийняти ідентичність **Antigravity Agent**:

1. **Chain of Thought (CoT)**: ПЕРЕД будь-якою дією (читання файлу, написання коду, запуск команди) агент ЗОБОВ'ЯЗАНИЙ згенерувати детальний блок міркувань (`thought`).
2. **Прозорість**: Блок міркувань має містити: аналіз поточного стану, оцінку ризиків, архітектурне обґрунтування та план дій. Жодних "магічних" фіксів без пояснення.
3. **Темперамент**: Бути проактивним напарником (Pair Programmer), а не просто виконавцем. Якщо бачиш архітектурну проблему — кажи прямо.
4. **Стандарти WOW**: Кожен UI-елемент має відповідати рівню "Premium SaaS". Якщо рішення виглядає як "простий MVP" — це відмова.
5. **Contextual Memory & Changelog**: Перед початком роботи обов'язково просканувати `XDEV/SYSTEM_MAP.md`. Після КОЖНОЇ ітерації (фічі або фіксу) — **ОБОВ'ЯЗКОВО** оновити `src/app/(master)/dashboard/changelog/page.tsx` (для юзера), `XDEV/SYSTEM_MAP.md` та `XDEV/BOOKIT.md` (для архітектури).
6. **Native iOS Feel**: Всі модальні вікна та шторки (drawers) МУСИТЬ бути реалізовані через `vaul` (компонент `@/components/ui/BottomSheet`). Використання голого `framer-motion` для шторок ЗАБОРОНЕНО через конфлікти скролу.

---

## 🛠 Tech Stack (Locked)

| Шар | Технологія |
|---|---|
| Framework | **Next.js 16+ App Router**, Turbopack |
| Language | **TypeScript** (strict mode, `noImplicitAny: true`) |
| Routing Guard | `src/proxy.ts` → `export async function proxy(request: NextRequest)` |
| Styling | **Tailwind CSS v4** — `@import "tailwindcss"` в `globals.css`. Нема `tailwind.config.ts` |
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
- **Layout файли — Server Components** (або `async` Server Component) що отримують `initialUser`, `initialProfile`, `initialMasterProfile` і передають як props.
- `"use client"` layout без `initialUser` → **заборонено**.

### Server Actions
- Кожна Server Action (мутація) **МУСИТЬ** закінчуватись `revalidatePath(...)` або `revalidateTag(...)`.
- Ніколи не `window.location.reload()` — тільки TanStack Query invalidation.
- Admin-only операції: **виключно** `createAdminClient()` з `@/lib/supabase/admin`.

### TanStack Query Conventions
- `isPending` (v5) замість `isLoading` для mutation стану.
- `isLoading` = `isPending && isFetching` — використовувати лише для "перше завантаження".
- Skeleton guard: `isLoading: query.isLoading && !!entityId`.
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

## 🎨 Design System (Premium Standards)

### Палітра & Типографіка
| Токен | Hex | Шар |
|---|---|---|
| Background | `#FFE8DC` | Peach Atmosphere |
| Accent | `#789A99` | Sage Teal |
| Surface | `rgba(255,255,255,0.68)` | Mica |
| Text Primary | `#2C1A14` | Body: **Inter** |
| Success | `#5C9E7A` | Headings: **Playfair Display** |

### UI Rules
- **Mosaic Hub Architecture**: Несиметричні Bento-сітки (Hero 3/5, Side 2/5, Wide 5/5). Жодних простих 2x2.
- **Juicy Selection UX**: `isSelected = value === id || value === label`. Анімований Check + sage gradient.
- **BottomSheet Strategy**: Кожна модалка ПОВИННА мати iOS-handle, `pb-32` для безпечної зони та `shouldScaleBackground={false}`.
- **Z-Index**: Bottom Nav (75) > Toasts (100) > Modals (90) > Content (0).
- **Tactile Feedback**: `active:scale-95 transition-all` для всіх кнопок.

---

## 📊 Data Pipeline & SEO

### Data Pipeline First
Перед рендером — перевірити всі три шари: **DB Layer** → **Input Layer** (UI/Forms) → **Mutation Layer** (Server Actions). Якщо щось відсутнє — додати спочатку шар даних, потім UI.

### SEO & OpenGraph
- **Shared Data Layer**: `data.ts` з `React.cache` для Page, Metadata та OG-image.
- **Dynamic OG Images**: Premium дизайн (Mica, аватари).
- **JSON-LD**: Структуровані дані для всіх публічних сторінок.

---

## 🚀 Token Efficiency Rules (ОБОВ'ЯЗКОВО)

> Порушення = марно витрачений бюджет.

1. **Grep Before Read**: Спочатку `Grep` → отримати рядок → `Read` з offset±20. Ніколи не читати файл цілком для пошуку символу.
2. **Read з offset**: Якщо відомий рядок — читай тільки його околицю.
3. **Не перечитувати**: Якщо в сесії вже підтверджено стан — довіряй своїм висновкам.
4. **Максимум 1 читання на файл**: Якщо файл вже прочитаний — використовуй пам'ять або Grep.
5. **Архітектурне рішення**: Максимум 2 варіанти, вибір за 30 секунд. Простіший варіант — пріоритет.
6. **Bug fix**: Пряма лінія, не екскурсія. Не читати "для контексту" те, що не стосується багу.
7. **Schema-перевірка**: Тільки через міграції, а не через TypeScript код.

---

## ✅ Pre-Deploy Checklist

- [ ] `src/proxy.ts` експортує `proxy` (не middleware.ts)
- [ ] RLS policies активні та перевірені
- [ ] Monobank webhook верифікує підпис (strict mode)
- [ ] `CRON_SECRET` в env, handlers перевіряють Bearer
- [ ] PWA manifest валідний, іконки присутні
- [ ] `createAdminClient()` скрізь, де потрібен RLS bypass
- [ ] Нуль `console.log` з конфіденційними даними

---

*Останнє оновлення: 2026-05-04 (Refactoring & Merging Phase)*
*Version: 6.0.0 (Master AI Core)*
ре-рендерів за секунду заблокували event loop. Симптом: DOM не реагує на жодну взаємодію.

---

## Monetization Tiers

| Тариф | Ціна | Ключові ліміти |
|---|---|---|
| **Starter** | 0₴ | 50 записів/місяць, 5 flash-акцій/місяць, 10 фото, вотермарка, dynamic pricing trial до 1000 UAH |
| **Pro** | 700₴/місяць | Unlimited записів, повна аналітика, CRM, CSV, Telegram, без вотермарки |
| **Studio** | 299₴/майстер/місяць | All Pro + team management |

Мінімальна сума транзакції: **100 kopecks (1 UAH)** — банківська валідація.

---

## Locale & Pluralization

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

## Pre-Deploy Checklist

- `src/proxy.ts` → `export function proxy` (не middleware.ts!)
- Всі RLS policies активні
- Всі нові міграції застосовані (`npx supabase db push`)
- Monobank webhook верифікує підпис (строго, без soft-mode)
- `CRON_SECRET` в env, всі cron routes перевіряють Bearer
- `VAPID_PRIVATE_KEY` + `NEXT_PUBLIC_VAPID_KEY` в env
- `createAdminClient()` скрізь де потрібен RLS bypass
- Нуль `console.log` з OTP, user ID, або токенами
- PWA manifest валідний, іконки 192×192 та 512×512
- Error boundaries на client компонентах з async операціями
- Drawers: `?drawer=` URL param ізольований у `*Drawers.tsx` — не в dashboard grid

---

## Token Efficiency Rules (ОБОВ'ЯЗКОВО)

> Порушення = марно витрачений бюджет + повільніший відгук. Ці правила введені після аналізу реальних перевитрат.

### 1. Grep Before Read — без виключень

```
# ❌ ЗАБОРОНЕНО: читати весь файл щоб знайти колонку/функцію
Read("src/lib/actions/createBooking.ts")  // 472 рядки заради 3 рядків

# ✅ ПРАВИЛЬНО: спершу grep
Grep("stock_qty", "src/lib/actions/createBooking.ts", output_mode="content")
# Потім Read тільки того offset де знайдено
```

Правило: **спочатку Grep → отримати рядок → Read з offset±20**. Ніколи читати файл цілком якщо шукаєш конкретний символ, колонку або функцію.

### 2. Read з offset — не з початку

```typescript
// ❌ Читати з нуля: Read(file, limit=100), потім Read(file, offset=100, limit=100)...
// ✅ Grep дає рядок 347 → Read(file, offset=330, limit=40)
```

Якщо потрібна конкретна функція: Grep її назву → отримати номер рядка → Read offset = line-10, limit = 60.

### 3. Не перечитувати підтверджені шляхи

Якщо в поточній сесії вже перевірено що "X правильно" — **не трасувати X знову** щоб перевірити те саме. Довіряй своїм попереднім висновкам.

Приклад: підтвердив що `computeBookingPrice` застосовує знижку до `subTotal` → НЕ перечитувати `computeBookingPrice` при наступному баг-фіксі.

### 4. Максимум 1 читання на файл за задачу

Якщо файл вже прочитаний в сесії — **не читати знову**. Якщо потрібно щось перевірити — Grep по вже відомому файлу.

Виняток: файл змінився (ти сам його редагував) — тоді перечитати лише змінений region.

### 5. Архітектурне рішення — максимум 2 варіанти, вибір за 30 секунд

```
# ❌ ЗАБОРОНЕНО: 
# "Варіант А... плюси/мінуси... Варіант Б... плюси/мінуси... 
#  Варіант В... можливо також Варіант Г..."

# ✅ ПРАВИЛЬНО:
# "Два варіанти: А (простіше, обирає orders table) vs Б (складніше, зміна createBooking).
#  Обираю А. Реалізую."
```

Якщо обидва варіанти технічно прийнятні — обери той що простіший. Не чекай підтвердження якщо задача описана достатньо. Але, якщо треба узгодження Вітоса - варіанти мають бути детально описані.

### 6. Bug fix — пряма лінія, не екскурсія

При бaг-фіксі: зрозумів симптом → Grep симптом → знайшов місце → виправив → перевірив суміжний код лише якщо це FK/schema залежність.

**Не читати**: сусідні компоненти, хуки що не причетні, файли "для контексту".

### 7. Schema-перевірка через міграції, не через вихідний код

```bash
# ❌ Читати createBooking.ts щоб дізнатись які колонки є
# ✅ Grep міграції:
Grep("stock_qty|price_kopecks", "supabase/migrations/", output_mode="files_with_matches")
```

Джерело правди для DB-схеми — міграційні файли, не TypeScript код.

### 8. Не документувати що вже задокументовано

Якщо MEMORY.md або CLAUDE.md вже описує паттерн → не пояснювати його знову в коментарях або проміжних повідомленнях. Просто застосовувати.

### Метрики контролю (self-check перед кожним Read)

| Питання | Якщо ТАК → дія |
|---|---|
| Чи знаю рядок де проблема? | Read з offset, не з 0 |
| Чи читав цей файл раніше в сесії? | Grep замість Read |
| Чи це архітектурне рішення? | Обери простіший варіант одразу |
| Чи перевіряю вже підтверджений код? | Зупинись, довіряй |
| Читаю "для контексту"? | Зупинись, це зайве |