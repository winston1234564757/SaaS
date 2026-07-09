# OPT-EXPL-01 — /explore глибша cache-shell стратегія (carry-over P0-PERF-1)

**Тип:** REDESIGN (architecture)
**Пріоритет:** P1
**Статус:** ⏸ DEFERRED (не форсити перед лончем)
**Спеціаліст-скіли:** `nextjs` `senior-frontend`

---

## Поточний стан
`src/app/explore/page.tsx:20` — публічний каталог тягнеться через `getExploreMasters()` з `explore/data.ts` (data-cache **вже приземлився**, commit `7a02806c` за session-handoff). Тобто «zero cache» зі старого P0-PERF-1 частково закрито.

Лишається: сторінка досі має dynamic-частини (per-user preferred categories `:24-46`, inviteCode `:51-58`), що тримають її частково динамічною. Повний фікс класу P0-PERF-1 — cache-shell + Suspense-island для per-user частин, того ж класу, що й повністю динамічний `[slug]` роут.

## Ціль
Винести per-user частини (`preferredCategories`, `inviteCode`) у Suspense-island поверх кешованого shell'а каталогу. Потребує ввімкненого `cacheComponents` (Next canary flag).

## Файли, які чіпаю
- `src/app/explore/page.tsx` — розділити кешований shell і per-user island.
- `src/app/explore/data.ts` — межа data-cache (вже є).
- `next.config.ts` — прапор `cacheComponents` (окреме рішення).

## Ризики / що може зламатись
- **Блокер:** потребує `cacheComponents`, який зараз не ввімкнено. Вмикання — окреме архітектурне рішення з власними ризиками по всьому застосунку.
- За `SESSION_HANDOFF_2026-07-10`: **degradation ≠ bug, НЕ форсити перед лончем.** Потребує власного Task Gate + тестів.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Каталог обслуговується з кешу; per-user частини — окремий island без інвалідації shell'а.
- [ ] Прогнано власний Task Gate + e2e для /explore (вже є 10 тестів, commit `91615a6e`).

## Відкриті питання до тебе
1. Вмикати `cacheComponents` глобально — окреме рішення. Робити цю задачу тільки after-launch?
