# AUDIT-04: Architecture Friction Points
> Дата: 2026-06-15 | Аудитор: AI Agent (Architecture domain) | Sprint-04: 27/34

---

## Методологія

**Deletion Test:** якщо видалити модуль і складність з'являється у N caller-ів — модуль заробляв своє місце. Якщо складність зникає — це був pass-through (shallow module).

**Глосарій:** Module / Interface / Implementation / Depth / Seam / Adapter / Leverage / Locality (з LANGUAGE.md improve-codebase-architecture skill).

---

## ARCH-1 [Strong]: `notifMap.ts` — монолітна lookup table (25,956 bytes)

- **Файл:** `src/lib/notifications/notifMap.ts`
- **Розмір:** 25,956 bytes — найбільший utility файл у проекті
- **Проблема:** Єдиний файл містить: типи нотифікацій, шаблони текстів (UK/EN), логіку cascade (TG→Push→SMS), priority flags, channel config. Додавання нового event типу = редагування одного моноліту.
- **Deletion Test:** Видалити → 40+ компонентів потребують рефакторингу. Заробляє місце, але структура неглибока.
- **Рефакторинг:**
  ```
  src/lib/notifications/
  ├── types.ts          ← NotifEvent union, NotifPayload
  ├── templates/        ← UK/EN шаблони по event групах
  │   ├── booking.ts
  │   ├── marketing.ts
  │   └── system.ts
  ├── channels.ts       ← cascade config, priority matrix
  └── index.ts          ← re-export публічного API
  ```
- **Leverage:** Додавання нового event = один новий файл в `templates/`, не 200-рядкова вставка у монолітний файл.
- **Зусилля:** L (треба оновити всі 40+ import paths).

---

## ARCH-2 [Strong]: Admin Zone vs Master Zone — розбіжність патернів даних

- **Admin файли:** `src/components/admin/` (6 сторінок)
- **Проблема:** Admin Zone використовує сирий `useState/useEffect` + `supabase.from()` прямо в компонентах. Master Zone — TanStack Query + хуки (`useClients`, `useDashboardStats`). Два різних патерни = подвійний mental model для розробника.
- **Конкретно:**
  - `AdminOverviewCharts.tsx` — 3 окремих `useEffect`, ручний `setLoading(false)` в catch
  - `ModerationHub.tsx` — silent error (no toast on fetch fail)
  - `AllianceMap.tsx` — silent error
  - `SystemLogsViewer.tsx` — silent error
- **Fix:** Мігрувати Admin до TanStack Query. Використовувати `useQuery` + `queryClient` + `parseError()` для консистентного error handling.
- **Leverage:** Query invalidation, background refetch, retry logic — безкоштовно.
- **Зусилля:** M (6 компонентів × ~30 рядків кожен).

---

## ARCH-3 [Strong]: `useSettingsForm` — 26 `useState` замість єдиної форм-структури

- **Файл:** `src/lib/supabase/hooks/useSettingsForm.ts`
- **Проблема:** 26 окремих `useState` викликів для полів форми. Кожен render може тригернути 26 re-renders. Немає типизованої форм-схеми.
- **Порівняння:** Інші форми проекту використовують `react-hook-form` (BookingWizard, ClientAuthSheet).
- **Deletion Test:** Видалити → 1 компонент `SettingsPage.tsx`. Не поширюється. Але сам hook шалено shallow — 26 useStates без жодної логіки крім set/get.
- **Fix:** Замінити 26 useState на `useForm()` з `react-hook-form` + `zodResolver`. Схема одним об'єктом, dirty tracking безкоштовно, validation вбудована.
- **Зусилля:** M.

---

## ARCH-4 [Strong]: `getCategoryIcon` — switch statement в render path

- **Файл:** `src/components/public/ExplorePage.tsx` (та інші)
- **Проблема:**
  ```tsx
  // Grow-with-the-codebase antipattern
  switch (category) {
    case 'Нігті': return <Scissors />
    case 'Брови': return <Eye />
    // ... +12 more cases
  }
  ```
  Switch у render path = O(n) lookup при кожному render. Додавання категорії = редагування компонента.
- **Fix:**
  ```tsx
  // Поза компонентом — lookup map, O(1), не реєструється в re-render
  const CATEGORY_ICONS: Record<string, LucideIcon> = {
    'Нігті': Scissors,
    'Брови': Eye,
    // ...
  };
  // В компоненті:
  const Icon = CATEGORY_ICONS[category] ?? Tag;
  return <Icon />;
  ```
- **Locality:** Нова категорія = один рядок у lookup map, не пошук у switch-statement.
- **Зусилля:** S.

---

## ARCH-5 [Worth exploring]: Booking price розподілена між 5 файлами

- **Файли:**
  - `src/lib/utils/pricing.ts` — base price calc
  - `src/lib/billing/pricing.ts` — subscription pricing
  - `src/components/booking/BookingWizard.tsx` — inline price adjustments
  - `src/app/api/bookings/create/route.ts` — server-side price validation
  - `src/lib/supabase/hooks/useServices.ts` — price formatting
- **Проблема:** Логіка "скільки коштує запис" розподілена між 5 різними контекстами. Зміна формули (наприклад, dynamic pricing discount) потребує оновлення в 5 місцях.
- **Deletion Test:** Видалити `src/lib/utils/pricing.ts` → 3 caller-и переписують логіку самостійно. Заробляє місце.
- **Fix:** Єдиний `BookingPriceCalculator` seam:
  ```ts
  interface BookingPriceInput { serviceId, masterId, date, promoCode? }
  interface BookingPriceResult { base, discount, total, breakdown }
  function calculateBookingPrice(input: BookingPriceInput): BookingPriceResult
  ```
  Один виклик з BookingWizard, server route, і будь-якого нового місця.
- **Зусилля:** L (server + client + tests).

---

## ARCH-6 [Worth exploring]: `MasterContext` — 20+ компонентів споживають весь контекст

- **Файл:** `src/lib/supabase/context.tsx`
- **Проблема:** `MasterContext` містить `{user, profile, masterProfile, isLoading, refetch}`. 20+ компонентів роблять `useMaster()` але споживають лише 1-2 поля. При оновленні будь-якого поля — ре-рендер усіх 20+ компонентів.
- **Патерн рішення:** Context selector (Zustand-style) або окремі атомарні контексти:
  ```ts
  const { user } = useMasterUser();       // тільки user
  const { masterProfile } = useMasterProfile(); // тільки masterProfile
  ```
- **Зусилля:** M (refactor без breaking changes через re-export).

---

## ARCH-7 [Worth exploring]: Admin — 100% hardcoded Tailwind, нуль CSS variables

- **Файли:** 6 admin сторінок + `BroadcastEditor.tsx` + `StoryGenerator.tsx`
- **Масштаб:** 88 хардкодованих hex кольорів, 11 градієнтів, 16 файлів
- **Проблема:** Dark mode для адмінів = неможливий. Theme switching для Admin = переписати всі файли.
- **Fix:** Мігрувати до CSS vars з globals.css:
  ```css
  /* замість bg-[#1a1a2e] */
  .admin-surface { background: var(--admin-surface, #1a1a2e); }
  ```
  Починати з `BroadcastEditor.tsx` + `StoryGenerator.tsx` (найбільші порушники).
- **Зусилля:** L (16 файлів).

---

## ARCH-8 [Worth exploring]: 3 різні data-fetching патерни в одному проекті

| Патерн | Де використовується | Проблема |
|--------|---------------------|---------|
| TanStack Query hooks | Master Zone dashboard | ✅ Правильно |
| Raw `useEffect + useState` | Admin Zone (6 pages) | ❌ No caching, no retry |
| Server Components + direct `supabase.from()` | Public routes | ✅ OK для SSR |

**Наслідок:** Новий розробник (або AI agent) не знає який патерн використовувати для нового компонента.
**Fix:** ADR — "Який data fetching де": SSR=Server Components, Client interactive=TanStack Query, Admin=TanStack Query.

---

## ARCH-9 [Speculative]: `NotifData` — 60+ optional fields в одному union type

- **Проблема:** `NotifData` тип у `notifMap.ts` має ~60+ optional fields, бо всі events шарять один тип. TypeScript не може підказати які поля потрібні для конкретного event.
- **Fix:** Discriminated union:
  ```ts
  type NotifData =
    | { type: 'booking_confirmed'; bookingId: string; masterName: string }
    | { type: 'flash_deal_created'; dealId: string; discount: number }
    // ...
  ```
- **Зусилля:** L (великий рефакторинг типів).

---

## ARCH-10 [Speculative]: Auth guard — 3 різні підходи до перевірки ролей

| Підхід | Файли | 
|--------|-------|
| `proxy.ts` route guard | Server-side redirect для `/dashboard/*`, `/my/*` |
| `MasterContext.isLoading` check | Client components (`DashboardLayout.tsx`) |
| Direct `getUser()` in Server Component | Окремі сторінки (`/my/setup/*`) |

**Проблема:** Немає єдиного `requireMasterRole()` / `requireClientRole()` seam. Якщо змінюється умова "хто може бачити dashboard" — потрібно оновити 3+ місця.
**Fix:** Єдиний `requireRole(role: 'master' | 'client')` wrapper для Server Components.

---

## ARCH-11 [Speculative]: `parseError()` — існує але не enforced

- **Файл:** `src/lib/utils/errors.ts`
- **Проблема:** `parseError(err)` правильний util для обробки Supabase errors, але 3/6 admin компонентів і ~30% server actions мають `catch (err) { console.error(err) }` без `parseError`.
- **Наслідок:** Silent failures у production (помилка логується в консоль але не показується user-ові).
- **Fix:** ESLint custom rule або lint script що шукає `catch.*console.error` без `parseError`.

---

## ARCH-12 [Speculative]: Booking flow split — client + server validation не синхронізовані

- **Проблема:** `BookingWizard.tsx` (client) валідує `canBook`, `hasConflict`, `isAvailable` окремо від `src/app/api/bookings/create/route.ts` (server). Якщо логіка розходиться — race condition у production.
- **Fix:** Shared `validateBookingSlot(input)` function що викликається і на клієнті (preview) і на сервері (final validation). `src/lib/booking/validateSlot.ts`.

---

## Матриця пріоритетів

| ID | Рекомендація | Зусилля | Leverage | Sprint |
|----|-------------|---------|---------|--------|
| ARCH-4 | getCategoryIcon → lookup map | S | Low | Sprint-04 (зараз) |
| ARCH-2 | Admin → TanStack Query | M | High | Sprint-05 |
| ARCH-3 | useSettingsForm → react-hook-form | M | Medium | Sprint-05 |
| ARCH-6 | MasterContext selectors | M | High | Sprint-05 |
| ARCH-1 | notifMap.ts split | L | High | Sprint-06 |
| ARCH-5 | BookingPriceCalculator | L | High | Sprint-06 |
| ARCH-7 | Admin CSS variables | L | Medium | Sprint-06 |
| ARCH-9 | NotifData discriminated union | L | Medium | Sprint-07 |

**Top Recommendation:** ARCH-4 (getCategoryIcon) — найменше зусиль, реалізується за 15 хвилин, усуває антипатерн. Потім ARCH-2 (Admin → TanStack Query) — усуває найбільшу розбіжність патернів і дає silent error handling безкоштовно.
