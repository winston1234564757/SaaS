# AUDIT-00: Executive Overview
> Дата: 2026-06-15 | BookIT SaaS — Глобальний аудит | Sprint-04: 27/34 | Launch: 2026-06-22

---

## TL;DR

**7 критичних P0 блокерів до launch.** 2 з них — security дірки що дозволяють account takeover. Решта — performance + testing. Після launch: 40+ P1/P2 задач для Sprint-05/06, включаючи 6 high-revenue нових фіч.

---

## Файли аудиту

| Файл | Домен | P0 | P1 | P2 |
|------|-------|----|----|-----|
| [01_CODE_QUALITY.md](01_CODE_QUALITY.md) | Code quality, patterns | 3 | 6 | 5 |
| [02_SECURITY.md](02_SECURITY.md) | Security vulnerabilities | 2 | 4 | 3 |
| [03_PERFORMANCE_TESTING.md](03_PERFORMANCE_TESTING.md) | Performance + E2E coverage | 6 | 5 | 4 |
| [04_ARCHITECTURE.md](04_ARCHITECTURE.md) | Architectural friction | 0 | 4 | 8 |
| [05_UX_FEATURES.md](05_UX_FEATURES.md) | UX gaps + new features | 9 | 14 | 8 |

---

## TOP 10 — Критичні знахідки (до launch 2026-06-22)

### 🔴 P0 SECURITY — Виправити НЕГАЙНО

| # | Знахідка | Файл | CWE | CVSS |
|---|---------|------|-----|------|
| 1 | `/api/debug/fire-notifs` — нульова auth, user enumeration | `src/app/api/debug/fire-notifs/route.ts:61` | CWE-306 | ~9.1 |
| 2 | Telegram webhook — відсутня верифікація секрету | `src/app/api/telegram/webhook/route.ts:46` | CWE-345 | ~8.6 |

**Ці дві дірки = pre-launch blockers. Не деплоїти без виправлення.**

---

### 🔴 P0 PERFORMANCE — Критичні для scale

| # | Знахідка | Файл | Impact |
|---|---------|------|--------|
| 3 | `/explore` — force-dynamic, нульовий кеш | `src/app/explore/page.tsx:6` | 100 users = 100 cold Supabase queries |
| 4 | Explore mega-query — 5 nested joins, 1800+ рядків | `ExplorePage.tsx` | Повільний TTI на prod |
| 5 | GSAP у main bundle | `package.json:35` | +80KB на кожній сторінці |

---

### 🔴 P0 TESTING — Нульове покриття критичних flows

| # | Знахідка | Impact |
|---|---------|--------|
| 6 | `/my/messages` — нуль E2E тестів (новий DB schema!) | Деплой без coverage = невидимі баги |
| 7 | `/explore` — тільки smoke тест, нуль category/sort/search тестів | Найбільша конверсійна воронка без coverage |

---

### 🟡 P0 UX — Блокуючі для конверсії

| # | Знахідка | Revenue impact |
|---|---------|----------------|
| 8 | Search у /explore без debounce | Keystroke jank → відмова від пошуку |
| 9 | Admin: нуль ARIA атрибутів | Screen readers повністю непрацездатні в Admin zone |
| 10 | Notification mark-as-read при відкритті замість закриття | Всі нотифікації виглядають прочитаними відразу |

---

## Revenue Impact Matrix — Нові фічі

> Повна таблиця у [05_UX_FEATURES.md](05_UX_FEATURES.md) секція C.

| Фіча | Revenue Tier | Оцінка | Sprint |
|------|-------------|--------|--------|
| **C3: Клієнтська оплата при бронюванні** | Revenue critical | -60-80% no-shows + 2-3% transaction fee | Sprint-05 |
| **D7: Studio self-serve signup** | Revenue critical | Блокує всю Studio revenue (299₴/master/mo) | Sprint-05 |
| **C1: Google/Apple Calendar sync** | Churn prevention | Double-booking churn = top-3 причина відтоку | Sprint-05 |
| **C4: Telegram Mini App** | Growth | UA market: 80%+ щоденний Telegram | Sprint-06 |
| **C6: Recurring bookings** | Retention | "Кожні 3 тижні" стандарт у beauty | Sprint-05 |
| **C8: Gift vouchers** | Seasonal revenue | 8 березня + Різдво → spike | Sprint-06 |

---

## Монетизаційні прогалини (D1-D7)

> Повна таблиця у [05_UX_FEATURES.md](05_UX_FEATURES.md) секція D.

| # | Прогалина | Пріоритет |
|---|-----------|-----------|
| D7 | Studio tier — нуль self-serve signup (waitlist only) | **P0 — блокує всю Studio revenue** |
| D1 | Analytics CSV/PDF export → Pro ліміт відсутній | P0 |
| D5 | SMS cost preview відсутній → surprise charges → churn | P0 |
| D2 | Custom CRM segments → повинні бути Pro-only | P1 |
| D3 | Flash Deals → Starter ліміт (1 активна) відсутній | P1 |
| D4 | Portfolio gate (5 items Starter) — upsell UI відсутній | P1 |
| D6 | Нуль in-app upsell moments при досягненні лімітів | P1 |

---

## Architectural Debt Summary

> Повна таблиця у [04_ARCHITECTURE.md](04_ARCHITECTURE.md).

| # | Friction Point | Зусилля | Leverage |
|---|---------------|---------|---------|
| ARCH-1 | `notifMap.ts` монолітна 26KB файл | L | High |
| ARCH-2 | Admin Zone: raw useEffect vs TanStack Query | M | High |
| ARCH-3 | useSettingsForm: 26 useState замість react-hook-form | M | Medium |
| ARCH-4 | getCategoryIcon: switch в render path | **S** | Low |
| ARCH-5 | Booking price логіка в 5 файлах | L | High |
| ARCH-6 | MasterContext: 20+ споживачів, нуль селекторів | M | High |

---

## Швидкі виграші Sprint-04 (до launch, ≤ 2 год)

Кожен з цих fixes — S або XS зусилля, але закривають P0 знахідки:

```
1. DELETE /api/debug/fire-notifs/route.ts                    (15 хв) SEC-P0-1
2. Telegram webhook secret token verification                 (20 хв) SEC-P0-2
3. explore/page.tsx: revalidate = 60                         (5 хв)  P0-PERF-1
4. GSAP → next/dynamic({ ssr: false })                       (10 хв) P0-PERF-3
5. getCategoryIcon switch → lookup map                        (15 хв) ARCH-4
6. Admin: type="button" mass replace (6 files)               (30 хв) CQ-P0-1
7. getSession() → getUser() (4 компоненти)                   (15 хв) SEC-P1-1
8. staleTime на 9 хуках                                      (20 хв) P1-PERF-4
TOTAL: ~2 год 10 хв → 8 знахідок закрито
```

---

## Sprint Roadmap

### Sprint-04 (поточний, до 2026-06-22)
- T-QA-explore: /explore photo heights + scrollable tags strip
- SEC-P0-1 + SEC-P0-2: security blockers
- P0-PERF-1: revalidate = 60 на /explore
- P0-PERF-3: GSAP dynamic()
- P0-TEST-3: vitest coverage config

### Sprint-05 (після launch)
**Focus: Revenue + Core gaps**
- C3: Клієнтська оплата при бронюванні (найбільший revenue impact)
- D7: Studio self-serve signup
- C1: Google/Apple Calendar sync
- C6: Recurring bookings
- P0-TEST-1: /messages E2E spec (55 → 56 specs)
- P0-TEST-2: /explore E2E spec (56 → 57 specs)
- P0-PERF-2: get_explore_masters RPC
- ARCH-2: Admin → TanStack Query
- SEC-P1-1..P1-4: всі P1 security fixes

### Sprint-06 (retention + scale)
**Focus: Growth + Architecture**
- C4: Telegram Mini App
- C8: Gift vouchers
- C2: Waiting list
- ARCH-1: notifMap.ts split
- ARCH-5: BookingPriceCalculator
- ARCH-6: MasterContext selectors
- D1: Analytics export Pro gate
- D2-D4: Monetization gates

---

## Загальна оцінка здоров'я проекту

| Домен | Оцінка | Коментар |
|-------|--------|---------|
| Функціональність | 8/10 | Основний booking flow повністю робочий |
| Security | 5/10 | 2 критичні дірки (fire-notifs + telegram) |
| Performance | 6/10 | Explore = bottleneck, решта OK |
| Testing | 5/10 | 55 E2E specs але критичні paths без coverage |
| Architecture | 7/10 | TanStack Query правильно, Admin = legacy |
| UX / Accessibility | 6/10 | Admin zone = screen reader incompatible |
| Code Quality | 7/10 | parseError існує, але не enforced; admin типи shallow |
| **Загальний** | **6.3/10** | Ready for soft launch після 2 P0 security fixes |

**Висновок:** Продукт готовий до soft launch після виправлення 2 P0 security блокерів. Full launch з production load потребує /explore ISR кешу (P0-PERF-1). Всі інші знахідки — пост-launch roadmap.
