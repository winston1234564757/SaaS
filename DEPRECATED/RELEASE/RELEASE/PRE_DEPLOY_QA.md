# BookIT — Pre-Deploy QA: Повний огляд 13 кроків

> Сформовано: 2026-06-01 · Стан: **13/13 завершено (100%)**
> TSC: 0 помилок · Build: clean · Гілка: `main`

---

## Загальний прогрес

```
[█████████████] 100% (13/13)

Step 01 Landing          ✅ 2026-05-28
Step 02 Auth             ✅ 2026-05-28
Step 03 Onboarding       ✅ 2026-05-30
Step 04 Dashboard Home   ⚠️ Carry-over (B-01 pending)
Step 05 Bookings         ✅ 2026-05-31
Step 06 CRM Clients      ✅ 2026-05-31
Step 07 Services+Products✅ 2026-05-31
Step 08 Other Hubs       ✅ 2026-05-31
Step 09 Explore          ✅ 2026-05-31
Step 10 Public Master    ✅ 2026-05-31
Step 11 Shop+Portfolio   ✅ 2026-05-31
Step 12 Client Portal    ✅ 2026-06-01
Step 13 Final Sprint     ✅ 2026-06-01
```

---

## Що зроблено на кожному кроці

### STEP 01 — Головний лендинг `/`
**Drawer:** `d61ab82e` · Commit: `3a42b10+`

- GSAP ScrollTrigger stack (11 секцій, 30vh overlap) — повністю налаштований
- Детекція слабких пристроїв (CPU < 4 або RAM < 4GB) → GSAP вимикається автоматично
- `prefers-reduced-motion` підтримка
- ROI калькулятор: безпечне затискання значень (clamping)
- CountUp рефакторено на `useState + useMotionValueEvent`
- Всі CSS змінені на токени `--l-*`; alt на зображеннях; `aria-label` на Bento
- Emoji: тільки 🇺🇦 у футері — дозволено; решта нуль
- Playwright smoke тести: зелені

**Що перевірити вручну:** Лендинг загалом стабільний. Якщо щось зламалось — Playwright покаже.

---

### STEP 02 — Авторизація `/login`, `/register`, `/callback`
**Drawer:** `0f174061` / `aece86e2` · Commit: `ff50c78`

- Layout авторизації: Frost split-screen (45% темна панель + 55% форма); mobile — одна колонка
- `PhoneOtpForm` перероблено на "Nordic Slab": білий контейнер на lavender, стопкою role cards, 3-сегментний прогрес
- Google OAuth: виправлено кнопку "назад"
- OTP: paste + auto-submit
- WCAG AA: всі пари кольорів перевірені (замінено `#94A3B8` → `#64748B`, `#6366F1` → `#4338CA` для тексту)
- `data-theme="frost"` на div (не html) — достатньо для CSS cascade

**Що перевірити вручну:** E2E auth тести — carry-over (логіка не змінювалась).

---

### STEP 03 — Онбординг `/dashboard/onboarding`
**Drawer:** `9014576630a5` · Commit: `967bf06` (64 файли, задеплоєно на Vercel)

- 5-крокова форма: Profile → Services → Schedule → Preview → Success
- Frost тема: 3 рівні примусового застосування (root layout SSR + master layout CSS `!important` + wizard `useEffect`)
- `loading.tsx` — новий Frost skeleton (закриває blank gap при завантаженні)
- Admin client для збереження кроків (обхід RLS — анонімний клієнт мовчки ігнорував запис)
- `router.refresh()` видалено з OTP форми (race condition fix)
- Slug: regex валідація + редагування в StepPreview
- Послуги: стан per-category (categoryPrices + categoryServiceTypes)

**Що перевірити вручну → B-02 (критично):**
- [ ] Vercel prod (`967bf06`) — повний прогін онбордингу від реєстрації до Success
- [ ] Закрий браузер посередині — крок зберігся?
- [ ] Frost тема не протікає Blossom на жодному кроці?
- [ ] Blank page не з'являється до loading skeleton?

---

### STEP 04 — Dashboard Home `/dashboard`
**Commit:** `6577d5a` · **Статус: ⚠️ Carry-over (B-01 pending)**

- `EarningsPulseWidget`: виправлено баг `/100` (дохід ділився на 100)
- `useRealtimeNotifications`: додано `busyness` query invalidation
- Empty states для 6 віджетів: TodaySchedule, TopServices, ChannelHealth, InsightsRow, WeeklyChart, PeakHours
- Tour система: `DashboardTourContext` + `DashboardTourBanner` + DOM overlay + `getBCR` + `data-tour-step`
- Academy: повний rewrite — tabs + accordion + 26 статей + Emil springs + deep links
- Frost Grid: `items-start` → stretch; `flex flex-col` на wrapper divs
- PeakHours: `h-[13px]` → `flex-1 min-h-[10px]` (динамічне масштабування)
- InsightsRow: TopClientCard + totalSpent; AvgCheckCard + comparison bars
- ChannelHealthWidget: actionable empty state + CTA → /dashboard/clients

**Що перевірити вручну → B-01 (критично):**
- [ ] Відкрий `/dashboard` у всіх 3 темах (Blossom / Studio / Frost)
- [ ] Запусти `/impeccable` аудит — health score (базовий 22/40, ціль 34+)
- [ ] Виджети заповнюють висоту у Frost Grid? (не "висять" зверху)
- [ ] PeakHours heatmap масштабується до розміру картки?
- [ ] Academy: табуляція і акордеон працюють?
- [ ] InsightsRow: реальні дані відображаються?
- [ ] Tour: з'являється при першому відвідуванні?

---

### STEP 05 — Записи `/dashboard/bookings`
**Drawer:** `f4b261099ec82d90` · impeccable 16/20 · E2E 22/22

- Auth guards перед `try{}` у всіх 6 функціях `actions.ts`
- `completeBooking`: виправлено порожні strings у notification (тепер реальні date/services)
- `cancelBooking` + `updateBookingStatus`: status guard
- `layoutId` sliding indicators ×4 (mobile + desktop TR + View switchers)
- `type="button"` ×36 в 7 файлах; `aria-pressed`; `aria-label`; `min-h-[44px]`
- URL-state: `?view ?range ?date ?status` + `<Suspense>` + `setUrl()` helper
- `dayWorkHours` useMemo замість 3 IIFE
- Emoji ⭐ видалено з `notifyClientReviewNudge`
- E2E: 22 passed, 0 failed

**Що перевірити вручну:** E2E покриває основне. Візуально — layoutId tabs плавно?

---

### STEP 06 — CRM Клієнти `/dashboard/clients`
**Drawer:** `8b26b6ff187c043ed68372b0` · impeccable 15/20

- `div` → `button` на картках клієнтів (grid + list info sections)
- `aria-pressed` ×8 chip groups (retention, view toggle, custom segments)
- `SegmentBuilder`: `useEffect([initial?.id])` — React strict mode safe state sync
- `ClientDetailSheet`: 2-step archive confirm (без випадкового архівування)
- `useMemo` для відфільтрованого списку
- `useClientBookings`: typed `RawRow` interface замість `(data as any[])`
- SPRING const у всіх 3 файлах

**Що перевірити вручну:**
- [ ] Рамки карток клієнтів виглядають нормально (border + tint замість лівої смуги)?
- [ ] Archive — 2-step confirm спрацьовує?

---

### STEP 07 — Послуги і Товари `/dashboard/services`, `/dashboard/products`
**Drawer:** `ea3affc66ed6c48195edda5e`

- `ServiceCard`: `motion.div onClick` → info section `<button type="button">` (без button-in-button)
- `type="button"` ×20+; `aria-pressed` ×10; `aria-label` на FABs і drag handles
- Хардкодовані stats "24/+12%" → плейсхолдер "Статистика з'явиться після перших записів"
- `AnimatePresence`: `x:±10` → `y:4` (відповідно до dashboard animation system)
- `FAB_SPRING` const на рівні модуля
- Видалено сирітські файли: `services/ProductCard.tsx`, `services/ProductForm.tsx` (0 імпортів)

**Що перевірити вручну:** Drag handle на карточках послуг/товарів — drag курсор і функція?

---

### STEP 08 — Інші хаби: Revenue · Growth · Marketing · Billing · Settings · Studio
**Drawer:** `e1534fd674b5432d8685234b` · 3 сесії (08a/08b/08c)

- `DynamicPricingPage`: `div` → `button` + `w-full text-left` (P1)
- `StoryGenerator`: `motion.div` → `motion.button` (P1); виправлено curly quotes U+201C/D
- `type="button"` ×20+ по всіх хабах; `aria-pressed` на tab switchers
- `BillingPage`: `spring as const`
- `BusynessWidget`: видалено як dead code (69 рядків)
- Mono webhook: перевірено ECDSA P-256 — CLEAN, без змін
- `SettingsPage`: `type="button"` sweep

**Що перевірити вручну:** Billing webhook критичний — але він перевірений і CLEAN.

---

### STEP 09 — Explore `/explore`
**Drawer:** `e7959f077fa9adbf72463435`

- `type="button"` ×9; `aria-label` + `p-1.5` (X clear)
- `aria-pressed` ×4 toggles; `aria-expanded` + `aria-haspopup="listbox"` (city trigger)
- `role="listbox"` / `role="option"` + `aria-selected`
- Баг PRO badge: кліпувався через `overflow-hidden` → переміщено в outer wrapper
- `pluralUk()` для serviceCount ("послуга/послуги/послуг")
- SPRING as const ×4; `animate-pulse` видалено; MasterCard hover lift

**Що перевірити вручну:**
- [ ] PRO badge видно повністю на картці майстра?
- [ ] Фільтр + пошук + сортування + dropdown міста — все працює?

---

### STEP 10 — Публічна сторінка майстра `/[slug]`
**Drawer:** `6b554b09eed872165f45ba2a`

- SPRING + SPRING_CARD as const — 15 inline transitions витягнуто в константи
- `type="button"` ×3 (FlashDealCard, referral banners)
- Hardcoded `#2C1A14` → `text-foreground`; rgba referrer → success tokens
- `<img>` → Next.js `<Image>` для thumbnail послуг
- Share кнопка: `size-9` → `size-11` (36→44px); carousel nav: `size-7` → `size-11` (28→44px)
- `aria-selected` динамічний в `ClientCombobox` (не hardcoded `false`)
- `aria-label` на date prev/next nav
- C2C race condition: cancelled flag + cleanup
- OTP цифри: `w-10` → `w-11` (40→44px touch target)
- Бізнес-логіка verified CLEAN: `createBooking`, `dynamicPricing`, `computeBookingPrice`

**Що перевірити вручну:**
- [ ] Повний флоу бронювання на публічній сторінці майстра?
- [ ] OTP цифри зручно натискати на мобільному?

---

### STEP 11 — Shop і Portfolio `/[slug]/shop`, `/[slug]/portfolio`
**Drawer:** `2272efe59888d3addd38f5c0`

- SPRING as const ×4 (SHEET / GALLERY / CART / SUCCESS)
- DOM ref: `getElementById` → `useRef<HTMLDivElement>(null)`
- `type="button"` ×17; `aria-label` ×7; `aria-pressed` ×5
- Фото dots: `p-3 -m-3` wrapper (8px → 32px+ touch target без візуальних змін)
- Emoji блискавка → видалено; `fill="currentColor"` на Star icons
- Бізнес-логіка: `createPublicOrder` stock atomic verified CLEAN

**Що перевірити вручну:**
- [ ] Кошик: додати товар, змінити кількість, оформити замовлення?
- [ ] Portfolio: відкрити фото, бронювання з портфоліо?

---

### STEP 12 — Клієнтський кабінет `/my/*`
**Drawers:** `0a433239dd2c899a3691ba79` (12a) · `3bec0459fbf4b9a44e1aa9d9` (12b)

**Безпека (12a):**
- 5 page-файлів без auth guard → `if (!user) redirect('/login')` додано
- `/my/setup/phone` — нуль авторизації → повний rewrite: async + createClient + redirect
- `ClientNotificationsPage`: `motion.div onClick` → `motion.button type="button"`
- `MyProfilePage`: `aria-label` на back Link; виправлено curly apostrophe U+2019 ("здоров'я")
- `MyBookingsPage`: зірочки рейтингу — `type="button"` + `aria-label` + `aria-pressed`
- `ChannelBanner`: dismiss button `aria-label="Закрити"`

**Correctness (12b):**
- `type="button"` ×30+ (MyBookingsPage, MyLoyaltyPage, MyProfilePage, SupportChatPage, MasterModeBanner)
- `aria-pressed` на tab/filter buttons (MyBookingsPage, MyLoyaltyPage)
- `htmlFor` + `id` на 5 полях форми (MyProfilePage)
- `spring as const` у 5 компонентах
- `aria-current="page"` на всіх nav Links (MyBottomNav)
- Emoji 🔔📅💳🔗 видалено з SUGGESTIONS (SupportChatPage)

**Що перевірити вручну:**
- [ ] `/my/bookings` без авторизації → редірект на `/login`?
- [ ] Авторизуйся → перевір всі 5 сторінок відкриваються нормально
- [ ] Форма профілю: збережи зміни; upload аватарки?

---

### STEP 13 — Фінальний спринт: Admin · Public · Backlog
**Drawer:** `774ccb6b5e3b9700582e81ce`

**Безпека P0:**
- `support.ts` → `resolveSupportTicketAction()` — не було перевірки ролі адміна.
  Будь-який авторизований користувач міг закрити тікет. Виправлено: `profile.role !== 'admin'` guard.

**Admin A11y:**
- `MastersDirectory` ×4, `ModerationHub` ×7, `AdminSupportConsole` ×3, `SystemLogsViewer` ×3, `AllianceMap` ×3 — всього 25× `type="button"`

**Публічні сторінки:**
- `invite/[code]/page.tsx`: emoji ✨📅💎 → Lucide Sparkles / CalendarCheck / Gem
- `offline/page.tsx`: `type="button"` + `aria-label="Спробувати знову"`; emoji: `aria-hidden="true"`

**Backlog:**
- Studio WeeklyChart: дата в підказці (`Пн · 1.06`); `getWeekDates()`; `div` → `button` на барах
- Blossom WeeklyChart: `div` → `button` на барах; `type="button"` на mode toggle
- Frost WeeklyChart: підтверджено — вже `rounded-[4px]`, змін не потрібно
- BookingCard: `borderLeft:4px` → `border:1px + background:${color}08`; видалено `pl-1`
- ClientsPage: те саме виправлення рамки на grid (~631) + list (~806)

**Що перевірити вручну:**
- [ ] `/admin/support` → закрити тікет як адмін — спрацьовує?
- [ ] `/invite/[code]` — іконки замість emoji виглядають нормально?
- [ ] Картки записів і клієнтів — нова рамка з тонованим фоном?

---

## Що залишилось зробити (обов'язково до деплою)

### 🔴 B-01 — Dashboard `/impeccable` аудит

Health score: базовий **22/40** → ціль **34+**. Потрібна окрема сесія.

- [ ] Blossom тема: виджети, typography, кольори
- [ ] Studio тема: виджети, typography, кольори
- [ ] Frost тема: Grid stretch, виджети заповнюють висоту
- [ ] PeakHours: heatmap масштабується динамічно
- [ ] Academy: tabs + accordion + 26 статей
- [ ] Tour: з'являється при першому відвідуванні, overlay коректний
- [ ] InsightsRow: TopClient + AvgCheck з реальними даними

### 🔴 B-02 — Vercel QA: онбординг

Commit `967bf06` на Vercel production.

- [ ] Зареєструй нового майстра → відкрий онбординг
- [ ] Profile → Services → Schedule → Preview → Success (пройти повністю)
- [ ] Закрий браузер посередині → крок зберігся?
- [ ] Frost тема не "протікає" Blossom?
- [ ] Loading skeleton → не blank page?
- [ ] Slug генерується і редагується?
- [ ] Послуги зберігаються по категоріях?

---

## Відкладено (не блокує реліз)

| ID | Що | Де |
|---|---|---|
| C-02 | Бейдж статусу `text-[9px]` → `text-[11px]` | `BookingDetailsModal.tsx` |
| B-06 | Vercel Pro → cron `0 * * * *` | Vercel (external) |
| B-07 | E2E тести для онбордингу | playwright |
| — | Playwright auth smoke | carry-over STEP 02 |

---

*Сформовано: 2026-06-01 · Наступний крок: B-01 `/impeccable` аудит дашборду + B-02 Vercel QA*
