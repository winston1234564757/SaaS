# AIDEVELOPER.md — AI Development Constitution

> Конституція для AI-агентів, що працюють з кодовою базою BookIT.  
> Порушення будь-якого правила = критична помилка.

---

## 💎 ЗАЛІЗНЕ ПРАВИЛО (Iron Rule)

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

## Tech Stack (Locked)

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

## Coding Standards

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
  
  // ❌ НЕПРАВИЛЬНО:
  const ops: Promise<unknown>[] = [...];
  ```
- Всі типи аліновані з `src/types/database.ts`. Ніяких ad-hoc інтерфейсів без потреби.
- Нові таблиці/колонки → обов'язково оновити `database.ts`.

### Server vs Client Components

- **Server Component за замовчуванням** — якщо компонент не має `useState`, `useEffect`, обробників подій.
- `"use client"` — тільки для інтерактивних компонентів.
- **Layout файли — Server Components** (або `async` Server Component) що отримують `initialUser`, `initialProfile`, `initialMasterProfile` і передають як props.
- `"use client"` layout без `initialUser` → **заборонено** (причина: `isLoading: true` на mount, блокує context-dependent saves).

### Server Actions

- Кожна Server Action (мутація) **МУСИТЬ** закінчуватись `revalidatePath(...)` або `revalidateTag(...)` — або явно поясненою причиною чому не потрібно (напр. 100% client-side zone).
- Ніколи не `window.location.reload()` — тільки TanStack Query invalidation.
- Admin-only операції: **виключно** `createAdminClient()` з `@/lib/supabase/admin`.

### Zod Validation

- Всі форми + API inputs валідуються через Zod.
- Схеми — окремо від компонентів (у `src/lib/validations/` або поряд з action файлом).
- `safeParse` + обробка `.error` обов'язкові.

### TanStack Query Conventions

- `isPending` (v5) замість `isLoading` для mutation стану.
- `isLoading` = `isPending && isFetching` — використовувати лише для "перше завантаження".
- Skeleton guard: `isLoading: query.isLoading && !!entityId` — запобігає skeleton до готовності context.
- Empty array `[]` → **завжди** Empty State, ніколи skeleton.
- `invalidateQueries` — завжди з конкретним `queryKey`. Ніколи `invalidateQueries()` без аргументів.

### React Query staleTime (стандарт)

| Дані | staleTime |
|---|---|
| Dashboard stats | 1 хвилина |
| Analytics | 5 хвилин |
| Services / Products | 10 хвилин |
| Notifications | 30 секунд |
| Bookings list | 2 хвилини |

### Anti-patterns (ЗАБОРОНЕНО)

```typescript
// ❌ getSession() в queryFn — deadlock!
queryFn: async () => {
  const { data: { session } } = await supabase.auth.getSession(); // ЗАБОРОНЕНО
}

// ✅ Supabase browser client прикріплює токен автоматично
queryFn: async () => {
  const { data } = await supabase.from('bookings').select('*');
  return data;
}
```

```typescript
// ❌ Inline admin client
const admin = createClient(process.env.URL!, process.env.SERVICE_ROLE_KEY!); // ЗАБОРОНЕНО

// ✅ Єдина точка входу
import { createAdminClient } from '@/lib/supabase/admin';
const admin = createAdminClient();
```

```typescript
// ❌ Math.random() для кодів
const code = Math.floor(Math.random() * 10000); // ЗАБОРОНЕНО

// ✅ Crypto
const arr = new Uint32Array(1);
crypto.getRandomValues(arr);
```

---

## Database Rules

### RLS — Завжди

- **Кожна нова таблиця** МУСИТЬ мати RLS увімкнений.
- Всі policies перевіряються через `auth.uid()`.
- Тригери що записують в захищені таблиці → `SECURITY DEFINER`.
- `createAdminClient()` — єдиний спосіб bypass RLS у server-side коді.

### RPC для складних агрегацій

- Складні запити з JOIN + агрегатами → завжди через `supabase.rpc('function_name', params)`.
- RPC функції → `SECURITY DEFINER`, `REVOKE PUBLIC`, `GRANT TO service_role` де потрібно.
- Race-condition-safe batch операції: `FOR UPDATE SKIP LOCKED` в RPC.

### Суворі правила для міграцій

- Нова колонка → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`.
- Нова RPC → `CREATE OR REPLACE FUNCTION`.
- Partial indexes → `WHERE condition` для performance-критичних запитів.
- Нові FK → перевірити каскад (`ON DELETE CASCADE` або `ON DELETE SET NULL`).

---

## Auth & Security Rules

### SMS OTP Flow
```
POST /api/auth/send-sms → rate-limit → INSERT sms_otps → TurboSMS
POST /api/auth/verify-sms → atomic check_and_log_sms_attempt() RPC → admin.generateLink('magiclink') → { email, token }
Client → supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
```
- **НІКОЛИ** не повертати пароль або service role key у відповіді API.
- `virtualEmail = phone.replace('+','') + '@bookit.app'`

### Webhook Security
- Monobank: Ed25519 верифікація **строга** — 403 при будь-якому збої підпису. Без soft-mode.

### Cron Security
- Кожен cron handler: `Authorization: Bearer {CRON_SECRET}` — **перший рядок**, без виключень.

### Telegram
- `escHtml()` на **всіх** user-supplied strings перед вставкою в HTML parse_mode.
- Завжди використовуй Inline Buttons (`replyMarkup`) для Call-to-Action. Ніколи не залишай текстових посилань.

### Notifications & Deep Linking
Усі нотифікації (In-App, Web Push, Telegram) **ОБОВ'ЯЗКОВО** повинні підтримувати Deep Linking на конкретний об'єкт (картку запису, відгук, налаштування).
- **Telegram**: завжди передавай `replyMarkup: { inline_keyboard: [[{text, url}]] }`.
- **Push**: завжди передавай `url: '...'` в payload.
- **In-app**: завжди зберігай `related_booking_id` або обробляй onClick.
Система працює каскадно: `Push -> Telegram -> SMS`. Завжди перевіряй наявність `push_subscriptions` перед фоллбеком на Telegram.

---

## Slot Scheduling

Pre-fetch повний 30-денний розклад в одному `Promise.all`:
```typescript
// useWizardSchedule.ts pattern:
const [templates, exceptions, timeOffs, bookings] = await Promise.all([...]);
// ScheduleStore: { templates, exceptions, timeOffs, bookingsByDate }
```

- `generateAvailableSlots`, `scoreSlots`, `buildSlotRenderItems` — з `@/lib/utils/smartSlots`.
- Ніколи не fetchити слоти per-date ліниво — завжди pre-fetch вікно.
- Date strip: off-days → `вих.` + dashed border; fully-booked → `зайнято` + red border.

## 📱 Mobile Interaction Rules (v5.2.0+)
- **BottomSheet Strategy**: Завжди використовувати `@/components/ui/BottomSheet`.
- **Swipe-to-Dismiss**: Кожна модалка ПОВИННА мати iOS-handle та підтримувати свайп вниз для закриття.
- **Scroll Locking**: При відкритій шторці `body` скрол має бути заблокований через `vaul` mechanism.
- **Z-Index Strategy**: Bottom Nav (75) > Toasts (100) > Modals (50) > Content (0).

---

## Design System (Locked)

### Палітра
| Токен | Hex |
|---|---|
| Background | `#FFE8DC` (персик/salmon) |
| Accent | `#789A99` (sage teal) |
| Text Primary | `#2C1A14` |
| Text Secondary | `#6B5750` |
| Text Tertiary | `#A8928D` |
| Surface | `rgba(255,255,255,0.68)` (Mica) |
| Success | `#5C9E7A` |
| Warning | `#D4935A` |
| Error | `#C05B5B` |

### Типографіка
- Body: **Inter** (Cyrillic subset) — `font-sans`
- Display/Headings: **Playfair Display** (Cyrillic subset) — `font-display`
- CSS класи: `.display-xl`, `.display-lg`, `.display-md`, `.heading-serif`

### UI Rules & Premium Standards
- **Mosaic Hub Architecture**: Mobile navigation and complex menus must use asymmetric, non-repeating Bento grids. No 2x2 grids everywhere. Use unique layouts per section (Hero 3/5, Side 2/5, Wide 5/5).
- **Peach Atmosphere**: Global backgrounds and Hub states use deep peach-to-peach-deep gradients (`#FFE8DC` to `#FFD1B8`) with heavy `backdrop-blur-3xl`.
- **Juicy Selection UX**: Toggleable items (specializations, categories, etc.) must:
  - Use **Robust Mapping**: `isSelected = value === id || value === label`.
  - Active: Vibrant `sage` gradient + `shadow-sage/20` + animated `Check` icon.
  - Inactive: Grayscale emoji (`filter: grayscale`) + 70% opacity + `white/60` background.
  - Feedback: `whileTap={{ scale: 0.92 }}`
- Card radius: 24px | Button radius: 16px | Input radius: 12px
- `.bento-card` — backdrop-blur, Mica, border rgba(255,255,255,0.4), box-shadow
- Emoji в desktop UI — **тільки якщо явно запросив користувач**
- Mobile-first, touch targets мінімум 44×44px
- `will-change: transform` для GPU-анімацій
- УСІ кнопки та клікабельні елементи повинні мати тактильний відгук: `active:scale-95 transition-all`.
- Модалки та Sheets ПОВИННІ використовувати Radix UI (Focus Trap, Esc closure).
- Toasts завжди мають z-[100], а модалки z-[90].
- **Safe Interaction Zone**: Весь контент у BottomSheet ПОВИНЕН мати `pb-32` (128px) або `padding-bottom: calc(env(safe-area-inset-bottom) + 80px)`, щоб запобігти перекриттю з `BottomNav` та забезпечити доступ до останніх елементів списку.
- **Vaul Performance**: Для запобігання лагам при свайпі закриття, ЗАВЖДИ використовувати `shouldScaleBackground={false}` та уникати `dvh` одиниць у висоті (використовувати стабільні `vh`), щоб клавіатура не викликала стрибків лейауту.

### UX Copywriting & Forms (Tone of Voice)
- Використовуй виключно терміни: `Майстер` (не спеціаліст/робітник), `Клієнт` (не юзер/покупець), `Бронювання/Запис`, `Підписка/Тариф` (не пакет).
- ЗАБОРОНЕНО використовувати хардкод чи тернарні оператори для множини (напр. `count === 1 ? 'відгук' : 'відгуків'`). **ЗАВЖДИ** використовуй `import { pluralUk } from '@/lib/utils/pluralUk'`.
- Усі системні/бекенд помилки (Zod, Network, Postgres) **ПОВИННІ** проходити через `parseError(err)` з `src/lib/utils/errors.ts` перед показом юзеру. НІЯКИХ "String must contain".
- Форми ПОВИННІ використовувати атрибут `aria-invalid="true"` на інпутах при помилках валідації (викликає червоне світіння через глобальні стилі) та `aria-describedby` для читабельного повідомлення під полем. Ніколи не блокуй мовчки кнопку "Далі" без пояснень.
- **Identity Display**: Завжди використовувати пріоритет: `business_name` → `full_name`. Якщо `business_name` заповнено — воно має бути основним заголовком на публічній сторінці, у бічному меню дашборду та в каталозі.
- **Robust Category Mapping**: При відображенні спеціалізацій/категорій завжди перевіряти збіг як по `id`, так і по `label` (напр. `val === c.id || val === c.label`). Це забезпечує зворотну сумісність зі старими даними та стійкість до ручного введення.

### Tailwind v4
```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-peach: #FFE8DC;
  --color-sage: #789A99;
  /* ... */
}
/* НЕ @tailwind base/components/utilities */
```

---

## Data Pipeline First — Обов'язкова перевірка перед UI

Перед рендером будь-яких даних — перевірити ВСІ три шари:

| Шар | Питання | Як перевірити |
|---|---|---|
| **DB Layer** | Чи є колонка у таблиці? | `grep` міграції або `SELECT` query |
| **Input Layer** | Чи є форма/UI для введення? | Прочитати відповідний CRUD компонент |
| **Mutation Layer** | Чи є Server Action що зберігає? | Перевірити `.update({...})` виклики |

**Якщо ХОЧА Б ОДИН шар відсутній → СПОЧАТКУ додати шар, ПОТІМ UI.**

---

## PWA / Session Rules

### Supabase Browser Client Architecture
- `src/lib/supabase/client.ts` — singleton, `pwaDummyLock` (обходить Web Locks), `autoRefreshToken: false`
- `resetFetchController()` — kill switch для in-flight запитів
- Custom fetch timeout: 8s (auth) / 10s (інші)

### Context Hydration
```typescript
// context.tsx — НІКОЛИ await всередині onAuthStateChange:
onAuthStateChange((event, session) => {
  // ✅ setTimeout(0) → наступний macrotask (після lockAcquired=false)
  setTimeout(() => { if (mountedRef.current) fetchProfile(u.id); }, 0);
  
  // ❌ await fetchProfile(u.id) — циклічний deadlock!
})
```

### 🔴 CRITICAL: useEffect Dependency Safety — onAuthStateChange

**НІКОЛИ не додавай `user`, `isLoading` або будь-який state що змінюється ВСЕРЕДИНІ ефекту до deps масиву auth-підписки.**

```typescript
// ❌ ЗАБОРОНЕНО — INFINITE RENDER LOOP (вбиває весь DOM):
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    setUser(session?.user ?? null);   // ← змінює `user`
    setIsLoading(false);              // ← змінює `isLoading`
  });
  return () => subscription.unsubscribe();
}, [supabase, fetchProfile, isLoading, user]); // ❌ user та isLoading в deps = loop!
// Механізм: setUser → user зміна → ефект cleanup+rerun → нова підписка → INITIAL_SESSION → setUser → ...

// ✅ ПРАВИЛЬНО — тільки стабільні значення в deps:
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    setUser(session?.user ?? null);   // OK — не в deps
    setIsLoading(false);              // OK — не в deps
  });
  return () => subscription.unsubscribe();
}, [supabase, fetchProfile]); // ✅ обидва стабільні: useMemo([], []) та useCallback([supabase])
```

**Правило:** deps auth-ефекту = ЛИШЕ те що потрібно для ПІДПИСКИ (client instance, stable callbacks). Ніколи — state що ефект сам же і змінює.

**Інцидент (2026-04-29):** Цей баг заморозив весь UI додатку. Мільйони ре-рендерів за секунду заблокували event loop. Симптом: DOM не реагує на жодну взаємодію.

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