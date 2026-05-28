# Phase 1.5 — Auth UX Redesign + Tour Persistence

**Дата:** 2026-04-06
**Статус:** Approved
**Scope:** Auth flow redesign (role selection, Google OAuth fix, OTP fix) + onboarding tour DB persistence

---

## 1. Контекст

Після 23 ітерацій і повного security audit виявлені критичні UX-тертя в auth flow:
- Вибір ролі (Клієнт/Майстер) похований у toggle всередині картки — новий юзер його не помічає
- Google OAuth: після відміни popup `isGoogleLoading = true` назавжди (кнопка блокується)
- OTP auto-submit: race condition між `setTimeout(80ms)` і stale `digits` state
- Dashboard tour: тільки `localStorage` → показується знову на кожному новому пристрої

---

## 2. Auth Flow Redesign

### 2.1 Структура URL

- `/register` → HTTP 301 redirect до `/login`
- `/login` → рендерить `PhoneOtpForm` (єдина точка входу)
- Причина: OTP flow сам визначає `isNew` через `verify-sms` — штучна різниця між login і register не потрібна

### 2.2 Кроки PhoneOtpForm

```
step: 'role' → 'phone' → 'otp'
```

**Step "role"** — повний екран вибору:

```
Заголовок: "Ласкаво просимо до Bookit"
Підзаголовок: "Як ви хочете використовувати сервіс?"

[Картка Клієнт]   [Картка Майстер]
 UserRound icon    Scissors icon
 "Я Клієнт"       "Я Майстер"
 "Записуюсь до     "Керую записами,
  майстрів онлайн"  клієнтами та доходом"

[Продовжити]

"Повертаєшся? Увійти" / "Вперше тут? Реєстрація" (обидва → /login)
```

Стан картки:
- Обрана: border `#789A99`, bg `#789A99/8`, checkmark icon у правому верхньому куті
- Необрана: border `#E8D0C8`, bg white, hover border `#C4A89E`

Анімація вибору: `scale(1.02)` + `border-color` transition 150ms.

**Step "phone"** — role badge зверху:
- `[← Клієнт]` або `[← Майстер]` — клікабельний badge, повертає на 'role'
- Google OAuth button
- Divider "Або через SMS"
- Поле телефону з +38 префіксом
- CTA "Отримати код"

**Step "otp"** — без структурних змін, тільки bug fixes.

### 2.3 Fix #1 — Google OAuth Rate Limit / Loading Stuck

**Проблема:** після відміни OAuth redirect юзер повертається на `/login`, але `isGoogleLoading = true`. Повторний клік — `signInWithOAuth` викликається двічі швидко → Supabase rate limit.

**Рішення:**
```typescript
// 1. Window focus listener — скидає loading коли юзер повертається
useEffect(() => {
  const reset = () => setIsGoogleLoading(false);
  window.addEventListener('focus', reset);
  return () => window.removeEventListener('focus', reset);
}, []);

// 2. Guard від дублікатів
async function handleGoogleLogin() {
  if (isGoogleLoading) return;
  setIsGoogleLoading(true);
  setError('');
  try {
    const { error } = await supabase.auth.signInWithOAuth({ ... });
    if (error) { setIsGoogleLoading(false); setError(error.message); }
    // якщо успіх → редирект відбувається, loading залишається true до переходу
  } catch {
    setIsGoogleLoading(false);
    setError('Помилка входу через Google. Спробуйте ще раз.');
  }
}
```

### 2.4 Fix #2 — OTP Auto-Submit Race Condition

**Проблема:** `handleDigitChange` запускає `setTimeout(() => handleVerifyOtp(), 80)`. За 80ms `digits` state може ще не оновитись (stale closure). Результат: `otp.length < 6` → помилка при неповному вводі.

**Рішення:** передавати `otp` напряму, не читати зі state:

```typescript
function handleDigitChange(index: number, val: string) {
  const char = val.replace(/\D/g, '').slice(-1);
  const next = [...digits];
  next[index] = char;
  setDigits(next);
  setError('');
  if (char && index < 5) digitRefs.current[index + 1]?.focus();
  if (next.every(d => d !== '') && char) {
    setTimeout(() => handleVerifyOtp(next.join('')), 80);
  }
}

// handleVerifyOtp приймає опціональний otpOverride
async function handleVerifyOtp(otpOverride?: string) {
  const otp = otpOverride ?? digits.join('');
  if (otp.length < 6) return; // silent guard, не показуємо error
  // ... решта логіки
}
```

---

## 3. Tour Persistence

### 3.1 Міграція 058

```sql
-- supabase/migrations/058_has_seen_tour.sql
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN NOT NULL DEFAULT FALSE;
```

### 3.2 Server Action

```typescript
// src/app/(master)/dashboard/actions.ts (додати)
'use server';
export async function markTourSeen() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const admin = createAdminClient();
  await admin.from('master_profiles')
    .update({ has_seen_tour: true })
    .eq('id', user.id);
}
```

### 3.3 DashboardTourProvider

Приймає `initialHasSeenTour: boolean` prop:

```typescript
export function DashboardTourProvider({
  children,
  initialHasSeenTour,
}: {
  children: React.ReactNode;
  initialHasSeenTour: boolean;
}) {
  const [tourStep, setTourStep] = useState(-1);

  useEffect(() => {
    if (initialHasSeenTour) return; // DB flag → не показуємо
    const val = localStorage.getItem(LS_KEY);
    if (val === null) {
      localStorage.setItem(LS_KEY, 'in-progress');
      const t = setTimeout(() => setTourStep(0), 1000);
      return () => clearTimeout(t);
    }
  }, [initialHasSeenTour]);

  function closeTour() {
    setTourStep(-1);
    localStorage.setItem(LS_KEY, 'true');
    void markTourSeen(); // fire-and-forget
  }

  // handleNextStep аналогічно
}
```

### 3.4 Dashboard Layout

```typescript
// src/app/(master)/dashboard/layout.tsx
// Додати has_seen_tour до select master_profiles
const { data: masterProfile } = await supabase
  .from('master_profiles')
  .select('..., has_seen_tour')
  .eq('id', user.id)
  .single();

// Передати в DashboardTourProvider
<DashboardTourProvider initialHasSeenTour={masterProfile?.has_seen_tour ?? false}>
```

---

## 4. Файли до змін

| Файл | Тип |
|------|-----|
| `src/components/auth/PhoneOtpForm.tsx` | Major refactor |
| `src/app/(auth)/register/page.tsx` | → redirect 301 |
| `src/app/(auth)/login/page.tsx` | Minor metadata fix |
| `src/components/master/dashboard/DashboardTourContext.tsx` | + initialHasSeenTour prop |
| `src/app/(master)/dashboard/layout.tsx` | + has_seen_tour в select + prop |
| `src/app/(master)/dashboard/actions.ts` | + markTourSeen |
| `supabase/migrations/058_has_seen_tour.sql` | New |

---

## 5. Що НЕ змінюємо

- `useTour.ts` — залишається для інших (не dashboard) турів
- `claimMasterRole`, `createMasterProfileAfterSignup` — без змін
- `/auth/callback/route.ts` — без змін
- API routes `send-sms`, `verify-sms` — без змін
- Дизайн-система, кольори, токени — без змін

---

## 6. Тестування

- [ ] Вибір ролі → Клієнт → Google OAuth → redirect до `/my/bookings`
- [ ] Вибір ролі → Майстер → SMS OTP → новий майстер → `/dashboard/onboarding`
- [ ] Вибір ролі → Майстер → SMS OTP → існуючий майстер → `/dashboard`
- [ ] Google OAuth: відміна → повернення на login → кнопка розблокована
- [ ] Google OAuth: повторний клік (double-click) → тільки один запит
- [ ] OTP: вставка 6 цифр clipboard → auto-submit без помилки
- [ ] Tour: перший вхід → тур показується
- [ ] Tour: закрити тур → новий пристрій/браузер → тур НЕ показується
