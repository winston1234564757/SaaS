# 🕹️ Button Action & URL Map — BookIT

Цей документ описує всі активні кнопки, що ведуть до значущих змін UI або навігації, та їх статус переходу на "URL Action Bus" / "Terminal Deep Linking".

---

## 🏠 Dashboard Home (`/dashboard`)

| Кнопка / Елемент | Ціль (Target) | Поточний метод | Статус |
|---|---|---|---|
| **Quick Actions: Записи** | `/dashboard/bookings` | `Link` | ✅ Terminal |
| **Quick Actions: Клієнти** | `/dashboard/clients` | `Link` | ✅ Terminal |
| **Quick Actions: Flash-акції** | `?drawer=flash_deals` | `nuqs` | ✅ Terminal |
| **Greeting: Найближчий запис** | `?bookingId={id}` | `Link` | ✅ Terminal |
| **Schedule: Картка запису** | `?bookingId={id}` | `router.push` | ✅ Terminal |
| **Schedule: Кнопка "Усі"** | `/dashboard/bookings` | `Link` | ✅ Terminal |

---

## 👥 Clients CRM (`/dashboard/clients`)

| Кнопка / Елемент | Ціль (Target) | Поточний метод | Статус |
|---|---|---|---|
| **Картка клієнта (клік)** | `ClientDetailSheet` | `?clientPhone={phone}` → `router.push` | ✅ Terminal (Back = закрити) |
| **Кнопка "Записати"** | `ManualBookingForm` з prefill | `openBookingForClient(client)` (local) | 🟡 Local OK (wizard не потребує URL) |
| **Smart-дія (Sparkles)** | `PopUpModal` (Action) | `setShowSmartAction(client)` | 🟡 Internal (ephemeral action) |
| **Кнопка "Розсилка" (Top)** | `/dashboard/marketing?tab=broadcasts` | `router.push` | ✅ Terminal |
| **Segment Chips** | Фільтрація списку | `useState` | 🟡 Internal (OK) |

---

## 📅 Bookings CRM (`/dashboard/bookings`)

| Кнопка / Елемент | Ціль (Target) | Поточний метод | Статус |
|---|---|---|---|
| **Слот календаря (клік)** | `BookingDetailsModal` | `?bookingId={id}` | ✅ Terminal |
| **Кнопка "Створити запис"** | `BookingWizard` | `_action=booking:create` | ✅ Action Bus |
| **Вільне вікно на таймлайні** | `ManualBookingForm` з `initialTime` | `OpportunityMenu` → `setFormOpen` | 🟡 Local OK (transient pick) |
| **Кнопка "Перенести"** | `ReschedulePanel` | `useState` (in modal) | 🟡 Modal internal |

---

## 📦 Products & Orders (`/dashboard/products`)

| Кнопка / Елемент | Ціль (Target) | Поточний метод | Статус |
|---|---|---|---|
| **Tabs: Товари / Замовлення** | Перемикання списків | `?tab=products\|orders` → `router.replace` | ✅ Terminal |
| **Кнопка "Додати товар"** | `ProductFormDrawer` | `?productId=new` → `router.replace` | ✅ Terminal |
| **Картка: Редагувати** | `ProductFormDrawer` | `?productId={id}` → `router.replace` | ✅ Terminal |
| **Картка: Поповнити склад** | `RestockDrawer` | `?restockId={id}` → `router.replace` | ✅ Terminal |

---

## ✂️ Services (`/dashboard/services`)

| Кнопка / Елемент | Ціль (Target) | Поточний метод | Статус |
|---|---|---|---|
| **Кнопка "Додати послугу"** | `/dashboard/services/new` | `Link` / `router.push` | ✅ Terminal |
| **Картка: Редагувати** | `/dashboard/services/{id}` | `router.push` | ✅ Terminal |

---

## 📢 Marketing & Growth (`/dashboard/marketing`)

| Кнопка / Елемент | Ціль (Target) | Поточний метод | Статус |
|---|---|---|---|
| **Tabs: Сторіс / Розсилки** | Перемикання табів | `?tab=stories\|broadcasts` → `router.replace` | ✅ Terminal |
| **Кнопка "Нова розсилка"** | `BroadcastEditor` | `useUrlActionBus('marketing:broadcast')` | ✅ Action Bus |
| **Growth: Loyalty** | `?drawer=loyalty` | `nuqs` | ✅ Terminal |
| **Growth: Referral** | `?drawer=referral` | `nuqs` | ✅ Terminal |
| **Growth: Partners** | `?drawer=partners` | `nuqs` | ✅ Terminal |

---

## 🖼️ Portfolio (`/dashboard/portfolio`)

| Кнопка / Елемент | Ціль (Target) | Поточний метод | Статус |
|---|---|---|---|
| **Кнопка "Додати"** | `/dashboard/portfolio/new` | `router.push` | ✅ Terminal (No-Modals) |
| **Картка: Редагувати** | `/dashboard/portfolio/{id}` | `router.push` | ✅ Terminal (No-Modals) |
| **Кнопка "Сторіз"** | `StoryGenerator` | `?drawer=story_generator` → `router.replace` | ✅ Terminal |

---

## 🛠️ Залишок (мінімальний)

### UrlActionBus — опціонально
- [ ] `client:edit` — окрема дія (відкрити шит у режимі редагування нотаток). Низький пріоритет — `client:open` вже покриває цей сценарій.
- [ ] `_action=ui:open_drawer` — унiверсальний виклик drawer по імені (для майбутніх use-case).

---

## ✅ Виконано (цей спринт)

| Що | Деталь |
|---|---|
| **UrlActionBus** | `src/lib/actions/UrlActionBus.ts` — 7 схем, `useUrlActionBus`, `buildActionUrl` |
| **SafetyAlert** | health/medical notes у BookingWizard (master mode) |
| **booking:create consumer** | `BookingsPage` + `PublicMasterPage` підписані, prefill clientId/date/time |
| **marketing:broadcast consumer** | `BroadcastsTab` підписаний, prefill clientIds/templateId |
| **product:edit consumer** | `ProductsPage` підписаний → `?productId={id}` |
| **client:open consumer** | `ClientsPage` підписаний → резолвить clientId → `?clientPhone=` |
| **Clients CRM → Terminal** | `?clientPhone=` в URL, Back = закрити sheet, deep-linkable |
| **Products → Terminal** | `?tab=`, `?productId=`, `?restockId=` |
| **Marketing tabs → Terminal** | `?tab=stories\|broadcasts` через `router.replace` |
| **Portfolio → Terminal** | `?portfolioId=`, `?drawer=story_generator` |
| **BentoBottomNav / QuickActionsWidget** | Аудит пройдений — сумісні, змін не потребують |

---

## ✅ Виконано (цей спринт)

| Що | Деталь |
|---|---|
| **UrlActionBus** | `src/lib/actions/UrlActionBus.ts` — 7 схем, `useUrlActionBus`, `buildActionUrl` |
| **SafetyAlert** | health/medical notes у BookingWizard (master mode) |
| **booking:create consumer** — Bookings | `BookingsPage` підписаний, prefill clientId/date/time |
| **marketing:broadcast consumer** | `BroadcastsTab` підписаний, prefill clientIds/templateId |
| **Clients CRM → Terminal** | `?clientPhone=` в URL, Back = закрити sheet, deep-linkable |
| **Products → Terminal** | `?tab=`, `?productId=`, `?restockId=` |
| **Marketing tabs → Terminal** | `?tab=stories\|broadcasts` через `router.replace` |
