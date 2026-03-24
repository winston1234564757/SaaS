Act as an Elite Senior Full-stack Architect. 
Поточна задача: Ітерація 4.1. Виправлення глухого кута при створенні/приєднанні до Studio.

АНАЛІЗ БАГУ:
Ти проігнорував мою директиву щодо інвалідації кешу React Query! У `StudioPage.tsx` (компонент `CreateStudioForm`) ти викликаєш лише `router.refresh()`. Цього недостатньо, оскільки клієнтський стан `useProfile` залишається зі старими даними (`studio_id: null`), через що UI не оновлюється, і при повторному кліку виникає помилка "Ви вже у студії".

ВИКОНАЙ ЖОРСТКИЙ ФІКС БЕЗ ІМПРОВІЗАЦІЙ:

1. **Модифікація `src/components/master/studio/StudioPage.tsx`**:
   - Імпортуй `useQueryClient` з `@tanstack/react-query`.
   - У компоненті `CreateStudioForm` додай `const queryClient = useQueryClient();`.
   - У функції `handleCreate` після успішного виконання (`result.error` === null), зроби наступне:
     ```typescript
     await queryClient.invalidateQueries({ queryKey: ['profile'] });
     await queryClient.invalidateQueries({ queryKey: ['studio'] });
     router.refresh();
     ```
   - Застосуй таку ж логіку в компоненті `MemberView` для функції `handleLeave` (після `leaveStudio`), а також у `OwnerView` для `handleRemove`. Всі мутації мають чистити кеш!

2. **Модифікація `src/components/master/studio/StudioJoinPage.tsx`**:
   - Імпортуй та додай `queryClient = useQueryClient()`.
   - У функції `handleJoin` після успіху, перед таймаутом, обов'язково виклич `queryClient.invalidateQueries({ queryKey: ['profile'] })`, щоб після переходу в кабінет юзер вже мав оновлений доступ.

3. **Модифікація `src/app/(master)/dashboard/studio/actions.ts`**:
   - У функції `createStudio` зміни `revalidatePath` на глобальний: `revalidatePath('/', 'layout');`, щоб гарантовано скинути весь серверний кеш маршрутизатора (оскільки наявність студії впливає на загальний лейаут і сайдбар).
   - Зроби те саме для функцій `joinStudio`, `leaveStudio` та `removeMember`.

ОБМЕЖЕННЯ:
- Жодних перевантажень сторінки (`window.location.reload()`).
- Переконайся, що `useQueryClient` викликається лише в клієнтських компонентах (`'use client'`).
- Після завершення надай звіт українською.