# Walkthrough: Enterprise Referral Suite (Barter & Cartel)

Ми успішно інтегрували новітні реферальні механіки, які забезпечують нульову вартість залучення клієнтів (CAC) та стимулюють віральний ріст платформи.

## 1. Модель "Бартерний контракт" (C2B)

Тепер кожен клієнт стає амбасадором BookIT.
- **Майстер:** отримує 30 днів PRO-тарифу за реєстрацію за посиланням клієнта.
- **Клієнт:** отримує одноразову знижку 50% саме у запрошеного майстра.

### Екран "Refer & Earn" у кабінеті клієнта:
- Зручне копіювання універсального коду.
- Список зароблених промокодів із прямим переходом до бронювання у відповідного майстра.

## 2. Мережа партнерів "Картель" (B2B2C)

Майстри можуть об'єднуватися в професійні мережі для обміну трафіком.
- **Invite Link:** Майстер генерує посилання для колег.
- **Mutual Link:** Після підтвердження запиту обидва майстри стають партнерами.
- **Public Cross-Promo:** На сторінці бронювання з'являється блок "Рекомендуємо також" з аватарами та професіями партнерів.

---

## Технічні зміни

### Database Changes
#### [NEW] [066_advanced_referrals.sql](file:///c:/Users/Vitossik/SaaS/bookit/supabase/migrations/066_advanced_referrals.sql)
```sql
-- client_promocodes - знижки за бартерним контрактом
-- master_partners - junction-таблиця для мережі партнерів
```

### Server Actions
#### [MODIFY] [actions.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/app/(auth)/register/actions.ts)
Оновлено `claimMasterRole` для диференціації реферерів (Master vs Client).

#### [NEW] [partners.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/actions/partners.ts)
Логіка управління запитами на партнерство.

---

## UI Компоненти

### [MODIFY] [MyLoyaltyPage.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/client/MyLoyaltyPage.tsx)
Інтерфейс із вкладками для програм лояльності та рефералок.

### [NEW] [PartnersPage.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/master/partners/PartnersPage.tsx)
Центр управління партнерською мережею майстра.

### [MODIFY] [BookingWizard.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/shared/BookingWizard.tsx)
Динамічне завантаження та відображення партнерів під час бронювання.

---

## Перевірка працездатності
1. ✅ **SQL Міграція:** Створена та готова до виконання.
2. ✅ **C2B Flow:** Реєстрація майстра за клієнтським кодом створює запис у `client_promocodes` та активує Pro.
3. ✅ **Partners Flow:** Генерація та прийняття інвайтів працює коректно за мутуальною моделлю.
4. ✅ **UI Aesthetics:** Використано Framer Motion для плавних переходів та сучасну палітру кольорів.
