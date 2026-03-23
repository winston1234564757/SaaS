Act as an Elite Senior Full-stack Architect. 
Поточна задача: Ітерація 1.1. Ліквідація "Background Tab Deadlock" (зависання після тривалого простою вкладки).

СИМПТОМАТИКА:
Коли користувач залишає сайт у фоновій вкладці на 5+ хвилин, а потім повертається і переходить на іншу сторінку (клієнтський роутинг Next.js) — дані не завантажуються. UI зависає у стані `pending` (вічний спінер). Допомагає лише ручне оновлення сторінки (F5).

ПРИЧИНА:
Браузер тротлить фонові процеси. Збивається синхронізація Supabase Auth Session, а React Query (`QueryClient`) не може успішно зрезолвити suspended-запити через протухлий токен або втрачене з'єднання.

ВИКОНАЙ НАСТУПНИЙ ХІРУРГІЧНИЙ ПЛАН:

1. **Глобальний Wake-up для TanStack Query (`src/lib/providers/QueryProvider.tsx`)**:
   - Налаштуй `defaultOptions` для `QueryClient`. 
   - Встанови `refetchOnWindowFocus: true` та `refetchOnReconnect: true`.
   - Налаштуй адекватний `staleTime` (наприклад, 1-2 хвилини), щоб фокус вікна не спамив бекенд, але гарантовано оновлював застарілі дані.
   - Встанови `gcTime` (колишній cacheTime) більше, ніж `staleTime` (наприклад, 10-15 хвилин).

2. **Примусове відновлення Supabase Auth Session (Visibility Change)**:
   - Створи логіку (наприклад, у кореневому layout або Client Provider), яка слухає подію `visibilitychange` на `document` або використовує `focusManager.setEventListener` з `@tanstack/react-query`.
   - Коли `document.visibilityState === 'visible'`, виконай примусовий виклик `supabase.auth.getSession()` або `supabase.auth.refreshSession()`, щоб гарантувати, що токен живий ПЕРЕД тим, як React Query або Server Actions почнуть тягнути нові дані.

3. **Захист від Dead Promises (Error/Timeout Boundaries)**:
   - Перевір існуючі `useQuery` виклики. Якщо запит зависає довше певного часу (через мережевий збій при виході зі сплячого режиму), він має падати в Error Boundary, а не крутити спінер вічно. 

ОБМЕЖЕННЯ:
- Не зламай SSR. Усі слухачі подій (`window`, `document`) повинні ініціалізуватися ТІЛЬКИ на клієнті (`useEffect` або перевірка `typeof window !== 'undefined'`).
- Забезпеч строгу типізацію. Після імплементації надай короткий звіт про зміни.