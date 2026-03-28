# Bookit — Правила розробки

## 1. MasterProvider — завжди передавати initialData з сервера

`MasterProvider` приймає `initialUser`, `initialProfile`, `initialMasterProfile`.
Коли компонент рендериться всередині `(master)/layout.tsx` — ці props ЗАВЖДИ передаються.

```tsx
// (master)/layout.tsx — Server Component
const [{ data: profile }, { data: masterProfile }] = await Promise.all([
  supabase.from('profiles').select('*').eq('id', user.id).single(),
  supabase.from('master_profiles').select('*').eq('id', user.id).maybeSingle(),
]);

return (
  <DashboardLayout
    initialUser={user}
    initialProfile={profile ?? null}
    initialMasterProfile={masterProfile ?? null}
  >
    {children}
  </DashboardLayout>
);
```

**Чому:** без initialData `isLoading=true` і всі хуки disabled (~300–800ms), що спричиняє F5-reload ефект.
**Виняток:** `onboarding/layout.tsx` — новий користувач, немає master_profile, MasterProvider без props — нормально.

---

## 2. isLoading у хуках з `enabled: !!masterId` — завжди з guard

```ts
// ПРАВИЛЬНО
return { data, isLoading: isLoading && !!masterId };

// НЕПРАВИЛЬНО — disabled query має isPending=true в деяких builds TanStack Query v5
return { data, isLoading };
```

**Чому:** коли `masterId=undefined` (query disabled), `isLoading` може бути `true` → нескінченний скелетон.

---

## 3. queryClient.invalidateQueries() — тільки з конкретним queryKey

```ts
// ПРАВИЛЬНО
queryClient.invalidateQueries({ queryKey: ['vacation', masterId] });

// ПРАВИЛЬНО (тільки для pull-to-refresh) — інвалідує лише активно підписані queries
queryClient.invalidateQueries({ type: 'active' });

// НЕПРАВИЛЬНО — скидає весь кеш, каскад loading-станів по всьому dashboard
queryClient.invalidateQueries();
```

**Чому:** `profile`/`masterProfile` не зберігаються в TanStack Query — вони в MasterContext. Після збереження налаштувань достатньо `refresh()`.

---

## 4. Оновлення profile/masterProfile — тільки через refresh()

```ts
// ПРАВИЛЬНО
await refresh(); // оновлює MasterContext з БД

// НЕ ПОТРІБНО після refresh()
queryClient.invalidateQueries(); // зайвий виклик — profile не в TanStack Query
```

---

## 5. Supabase client — singleton на клієнті

`createClient()` (client.ts) повертає singleton на браузері. Не створювати вручну поза хуками.
Для мутацій всередині хуків — `createClient()` завжди повертає той самий інстанс.

---

## 6. useMutation — завжди isPending, ніколи isLoading

```ts
// TanStack Query v5 — ПРАВИЛЬНО
const { isPending } = useMutation({ ... });

// НЕПРАВИЛЬНО (v4 API)
const { isLoading } = useMutation({ ... });
```

---

## 7. onSuccess у mutations — завжди invalidateQueries з ключем

```ts
const mutation = useMutation({
  mutationFn: async (...) => { ... },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['vacation', masterId] }),
});
```

---

## 8. Admin client — тільки з @/lib/supabase/admin

```ts
// ПРАВИЛЬНО
import { createAdminClient } from '@/lib/supabase/admin';

// НЕПРАВИЛЬНО — inline service role key
const admin = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY);
```

---

## 9. Server Actions — revalidatePath після мутацій

Якщо Server Action змінює дані, що кешуються Next.js — обов'язково `revalidatePath`.
Для даних у TanStack Query (не Next.js cache) — `invalidateQueries` на клієнті достатньо.

---

## 10. Типізація — ніколи не анотувати Supabase builder arrays як Promise<unknown>[]

```ts
// ПРАВИЛЬНО — TypeScript виведе тип автоматично
const ops = [supabase.from('a').insert(...), supabase.from('b').update(...)];
await Promise.all(ops);

// НЕПРАВИЛЬНО
const ops: Promise<unknown>[] = [...];
```

---

## 11. DATA FETCHING & STATE MANAGEMENT

### Правило: Server Actions = Мутації ТІЛЬКИ. Читання = Browser Client + React Query.

```ts
// ПРАВИЛЬНО — читання через browser client у queryFn
const { data } = useQuery({
  queryKey: ['bookings', masterId, dateFrom, dateTo],
  queryFn: async () => {
    const supabase = createClient(); // browser client — singleton
    const { data } = await supabase.from('bookings').select('*').eq('master_id', masterId!);
    return data;
  },
});

// НЕПРАВИЛЬНО — Server Action для читання
const { data } = useQuery({
  queryFn: async () => {
    return await getBookingsAction(masterId); // 'use server' — зайвий roundtrip
  },
});
```

### Правило: keepPreviousData — тільки для "рефайнмент" фільтрів, НЕ для перемикання дат.

Використовуй `placeholderData: keepPreviousData` коли зміна queryKey є **уточненням** тих самих даних (пагінація, аналітичний період). **НЕ використовуй** для перемикання між принципово різними наборами даних (дні, тижні — записи на понеділок ≠ записи на вівторок).

```ts
import { keepPreviousData } from '@tanstack/react-query';

// ПРАВИЛЬНО — аналітика: той самий дашборд, інший період
useQuery({
  queryKey: ['analytics-v2', masterId, startDate, endDate],
  queryFn: ...,
  placeholderData: keepPreviousData,
});

// НЕПРАВИЛЬНО — записи: день A → день B = різні набори, покаже записи з A у день B
useQuery({
  queryKey: ['bookings', masterId, dateFrom, dateTo],
  queryFn: ...,
  placeholderData: keepPreviousData, // ❌ покаже 5 записів з понеділка у пустий вівторок
});
```

Показувати фоновий рефетч через `isFetching`, не через `isLoading`:

```ts
const { data, isLoading, isFetching, isPlaceholderData } = useQuery({ ... });

// isLoading — тільки перший завантаження (немає даних взагалі)
// isFetching — будь-який фоновий рефетч (оновлення дати, фокус вкладки)
// isPlaceholderData — показуємо попередні дані

// ПРАВИЛЬНО — guard щоб уникнути skeleton при placeholder
return { data, isLoading: isLoading && !isPlaceholderData };
```

### Заборонено: `getSession()` у queryFn

```ts
// ЗАБОРОНЕНО — блокує queryFn до завершення token refresh
queryFn: async () => {
  await supabase.auth.getSession(); // причина вічного спінера
  ...
}

// ДОЗВОЛЕНО — тільки в event handlers (handleSave, etc.)
```

---

## 12. Stale Tab Recovery — focusManager + getSession()

Після тривалого фонового режиму (PWA згорнуто, вкладка неактивна) Supabase JWT може протухнути. 
Але що гірше — **iOS PWA часто повністю вбиває/заморожує JavaScript** і під час повернення в додаток може **не відправити** події `visibilitychange` або `focus`.

### Правильне рішення: 2 механізми (QueryProvider.tsx)
1. **`useSessionWakeup`**: Слухає стандартні події `visibilitychange`. При пробудженні швидко оновлює токен через `await supabase.auth.getSession()` та каже TanStack Query зробити `onFocus()`.
2. **`useDeepSleepWakeup` (Heartbeat)**: Тихий інтервал, який кожні 5 секунд працює у фоні. Якщо JS був "заморожений" ОС (> 3-х хвилин розрив між викликами інтервалу), це означає що користувач явно повернувся до додатка з тривалого фону. Змушуємо бекграунд-рефетч через `queryClient.invalidateQueries({ type: 'active' })`.

```ts
// ПРАВИЛЬНО — heartbeat детектор (useDeepSleepWakeup)
const interval = setInterval(async () => {
    const elapsed = Date.now() - lastTime;
    if (elapsed > 180_000) { // 3 хвилини
      // 1. Оновити токен
      await supabase.auth.getSession();
      // 2. Змусити TQ перезавантажити активні хуки без skeleton-loading
      queryClient.invalidateQueries({ type: 'active' });
    }
    lastTime = Date.now();
}, 5000);
```

**Чому:** `refetchOnWindowFocus: true` працює ідеально для вкладок Chrome, але цього **недостатньо** для iOS PWAs (Home Screen Apps), які обходять стандартний JS Event Loop. Поєднання listener + heartbeat гарантує 100% свіжі дані.

---

## 13. Realtime — один канал на таблицю

Всі Supabase Realtime підписки для таблиці `bookings` консолідовані в `useRealtimeNotifications`. Це єдиний хук, де дозволено `.channel()` для bookings.

```ts
// ПРАВИЛЬНО — єдиний канал в useRealtimeNotifications
// Інвалідує: bookings, wizard-schedule, dashboard-stats,
// weekly-overview, notifications, monthly-booking-count, clients

// ЗАБОРОНЕНО — окремі канали в useDashboardStats, useWeeklyOverview, etc.
// Кожен канал = окреме WebSocket-з'єднання = 4× батарея/мережа
```

**Чому:** Кожен `.channel()` — це окреме WebSocket-з'єднання до Supabase. На мобільному 4 канали замість 1 — це 4× батарея та мережевих з'єднань.

---

## 14. Supabase запити — `.limit()` для bulk queries

Будь-який запит що може повернути необмежену кількість рядків **ОБОВ'ЯЗКОВО** має мати `.limit()`.

```ts
// ПРАВИЛЬНО
supabase.from('bookings').select('*').eq('master_id', id).limit(5000);

// ЗАБОРОНЕНО — 10,000+ записів завантажаться на клієнт
supabase.from('bookings').select('*').eq('master_id', id);
```

**Виняток:** single-row запити (`.single()`, `.maybeSingle()`), count запити (`{ count: 'exact', head: true }`).

---

## 15. CSS — GPU та мобільна швидкодія

- `will-change: transform` для animated елементів (blobs, cards)
- `contain: strict` для ізоляції layout/paint
- `@media (prefers-reduced-motion: reduce)` — зупиняти декоративні анімації
- Grain overlay — тільки desktop (`@media (hover: hover)`)
- Backdrop-filter — уникати на мобільних де це спричиняє frame drops
