# Bookit — CTO Audit Report
> Дата: 2026-03-12 | Статус: MVP Phase 1

---

## EXECUTIVE SUMMARY

Проект має міцну основу (правильний стек, хороша структура, TanStack Query, RLS), але є **3 критичні блокери** які ламають production UX прямо зараз, і кілька системних проблем, які накопичуватимуть технічний борг.

---

## 1. АРХІТЕКТУРНІ РОЗБІЖНОСТІ

### 🔴 КРИТИЧНО: `middleware.ts` ВІДСУТНІЙ

**Проблема:** Файл `middleware.ts` у корені проекту не існує взагалі.

Supabase SSR (`@supabase/ssr`) вимагає middleware для **refresh сесії між запитами** — без нього OAuth cookies не зберігаються між redirect і наступним page load.

**Наслідки:**
- Google OAuth: після `exchangeCodeForSession` cookies встановлюються у response callback, але наступний redirect на `/dashboard` читає cookies через middleware якого немає → сесія пуста → редірект на landing/login
- Email auth працює бо форма робить прямий POST без додаткового redirect, cookies зберігаються одразу
- Dashboard (`/dashboard`) не має server-side auth guard зовсім — DashboardLayout є `'use client'` без redirect, захищає тільки через MasterProvider (client-side)

### 🟠 Відсутній auth guard у dashboard layout

`src/app/(master)/layout.tsx` просто рендерить `<DashboardLayout>` без будь-якої перевірки авторизації на сервері. Якщо middleware немає — неавторизований юзер може потрапити на `/dashboard` і побачити порожній UI.

`src/app/my/layout.tsx` — правильно: робить `redirect('/login')` на сервері. ✅

### 🟠 View Mode (Master as Client) — не реалізовано

Майстри теж ходять до інших майстрів. Потрібна кнопка "Перейти в режим клієнта" в Settings, яка ставить cookie `view_mode=client` і пускає майстра на `/my/bookings`.

### 🟡 Timezone bug (декілька місць)

`toISOString().slice(0, 10)` використовується в `BookingFlow.tsx` (рядок 51). При UTC+2 і часі близько до опівночі дає **неправильну дату**. Правило в MEMORY.md каже "ніколи не використовувати toISOString" — але функція `toLocalDateStr()` не винесена в утиліту.

---

## 2. КРИТИЧНІ ПРОГАЛИНИ (Missing Features)

| # | Функціонал | Стан | Де |
|---|-----------|------|----|
| M1 | `middleware.ts` (Supabase SSR) | ❌ Відсутній | — |
| M2 | Auth guard у `/dashboard` layout | ❌ Відсутній | `(master)/layout.tsx` |
| M3 | View mode (master→client cookie) | ❌ Відсутній | Settings + middleware |
| M4 | `/explore` — може бути порожня через відсутність `is_published=true` в БД | ⚠️ Код OK, дані? | `explore/page.tsx` |
| M5 | Portfolio upload UI | ❌ Відсутній | `dashboard/portfolio` |

**Що вже зроблено (і це добре):**
- ✅ Відгуки (27) — повністю
- ✅ Скасування запису (29) + Telegram нотифікація
- ✅ Repeat booking (28) — з фіксом initialStep
- ✅ PWA: sw.js, manifest.json, ServiceWorkerRegistration
- ✅ `explore/page.tsx` — Server Component + admin client + SEO
- ✅ `auth/callback/route.ts` — логіка ролей коректна

---

## 3. ПЛАН ХІРУРГІЧНОГО ВТРУЧАННЯ

### Фаза 1 — Auth & Routing (НАЙВИЩИЙ пріоритет)

**Час:** 1 сесія

1. **Створити `middleware.ts`** у корені `src/`:
   - Supabase `updateSession()` для refresh cookies
   - Захист `/dashboard/*` → redirect `/login` якщо немає user
   - Захист `/my/*` → redirect `/login` (перенести з layout)
   - Cookie `view_mode=client` → майстер на `/my/*` не редіректиться

2. **Додати server-side redirect у `(master)/layout.tsx`**:
   - `getUser()` → якщо немає → `redirect('/login')`
   - Якщо є але роль !== 'master' → `redirect('/my/bookings')`

3. **View Mode кнопка у Settings**:
   - Кнопка "Перейти в режим клієнта" → `document.cookie = 'view_mode=client'` + `router.push('/my/bookings')`
   - В `/my/` layout — кнопка "Назад до дашборду" якщо роль = 'master' + `view_mode=client`

### Фаза 2 — Data Layer

**Час:** 1 сесія

1. **`/explore`** — перевірити що майстри мають `is_published=true` у БД (код правильний)
2. **Services/Products CRUD** — перевірити hooks передачу `masterId`
3. **Профіль** — перевірити RLS UPDATE для `profiles` + `master_profiles`

### Фаза 3 — Бізнес-логіка

**Час:** 1-2 сесії

1. **CRM** — перевірити trigger `update_client_master_metrics()`, функція "Завершити візит"
2. **Portfolio upload** — UI в `/dashboard/portfolio`
3. **Email/Telegram** — error handling

### Фаза 4 — Quality & Polish

1. Винести `toLocalDateStr()` в `src/lib/utils/dates.ts` і замінити всюди
2. N+1 в ClientsPage → SQL aggregation view
3. CSV injection fix
4. `.env.example`

---

## ВИСНОВОК ДЛЯ СТАРТУ

**Перший крок сьогодні — Фаза 1, Пункт 1: `middleware.ts`**

Без цього Google OAuth broken на production і `/dashboard` не захищений. Все інше — вторинне.

```
middleware.ts не існує
  → OAuth сесія не зберігається між redirect
    → User кидає на landing при першому OAuth
    → З другої спроби (якщо cookies вже є) — OK
```
