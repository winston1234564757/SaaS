# DS-CLIENT-05 — Explore (пошук майстрів) · повна сторінка

> Тір 2 · клієнт-зона, зовнішні очі, найвищий пріоритет видимості.
> Файли: `ExplorePage.tsx` + `explore/{SearchPortal,IntentGrid,cards,FilterSheet,ReferralInviteCTA,shared}` + `app/explore/page.tsx`.

---

## Чесна оцінка Before (не прикрашаю)

Explore — **одна з найсильніших легасі-поверхонь**, НЕ зламана сторінка. Уже має:
- **Темний блок-герой** — `SearchPortal` = `bg-accent` (Frost `--accent #0F172A` = slate). Реальна обкладинка з пошуком-героєм + типографіка категорій розміром = частка майстрів (асиметрія).
- **Асиметрію тіла** — `IntentGrid` (один hero-intent + тихі chips), `SpotlightCard` (один editorial-PRO з фото).
- **Чесні low-data стани** — hero fallback today→tomorrow→top; spotlight ховається без фото; empty-стан.
- Живі функції: гео «поруч», smart-sort за історією, intent-chips, grid/list.

**Тому це НЕ ground-up rewrite** (як Analytics з фейком). Переписати з нуля = регресія робочого discovery-флоу. Це **системний token+contrast+craft alignment** — точнісінько ситуація DS-CLIENT-03 (Мої записи): структура сильна → викорінити banned-токени, полагодити контраст, підняти крафт світлих блоків. Прикидатись «редизайном з нуля» було б нечесно.

## Об'єктивний борг (grep, верифіковано)

1. **`text-muted-foreground` ×~30** — на Frost `--color-muted-foreground: var(--text-tertiary)` = `rgba(15,23,42,.45)` = **2.78:1** = САМЕ забанене §4 вимите значення (founder-скарга «патчворк»). У всіх 5 файлах.
2. **Статус-тони провалюють 4.5:1 на світлому дрібному** — `AvailChip` `var(--success)`/`var(--warning)` (10px), `--warning #B45309` на зірках. Урок DS-DASH-04.
3. **Uppercase-eyebrow (§4-бан)** — `SpotlightCard` «ОБРАНЕ» tracked; `FilterSheet` заголовки «ЦІНА»/«СОРТУВАННЯ» tracked.
4. **Кіт майже не прийнятий** — 0 `Button`, 0 `Section` (окрім `FilterSheet` вже на kit `Sheet`). Хендрол-кнопки скрізь.

## Концепт (що лишаю, що піднімаю)

**Не чіпаю (працює, драму несе):** SearchPortal-як-темний-герой, IntentGrid-логіка, geo/smart-sort/intent, grid/list-перемикач, spotlight-відбір, pagination, referral-логіка (C2B verified). Grid карток — легітимна однорідна сітка (як фото-грід; асиметрію несуть hero+spotlight, не кожна картка).

**Піднімаю:**
- **Токен-пас:** `text-muted-foreground` → `text-text-sub` (#475569, 5.9:1) де другорядне; → `text-foreground` де насправді головне (ціна послуги, ім'я міста поряд з іконкою). Через `replace_all` (edit-guard).
- **On-dark контраст SearchPortal:** субтайтл `/50` (4.46, провал для 11px) → `/70`; категорії неактивні `/45`→`/60`, лічильник `/35`→`/55` (мін 6.0 для дрібного). Перевірю парами.
- **Калібровані тони:** `AvailChip` good `#0B6B2E`(5.25) / warn `#9A4508`(5.1); зірка-fill — теплий амбер (декор-іконка, не текст), число поряд лишається `text-foreground metric-value`.
- **§4-eyebrow геть:** Spotlight «Обране» → `Badge surface="light"` (піл, sentence-case) або тихий не-tracked лейбл; FilterSheet заголовки → sentence-case без `uppercase tracking`.
- **Кіт опортуністично:** FilterSheet «Скинути/Готово» → `Button secondary/primary`; ReferralInviteCTA + footer-recruit CTA → `Button primary`; empty-state «Скинути все» + load-more → `Button`. Хендрол-nav-chips (IntentGrid) лишаю `<button>` (toggle-піли, не дії-домінанти — конверсія = регресія, урок DS-DASH-01/10).
- **Крафт світлого:** числа `.metric-value` (є), імена `.heading-serif`/CORMORANT (є). ReferralInviteCTA заголовок домінантою (є, Cormorant 1.7rem) — лишаю, тони фікс.

## Файли
`ExplorePage.tsx` · `explore/SearchPortal.tsx` · `explore/IntentGrid.tsx` · `explore/cards.tsx` · `explore/FilterSheet.tsx` · `explore/ReferralInviteCTA.tsx`. (`shared.ts`, `app/explore/page.tsx` — без змін, лише читав.)

## Ризики
- Grid карток однорідна — але це легітимно (фото-грід). Ризик: аудитор побачить «N карток». Мітигація: асиметрію несуть hero+spotlight; задокументовано.
- SearchPortal script-font h1 (`--font-great-vibes`) — не Cormorant. Свідомо лишаю (hero-ідентичність, founder-call); не чіпаю без запиту.
- `replace_all` голого `text-muted-foreground` ПІСЛЯ `/60`/`/40`-варіантів (інакше `text-text-sub/60` нонсенс).

## Гейти здачі
Own-eyes: прев'ю-роут `ds-preview` (жива повна Explore-сторінка з мок-майстрами, рідкі + густі дані) mobile 430 + desktop 1400, Playwright, видалити перед commit. · Контраст парами (a11y MCP / скрипт). · TSC:0 + build. · humanizer нових рядків (мінімум — copy майже незмінний). · TRACKER/TRANSITION/mempalace.

## Скіли
`design-taste-frontend` (перед .tsx) → `impeccable` (audit) → a11y → humanizer.
