# B-14 + B-15 + B-13 — Navbar, PUSH Fix, Flash Notifications

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

## B-15 — PUSH Notification при кожному вході в Settings (P1 Bug)
**Скіл:** `senior-backend`  
**Статус:** TODO

### Проблема
При кожному відкритті сторінки налаштувань приходить PUSH-повідомлення "сповіщення підключені". Це призводить до:
- Спам-відчуття у premium продукті
- Втрати довіри користувача

### Корінь проблеми
Скоріш за все: при вході на `/dashboard/settings` (або при першому завантаженні компонента) виконується перевірка/оновлення PUSH токена, яка тригерить відправку "confirmation" push.

### Файли для перевірки
1. `bookit/src/app/(master)/dashboard/settings/page.tsx`
2. `bookit/src/components/master/settings/SettingsPage.tsx`
3. `bookit/src/lib/notifications/NotificationOrchestrator.ts`
4. `bookit/src/app/api/notifications/` — API endpoints
5. Шукати `push_subscriptions`, `registerPush`, `subscribePush`

### Кроки аудиту
1. `Grep "push\|subscribe\|token" bookit/src/components/master/settings/` — знайти де тригерується
2. `Grep "sendPush\|notif.*settings" bookit/src/lib/notifications/` — знайти dispatch
3. Знайти умову що відправляє "confirmation" push — прибрати або додати `if (!alreadySent)`
4. Фікс: перевіряти чи токен вже збережений ПЕРЕД відправкою confirmation

### QA
- Зайти на Settings 3 рази підряд → жодного PUSH не надходить

---

## B-13 — Flash Deal Notifications: Перевірка (P1 Bug)
**Скіл:** `code-reviewer`  
**Статус:** TODO

### Проблема
Невідомо чи сповіщення від флеш-акції коректно відправляються. Потрібна перевірка.

### Файли
1. `bookit/src/lib/notifications/NotificationOrchestrator.ts` — cascade логіка
2. Flash deal related actions — шукати в `revenue/actions.ts` або `flash/`
3. `Grep "flash_deal\|flash deal" bookit/src/` — знайти всі місця

### Кроки аудиту
1. `Grep "flash" bookit/src/lib/notifications/` — чи є flash deal event
2. `Grep "FLASH\|flash_deal" bookit/src/app/` — знайти server actions
3. Перевірити flow: створення флеш-акції → чи тригерується `NotificationOrchestrator.dispatch`
4. Перевірити типи `notifMap` — чи є `flash_deal` тип
5. Якщо flow відсутній → додати відправку notification при створенні flash deal

### QA
- Створити тест флеш-акцію → перевірити чи прийшло сповіщення клієнтам сегменту

---

## B-14 — Navbar: Профіль Крайній Правий + Notifications FAB
**Пріоритет:** P2 UI  
**Скіл:** `design-taste-frontend`  
**Статус:** TODO

### Проблема (mobile)
Поточний `BentoBottomNav` або navbar:
1. Профіль (налаштування) знаходиться НЕ крайнім правим
2. Сповіщення (notifications bell) у головному navbar
3. Потрібно: notifications → тех.меню + sticky поряд з FAB коли є непрочитані

### Бажаний стан
**Bottom Nav (mobile):**
```
[Home] [Bookings] [Clients] [Marketing] [Profile ←крайній правий]
```

**Notifications:**
- Видалити з головного navbar (або залишити як secondary)
- Додати у тех.меню (more/additional menu)
- Якщо є непрочитані → sticky badge/dot поряд з FAB кнопкою

### Файли
1. `Grep "BentoBottomNav\|BottomNav\|bottom.*nav" bookit/src/components/` — знайти файл
2. Скоріш за все: `bookit/src/components/master/DashboardLayout.tsx` або окремий компонент
3. `bookit/src/components/master/dashboard/NotificationsBell.tsx`

### Кроки виконання
1. `Grep "BentoBottomNav" bookit/src/components/` — знайти точний файл
2. `Read` файл навбару — побачити поточний порядок елементів
3. Перемістити "Профіль" на крайню праву позицію
4. Прибрати NotificationsBell з navbar або перемістити у More/Tech menu
5. Додати sticky notifications indicator поряд з FAB:
   - FAB (+ кнопка швидкого запису) → існує?
   - Якщо є непрочитані notifications → red dot або badge поряд з FAB
6. `design-taste-frontend` для остаточного вигляду

### Важливо
- Touch targets ≥ 44px для всіх nav items
- `aria-current="page"` для активного пункту
- `aria-label` на іконкових кнопках без тексту

### QA
- Mobile: профіль крайнім правим в nav ✅
- Непрочитані сповіщення → badge поряд з FAB ✅
- Прочитані → badge зникає ✅
