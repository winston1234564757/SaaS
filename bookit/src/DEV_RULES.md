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

### Правило: keepPreviousData — обов'язково для хуків із динамічним queryKey.

Якщо `queryKey` містить параметри що змінюються користувачем (дата, preset, фільтр) — завжди додавай `placeholderData: keepPreviousData`. Без цього при кожній зміні параметра UI відображає порожній скелетон.

```ts
import { keepPreviousData } from '@tanstack/react-query';

// ПРАВИЛЬНО — UI зберігає старі дані поки нові вантажаться
useQuery({
  queryKey: ['analytics-v2', masterId, startDate, endDate],
  queryFn: ...,
  placeholderData: keepPreviousData,
});

// НЕПРАВИЛЬНО — при зміні startDate/endDate → бланк + spinner 1-2 секунди
useQuery({
  queryKey: ['analytics-v2', masterId, startDate, endDate],
  queryFn: ...,
  // немає placeholderData
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
