# План виправлення нарахування реферальних бонусів

Користувачі скаржаться, що бонуси (PRO-тариф для майстрів та 50% знижки для клієнтів) не нараховуються при реєстрації. Ми переробимо логіку в `src/app/(auth)/register/actions.ts`, щоб зробити її атомарною та стійкою до помилок.

## User Review Required

> [!IMPORTANT]
> Ми змінимо поведінку `upsert` у `claimMasterRole`. Замість `ignoreDuplicates: true` (який ігнорував оновлення, якщо профіль вже існував), ми будемо оновлювати поля підписки та реферера, якщо вони ще не встановлені.

> [!WARNING]
> Ми виділимо логіку "хто власник коду" в окремий блок, який перевірятиме обидві таблиці (`master_profiles` та `client_profiles`) паралельно для швидкості та надійності.

## Proposed Changes

### 1. Серверні дії: Реєстрація та Нагороди

#### [MODIFY] [actions.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/app/(auth)/register/actions.ts)
- Оновити функцію `claimMasterRole`:
    - Додати логіку пошуку реферера в обох таблицях.
    - Реалізувати Scenario A (Client Code): нарахування PRO новому майстру та створення запису в `client_promocodes`.
    - Реалізувати Scenario B (Master Code): нарахування PRO обом майстрам.
    - Використати `upsert` без `ignoreDuplicates: true`, щоб гарантувати оновлення даних при повторних спробах реєстрації.
- Аналогічно оновити `createMasterProfileAfterSignup` для підстраховки.

## Verification Plan

### Automated Tests
- Зареєструвати майстра за кодом клієнта. Перевірити:
    1. У нового майстра `subscription_tier = 'pro'`.
    2. У таблиці `client_promocodes` з'явився запис зі знижкою 50%.
    3. Викликано rpc `increment_client_master_invite_count`.

### Manual Verification
- Перевірити логи сервера на наявність повідомлень `[claimMasterRole] Client-to-Master (Barter) applied`.
- Перевірити БД через Supabase Dashboard.
