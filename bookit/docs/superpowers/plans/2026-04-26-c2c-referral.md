# C2C Referral Program — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a master-opt-in C2C referral program: clients share a discount link to a specific master, friends get X% off their first visit, referrers accumulate a per-master balance they manually apply to future bookings.

**Architecture:** New migration adds `c2c_enabled/c2c_discount_pct` to `master_profiles` and two new tables (`c2c_referrals`, `c2c_bonus_uses`). A DB trigger marks referrals complete when a linked booking reaches `status='completed'`. Discount is validated and applied inside `createBooking.ts` (server-side). Referrer balance is read via `get_c2c_balance` RPC. UI spans: master loyalty settings, post-booking share nudge, client loyalty tab (two sub-tabs: C2C + C2B).

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (PostgreSQL + RLS + triggers + RPCs), TanStack Query v5, Tailwind CSS v4, Framer Motion, `createAdminClient()` for all server mutations.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/099_c2c_referral.sql` | Create | DB schema: c2c_referrals, c2c_bonus_uses, master_profiles columns, trigger, RPCs |
| `src/types/database.ts` | Modify | Add C2cReferral, C2cBonusUse types + MasterProfile fields |
| `src/components/master/loyalty/LoyaltyPage.tsx` | Modify | Add C2C settings section (toggle + % input + stats) |
| `src/app/(master)/dashboard/loyalty/actions.ts` | Create | `saveMasterC2CSettings` server action |
| `src/lib/actions/referrals.ts` | Modify | Fix `getOrCreateReferralLink` for C2C type |
| `src/app/[slug]/page.tsx` | Modify | Read `searchParams.ref`, fetch c2c discount, pass to PublicMasterPage |
| `src/components/public/PublicMasterPage.tsx` | Modify | Accept + forward `c2cRef` / `c2cDiscountPct` to BookingFlow |
| `src/components/public/BookingFlow.tsx` | Modify | Accept + forward c2c props to BookingWizard |
| `src/components/shared/BookingWizard.tsx` | Modify | Pass c2c props to wizard state + BookingSuccess |
| `src/components/shared/wizard/useBookingWizardState.ts` | Modify | Accept c2c params, fetch referrer balance, expose to confirmation step |
| `src/lib/actions/createBooking.ts` | Modify | Validate C2C ref, apply friend discount, apply referrer bonus, record c2c_bonus_uses |
| `src/components/shared/wizard/BookingSuccess.tsx` | Modify | Show share nudge card when master c2c_enabled |
| `src/app/my/loyalty/page.tsx` | Modify | Load C2C referral data for client |
| `src/components/client/MyLoyaltyPage.tsx` | Modify | Two sub-tabs: "Для подруг" (C2C) + "Запросити майстра" (C2B) |
| `src/components/client/MyProfilePage.tsx` | Modify | Remove old broken C2C block |

---

## Task 1: DB Migration 099

**Files:**
- Create: `bookit/supabase/migrations/099_c2c_referral.sql`

- [ ] **Крок 1: Написати міграцію**

```sql
-- ════════════════════════════════════════════════════════════════
-- 099: C2C Referral Program
-- ════════════════════════════════════════════════════════════════

-- 1. Додаємо поля до master_profiles
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS c2c_enabled      BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS c2c_discount_pct INTEGER  NOT NULL DEFAULT 10
    CONSTRAINT c2c_discount_pct_range CHECK (c2c_discount_pct BETWEEN 1 AND 50);

-- 2. Таблиця відстеження рефералів
CREATE TABLE IF NOT EXISTS c2c_referrals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID        NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  referred_id   UUID        REFERENCES client_profiles(id) ON DELETE SET NULL,
  master_id     UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  booking_id    UUID        UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  discount_pct  INTEGER     NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'expired')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_c2c_referrals_referrer_master
  ON c2c_referrals(referrer_id, master_id);
CREATE INDEX IF NOT EXISTS idx_c2c_referrals_booking
  ON c2c_referrals(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_c2c_referrals_status
  ON c2c_referrals(status) WHERE status = 'completed';

-- 3. Таблиця використання бонусів реферера
CREATE TABLE IF NOT EXISTS c2c_bonus_uses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID        NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  master_id     UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  booking_id    UUID        UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_used INTEGER     NOT NULL CHECK (discount_used BETWEEN 1 AND 80),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_c2c_bonus_uses_referrer_master
  ON c2c_bonus_uses(referrer_id, master_id);

-- 4. RLS
ALTER TABLE c2c_referrals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE c2c_bonus_uses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "c2c_referrals: owner select" ON c2c_referrals;
CREATE POLICY "c2c_referrals: owner select"
  ON c2c_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "c2c_bonus_uses: owner select" ON c2c_bonus_uses;
CREATE POLICY "c2c_bonus_uses: owner select"
  ON c2c_bonus_uses FOR SELECT
  USING (auth.uid() = referrer_id);

GRANT ALL ON c2c_referrals  TO service_role;
GRANT ALL ON c2c_bonus_uses TO service_role;

-- 5. Тригер: bookings.status → 'completed' → c2c_referrals.status = 'completed'
CREATE OR REPLACE FUNCTION fn_c2c_complete_on_booking_done()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE c2c_referrals
    SET status = 'completed'
    WHERE booking_id = NEW.id AND status = 'pending';

    -- In-app notification для реферера
    INSERT INTO notifications (recipient_id, type, title, body, related_booking_id, related_master_id)
    SELECT
      r.referrer_id,
      'c2c_referral_completed',
      'Подруга завершила візит!',
      'Твій реферальний баланс поповнено. Використай його при наступному записі.',
      NEW.id,
      NEW.master_id
    FROM c2c_referrals r
    WHERE r.booking_id = NEW.id AND r.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_c2c_complete ON bookings;
CREATE TRIGGER trg_c2c_complete
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_c2c_complete_on_booking_done();

-- 6. RPC: get_c2c_balance(referrer_id, master_id) → INTEGER
CREATE OR REPLACE FUNCTION get_c2c_balance(p_referrer_id UUID, p_master_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_earned INTEGER;
  v_used   INTEGER;
BEGIN
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE status = 'completed') *
    (SELECT c2c_discount_pct FROM master_profiles WHERE id = p_master_id LIMIT 1),
    0
  ) INTO v_earned
  FROM c2c_referrals
  WHERE referrer_id = p_referrer_id AND master_id = p_master_id;

  SELECT COALESCE(SUM(discount_used), 0) INTO v_used
  FROM c2c_bonus_uses
  WHERE referrer_id = p_referrer_id AND master_id = p_master_id;

  RETURN GREATEST(0, v_earned - v_used);
END;
$$;

REVOKE ALL ON FUNCTION get_c2c_balance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_c2c_balance TO service_role, authenticated;

-- 7. RPC: get_c2c_stats_for_master(master_id) → TABLE
CREATE OR REPLACE FUNCTION get_c2c_stats_for_master(p_master_id UUID)
RETURNS TABLE(total_referrals BIGINT, completed_referrals BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COUNT(*)                                    AS total_referrals,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_referrals
  FROM c2c_referrals
  WHERE master_id = p_master_id;
$$;

REVOKE ALL ON FUNCTION get_c2c_stats_for_master FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_c2c_stats_for_master TO service_role, authenticated;
```

- [ ] **Крок 2: Застосувати міграцію**

```bash
cd bookit && npx supabase db push
```

Очікуваний результат: `Applying migration 099_c2c_referral.sql... done`

- [ ] **Крок 3: Закомітити**

```bash
git add bookit/supabase/migrations/099_c2c_referral.sql
git commit -m "feat(db): add c2c referral program tables and trigger (migration 099)"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `bookit/src/types/database.ts`

- [ ] **Крок 1: Знайти та розширити `MasterProfile` інтерфейс**

Знайти в `src/types/database.ts` інтерфейс `MasterProfile` (або аналогічний тип для `master_profiles`) і додати:

```typescript
c2c_enabled: boolean;
c2c_discount_pct: number;
```

- [ ] **Крок 2: Додати нові інтерфейси**

В кінець файлу (або до відповідної секції) додати:

```typescript
export interface C2cReferral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  master_id: string;
  booking_id: string | null;
  discount_pct: number;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
}

export interface C2cBonusUse {
  id: string;
  referrer_id: string;
  master_id: string;
  booking_id: string;
  discount_used: number;
  created_at: string;
}
```

- [ ] **Крок 3: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

Очікуваний результат: 0 помилок.

- [ ] **Крок 4: Закомітити**

```bash
git add bookit/src/types/database.ts
git commit -m "feat(types): add C2cReferral, C2cBonusUse types and MasterProfile c2c fields"
```

---

## Task 3: Master — C2C Settings in LoyaltyPage

**Files:**
- Create: `bookit/src/app/(master)/dashboard/loyalty/actions.ts`
- Modify: `bookit/src/components/master/loyalty/LoyaltyPage.tsx`

- [ ] **Крок 1: Створити server action**

Створити файл `src/app/(master)/dashboard/loyalty/actions.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const c2cSchema = z.object({
  enabled: z.boolean(),
  discountPct: z.number().int().min(1).max(50),
});

export async function saveMasterC2CSettings(
  enabled: boolean,
  discountPct: number,
): Promise<{ error?: string }> {
  const parsed = c2cSchema.safeParse({ enabled, discountPct });
  if (!parsed.success) return { error: 'Невірні дані' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('master_profiles')
    .update({
      c2c_enabled: parsed.data.enabled,
      c2c_discount_pct: parsed.data.discountPct,
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/loyalty');
  return {};
}
```

- [ ] **Крок 2: Читати поточні c2c-налаштування в LoyaltyPage**

В `src/components/master/loyalty/LoyaltyPage.tsx` знайти хук що завантажує дані майстра (або `useMasterContext`) і додати завантаження `c2c_enabled`, `c2c_discount_pct` з `master_profiles`.

Якщо сторінка використовує `useMasterContext` — дані вже є через `masterProfile`. Якщо ні — додати окремий запит:

```typescript
const { masterProfile } = useMasterContext();
const c2cEnabled = masterProfile?.c2c_enabled ?? false;
const c2cDiscountPct = masterProfile?.c2c_discount_pct ?? 10;
```

- [ ] **Крок 3: Додати state для C2C секції**

В компоненті `LoyaltyPage` додати стан:

```typescript
const [c2cEnabled, setC2cEnabled] = useState(masterProfile?.c2c_enabled ?? false);
const [c2cDiscount, setC2cDiscount] = useState(masterProfile?.c2c_discount_pct ?? 10);
const [c2cSaving, setC2cSaving] = useState(false);
const { showToast } = useToast();

async function handleSaveC2C() {
  setC2cSaving(true);
  const { error } = await saveMasterC2CSettings(c2cEnabled, c2cDiscount);
  setC2cSaving(false);
  if (error) {
    showToast({ type: 'error', title: 'Помилка', message: error });
  } else {
    showToast({ type: 'success', title: 'Збережено' });
  }
}
```

- [ ] **Крок 4: Додати C2C секцію в JSX**

Внизу `LoyaltyPage.tsx`, після існуючих loyalty programs, додати нову секцію:

```tsx
{/* ── C2C Referral Program ─────────────────────────── */}
<div className="bento-card p-5 mt-4">
  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-sm font-semibold text-[#2C1A14]">Реферальна програма клієнтів</p>
      <p className="text-xs text-[#A8928D] mt-0.5">
        Клієнти діляться вашою сторінкою зі знижкою
      </p>
    </div>
    {/* Toggle */}
    <button
      onClick={() => setC2cEnabled(v => !v)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        c2cEnabled ? 'bg-[#789A99]' : 'bg-[#E8D0C8]'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        c2cEnabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  </div>

  {c2cEnabled && (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">
          Знижка для подруги та бонус для клієнта
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={c2cDiscount}
            onChange={e => setC2cDiscount(Number(e.target.value))}
            className="flex-1 accent-[#789A99]"
          />
          <span className="text-sm font-bold text-[#789A99] w-10 text-right">
            {c2cDiscount}%
          </span>
        </div>
        <p className="text-[11px] text-[#A8928D] mt-1">
          Подруга отримає −{c2cDiscount}% на перший візит.
          Клієнт накопить −{c2cDiscount}% на свій наступний запис за кожну подругу що прийшла.
        </p>
      </div>
    </div>
  )}

  <button
    onClick={handleSaveC2C}
    disabled={c2cSaving}
    className="mt-4 w-full py-2.5 rounded-2xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#6B8C8B] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
  >
    {c2cSaving && <Loader2 size={14} className="animate-spin" />}
    Зберегти
  </button>
</div>
```

Переконатись що `Loader2` імпортовано з `lucide-react`.

- [ ] **Крок 5: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 6: Закомітити**

```bash
git add bookit/src/app/'(master)'/dashboard/loyalty/actions.ts \
        bookit/src/components/master/loyalty/LoyaltyPage.tsx
git commit -m "feat(master): C2C referral settings in loyalty page"
```

---

## Task 4: Fix `getOrCreateReferralLink` для C2C

**Files:**
- Modify: `bookit/src/lib/actions/referrals.ts`

- [ ] **Крок 1: Замінити заглушку C2C на реальну логіку**

В `src/lib/actions/referrals.ts` знайти блок `if (targetType === 'C2C')` (зараз повертає помилку) і замінити:

```typescript
if (targetType === 'C2C') {
  if (!targetMasterId) {
    return { success: false, error: 'masterId required for C2C link' };
  }

  const admin = createAdminClient();

  // 1. Отримуємо або генеруємо referral_code клієнта
  const clientCodeRes = await getOrGenerateProfileReferralCode(ownerId, 'client');
  if (!clientCodeRes.success || !clientCodeRes.code) {
    return { success: false, error: clientCodeRes.error || 'Помилка генерації коду' };
  }

  // 2. Отримуємо slug майстра
  const { data: mp } = await admin
    .from('master_profiles')
    .select('slug')
    .eq('id', targetMasterId)
    .maybeSingle();

  if (!mp?.slug) {
    return { success: false, error: 'Майстра не знайдено' };
  }

  const code = clientCodeRes.code;
  const link = `${appUrl}/${mp.slug}?ref=${code}`;
  return { success: true, code, link };
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 3: Закомітити**

```bash
git add bookit/src/lib/actions/referrals.ts
git commit -m "fix(referrals): implement C2C link generation via client referral code + master slug"
```

---

## Task 5: `[slug]/page.tsx` — читати `ref` param

**Files:**
- Modify: `bookit/src/app/[slug]/page.tsx`

- [ ] **Крок 1: Розширити Props і читати ref**

В `src/app/[slug]/page.tsx` знайти сигнатуру компонента. Додати `searchParams` до props:

```typescript
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export default async function MasterPublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { ref: c2cRef } = await searchParams;
  // ... існуючий код ...
```

- [ ] **Крок 2: Валідувати ref та завантажити c2c дані**

Після отримання `masterId` з master_profiles, додати паралельний запит (в існуючий `Promise.all` або окремо):

```typescript
// C2C: якщо є ?ref= — перевіряємо чи код існує і чи майстер увімкнув програму
let c2cDiscountPct: number | null = null;
let validC2cRef: string | null = null;

if (c2cRef && master?.id) {
  const [{ data: clientProfile }, c2cEnabled] = await Promise.all([
    supabase
      .from('client_profiles')
      .select('id')
      .eq('referral_code', c2cRef)
      .maybeSingle(),
    Promise.resolve(master.c2c_enabled && master.c2c_discount_pct),
  ]);

  if (clientProfile && master.c2c_enabled) {
    validC2cRef = c2cRef;
    c2cDiscountPct = master.c2c_discount_pct;
  }
}
```

Переконатись що `master_profiles` SELECT включає `c2c_enabled, c2c_discount_pct`.

- [ ] **Крок 3: Передати в PublicMasterPage**

```tsx
<PublicMasterPage
  master={master}
  // ... існуючі props ...
  c2cRef={validC2cRef}
  c2cDiscountPct={c2cDiscountPct}
/>
```

- [ ] **Крок 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 5: Закомітити**

```bash
git add bookit/src/app/\[slug\]/page.tsx
git commit -m "feat(slug): read and validate C2C ref param, pass to PublicMasterPage"
```

---

## Task 6: PublicMasterPage → BookingFlow → BookingWizard — прокинути props

**Files:**
- Modify: `bookit/src/components/public/PublicMasterPage.tsx`
- Modify: `bookit/src/components/public/BookingFlow.tsx`
- Modify: `bookit/src/components/shared/BookingWizard.tsx`

- [ ] **Крок 1: PublicMasterPage — додати props і передати в BookingFlow**

В `src/components/public/PublicMasterPage.tsx` розширити інтерфейс Props:

```typescript
interface Props {
  master: Master; // існуючий тип
  // ... існуючі props ...
  c2cRef?: string | null;
  c2cDiscountPct?: number | null;
}
```

Знайти де рендериться `<BookingFlow>` або де відкривається wizard, і передати props:

```tsx
<BookingFlow
  // ... існуючі props ...
  c2cRef={c2cRef ?? null}
  c2cDiscountPct={c2cDiscountPct ?? null}
/>
```

- [ ] **Крок 2: BookingFlow — прокинути в BookingWizard**

В `src/components/public/BookingFlow.tsx` розширити props і передати далі:

```typescript
interface BookingFlowProps {
  // ... існуючі ...
  c2cRef?: string | null;
  c2cDiscountPct?: number | null;
}
```

Передати в `<BookingWizard>`:

```tsx
<BookingWizard
  // ... існуючі props ...
  c2cRef={c2cRef ?? null}
  c2cDiscountPct={c2cDiscountPct ?? null}
/>
```

- [ ] **Крок 3: BookingWizard — додати props і передати в useBookingWizardState**

В `src/components/shared/BookingWizard.tsx` розширити props:

```typescript
interface BookingWizardProps {
  // ... існуючі ...
  c2cRef?: string | null;
  c2cDiscountPct?: number | null;
}
```

Передати в хук:

```typescript
const state = useBookingWizardState({
  // ... існуючі params ...
  c2cRef: c2cRef ?? null,
  c2cDiscountPct: c2cDiscountPct ?? null,
});
```

- [ ] **Крок 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 5: Закомітити**

```bash
git add bookit/src/components/public/PublicMasterPage.tsx \
        bookit/src/components/public/BookingFlow.tsx \
        bookit/src/components/shared/BookingWizard.tsx
git commit -m "feat(booking): thread c2cRef and c2cDiscountPct through PublicMasterPage → BookingWizard"
```

---

## Task 7: useBookingWizardState — C2C state + referrer balance

**Files:**
- Modify: `bookit/src/components/shared/wizard/useBookingWizardState.ts`

- [ ] **Крок 1: Додати c2c params в інтерфейс хука**

```typescript
interface UseBookingWizardStateParams {
  // ... існуючі ...
  c2cRef?: string | null;
  c2cDiscountPct?: number | null;
}
```

- [ ] **Крок 2: Додати state для C2C friend discount і referrer balance**

```typescript
// C2C friend discount (передається від master page)
const [c2cFriendDiscount] = useState<number>(c2cDiscountPct ?? 0);
const c2cRefCode = c2cRef ?? null;

// Referrer balance (завантажується якщо user = client і є masterId)
const [referrerBalance, setReferrerBalance] = useState<number>(0);
const [referrerBonusToUse, setReferrerBonusToUse] = useState<number>(0);
```

- [ ] **Крок 3: Завантажити referrer balance при відкритті wizard**

```typescript
useEffect(() => {
  if (!isOpen || mode !== 'client') return;

  async function loadBalance() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.rpc('get_c2c_balance', {
      p_referrer_id: user.id,
      p_master_id: masterId,
    });
    if (typeof data === 'number' && data > 0) {
      setReferrerBalance(data);
    }
  }

  loadBalance();
}, [isOpen, masterId, mode]);
```

- [ ] **Крок 4: Повернути нові значення з хука**

```typescript
return {
  // ... існуючі ...
  c2cRefCode,
  c2cFriendDiscount,
  referrerBalance,
  referrerBonusToUse,
  setReferrerBonusToUse,
};
```

- [ ] **Крок 5: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 6: Закомітити**

```bash
git add bookit/src/components/shared/wizard/useBookingWizardState.ts
git commit -m "feat(wizard): add C2C friend discount state and referrer balance loading"
```

---

## Task 8: BookingWizard — UI для знижки і балансу

**Files:**
- Modify: `bookit/src/components/shared/BookingWizard.tsx`

- [ ] **Крок 1: Показати C2C discount badge на кроці підтвердження (details)**

Знайти в `BookingWizard.tsx` крок `'details'` або `'confirmation'` — де показується фінальна ціна. Додати badge якщо `c2cFriendDiscount > 0`:

```tsx
{state.c2cFriendDiscount > 0 && (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5C9E7A]/10 border border-[#5C9E7A]/20">
    <Gift size={14} className="text-[#5C9E7A]" />
    <span className="text-xs font-medium text-[#5C9E7A]">
      Знижка за запрошенням −{state.c2cFriendDiscount}% застосована
    </span>
  </div>
)}
```

- [ ] **Крок 2: Показати referrer balance якщо є**

Після badge знижки, на кроці деталей:

```tsx
{state.referrerBalance > 0 && (
  <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#D4935A]/10 border border-[#D4935A]/20">
    <div className="flex items-center gap-2">
      <Gift size={14} className="text-[#D4935A]" />
      <span className="text-xs font-semibold text-[#D4935A]">
        Реферальний баланс: {state.referrerBalance}%
      </span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#6B5750]">Використати:</span>
      <div className="flex gap-1 flex-wrap">
        {[0, Math.min(10, state.referrerBalance), Math.min(20, state.referrerBalance), Math.min(state.referrerBalance, 80)]
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .map(v => (
            <button
              key={v}
              onClick={() => state.setReferrerBonusToUse(v)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                state.referrerBonusToUse === v
                  ? 'bg-[#D4935A] text-white'
                  : 'bg-white/60 text-[#6B5750] hover:bg-white'
              }`}
            >
              {v === 0 ? 'Не зараз' : `−${v}%`}
            </button>
          ))}
      </div>
    </div>
  </div>
)}
```

- [ ] **Крок 3: Передати c2c дані в createBooking при сабміті**

Знайти в `BookingWizard.tsx` або `useBookingWizardState.ts` місце де викликається `createBooking(payload)` і додати:

```typescript
const payload = {
  // ... існуючі поля ...
  referral_code_used: state.c2cRefCode ?? null,
  c2c_referrer_bonus: state.referrerBonusToUse > 0 ? state.referrerBonusToUse : null,
};
```

- [ ] **Крок 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 5: Закомітити**

```bash
git add bookit/src/components/shared/BookingWizard.tsx
git commit -m "feat(wizard): show C2C discount badge and referrer balance selector on confirmation step"
```

---

## Task 9: `createBooking.ts` — C2C валідація і знижки

**Files:**
- Modify: `bookit/src/lib/actions/createBooking.ts`

- [ ] **Крок 1: Додати `c2c_referrer_bonus` до schema**

Знайти `const schema = z.object({...})` і додати поле:

```typescript
c2c_referrer_bonus: z.number().int().min(1).max(80).optional().nullable().default(null),
```

- [ ] **Крок 2: Розширити master_profiles SELECT**

Знайти рядок 138:
```typescript
.select('subscription_tier, pricing_rules, dynamic_pricing_extra_earned, telegram_chat_id, is_published, timezone')
```
Замінити на:
```typescript
.select('subscription_tier, pricing_rules, dynamic_pricing_extra_earned, telegram_chat_id, is_published, timezone, c2c_enabled, c2c_discount_pct')
```

- [ ] **Крок 3: Додати C2C friend validation після секції 7.5 (loyalty engine)**

Після блоку loyalty engine (після рядка ~286) додати нову секцію:

```typescript
// ── 7.6. C2C Friend Discount ──────────────────────────────────────────────
let c2cFriendDiscountPct = 0;
let c2cReferrerId: string | null = null;

if (p.source === 'online' && p.referral_code_used && (mp as any).c2c_enabled) {
  const { data: referrerProfile } = await admin
    .from('client_profiles')
    .select('id')
    .eq('referral_code', p.referral_code_used)
    .maybeSingle();

  if (referrerProfile) {
    // Перевірка: новий клієнт до цього майстра
    const { count: existingBookingsCount } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', p.masterId)
      .eq('client_id', resolvedClientId ?? '')
      .neq('status', 'cancelled');

    // Самореферал заборонено
    const isSelfReferral = resolvedClientId && referrerProfile.id === resolvedClientId;

    if (!isSelfReferral && (existingBookingsCount ?? 0) === 0) {
      c2cFriendDiscountPct = (mp as any).c2c_discount_pct as number;
      c2cReferrerId = referrerProfile.id;
    }
  }
}

// ── 7.7. C2C Referrer Bonus ──────────────────────────────────────────────
let c2cReferrerBonusPct = 0;

if (p.source === 'online' && p.c2c_referrer_bonus && resolvedClientId) {
  // Перевіряємо баланс server-side
  const { data: balance } = await admin.rpc('get_c2c_balance', {
    p_referrer_id: resolvedClientId,
    p_master_id: p.masterId,
  });

  const availableBalance = typeof balance === 'number' ? balance : 0;
  if (p.c2c_referrer_bonus <= availableBalance) {
    c2cReferrerBonusPct = p.c2c_referrer_bonus;
  }
}
```

- [ ] **Крок 4: Включити C2C знижки в discount resolution (секція 7.8)**

Знайти блок "7.6. Comprehensive Discount Resolution" (тепер стане 7.8) і додати C2C знижки:

```typescript
// C2C знижки від originalTotal
const c2cFriendAmount   = c2cFriendDiscountPct > 0
  ? Math.round(originalTotal * c2cFriendDiscountPct / 100) : 0;
const c2cReferrerAmount = c2cReferrerBonusPct > 0
  ? Math.round(originalTotal * c2cReferrerBonusPct / 100) : 0;

// Додати до totalDiscounts
const totalDiscounts = dynamicDiscount + loyaltyDiscountAmount + flashDealAmount
  + c2cFriendAmount + c2cReferrerAmount;
```

Оновити `dynamic_pricing_label` в INSERT:

```typescript
dynamic_pricing_label: [
  dynamicResult?.label,
  loyaltyLabel || null,
  c2cFriendDiscountPct > 0 ? `Реф. програма −${c2cFriendDiscountPct}%` : null,
  c2cReferrerBonusPct > 0  ? `Реф. бонус −${c2cReferrerBonusPct}%`   : null,
].filter(Boolean).join(', ') || null,
```

- [ ] **Крок 5: Після INSERT bookings — зберегти C2C записи**

Після блоку "11. Mark flash deal" (рядок ~419) додати:

```typescript
// 12b. C2C friend referral record
if (c2cReferrerId && c2cFriendDiscountPct > 0) {
  await admin.from('c2c_referrals').insert({
    referrer_id:  c2cReferrerId,
    referred_id:  resolvedClientId,
    master_id:    p.masterId,
    booking_id:   bookingId,
    discount_pct: c2cFriendDiscountPct,
    status:       'pending',
  });
}

// 12c. C2C referrer bonus use record
if (resolvedClientId && c2cReferrerBonusPct > 0) {
  await admin.from('c2c_bonus_uses').insert({
    referrer_id:   resolvedClientId,
    master_id:     p.masterId,
    booking_id:    bookingId,
    discount_used: c2cReferrerBonusPct,
  });
}
```

- [ ] **Крок 6: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 7: Закомітити**

```bash
git add bookit/src/lib/actions/createBooking.ts
git commit -m "feat(createBooking): C2C friend discount validation and referrer bonus application"
```

---

## Task 10: BookingSuccess — Share Nudge

**Files:**
- Modify: `bookit/src/components/shared/wizard/BookingSuccess.tsx`

- [ ] **Крок 1: Розширити props**

```typescript
interface BookingSuccessProps {
  // ... існуючі ...
  masterSlug: string;
  c2cEnabled?: boolean;
  c2cDiscountPct?: number;
  clientReferralCode?: string | null;
}
```

- [ ] **Крок 2: Завантажити referral code клієнта (якщо c2cEnabled)**

```typescript
const [shareLink, setShareLink] = useState<string | null>(null);
const [shareCopied, setShareCopied] = useState(false);

useEffect(() => {
  if (!c2cEnabled || !clientUserId) return;
  // Завантажуємо referral code
  import('@/lib/actions/referrals').then(({ getOrCreateReferralLink }) => {
    // masterId треба отримати окремо — передаємо через props
    getOrCreateReferralLink(clientUserId, 'client', 'C2C', masterSlug).then(res => {
      if (res.success) setShareLink(res.link);
    });
  });
}, [c2cEnabled, clientUserId, masterSlug]);
```

**Примітка:** `getOrCreateReferralLink` вже виправлена в Task 4. Але для BookingSuccess нам потрібен masterId, а не masterSlug. Оскільки BookingSuccess вже знає `masterName`, потрібно також передати `masterId`.

Замість `masterSlug` — передати `masterId` як prop і викликати `getOrCreateReferralLink(clientUserId, 'client', 'C2C', masterId)`.

- [ ] **Крок 3: Додати share card в JSX**

Після `<PushPrompt />`, перед кнопкою "Чудово!", якщо `c2cEnabled && shareLink`:

```tsx
{c2cEnabled && shareLink && (
  <div className="w-full p-4 rounded-2xl bg-[#D4935A]/10 border border-[#D4935A]/20">
    <div className="flex items-center gap-2 mb-3">
      <Gift size={15} className="text-[#D4935A]" />
      <p className="text-sm font-semibold text-[#2C1A14]">
        Поділись з подругою
      </p>
    </div>
    <p className="text-xs text-[#6B5750] mb-3">
      Вона отримає −{c2cDiscountPct}% на перший візит до {masterName} 🎁
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => {
          navigator.clipboard.writeText(shareLink);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        }}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/70 text-[#789A99] text-xs font-semibold border border-white/80 hover:bg-white transition-colors"
      >
        {shareCopied ? <Check size={12} /> : <Copy size={12} />}
        {shareCopied ? 'Скопійовано!' : 'Копіювати'}
      </button>
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: `Запишись до ${masterName} — Bookit`,
              text: `Твоя подруга ділиться знижкою ${c2cDiscountPct}% на перший запис!`,
              url: shareLink,
            });
          } else {
            navigator.clipboard.writeText(shareLink);
          }
        }}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#D4935A] text-white text-xs font-semibold hover:bg-[#c07d45] transition-colors"
      >
        <Share2 size={12} />
        Поділитись
      </button>
    </div>
  </div>
)}
```

Переконатись що `Gift, Copy, Check, Share2` імпортовані з `lucide-react`.

- [ ] **Крок 4: Передати нові props з BookingWizard в BookingSuccess**

В `src/components/shared/BookingWizard.tsx` знайти `<BookingSuccess>` і додати:

```tsx
<BookingSuccess
  // ... існуючі props ...
  masterId={masterId}
  c2cEnabled={(mp as any)?.c2c_enabled ?? false}
  c2cDiscountPct={(mp as any)?.c2c_discount_pct ?? 10}
/>
```

**Примітка:** master's `c2c_enabled` і `c2c_discount_pct` можна передати через `BookingWizard` props (вони вже читаються з `[slug]/page.tsx`).

- [ ] **Крок 5: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 6: Закомітити**

```bash
git add bookit/src/components/shared/wizard/BookingSuccess.tsx \
        bookit/src/components/shared/BookingWizard.tsx
git commit -m "feat(booking-success): add C2C share nudge card after successful booking"
```

---

## Task 11: MyLoyaltyPage — два під-таби

**Files:**
- Modify: `bookit/src/app/my/loyalty/page.tsx`
- Modify: `bookit/src/components/client/MyLoyaltyPage.tsx`

- [ ] **Крок 1: Завантажити C2C дані в `page.tsx`**

В `src/app/my/loyalty/page.tsx` додати до існуючих запитів (в `Promise.all` або окремо):

```typescript
// C2C referrals for client
const { data: c2cReferrals } = await supabase
  .from('c2c_referrals')
  .select(`
    id, discount_pct, status, created_at, master_id,
    master_profiles (
      id, slug, avatar_emoji,
      profiles ( full_name )
    )
  `)
  .eq('referrer_id', user!.id)
  .order('created_at', { ascending: false });

// C2C balance per master (для кожного унікального master_id)
const uniqueMasterIds = [...new Set((c2cReferrals ?? []).map((r: any) => r.master_id))];
const balances: Record<string, number> = {};
await Promise.all(
  uniqueMasterIds.map(async (mid) => {
    const { data } = await supabase.rpc('get_c2c_balance', {
      p_referrer_id: user!.id,
      p_master_id: mid,
    });
    balances[mid] = typeof data === 'number' ? data : 0;
  })
);
```

- [ ] **Крок 2: Маппінг C2C даних для компонента**

```typescript
const c2cItems = (c2cReferrals ?? []).map((r: any) => {
  const mp = Array.isArray(r.master_profiles) ? r.master_profiles[0] : r.master_profiles;
  const profile = Array.isArray(mp?.profiles) ? mp.profiles[0] : mp?.profiles;
  return {
    id: r.id as string,
    discountPct: r.discount_pct as number,
    status: r.status as 'pending' | 'completed' | 'expired',
    masterName: profile?.full_name || 'Майстер',
    masterSlug: mp?.slug as string,
    masterEmoji: mp?.avatar_emoji || '💅',
    masterId: r.master_id as string,
    createdAt: r.created_at as string,
    balance: balances[r.master_id] ?? 0,
  };
});
```

- [ ] **Крок 3: Передати в MyLoyaltyPage**

```tsx
return (
  <MyLoyaltyPage
    programs={items}
    referralCode={referralCode || ''}
    totalMastersInvited={clientProfile?.total_masters_invited || 0}
    promocodes={promoItems}
    c2cReferrals={c2cItems}
  />
);
```

- [ ] **Крок 4: Оновити MyLoyaltyPage — два під-таби у вкладці Refer & Earn**

В `src/components/client/MyLoyaltyPage.tsx` поточна вкладка `referral` показує тільки C2B. Переробити на два під-таби:

```typescript
const [referralTab, setReferralTab] = useState<'c2c' | 'c2b'>('c2c');
```

Додати інтерфейс для C2C даних:

```typescript
interface C2cReferralItem {
  id: string;
  discountPct: number;
  status: 'pending' | 'completed' | 'expired';
  masterName: string;
  masterSlug: string;
  masterEmoji: string;
  masterId: string;
  createdAt: string;
  balance: number;
}

interface Props {
  // ... існуючі ...
  c2cReferrals: C2cReferralItem[];
}
```

- [ ] **Крок 5: Додати під-таби у вкладку referral**

У секції `activeTab === 'referral'` додати навігацію між C2C і C2B:

```tsx
{/* Under-tab switcher */}
<div className="flex p-1 bg-[#F5E8E3] rounded-2xl mb-4">
  <button
    onClick={() => setReferralTab('c2c')}
    className={cn(
      "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all",
      referralTab === 'c2c' ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#A8928D]"
    )}
  >
    <Gift size={12} />
    Для подруг
  </button>
  <button
    onClick={() => setReferralTab('c2b')}
    className={cn(
      "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all",
      referralTab === 'c2b' ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#A8928D]"
    )}
  >
    <Users size={12} />
    Запросити майстра
  </button>
</div>

{referralTab === 'c2c' ? (
  <C2CReferralTab referrals={c2cReferrals} referralCode={referralCode} />
) : (
  <C2BReferralTab
    inviteLink={inviteLink}
    totalMastersInvited={totalMastersInvited}
    promocodes={promocodes}
    copied={copied}
    copyToClipboard={copyToClipboard}
  />
)}
```

- [ ] **Крок 6: Винести C2B в підкомпонент і написати C2C підкомпонент**

Існуючий код C2B вкладки обернути в `function C2BReferralTab({...})` (без змін у логіці).

Новий `function C2CReferralTab({ referrals, referralCode })`:

```tsx
function C2CReferralTab({
  referrals,
  referralCode,
}: {
  referrals: C2cReferralItem[];
  referralCode: string;
}) {
  const [copiedMaster, setCopiedMaster] = useState<string | null>(null);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua';

  const completed = referrals.filter(r => r.status === 'completed').length;
  const pending   = referrals.filter(r => r.status === 'pending').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="bento-card p-4 flex items-center justify-around">
        <div className="text-center">
          <p className="text-[10px] text-[#A8928D] uppercase tracking-wider mb-0.5">Запрошено</p>
          <p className="text-lg font-bold text-[#2C1A14]">{referrals.length}</p>
        </div>
        <div className="w-px h-8 bg-[#E8D0C8]" />
        <div className="text-center">
          <p className="text-[10px] text-[#A8928D] uppercase tracking-wider mb-0.5">Завершили</p>
          <p className="text-lg font-bold text-[#5C9E7A]">{completed}</p>
        </div>
        <div className="w-px h-8 bg-[#E8D0C8]" />
        <div className="text-center">
          <p className="text-[10px] text-[#A8928D] uppercase tracking-wider mb-0.5">Очікують</p>
          <p className="text-lg font-bold text-[#D4935A]">{pending}</p>
        </div>
      </div>

      {referrals.length === 0 ? (
        <div className="bento-card p-8 text-center">
          <span className="text-3xl block mb-3">🎁</span>
          <p className="text-sm font-semibold text-[#2C1A14]">Ще нікого не запрошено</p>
          <p className="text-xs text-[#A8928D] mt-1">
            Діліться посиланням на майстра після запису
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {referrals.map(r => (
            <div key={r.id} className="bento-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5E8E3] flex items-center justify-center text-lg shrink-0">
                    {r.masterEmoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C1A14]">{r.masterName}</p>
                    <p className="text-[10px] text-[#A8928D]">
                      Знижка {r.discountPct}% · {r.status === 'completed' ? '✅ Завершено' : '⏳ Очікує'}
                    </p>
                  </div>
                </div>
                {r.balance > 0 && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#D4935A]">+{r.balance}%</p>
                    <p className="text-[10px] text-[#A8928D]">баланс</p>
                  </div>
                )}
              </div>
              {/* Share link */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={async () => {
                    const link = `${siteUrl}/${r.masterSlug}?ref=${referralCode}`;
                    await navigator.clipboard.writeText(link);
                    setCopiedMaster(r.masterId);
                    setTimeout(() => setCopiedMaster(null), 2000);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/70 text-[#789A99] text-xs font-semibold border border-white/80 hover:bg-white transition-colors"
                >
                  {copiedMaster === r.masterId ? <Check size={12} /> : <Copy size={12} />}
                  {copiedMaster === r.masterId ? 'Скопійовано!' : 'Скопіювати посилання'}
                </button>
                <Link
                  href={`/${r.masterSlug}`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#789A99] text-white text-xs font-semibold hover:bg-[#6B8C8B] transition-colors"
                >
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Переконатись що `ArrowRight, Copy, Check, Gift, Users` імпортовані.

- [ ] **Крок 7: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 8: Закомітити**

```bash
git add bookit/src/app/my/loyalty/page.tsx \
        bookit/src/components/client/MyLoyaltyPage.tsx
git commit -m "feat(loyalty): C2C two sub-tabs in Refer & Earn (Для подруг + Запросити майстра)"
```

---

## Task 12: Прибрати старий C2C блок з MyProfilePage

**Files:**
- Modify: `bookit/src/components/client/MyProfilePage.tsx`

- [ ] **Крок 1: Видалити C2C стан і хендлери**

В `src/components/client/MyProfilePage.tsx` видалити:
- `const [c2cLink, setC2cLink] = useState<string | null>(null);`
- `const [c2cCopied, setC2cCopied] = useState(false);`
- `const [c2cLoading, setC2cLoading] = useState(false);`
- Функції `handleGenerateC2C`, `handleCopyC2C`, `handleShareC2C`
- Імпорт `getOrCreateReferralLink` якщо не використовується ніде ще

- [ ] **Крок 2: Видалити JSX блок "C2C: Подаруй подрузі знижку"**

Видалити весь `motion.div` з коментарем `{/* C2C: Подаруй подрузі знижку */}` (~рядки 239–299).

- [ ] **Крок 3: Видалити `lastMasterId` з Props якщо не потрібен ніде ще**

Перевірити чи `lastMasterId` використовується десь ще в компоненті. Якщо ні — видалити з інтерфейсу Props і з `page.tsx`.

- [ ] **Крок 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 5: Закомітити**

```bash
git add bookit/src/components/client/MyProfilePage.tsx \
        bookit/src/app/my/profile/page.tsx
git commit -m "refactor(profile): remove broken C2C block — referral now lives in loyalty tab"
```

---

## Self-Review

### Spec Coverage Check

| Вимога | Реалізовано |
|---|---|
| Master opt-in + налаштування % в LoyaltyPage | ✅ Task 3 |
| C2C link через client_profiles.referral_code | ✅ Task 4 |
| [slug] читає ref param, валідує | ✅ Task 5 |
| BookingWizard badge знижки для подруги | ✅ Task 8 |
| createBooking: friend validation (новий клієнт, не самореферал) | ✅ Task 9 |
| createBooking: C2C discount в ціні | ✅ Task 9 |
| createBooking: referrer balance validation server-side | ✅ Task 9 |
| c2c_referrals INSERT після booking | ✅ Task 9 |
| c2c_bonus_uses INSERT після referrer bonus | ✅ Task 9 |
| DB тригер: completed booking → referral completed | ✅ Task 1 |
| In-app нотифікація рефереру | ✅ Task 1 (в тригері) |
| Post-booking share nudge | ✅ Task 10 |
| Loyalty tab: два під-таби C2C + C2B | ✅ Task 11 |
| C2C balance відображення в loyalty | ✅ Task 11 |
| Видалити дублікат з profile page | ✅ Task 12 |
| Max discount cap 80% (server-side) | ✅ Task 9 (schema validation) |

### Можливі Питання

**Q: notifications таблиця підтримує тип `c2c_referral_completed`?**  
Перевірити CHECK constraint на `notifications.type` в міграції 001 або останніх міграціях. Якщо є обмеження — додати новий тип в міграцію 099.

**Q: `get_c2c_balance` RPC доступна через anon/authenticated client?**  
Так — `GRANT EXECUTE ... TO authenticated` в міграції 099.

**Q: lastMasterId в profile/page.tsx — чи потрібен після видалення C2C блоку?**  
Ні — можна видалити відповідний запит з `Promise.all` у `src/app/my/profile/page.tsx`.
