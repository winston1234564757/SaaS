# OPT-DB-08 — Кластер N+1 / query waterfall

**Тип:** DATA
**Пріоритет:** P2
**Статус:** DRAFT
**Спеціаліст-скіли:** `senior-backend`

---

## Поточний стан
- `src/app/my/loyalty/page.tsx:132-145` — `Promise.all(masters.map(m => rpc('get_c2c_balance', {referrer, master})))`: один RPC round-trip на кожного реферованого майстра (N+1, розпаралелено, але N запитів).
- `src/app/(master)/dashboard/marketing/actions.ts:437-444` — `getBroadcastAnalytics` вкладає awaited ownership-запит усередину `.in(...)`, хоч уже обмежено одним `broadcastId` → два round-trip замість одного.
- Sequential-then-await (незалежні запити, мали б `Promise.all`):
  - `src/lib/hooks/useVacationImpact.ts:34-52` — `master_time_off` потім `bookings`.
  - `src/lib/hooks/useSourceAttribution.ts:73-79` — поточний період потім попередній (лише при compareTrend).
  - `src/lib/hooks/useReviewsMetrics.ts:85-99` — той самий current-then-previous патерн.

## Ціль
- loyalty: один set-returning RPC `get_c2c_balances(referrer)` згрупований по майстрах.
- broadcast: прибрати вкладений sub-query (ownership перевірити guard'ом до, або join).
- 3 хуки: незалежні запити в `Promise.all`.

## Файли, які чіпаю
- `src/app/my/loyalty/page.tsx:132-145` (+ можливо новий RPC).
- `src/app/(master)/dashboard/marketing/actions.ts:437-444`.
- `useVacationImpact.ts:34-52`, `useSourceAttribution.ts:73-79`, `useReviewsMetrics.ts:85-99`.

## Ризики / що може зламатись
- Новий `get_c2c_balances` RPC має точно відтворити семантику per-master балансу (owner-guard, `search_path`).
- `Promise.all` у хуках: переконатись, що другий запит справді не залежить від першого (source/reviews prev-period — незалежний від current, ок).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] loyalty: один запит замість N; broadcast: один round-trip.
- [ ] 3 хуки паралелізовані; значення незмінні.

## Відкриті питання до тебе
1. Немає — чекаю APPROVE. (loyalty-RPC — найбільша частина, решта дрібне.)
