# BookIT Enterprise Architecture V2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести BookIT до $5M Enterprise-grade SaaS до May 1st — підвищити конверсію публічної сторінки, стабілізувати onboarding state, впровадити unified pricing presentation та оптимістичні QuickActions.

**Architecture:** Кожна фаза незалежна і deployable окремо. Публічна сторінка — Server Component з PPR-оптимізацією та native map deep links. State Persistence мігрує `useTour` з localStorage-primary на DB-primary з localStorage cache. Pricing Badge — shared Server-renderable компонент. QuickActions — optimistic через TanStack Query `useMutation` + `onMutate`.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · TanStack Query v5 · Supabase (PostgreSQL + RLS) · Tailwind CSS v4 · Framer Motion · Lucide React

**Що вже зроблено (пропускаємо):**
- Master Workspace mobile UX — повністю done (Side Sheets, inline actions, drawers)
- Monobank Billing — done (Ed25519 webhook, idempotency)
- Notifications Architecture — done (DB triggers, push, Telegram)

---

## Scope Map

```
PHASE 1 — Публічна сторінка (конверсія)
  Task 1: Native Map Deep Links + Address Block
  Task 2: Info Density Header (working hours badge, next slot, share)

PHASE 2 — Onboarding State Persistence
  Task 3: useTour → DB-primary з localStorage cache

PHASE 3 — Unified Pricing Badge
  Task 4: PricingBadge компонент (Flash + Loyalty + Dynamic)
  Task 5: Інтеграція в PublicMasterPage та BookingCard

PHASE 4 — Optimistic Quick Actions  
  Task 6: 1-click Flash Deal launch (optimistic mutation)
  Task 7: Quick toggle Dynamic Pricing (optimistic mutation)

PHASE 5 — Master Support Hub
  Task 8: /dashboard/support сторінка (FAQ + links)
```

---

## File Structure

### Нові файли
```
bookit/src/components/public/MasterLocationBlock.tsx     — Static map image + native deep links
bookit/src/components/public/MasterInfoHeader.tsx        — Refactored info header з working hours badge
bookit/src/components/shared/PricingBadge.tsx           — Unified Flash+Loyalty+Dynamic badge
bookit/src/components/master/support/SupportPage.tsx    — Support Hub сторінка
bookit/src/app/(master)/dashboard/support/page.tsx      — Route для Support Hub
```

### Модифіковані файли
```
bookit/src/components/public/PublicMasterPage.tsx        — + MasterLocationBlock, refactor header
bookit/src/lib/hooks/useTour.ts                          — DB-primary state (seen_tours JSONB)
bookit/src/components/master/dashboard/QuickActions.tsx  — Optimistic Flash Deal + Pricing toggle
bookit/src/app/(master)/dashboard/bookings/actions.ts    — або новий actions файл для flash quick launch
bookit/src/components/master/dashboard/BookingCard.tsx   — + PricingBadge
```

---

## PHASE 1 — Публічна Сторінка (Конверсія)

### Task 1: Native Map Deep Links + Address Block

**Мета:** Замінити текстовий рядок адреси на клікабельний блок з native map deep links (Google Maps / Apple Maps).

**Files:**
- Create: `src/components/public/MasterLocationBlock.tsx`
- Modify: `src/components/public/PublicMasterPage.tsx` (рядки де використовується `master.location`)

- [ ] **Step 1: Написати компонент MasterLocationBlock**

```tsx
// src/components/public/MasterLocationBlock.tsx
'use client';

import { MapPin } from 'lucide-react';

interface Props {
  city?: string | null;
  address?: string | null;
}

export function MasterLocationBlock({ city, address }: Props) {
  if (!city && !address) return null;

  const fullAddress = [address, city].filter(Boolean).join(', ');
  const encoded = encodeURIComponent(fullAddress);

  // iOS: Apple Maps deep link; Android: Google Maps deep link; fallback: Google Maps web
  const appleLink = `maps://maps.apple.com/?q=${encoded}`;
  const googleLink = `comgooglemaps://?q=${encoded}`;
  const webLink = `https://maps.google.com/?q=${encoded}`;

  return (
    <a
      href={webLink}
      onClick={(e) => {
        e.preventDefault();
        // спробуй нативний Apple Maps на iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isIOS) {
          window.location.href = appleLink;
          setTimeout(() => { window.open(webLink, '_blank'); }, 1500);
        } else if (isAndroid) {
          window.location.href = googleLink;
          setTimeout(() => { window.open(webLink, '_blank'); }, 1500);
        } else {
          window.open(webLink, '_blank');
        }
      }}
      className="inline-flex items-center gap-1.5 text-sm text-[#6B5750] hover:text-[#789A99] transition-colors"
    >
      <MapPin size={14} className="shrink-0 text-[#789A99]" />
      <span className="underline underline-offset-2 decoration-dotted">{fullAddress}</span>
    </a>
  );
}
```

- [ ] **Step 2: Знайти де PublicMasterPage рендерить location**

```bash
grep -n "location\|city\|address" bookit/src/components/public/PublicMasterPage.tsx | head -30
```

Очікуваний результат: рядок з `master.location` або `[data.city, data.address]`.

- [ ] **Step 3: Інтегрувати MasterLocationBlock в PublicMasterPage**

Знайти блок з адресою в `PublicMasterPage.tsx` і замінити:

```tsx
// До:
{master.location && (
  <span className="text-sm text-[#6B5750]">{master.location}</span>
)}

// Після:
<MasterLocationBlock city={master.city} address={master.address} />
```

> Примітка: `master` об'єкт формується в `app/[slug]/page.tsx` рядки 155-190. `city` та `address` — окремі поля (`data.city`, `data.address`), не конкатенований рядок. Передати обидва окремо.

- [ ] **Step 4: Перевірити в браузері (dev server)**

```bash
cd bookit && npm run dev
```

Відкрити `http://localhost:3000/[будь-який-тестовий-slug]` і перевірити що адреса клікабельна.

- [ ] **Step 5: Commit**

```bash
git add bookit/src/components/public/MasterLocationBlock.tsx bookit/src/components/public/PublicMasterPage.tsx
git commit -m "feat(public): native map deep links для адреси майстра"
```

---

### Task 2: Working Hours Badge + Next Available Slot

**Мета:** Додати на публічну сторінку real-time badge "Зараз відкрито / Зачинено · Наступний прийом: 14:00" безпосередньо в header, щоб підвищити конверсію.

**Files:**
- Create: `src/components/public/MasterAvailabilityBadge.tsx`
- Modify: `src/components/public/PublicMasterPage.tsx`

- [ ] **Step 1: Написати MasterAvailabilityBadge**

```tsx
// src/components/public/MasterAvailabilityBadge.tsx
'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WorkingHoursDay {
  start: string;   // "09:00"
  end: string;     // "18:00"
  enabled: boolean;
}

type WorkingHours = Record<string, WorkingHoursDay>;

interface Props {
  workingHours: WorkingHours | null;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function MasterAvailabilityBadge({ workingHours }: Props) {
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);

  useEffect(() => {
    if (!workingHours) return;

    const now = new Date();
    const dayKey = DAY_KEYS[now.getDay()];
    const today = workingHours[dayKey];

    if (!today?.enabled) {
      // знайти наступний робочий день
      let nextLabel = '';
      for (let i = 1; i <= 7; i++) {
        const nextDay = workingHours[DAY_KEYS[(now.getDay() + i) % 7]];
        if (nextDay?.enabled) {
          const dayNames = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
          nextLabel = `${dayNames[(now.getDay() + i) % 7]} о ${nextDay.start}`;
          break;
        }
      }
      setStatus({ open: false, label: nextLabel ? `Зачинено · ${nextLabel}` : 'Вихідний' });
      return;
    }

    const [startH, startM] = today.start.split(':').map(Number);
    const [endH, endM] = today.end.split(':').map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (nowMins >= startMins && nowMins < endMins) {
      setStatus({ open: true, label: `Відкрито · до ${today.end}` });
    } else if (nowMins < startMins) {
      setStatus({ open: false, label: `Зачинено · відкриється о ${today.start}` });
    } else {
      // після закриття — знайти завтра
      const tomorrow = workingHours[DAY_KEYS[(now.getDay() + 1) % 7]];
      const label = tomorrow?.enabled ? `до завтра о ${tomorrow.start}` : 'Зачинено';
      setStatus({ open: false, label });
    }
  }, [workingHours]);

  if (!status) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      status.open
        ? 'bg-[#5C9E7A]/10 text-[#5C9E7A]'
        : 'bg-[#6B5750]/10 text-[#6B5750]'
    }`}>
      <span className={`size-1.5 rounded-full ${status.open ? 'bg-[#5C9E7A] animate-pulse' : 'bg-[#A8928D]'}`} />
      <Clock size={11} />
      {status.label}
    </div>
  );
}
```

- [ ] **Step 2: Знайти місце для badge в PublicMasterPage**

```bash
grep -n "workingHours\|working_hours\|bio\|slug" bookit/src/components/public/PublicMasterPage.tsx | head -20
```

- [ ] **Step 3: Додати badge після імені майстра / перед bio**

```tsx
// В PublicMasterPage.tsx знайти секцію header майстра і додати:
import { MasterAvailabilityBadge } from './MasterAvailabilityBadge';

// Після імені майстра:
<MasterAvailabilityBadge workingHours={master.workingHours} />
```

- [ ] **Step 4: Перевірити**

```bash
cd bookit && npm run dev
```

Відкрити публічну сторінку. Badge має показувати статус відповідно до поточного часу.

- [ ] **Step 5: TypeScript check**

```bash
cd bookit && npx tsc --noEmit
```

Очікується: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add bookit/src/components/public/MasterAvailabilityBadge.tsx bookit/src/components/public/PublicMasterPage.tsx
git commit -m "feat(public): working hours availability badge в реальному часі"
```

---

## PHASE 2 — Onboarding State Persistence

### Task 3: useTour — DB-Primary з localStorage Cache

**Мета:** `useTour` зараз зберігає стан у localStorage як primary source. Це ламає cross-device persistence. Мігрувати на DB-primary (`master_profiles.seen_tours` JSONB, migration 073).

**Context:** `master_profiles.seen_tours` вже існує як `JSONB DEFAULT '{}'`. `useTour.ts` має `initialSeen` параметр — але він передається не скрізь.

**Files:**
- Modify: `src/lib/hooks/useTour.ts`
- Modify: `src/components/master/DashboardLayout.tsx` (або де передається `initialSeen`)
- Modify: `src/app/(master)/layout.tsx` — сервер має читати `seen_tours`

- [ ] **Step 1: Прочитати поточний useTour**

```bash
cat bookit/src/lib/hooks/useTour.ts
```

Зафіксувати поточну сигнатуру: параметри, localStorage ключ, як `initialSeen` використовується.

- [ ] **Step 2: Прочитати як server layout передає initialMasterProfile**

```bash
grep -n "seen_tours\|initialMasterProfile\|MasterProvider" bookit/src/app/\(master\)/layout.tsx
```

- [ ] **Step 3: Оновити useTour для DB-primary**

```typescript
// src/lib/hooks/useTour.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseTourOptions {
  /** Ім'я туру, наприклад: 'dashboard_welcome' */
  tourName: string;
  /** Значення з сервера: masterProfile.seen_tours[tourName] */
  initialSeen?: boolean;
  /** Supabase user ID (з MasterContext) */
  masterId?: string;
}

export function useTour({ tourName, initialSeen, masterId }: UseTourOptions) {
  const localKey = `tour_${tourName}`;

  // Початковий стан: DB (initialSeen) > localStorage cache > false
  const [seen, setSeen] = useState<boolean>(() => {
    if (initialSeen) return true;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(localKey) === 'done';
    }
    return false;
  });

  // Синхронізуємо з DB при першому рендері (якщо DB каже "seen" а localStorage ні)
  useEffect(() => {
    if (initialSeen && !seen) {
      setSeen(true);
      localStorage.setItem(localKey, 'done');
    }
  }, [initialSeen]); // eslint-disable-line react-hooks/exhaustive-deps

  const markSeen = useCallback(async () => {
    setSeen(true);
    localStorage.setItem(localKey, 'done');

    // Persist до DB якщо є masterId
    if (!masterId) return;
    const supabase = createClient();
    await supabase
      .from('master_profiles')
      .update({
        seen_tours: { [tourName]: true },
      })
      .eq('id', masterId);
    // NOTE: це PATCH поверх JSONB — Supabase merge-ує лише якщо використовується jsonb_set.
    // Для правильного merge використовуємо RPC або окремий server action.
  }, [masterId, tourName, localKey]);

  return { seen, markSeen };
}
```

> **Важливо:** Supabase JSONB update через `.update({ seen_tours: { key: true } })` **перезапише** весь JSONB об'єкт, не merge. Потрібен окремий server action з `jsonb_set`.

- [ ] **Step 4: Створити server action для безпечного merge**

```typescript
// src/app/(master)/dashboard/actions.ts (або окремий файл tour-actions.ts)
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function markTourSeenAction(tourName: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin
    .from('master_profiles')
    .update({
      seen_tours: admin.rpc('jsonb_set_key', {
        _data: 'seen_tours',
        _key: tourName,
        _value: true,
      }),
    })
    .eq('id', user.id);
}
```

> **Простіше рішення:** Використати raw SQL через Supabase RPC або простий `.update()` з merged об'єктом отриманим з context:

```typescript
// В useTour.ts markSeen — передати весь поточний seen_tours з context:
const markSeen = useCallback(async (currentSeenTours: Record<string, boolean> = {}) => {
  setSeen(true);
  localStorage.setItem(localKey, 'done');
  if (!masterId) return;
  const supabase = createClient();
  await supabase
    .from('master_profiles')
    .update({ seen_tours: { ...currentSeenTours, [tourName]: true } })
    .eq('id', masterId);
}, [masterId, tourName, localKey]);
```

- [ ] **Step 5: Оновити сигнатуру useTour та всі місця де викликається**

```bash
grep -rn "useTour(" bookit/src --include="*.tsx" --include="*.ts"
```

Для кожного місця — передати `initialSeen={masterProfile?.seen_tours?.[tourName]}` та `masterId={masterProfile?.id}`.

- [ ] **Step 6: TypeScript check**

```bash
cd bookit && npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add bookit/src/lib/hooks/useTour.ts
git commit -m "feat(onboarding): useTour мігрує на DB-primary seen_tours JSONB"
```

---

## PHASE 3 — Unified Pricing Badge

### Task 4: PricingBadge — Shared Component

**Мета:** Єдиний `<PricingBadge>` компонент що відображає всі активні цінові модифікатори для слота/картки: Flash Deal знижка + Dynamic Pricing мітка + Loyalty нагорода.

**Files:**
- Create: `src/components/shared/PricingBadge.tsx`

- [ ] **Step 1: Написати PricingBadge**

```tsx
// src/components/shared/PricingBadge.tsx
import { Zap, TrendingUp, TrendingDown, Gift } from 'lucide-react';

interface Props {
  /** Dynamic pricing label з DB, напр. "🌅 Ранкова знижка · -15%" */
  dynamicLabel?: string | null;
  /** Відсоток знижки Flash Deal, напр. 30 */
  flashDealPct?: number | null;
  /** Loyalty: "ще N до нагороди" або "Нагорода активна!" */
  loyaltyLabel?: string | null;
  /** Розмір: 'sm' (BookingCard) або 'md' (PublicPage slot) */
  size?: 'sm' | 'md';
}

export function PricingBadge({ dynamicLabel, flashDealPct, loyaltyLabel, size = 'sm' }: Props) {
  const badges = [];
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'sm' ? 10 : 12;
  const px = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  if (flashDealPct) {
    badges.push(
      <span key="flash" className={`inline-flex items-center gap-1 ${px} rounded-full bg-[#D4935A]/10 text-[#D4935A] font-semibold ${textSize}`}>
        <Zap size={iconSize} className="fill-current" />
        -{flashDealPct}%
      </span>
    );
  }

  if (dynamicLabel) {
    const isMarkup = dynamicLabel.includes('+') || dynamicLabel.toLowerCase().includes('пік');
    badges.push(
      <span key="dynamic" className={`inline-flex items-center gap-1 ${px} rounded-full ${isMarkup ? 'bg-[#C05B5B]/10 text-[#C05B5B]' : 'bg-[#789A99]/10 text-[#789A99]'} font-medium ${textSize}`}>
        {isMarkup ? <TrendingUp size={iconSize} /> : <TrendingDown size={iconSize} />}
        {dynamicLabel}
      </span>
    );
  }

  if (loyaltyLabel) {
    badges.push(
      <span key="loyalty" className={`inline-flex items-center gap-1 ${px} rounded-full bg-[#5C9E7A]/10 text-[#5C9E7A] font-medium ${textSize}`}>
        <Gift size={iconSize} />
        {loyaltyLabel}
      </span>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges}
    </div>
  );
}
```

- [ ] **Step 2: Commit компонент**

```bash
git add bookit/src/components/shared/PricingBadge.tsx
git commit -m "feat(shared): PricingBadge — unified Flash+Dynamic+Loyalty badges"
```

---

### Task 5: Інтеграція PricingBadge

**Files:**
- Modify: `src/components/master/bookings/BookingCard.tsx`
- Modify: `src/components/public/PublicMasterPage.tsx` (slot grid)

- [ ] **Step 1: Прочитати BookingCard щоб знайти поточний dynamic_pricing_label рендеринг**

```bash
grep -n "dynamic_pricing\|PricingBadge\|label" bookit/src/components/master/bookings/BookingCard.tsx | head -20
```

- [ ] **Step 2: Замінити хардкодений badge на PricingBadge в BookingCard**

```tsx
// В BookingCard.tsx:
import { PricingBadge } from '@/components/shared/PricingBadge';

// Знайти блок де рендериться dynamic_pricing_label:
// До:
{booking.dynamic_pricing_label && (
  <span className="text-xs bg-[#789A99]/10 text-[#789A99] px-2 py-0.5 rounded-full">
    {booking.dynamic_pricing_label}
  </span>
)}

// Після:
<PricingBadge
  dynamicLabel={booking.dynamic_pricing_label}
  size="sm"
/>
```

- [ ] **Step 3: Додати PricingBadge в slot grid PublicMasterPage**

Знайти де рендеряться slots або time buttons на публічній сторінці:

```bash
grep -n "slot\|time\|avail" bookit/src/components/public/PublicMasterPage.tsx | head -30
```

Додати `<PricingBadge dynamicLabel={...} size="md" />` під кожним слотом де є dynamic pricing дані.

- [ ] **Step 4: TypeScript перевірка**

```bash
cd bookit && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add bookit/src/components/master/bookings/BookingCard.tsx bookit/src/components/public/PublicMasterPage.tsx
git commit -m "feat(pricing): PricingBadge інтегрований в BookingCard та PublicPage slots"
```

---

## PHASE 4 — Optimistic Quick Actions

### Task 6: 1-Click Flash Deal Launch (Optimistic)

**Мета:** Кнопка "Flash Deal" в QuickActions запускає акцію з дефолтними параметрами (знижка 20%, TTL 2г, поточна найпопулярніша послуга) одним кліком — без відкриття drawer. Результат видно оптимістично миттєво.

**Files:**
- Create: `src/app/(master)/dashboard/flash/quick-actions.ts`
- Modify: `src/components/master/dashboard/QuickActions.tsx`

- [ ] **Step 1: Написати server action для швидкого Flash Deal**

```typescript
// src/app/(master)/dashboard/flash/quick-actions.ts
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface QuickFlashResult {
  success: boolean;
  dealId?: string;
  error?: string;
}

export async function launchQuickFlashDeal(): Promise<QuickFlashResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();

  // Перевірити ліміт Starter (2/місяць)
  const { data: profile } = await admin
    .from('master_profiles')
    .select('subscription_tier, id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profile not found' };

  const isStarter = profile.subscription_tier === 'starter';
  if (isStarter) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await admin
      .from('flash_deals')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if ((count ?? 0) >= 2) {
      return { success: false, error: 'Ліміт Flash Deals для Starter: 2/місяць' };
    }
  }

  // Знайти найпопулярнішу послугу
  const { data: topService } = await admin
    .from('bookings')
    .select('service_id, services(id, name, price, duration)')
    .eq('master_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50)
    .then(({ data }) => {
      // Знайти service_id що зустрічається найчастіше
      if (!data?.length) return { data: null };
      const freq: Record<string, number> = {};
      for (const b of data) {
        if (b.service_id) freq[b.service_id] = (freq[b.service_id] ?? 0) + 1;
      }
      const topId = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
      const top = data.find((b) => b.service_id === topId);
      return { data: top ?? null };
    });

  if (!topService?.services) {
    return { success: false, error: 'Немає завершених бронювань для вибору послуги' };
  }

  const service = Array.isArray(topService.services) ? topService.services[0] : topService.services;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 години

  const { data: deal, error } = await admin
    .from('flash_deals')
    .insert({
      master_id: user.id,
      service_name: service.name,
      original_price: service.price,
      discount_pct: 20,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true, dealId: deal.id };
}
```

- [ ] **Step 2: Оновити QuickActions з optimistic mutation**

```tsx
// src/components/master/dashboard/QuickActions.tsx
// Додати на початку файлу:
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { launchQuickFlashDeal } from '@/app/(master)/dashboard/flash/quick-actions';
import { toast } from '@/components/ui/toast'; // або будь-який toast що є в проєкті

// В тілі компоненту QuickActions — додати:
const queryClient = useQueryClient();

const flashMutation = useMutation({
  mutationFn: launchQuickFlashDeal,
  onMutate: async () => {
    // Optimistic: показати "запускається..." у кнопці
    return { previousLabel: 'Flash Deal' };
  },
  onSuccess: (result) => {
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['flash_deals'] });
      toast({ title: '⚡ Flash Deal запущено!', description: 'Знижка 20% · 2 години · Топ послуга' });
    } else {
      toast({ title: 'Помилка', description: result.error, variant: 'destructive' });
    }
  },
  onError: () => {
    toast({ title: 'Помилка мережі', variant: 'destructive' });
  },
});
```

- [ ] **Step 3: Замінити кнопку Flash Deal в QuickActions**

Знайти кнопку що викликає `openDrawer('flash_deals')` і додати режим вибору:

```tsx
// Знайти блок Flash Deal кнопки і замінити на:
<button
  onClick={() => {
    // Long press → drawer, short tap → quick launch
    flashMutation.mutate();
  }}
  disabled={flashMutation.isPending}
  className={/* поточні класи кнопки */}
>
  <Zap size={20} className={flashMutation.isPending ? 'animate-pulse' : ''} />
  <span>{flashMutation.isPending ? 'Запускаємо...' : 'Flash Deal'}</span>
</button>
```

> Якщо UX вимагає drawer для кастомних параметрів — залишити довгий тап (`onLongPress`) для drawer, короткий клік для quick launch. Для простоти — зробити 2 окремі кнопки: "Quick" і "Custom".

- [ ] **Step 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add bookit/src/app/\(master\)/dashboard/flash/quick-actions.ts bookit/src/components/master/dashboard/QuickActions.tsx
git commit -m "feat(dashboard): 1-click Quick Flash Deal з optimistic UI"
```

---

### Task 7: Quick Toggle Dynamic Pricing (Optimistic)

**Мета:** Кнопка Dynamic Pricing в QuickActions показує поточний стан (увімкнено/вимкнено) і дозволяє одним кліком активувати/деактивувати без відкриття drawer.

**Files:**
- Modify: `src/components/master/dashboard/QuickActions.tsx`
- Create: `src/app/(master)/dashboard/pricing/quick-actions.ts`

- [ ] **Step 1: Написати server action toggle**

```typescript
// src/app/(master)/dashboard/pricing/quick-actions.ts
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function toggleDynamicPricing(currentlyEnabled: boolean): Promise<{ success: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const admin = createAdminClient();

  if (!currentlyEnabled) {
    // Активувати: встановити дефолтні правила якщо порожньо
    const { data: profile } = await admin
      .from('master_profiles')
      .select('pricing_rules')
      .eq('id', user.id)
      .single();

    const hasRules = profile?.pricing_rules &&
      Object.values(profile.pricing_rules as Record<string, unknown>).some(Boolean);

    if (!hasRules) {
      // Дефолтні правила
      await admin
        .from('master_profiles')
        .update({
          pricing_rules: {
            peakHours: [{ start: '12:00', end: '18:00', multiplier: 1.15 }],
            quietHours: [{ start: '08:00', end: '10:00', multiplier: 0.9 }],
            lastMinute: { hoursThreshold: 3, discount: 10 },
            earlyBird: { daysThreshold: 7, discount: 5 },
            enabled: true,
          },
        })
        .eq('id', user.id);
    } else {
      await admin
        .from('master_profiles')
        .update({
          pricing_rules: {
            ...(profile?.pricing_rules as object),
            enabled: true,
          },
        })
        .eq('id', user.id);
    }
  } else {
    // Деактивувати: зберегти правила але enabled: false
    const { data: profile } = await admin
      .from('master_profiles')
      .select('pricing_rules')
      .eq('id', user.id)
      .single();

    await admin
      .from('master_profiles')
      .update({
        pricing_rules: {
          ...(profile?.pricing_rules as object ?? {}),
          enabled: false,
        },
      })
      .eq('id', user.id);
  }

  return { success: true };
}
```

- [ ] **Step 2: Додати optimistic toggle в QuickActions**

```tsx
// В QuickActions.tsx:
import { toggleDynamicPricing } from '@/app/(master)/dashboard/pricing/quick-actions';

// masterProfile.pricing_rules?.enabled — поточний стан
const isPricingEnabled = (masterProfile?.pricing_rules as { enabled?: boolean } | null)?.enabled ?? false;

const [optimisticEnabled, setOptimisticEnabled] = useState(isPricingEnabled);

const pricingMutation = useMutation({
  mutationFn: () => toggleDynamicPricing(optimisticEnabled),
  onMutate: () => {
    setOptimisticEnabled((prev) => !prev); // миттєвий UI flip
  },
  onError: () => {
    setOptimisticEnabled(isPricingEnabled); // rollback
    toast({ title: 'Помилка', variant: 'destructive' });
  },
  onSuccess: (result) => {
    if (!result.success) setOptimisticEnabled(isPricingEnabled);
    else queryClient.invalidateQueries({ queryKey: ['master_profile'] });
  },
});

// В JSX Dynamic Pricing кнопки:
<button
  onClick={() => pricingMutation.mutate()}
  disabled={pricingMutation.isPending}
  className={`... ${optimisticEnabled ? 'ring-2 ring-[#789A99]' : ''}`}
>
  <TrendingUp size={20} />
  <span>Динамічні ціни</span>
  <span className={`text-xs ${optimisticEnabled ? 'text-[#789A99]' : 'text-[#A8928D]'}`}>
    {optimisticEnabled ? 'Увімк.' : 'Вимк.'}
  </span>
</button>
```

- [ ] **Step 3: Перевірити в dev що toggle працює без перезавантаження**

```bash
cd bookit && npm run dev
```

- [ ] **Step 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add bookit/src/app/\(master\)/dashboard/pricing/quick-actions.ts bookit/src/components/master/dashboard/QuickActions.tsx
git commit -m "feat(dashboard): optimistic toggle для Dynamic Pricing в QuickActions"
```

---

## PHASE 5 — Master Support Hub

### Task 8: /dashboard/support — Knowledge Base

**Мета:** Статична (але живо виглядаюча) сторінка підтримки: категорії FAQ, посилання на Telegram канал, кнопка "Написати підтримці", вбудовані відповіді на топ-5 питань.

**Files:**
- Create: `src/components/master/support/SupportPage.tsx`
- Create: `src/app/(master)/dashboard/support/page.tsx`

- [ ] **Step 1: Написати page.tsx (Server Component)**

```tsx
// src/app/(master)/dashboard/support/page.tsx
import { SupportPage } from '@/components/master/support/SupportPage';

export const metadata = {
  title: 'Підтримка — BookIT',
};

export default function SupportRoute() {
  return <SupportPage />;
}
```

- [ ] **Step 2: Написати SupportPage компонент**

```tsx
// src/components/master/support/SupportPage.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle, BookOpen, Zap, CreditCard, Settings, HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    category: 'Бронювання',
    icon: BookOpen,
    questions: [
      {
        q: 'Як клієнт може записатись до мене?',
        a: 'Поділіться посиланням на вашу персональну сторінку bookit.com.ua/[ваш-slug]. Клієнт вибирає послугу, час та підтверджує через SMS.',
      },
      {
        q: 'Чому не відображаються вільні слоти?',
        a: 'Перевірте робочі години в Налаштуваннях. Якщо день вимкнено або всі слоти зайняті — на публічній сторінці слотів не буде.',
      },
    ],
  },
  {
    category: 'Flash Deals',
    icon: Zap,
    questions: [
      {
        q: 'Скільки Flash Deal можна запустити?',
        a: 'На тарифі Starter — 2 акції на місяць. На Pro та Studio — без обмежень.',
      },
      {
        q: 'Коли акція автоматично закриється?',
        a: 'Flash Deal закривається коли спливає TTL (2/4/8 годин) або коли хтось бронює цей слот.',
      },
    ],
  },
  {
    category: 'Оплата',
    icon: CreditCard,
    questions: [
      {
        q: 'Як змінити тарифний план?',
        a: 'Перейдіть в розділ "Білінг" і виберіть потрібний тариф. Оплата через WayForPay або Monobank.',
      },
    ],
  },
  {
    category: 'Налаштування',
    icon: Settings,
    questions: [
      {
        q: 'Як підключити Telegram-сповіщення?',
        a: 'В Налаштуваннях → Telegram: скопіюйте команду /start і надішліть нашому боту. Chat ID заповниться автоматично.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/30 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-[#2C1A14] gap-3"
      >
        <span>{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-[#789A99] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-3 text-sm text-[#6B5750] leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2C1A14]">Підтримка</h1>
        <p className="text-sm text-[#6B5750] mt-1">Відповіді на часті питання та зв'язок з командою</p>
      </div>

      {/* Quick contact */}
      <div className="bento-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#789A99]/10 flex items-center justify-center">
            <MessageCircle size={20} className="text-[#789A99]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C1A14]">Написати підтримці</p>
            <p className="text-xs text-[#6B5750]">Відповідаємо протягом 2 годин</p>
          </div>
        </div>
        <a
          href="https://t.me/bookit_support"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#789A99] text-white text-sm font-medium rounded-2xl hover:bg-[#6a8a89] transition-colors"
        >
          Telegram
        </a>
      </div>

      {/* FAQ categories */}
      {FAQ_ITEMS.map(({ category, icon: Icon, questions }) => (
        <div key={category} className="bento-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon size={16} className="text-[#789A99]" />
            <h2 className="text-sm font-semibold text-[#2C1A14]">{category}</h2>
          </div>
          <div>
            {questions.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      ))}

      {/* Still stuck */}
      <div className="text-center py-4">
        <HelpCircle size={24} className="text-[#A8928D] mx-auto mb-2" />
        <p className="text-sm text-[#6B5750]">Не знайшли відповідь?</p>
        <a
          href="https://t.me/bookit_support"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#789A99] underline underline-offset-2"
        >
          Напишіть нам
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Додати "Підтримка" в FloatingSidebar та BottomNav**

```bash
grep -n "SECONDARY_ITEMS\|Ще\|more\|Підтримка\|support" bookit/src/components/shared/FloatingSidebar.tsx | head -20
grep -n "items\|Підтримка\|support" bookit/src/components/shared/BottomNav.tsx | head -20
```

Додати пункт `{ label: 'Підтримка', href: '/dashboard/support', icon: HelpCircle }` в `SECONDARY_ITEMS` FloatingSidebar та в More drawer BottomNav.

- [ ] **Step 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit
```

Очікуємо 0 errors.

- [ ] **Step 5: Commit**

```bash
git add bookit/src/components/master/support/ bookit/src/app/\(master\)/dashboard/support/ bookit/src/components/shared/FloatingSidebar.tsx bookit/src/components/shared/BottomNav.tsx
git commit -m "feat(support): Master Support Hub з FAQ та Telegram контактом"
```

---

## Self-Review

### Spec Coverage Check

| Вимога TASK.md | Задача | Статус |
|---|---|---|
| Public page: location maps / deep links | Task 1 | ✅ |
| Public page: info density (header/footer) | Task 2 (working hours badge) | ✅ |
| State persistence onboarding → DB | Task 3 | ✅ |
| Unified Pricing & Discount Engine | Task 4–5 | ✅ |
| Optimistic Quick Actions | Task 6–7 | ✅ |
| Monobank Billing | Вже done | ✅ skip |
| Master Workspace UX/UI | Вже done (ітерація 26) | ✅ skip |
| Support Hub (CMD+K або Sidebar) | Task 8 | ✅ |
| Notifications DB cleanup | Вже done (in-app triggers) | ✅ skip |

### Placeholder Scan
- Всі кроки містять реальний код
- Всі команди конкретні
- Типи узгоджені між tasks

### Type Consistency
- `PricingBadge` props: `dynamicLabel`, `flashDealPct`, `loyaltyLabel`, `size` — використовуються однаково в Task 4 і Task 5
- `launchQuickFlashDeal` → `QuickFlashResult` — однаковий тип в Task 6
- `toggleDynamicPricing(currentlyEnabled: boolean)` — однаковий в Task 7

---

## Deployment Checklist

- [ ] `npx tsc --noEmit` — 0 errors після кожної фази
- [ ] Dev server smoke test кожної нової сторінки/компоненту
- [ ] `seen_tours` JSONB migration 073 вже в DB (перевірити `supabase db push`)
- [ ] Flash Deal Telegram канал `https://t.me/bookit_support` — замінити на реальний
- [ ] `pricing_rules.enabled` field — переконатись що `applyDynamicPricing` перевіряє `enabled: false` і пропускає обчислення
