# Action Plan: Fixing Next.js App Router Cache Leaks

## 1. Client-Side Router Cache (Проблема PWA і Pull-to-Refresh)
**Де протікає:** Next.js зберігає зарендерені React Server Components (RSC) у кеші браузера (Router Cache). Навіть якщо `queryClient.invalidateQueries()` оновлює клієнтський стейт React Query, серверні компоненти і їхні пропси залишаються замороженими.
**Рішення:** 
- У [QueryProvider.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/providers/QueryProvider.tsx) та [PullToRefresh.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/ui/PullToRefresh.tsx) додати імпорт `useRouter` з `next/navigation`.
- При поверненні в застосунок (`visibilitychange`) і при свайпі вниз одночасно викликати:
  ```typescript
  router.refresh(); // Змушує Next.js оновити Server Components
  queryClient.invalidateQueries(); // Оновлює Client-side React Query state
  ```

## 2. Server Actions Data Cache (Проблема застарілих даних після мутацій)
**Де протікає:** Якщо Server Action (наприклад, [createBooking.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/actions/createBooking.ts) або зміна статусу запису) успішно зберігає дані в базу, Next.js **не знає**, що кеш застарів, доки йому прямо не сказати.
**Рішення:**
- Пройтись по всім Server Actions, які мутують дані ([createBooking](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/actions/createBooking.ts#60-300), `updateBookingStatus`, `createProduct`, тощо).
- В кінці успішних екшенів додати жорстку інвалідацію:
  ```typescript
  import { revalidatePath } from 'next/cache';
  // після успішного інсерту/апдейту:
  revalidatePath('/', 'layout'); 
  ```
  Це скине кэш для всіх маршрутів і гарантує, що при наступному `router.refresh()` прилетять нові дані.

## 3. Server Components Fetch Caching (Supabase `fetch` in RSC)
**Де протікає:** Supabase `.select()` по дефолту використовує звичайний `fetch`. У Next.js App Router `fetch` у серверних компонентах може агресивно кешуватися (Full Route Cache), якщо немає викликів динамічних функцій (`headers()`, `cookies()`).
**Рішення:**
- Додати `export const dynamic = 'force-dynamic';` у всі ключові [page.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/app/%28master%29/dashboard/page.tsx)/[layout.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/app/%28master%29/layout.tsx) (наприклад, Дашборд, Сторінка Майстра), щоб сторінки ніколи не білдувалися в статичний кеш.

## Механіка синхронізації
Коли користувач повертається в таб (5хв простою):
1. Тригер `visibilitychange` ловить подію.
2. `supabase.auth.getSession()` оновлює токен, щоб не було помилок JWT.
3. `router.refresh()` звертається до сервера і відмальовує нові RSC (враховуючи нові дані, бо кеш Server Actions скинутий).
4. `queryClient.invalidateQueries()` стріляє клієнтськими запитами (якщо є) і оновлює локальний React Query state.
5. Користувач гарантовано бачить свіжі записи без ручного F5.
