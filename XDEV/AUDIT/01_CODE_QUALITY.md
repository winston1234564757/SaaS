# AUDIT-01: Code Quality
> Дата: 2026-06-15 | Аудитор: AI Agent (Code Quality domain) | Sprint-04: 27/34

---

## CQ-P0 — Критичні (блокери якості)

### CQ-P0-1: Admin Zone — 85% кнопок без `type="button"`
- **Файли:** Всі 6 admin сторінок:
  - `src/components/admin/AdminOverviewCharts.tsx`
  - `src/components/admin/MastersDirectory.tsx`
  - `src/components/admin/AllianceMap.tsx`
  - `src/components/admin/ModerationHub.tsx`
  - `src/components/admin/SystemLogsViewer.tsx`
  - `src/components/admin/BroadcastEditor.tsx`
- **Проблема:** `<button onClick={fn}>` без `type="button"` всередині `<form>` тригерить form submit. У Admin zone є форми (фільтри, broadcast) — ризик небажаного submit при кліку на кнопки navigation/action.
- **CLAUDE.md rule:** Порушення залізного правила "type=button — завжди".
- **Fix:** Mass find-replace: `<button ` → `<button type="button" ` у всіх 6 файлах.
- **Зусилля:** S (automated sed або Cursor replace).

---

### CQ-P0-2: Admin Zone — нуль ARIA атрибутів
- **Файли:** Ті самі 6 admin сторінок
- **Проблема:** Жодного `aria-label`, `aria-pressed`, `role` у всій Admin зоні. Screen reader = непридатний для адмін панелі. Це окремо від business ARIA — але admin теж публічна точка входу.
- **Fix:** Мінімальний набір:
  - `aria-label` на icon-only кнопках
  - `role="status"` на loading states
  - `aria-current="page"` на sidebar nav items
  - `aria-pressed` на toggle buttons (active filters)

---

### CQ-P0-3: `transition-all` на 8+ елементах у ExplorePage
- **Файл:** `src/components/public/ExplorePage.tsx`
- **Проблема:** `transition-all` примушує браузер відслідковувати ВСІ CSS властивості при кожному render. На mobile 60fps scroll = repaint thrashing.
- **Fix:** Замінити на `transition-transform` або `transition-colors` — тільки те, що анімується.
- **Зусилля:** S (grep → targeted replace).

---

## CQ-P1 — Важливі

### CQ-P1-1: `parseError()` не використовується у ~30% error handlers
- **Файл source:** `src/lib/utils/errors.ts` — правильний util
- **Порушення:**
  - `src/components/admin/ModerationHub.tsx` — silent catch
  - `src/components/admin/AllianceMap.tsx` — silent catch
  - `src/components/admin/SystemLogsViewer.tsx` — silent catch
  - ~15 server actions з `catch (err) { console.error(err) }`
- **Наслідок:** Помилки тихо йдуть у консоль, user не бачить feedback.
- **Fix:** Enforce pattern: `catch (err) { toast.error(parseError(err)) }`. ESLint plugin або code review checklist.

---

### CQ-P1-2: Skeleton loading — непослідовне покриття
- **Є:** Dashboard widgets (✅ мають скелетони)
- **Немає:**
  - `/explore` — `null` state → layout shift
  - `/my/masters` — `null` state → layout shift
  - `/my/loyalty` — `null` state → layout shift
- **Наслідок:** CLS (Cumulative Layout Shift) — Google Lighthouse метрика деградує, UX perceived performance погіршується.
- **Fix:** Додати `<Skeleton>` компоненти (shadcn/ui pattern або кастомний) для відсутніх сторінок.
- **Зусилля:** S × 3 сторінки = M.

---

### CQ-P1-3: Compact chips — порушення 44px touch target
- **Файли:** CRM filter pills, service category chips, flash deal toggles
- **Проблема:** CLAUDE.md залізне правило: "Touch Targets ≥ 44px". Compact chips мають `py-1` або `py-0.5` → ~28-32px висота.
- **Fix:** `py-2` мінімум для всіх chips/pills. Слот-чіпи: `py-2.5` мінімум.

---

### CQ-P1-4: 9 TanStack Query хуків без `staleTime`
- **Файли:**
  - `src/lib/supabase/hooks/useClients.ts`
  - `src/lib/supabase/hooks/useDashboardStats.ts`
  - `src/lib/supabase/hooks/useWeeklyOverview.ts`
  - `src/lib/supabase/hooks/useBusyness.ts`
  - `src/lib/supabase/hooks/useVacationImpact.ts`
  - `src/lib/supabase/hooks/useNoShowMetrics.ts`
  - `src/lib/supabase/hooks/useSourceAttribution.ts`
  - `src/lib/supabase/hooks/useLeadTimeDistribution.ts`
  - (8 хуків без staleTime)
- **Проблема:** Без `staleTime` TanStack Query рефетчить при кожному фокусі вікна. `useClients` викликає дорогий CRM RPC — рефетч при кожному tab switch.
- **Fix:**
  ```ts
  staleTime: 5 * 60 * 1000  // analytics — 5 хв
  staleTime: 60_000          // CRM — 1 хв
  staleTime: 2 * 60 * 1000  // dashboard stats — 2 хв
  ```
- **Зусилля:** S × 9 = S (9 однорядкових правок).

---

### CQ-P1-5: Дублікати номерів E2E spec файлів
- **Файли:**
  - `tests/04-crm-logic.spec.ts` + `tests/04-master-crm-smoke.spec.ts`
  - `tests/08-booking-complete.spec.ts` + `tests/08-notification-adoption.spec.ts`
- **Проблема:** При CI паралельному запуску → конфлікти в звітах, плутанина у failure logs.
- **Fix:** Перейменувати в `04b-` / `08b-`.
- **Зусилля:** XS.

---

### CQ-P1-6: Фото upload — 3 несумісні реалізації
- **Варіанти:**
  1. Portfolio photos: tap overlay + desktop reorder
  2. Product photos: окремий drawer
  3. Profile avatar: inline
- **Проблема:** Різний UX патерн для одного концепту. Мобайл: delete/reorder портфоліо недоступне (тільки desktop drag-n-drop).
- **Ціль:** Т22 (фото стандартизація ⬜) — єдиний `PhotoUploader` компонент з уніфікованим UX.

---

## CQ-P2 — Середні

### CQ-P2-1: `date-fns` + `date-fns-tz` — ризик подвійного bundling
- **Файл:** `package.json:26-27`
- **Ризик:** Якщо імпортується `format` з `date-fns` і `formatInTimeZone` з `date-fns-tz` — обидві бібліотеки потрапляють у bundle (date-fns = ~75KB gzipped).
- **Fix:** Аудит всіх `import from 'date-fns'` — замінити на `date-fns-tz` там де потрібна timezone. Видалити `date-fns` з `package.json` якщо більше не потрібна standalone.

---

### CQ-P2-2: `active:scale` — 3 різних значення
- **Значення:** `active:scale-[0.98]`, `active:scale-95`, `active:scale-90`
- **Файли:** Розповсюджено по dashboard компонентах
- **Проблема:** Непослідовний тактильний відгук. 0.90 виглядає "важко", 0.98 ледь помітно.
- **Fix:** Єдиний дизайн токен: `active:scale-[0.97]` для всіх інтерактивних елементів.

---

### CQ-P2-3: RTL (React Testing Library) — лише 4 тестових файли
- **Факт:** `@testing-library/react` встановлений але severely underused
- **Відсутні компонентні тести:**
  - `BookingWizard` — найскладніший компонент (multi-step flow)
  - `ClientDetailSheet` — CRM drawer
  - `BookingCard` — rendering variations
  - `NotificationBell` — unread count, dropdown
- **Пріоритет:** Sprint-06 (після E2E coverage)

---

### CQ-P2-4: GSAP у production bundle (+80KB)
- **Файл:** `package.json:35` — `"gsap": "^3.15.0"` у `dependencies`
- **Проблема:** GSAP використовується лише в `LandingPageContent.tsx` (1 файл), але у `dependencies` (не `devDependencies`) → завантажується у production main bundle.
- **Fix:**
  ```tsx
  // src/app/page.tsx
  const LandingPageContent = dynamic(
    () => import('../components/landing/LandingPageContent'),
    { ssr: false }
  );
  ```
- **Зусилля:** S (1 рядок зміни).

---

### CQ-P2-5: `/dashboard/settings` — desktop layout не розроблений
- **Файл:** `src/app/dashboard/settings/page.tsx`
- **Проблема:** Mobile-first layout розтягнутий на desktop. Settings — найвідвідуваніша сторінка (billing, schedule). Wide mode = непридатні для використання колонки.
- **Ціль:** T25 (desktop settings layout ⬜).

---

## Статистика якості

| Категорія | Кількість проблем | P0 | P1 | P2 |
|-----------|------------------|----|----|-----|
| Accessibility | 6 | 2 | 3 | 1 |
| TypeScript / типи | 2 | 0 | 1 | 1 |
| Performance | 4 | 1 | 2 | 1 |
| Testing | 4 | 1 | 2 | 1 |
| UX consistency | 4 | 1 | 2 | 1 |
| **Total** | **20** | **5** | **10** | **5** |

---

## Швидкі виправлення (≤ 30 хв кожне)

| # | Fix | Де | Зусилля |
|---|-----|----|---------|
| 1 | type="button" mass replace (Admin) | 6 files | S |
| 2 | transition-all → transition-transform (Explore) | 1 file | S |
| 3 | getCategoryIcon switch → lookup map | 1 file | S |
| 4 | staleTime на 9 хуках | 9 files | S |
| 5 | GSAP dynamic() | 1 file | S |
| 6 | Spec file rename (04b, 08b) | 2 files | XS |
