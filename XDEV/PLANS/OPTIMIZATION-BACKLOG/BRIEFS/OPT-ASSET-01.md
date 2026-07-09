# OPT-ASSET-01 — Lazy-load важких drawer'ів

**Тип:** MOTION
**Пріоритет:** P1
**Статус:** DRAFT
**Спеціаліст-скіли:** `react-best-practices`

---

## Поточний стан (верифіковано 2026-07-10)
- `src/components/master/DashboardLayout.tsx:8,106` — `BookingDetailsModal` імпортується **статично** і монтується в шелі → потрапляє в бандл і монтується на **кожному** вході в дашборд, хоча відкривається зрідка.
- `ClientDetailSheet` — статичний імпорт у 4 місцях: `dashboard/widgets/frost/InsightsRow.tsx:7`, `widgets/studio/InsightsRow.tsx:8`, `widgets/shared/StatsModals.tsx:6`, `clients/ClientsPage.tsx:12`.
- `src/components/master/settings/components/ImageCropper.tsx:4` — `react-easy-crop` статично (важка ліба), хоч використовується лише в crop-drawer.

Довідково: `dynamic()` уже широко застосовано (Analytics, BookingFlow, DnD, gsap, revenue/growth під-таби) — патерн у проекті є.

## Ціль
Перевести важкі, рідко-відкривані drawer'и/ліби на `next/dynamic` (`{ ssr:false }` де доречно), за conditional-mount.

## Файли, які чіпаю
- `src/components/master/DashboardLayout.tsx:8,106` — `BookingDetailsModal` через `dynamic()`.
- 4 споживачі `ClientDetailSheet` → спільний `dynamic()`-варіант (можливо, один re-export модуль).
- `src/components/master/settings/components/ImageCropper.tsx:4` — `react-easy-crop` через `dynamic()`.

## Ризики / що може зламатись
- `BookingDetailsModal` керується глобально (`UrlActionBus`/store `flashOnCancelStore`) — dynamic-обгортка не має зламати відкриття за URL-екшеном; можливо, лишити монтування, але lazy-компонент всередині.
- `ClientDetailSheet` спільний у 6 точках (SYSTEM_MAP) — dynamic не має зламати передачу props у жодній.
- SSR: sheet'и клієнтські — `ssr:false` безпечно, але перевірити відсутність hydration-mismatch.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] BookingDetailsModal / ClientDetailSheet / ImageCropper не в початковому чанку відповідних сторінок (перевірити build-output).
- [ ] Відкриття кожного drawer'а працює (URL-екшен, кліки з віджетів, crop).

## Відкриті питання до тебе
1. Немає — чекаю APPROVE.
