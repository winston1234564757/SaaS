# Bookit Data Architecture Audit & Optimization Plan

> **Мета**: Проаналізувати розподіл даних між сторінками, виявити надмірність, запропонувати логічне об'єднання функціоналу та нові точки росту для преміального SaaS досвіду.

---

## 1. Dashboard — "Command Center" (`/dashboard`)

Поточний стан: Висока концентрація оперативних даних.

| Поточні дані | Джерело | Рекомендація |
|:---|:---|:---|
| **Записи сьогодні** | `bookings` | Додати "Завантаженість %" (Ratio: booked / working hours). |
| **Виручка (Today/Prev)** | `bookings` | Перенести в Analytics, на Дашборді залишити лише "Progress to Goal". |
| **Channel Health** | `profiles` | **ОБ'ЄДНАТИ** з "Marketing Insights" у віджет "System Power". |
| **Free Slots** | `smartSlots` | Додати кнопку "Поділитися вікнами" (generate short-link). |
| **Insights Row** | AI/Logic | **НОВЕ**: "Retention Alert" — список клієнтів, які мали записатися, але не зробили цього. |

### 💡 Пропозиція: "Revenue Forecast"
Замість простої статистики минулого, додати віджет **"Прогноз до кінця місяця"**, що базується на поточному темпі записів та середньому чеку.

---

## 2. CRM — "Client Intelligence" (`/dashboard/clients`)

Поточний стан: Найбільш насичений даними модуль.

| Поточні дані | Джерело | Рекомендація |
|:---|:---|:---|
| **Safety & Health** | `profiles` | **ПЕРЕНЕСТИ** у верхню частину `ClientDetailSheet` як "Critical Info". |
| **Vibe Tags** | Manual | **ОБ'ЄДНАТИ** з "Preferences" (кава, тиша, улюблений стиль). |
| **LTV Prediction** | Logic | Відображати яскравіше в Grid View для "Whales" (клієнтів з високим LTV). |
| **Retention Status** | RPC | **НОВЕ**: "Next Predicted Visit" (AI аналіз періодичності). |
| **History** | `bookings` | Додати "No-show rate" (відсоток прогулів). |

### 💡 Пропозиція: "Client Timeline"
Замість списку "Recent Bookings", зробити візуальний таймлайн з фото робіт (з Портфоліо) поруч із записами.

---

## 3. Marketing Hub — "Growth Engine" (`/dashboard/marketing`)

Поточний стан: Розпорошений між `marketing`, `flash`, `loyalty`, `referral`.

| Поточні дані | Джерело | Рекомендація |
|:---|:---|:---|
| **Broadcasts** | `broadcasts` | Залишити основним інструментом. |
| **Flash Deals** | `flash_deals` | **ПЕРЕНЕСТИ** сюди як "Quick Sales". |
| **Loyalty** | `loyalty` | **ПЕРЕНЕСТИ** сюди як "Retention Programs". |
| **Referrals** | `referrals` | **ПЕРЕНЕСТИ** сюди як "Viral Growth". |

### 💡 Пропозиція: "Unified Marketing Dashboard"
Створити єдину сторінку Marketing, де видно ефективність кожного каналу (Flash приніс X, Реферали — Y). Зараз ці дані в різних місцях.

---

## 4. Portfolio & Services — "The Showcase"

Поточний стан: `services` та `portfolio` існують паралельно.

| Поточні дані | Джерело | Рекомендація |
|:---|:---|:---|
| **Service Price** | `services` | Додати "Profitability Score" (Price / Duration). |
| **Portfolio Items** | `portfolio` | **ОБ'ЄДНАТИ**: у списку послуг показувати кращі роботи для кожної послуги. |
| **Reviews** | `reviews` | Прив'язати відгук до конкретного Portfolio Item для Social Proof. |

### 💡 Пропозиція: "Upsell Engine"
У редакторі послуг додати поле "Рекомендовані послуги" (Cross-sell) та "Add-ons" (маленькі послуги, що збільшують чек).

---

## 5. Нові системні сутності (Roadmap)

1.  **Inventory Intelligence (`/dashboard/products`)**:
    *   Зараз: Тільки "Stock".
    *   Додати: "Cost Price" → "Net Profit" (Виручка мінус собівартість матеріалів).
2.  **Financial Intelligence (`/dashboard/revenue`)**:
    *   Об'єднати `billing` (витрати на сервіс) та `bookings` (дохід).
    *   Додати "Tax Estimator" та "Expense Tracker".
3.  **Team Management (`/dashboard/studio`)**:
    *   Показники ефективності кожного майстра (Retention rate майстра).

---

## 🏗️ Архітектурні зміни (Next Steps)

1.  **Data Consolidation**: Перенести логіку розрахунку LTV та Retention з клієнтських компонентів у єдиний `useBusinessIntelligence` хук.
2.  **UI Unification**: Використовувати `UrlActionBus` для всіх переходів між модулями (напр. з Аналітики прямо в "Create Broadcast" для сегмента, що просідає).
3.  **Premium Polish**: Додати "Pulse" анімації для віджетів з критичними даними (напр. клієнт в зоні ризику).
