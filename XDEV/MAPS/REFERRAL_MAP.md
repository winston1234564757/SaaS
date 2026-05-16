# 🗺️ Мапа реферальних механік BookIT

Цей документ містить повний опис усіх реферальних механік, реалізованих у проекті BookIT, їх технічну логіку, локації в коді та відповідні міграції.

---

## 🚀 Загальний огляд

| Механіка | Тип | Реферер | Реферал | Вигода Реферера | Вигода Реферала | Локація (Code/UI) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B2B Alliance & Bounty** | M2M | Майстер | Новий Майстер | +30 днів Pro, Bounty (−10%), Lifetime Discount (5-50%) | 14-30 днів Pro тріалу | `referrals.ts`, `ReferralPage.tsx` |
| **"Запроси подругу" (C2C)** | C2C | Клієнт | Новий Клієнт | Бонусний баланс у цього майстра | Знижка на перший візит | `createBooking.ts`, `MyLoyaltyPage.tsx` |
| **Barter Contract (C2B)** | C2M | Клієнт | Новий Майстер | Промокод на −50% у нового майстра | 30 днів Pro тріалу | `referrals.ts` (`applyReferralRewards`) |
| **Cartel System** | M2M | Майстер | Партнер | Формальне партнерство (сітка) | — | `066_advanced_referrals.sql` |

---

## 💎 Детальний опис механік

### 1. B2B Referral (Alliance & Bounty)
**Ціль:** Органічний ріст бази майстрів.
- **Локація UI:** Дашборд → Growth Hub → `ReferralPage.tsx`.
- **Логіка:**
    - **Bounty:** Одноразова знижка 10% на наступний білінг за кожну першу оплату реферала. Накопичується в `referral_bounties_pending`.
    - **Alliance (Lifetime):** Постійна знижка на підписку. Росте ступінчасто:
        - 5 активних реф. = 5%
        - 10 активних реф. = 10%
        - 25 активних реф. = 25%
        - 50 активних реф. = 50%
- **Backend:** `src/lib/actions/referrals.ts` (`applyReferralRewards`).
- **БД (Міграції):** 
    - `096_bounty_referral_model.sql` (Bounty & Lifetime logic)
    - `010_master_referrals.sql` (Base structure)
- **Таблиці:** `master_referrals`, `master_alliances`, `referral_grants`.

### 2. C2C Referral ("Запроси подругу")
**Ціль:** Вірусність для кожного окремого майстра.
- **Локація UI:** `PostBookingAuth.tsx` (після успішного запису), `MyLoyaltyPage.tsx`.
- **Умова:** Майстер повинен увімкнути `c2c_enabled = true` у профілі.
- **Логіка:** Клієнт ділиться посиланням `/[slug]?ref=[client_code]`. 
    - **Реферал:** Отримує знижку (напр. 10%) на свій ПЕРШИЙ запис до цього майстра.
    - **Реферер:** Отримує бонусний баланс (RPC `get_c2c_balance`), який можна використати як знижку при наступних записах.
- **Backend:** `src/lib/actions/createBooking.ts` (складна валідація на рядках 332-434).
- **БД (Міграції):** `099_c2c_referral.sql`.
- **Таблиці:** `c2c_referrals`, `c2c_bonus_uses`.

### 3. C2B / C2M (Barter Contract)
**Ціль:** Залучення майстрів через активних клієнтів.
- **Локація UI:** `MyLoyaltyPage.tsx` (секція запрошення майстра).
- **Логіка:** Клієнт запрошує свого майстра (якого немає в BookIT). При реєстрації майстер вводить код клієнта.
    - **Клієнт:** Отримує запис у `client_promocodes` на −50% знижки.
    - **Майстер:** Отримує 30 днів Pro тріалу.
- **Backend:** `referrals.ts` (блок `else if (cReferrer)`).
- **БД (Міграції):** `066_advanced_referrals.sql`.
- **Таблиці:** `client_promocodes`, `client_profiles.total_masters_invited`.

### 4. Cartel System (Master Partnerships)
**Ціль:** Створення мереж майстрів-партнерів.
- **Логіка:** Майстри можуть встановлювати партнерські зв'язки. Це архітектурний базис для майбутніх крос-промо механік.
- **БД (Міграції):** `066_advanced_referrals.sql`.
- **Таблиці:** `master_partners`.

---

## 🛠️ Технічний стан та рекомендації

### Повністю готові (Stable):
- **B2B Alliance:** Логіка та UI повністю функціонують. ✅ Фікс FK 23503 + idempotency (2026-05-15)
- **C2B Barter:** Логіка та UI в кабінеті клієнта готові.

### Критичні баги (виправлені 2026-05-15):
- **B2B FK 23503 Race:** `applyReferralRewards` викликалась ДО створення `master_profiles` → `master_alliances` та `master_referrals` падали з FK error. **Фікс:** 3-Phase pattern в `claimMasterRole`, `createMasterProfileAfterSignup`, `auth/callback/route.ts`.
- **Idempotency → Starter override:** При retry реєстрації `referral_grants` вже існував → повертався `starter` → перезаписував Pro. **Фікс:** idempotency тепер повертає правильний pro-бонус (без повторного нарахування рефереру).

### 3-Phase Pattern (стандарт для всіх registration flows):
```
Phase 1: Upsert master_profiles зі starter (ignoreDuplicates:true) → FK exists
Phase 2: applyReferralRewards → bonus  
Phase 3: Update master_profiles з bonus (тільки якщо finalReferredBy)
```

### Потребують уваги (To-Do):
- **C2C UI:** Майстер має логіку в БД, але **немає перемикача** в налаштуваннях дашборду. Треба додати `C2CSwitch` у `SettingsPage.tsx`.
- **Marketing:** Потрібно додати опис B2B Alliance на лендінг, оскільки це сильна конкурентна перевага (можливість мати Pro безкоштовно, запросивши колег).
- **Analytics:** Додати в Dashboard статистику по C2C конверсіях (скільки нових клієнтів прийшло по рефералці).
