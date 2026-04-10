# План виправлення - Pricing Engine Bugfix

Ми виявили дві критичні причини, чому знижки перестали застосовуватися. Основна — некоректне отримання дати через `toISOString()`, що зміщувало слот на день назад.

## User Review Required

> [!IMPORTANT]
> **Математика сумарної знижки (40% Cap):** 
> Я пропоную змінити розрахунок так, щоб ліміт у 40% стосувався **всіх** знижок сумарно (Dynamic + Loyalty + Flash). 
> Якщо Dynamic Pricing дає знижку 20%, а Loyalty ще 30%, то сумарна знижка буде обмежена до 40% від оригінальної ціни. 
> Націнки (markup) у пікові години не обмежуються цим лімітом.

## Proposed Changes

### 1. Виправлення дати (Bug 4.1)

#### [MODIFY] [dynamicPricing.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/utils/dynamicPricing.ts)
- Видалити `toISOString().split('T')[0]`.
- Впровадити надійний метод отримання локальної дати у форматі `YYYY-MM-DD` без UTC-зміщення.
- Це гарантує, що `slotDateTime` створюється на правильний день, і `hoursAhead` буде позитивним для майбутніх слотів.

### 2. Корекція ліміту знижок (Bug 5.1)

#### [MODIFY] [createBooking.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/actions/createBooking.ts)
- Змінити розрахунок `finalTotal`:
    1. Рахуємо `originalTotal` (Services + Products без жодних знижок).
    2. Рахуємо `requestedDynamicDiscount = originalServicesPrice - adjustedServicesPrice`.
    3. Рахуємо `totalRequestedDiscount = requestedDynamicDiscount + loyaltyDiscountAmount + flashDealAmount`.
    4. Якщо `totalRequestedDiscount > 0` (тобто це знижка, а не націнка), обмежуємо її до `originalTotal * 0.40`.
    5. `finalTotal = originalTotal - effectiveDiscount`.

### 3. Перевірка БД (Профілактика)

#### [MODIFY] [createBooking.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/actions/createBooking.ts)
- Видалити спроби запису у колонки `discount_amount` та `loyalty_label`, якщо вони ще не існують у схемі (я перевірю схему через `view_file` типів ще раз, але про всяк випадок буду обережним). *Примітка: в попередньому кроці я бачив, що я їх додав у код запису, але в типах `Booking` їх немає.*

## Verification Plan

### Automated Tests
- Оновити `scratch/debugPricing.ts` для перевірки правильності вибору дати.
- Запустити build для перевірки типів.

### Manual Verification
1. Створити правило `last_minute` і переконатися, що ціна у віджеті бронювання зменшується.
2. Перевірити, що при поєднанні знижок вони не перевищують 40%.
