# DS-DASH-05 — Найближчі вільні дні (Section-редизайн)

**Статус:** DONE ✅ (founder QA пройдено · TSC:0 · Build:0)
**Тип:** REDESIGN · **Тір:** 1 · **Модель:** Opus · **P1**
**Файли:** `widgets/frost/NextFreeDaysWidget.tsx` (переписати) · `widgets/shared/hooks/useNextFreeDays.ts` (+`freeCount`, `workingDays`, `dayFull`)
**Скіли:** design-taste-frontend → impeccable (audit) → humanizer (нові рядки)

---

## Before (живий стан)

`bento-card p-4` хендрол:
- eyebrow `Вільні дні` (`text-tertiary` — 2.78:1, забанене §4)
- ряд з **до 5 однакових пілів** (день Пн + число + міс) — маркер провалу «N рівних», без домінанти/зірки
- **2×2 сітка з 4 CTA** (Flash / Сторіс / Шаблони / Розсилки) — знову рівномірність
- `return null` коли 0 вільних днів → на desktop (`h-full [&>*]:h-full` комірка) = порожня діра в гріді

Хук `useNextFreeDays`: дивиться 1-14 днів, збирає до 5 днів БЕЗ жодного запису (крім неділі). Повертає `{iso, dayLabel(Пн), dateLabel(5 лип)}`.

## Концепт (з нуля, не ретрофіт)

Метафора: **черга відкритих вікон** — не сітка дат, а «ось найближче вікно, яке варто заповнити». Питання за 3 сек: «коли моя найближча можливість продати слот?»

Світлий `Section` (лесон #1). Icon `CalendarDays`, title `Вільні дні`. Desktop h-full: `Section className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1"`.

**Домінанта = найближче вільне вікно (зірка).** Рештa вільних днів = тихий диференційований рейл (менші за героя). Ніколи N рівних пілів.

## 🔴 Low-data — тут ІНВЕРСІЯ DS-DASH-04 (лесон #2)

Founder має мало записів → **майже всі дні вільні**. «5 вільних днів» рівною сіткою = не інсайт, а «ти порожній», замаскований під дані. Тому фреймінг адаптується до відкритості календаря.

Хук +`freeCount` (усього вільних робочих днів у вікні, без кепу) + `workingDays` (усього робочих днів). `openness = freeCount / workingDays`.

| Стан | Умова | Домінанта |
|---|---|---|
| **loading** | isLoading | skeleton (герой + рейл) |
| **win** | `freeCount === 0` | Замість `return null`: `heading-serif` «Усе розписано» + «Найближчі 2 тижні зайняті» + emerald-точка. Без fill-CTA. Латає діру гріда. |
| **open** | `openness ≥ 0.7` | Календар відкритий (founder-реальність). Eyebrow «Багато вільних вікон». Герой = найближче вікно + рейл. Акцент на дії заповнити. |
| **gaps** | `openness < 0.7` | Eyebrow «Найближче вільне вікно». Герой = найближчий вільний день серед зайнятих + рейл решти. |

Герой (open + gaps однакова структура, різний eyebrow): `heading-serif` повний день (`Пʼятниця`, +`dayFull` у хук) + `metric-value` дата (`5 лип`, accent). Клікабельний → `onDayClick(iso)`, aria-label. Рейл: `freeDays.slice(1)` компактні піли, клікабельні.

## Диференціація (закон білого блоку)
- 4 рівні CTA → **2 фокусні**: Сторіс(free_slots, primary slate) + Flash(secondary hairline). Прибрати Шаблони/Розсилки (загальний маркетинг, не «заповнити цей день»; доступні з /dashboard/marketing). Той самий редукшн, що founder схвалив у DS-DASH-04.
- Герой (великий serif) vs рейл (малі піли) — ієрархія розміром, не рівність.
- Контраст: `text-tertiary` (2.78) прибрати з усього тексту → `text-secondary` (5.98). Ієрархію нести розміром (лесон #4 DS-DASH-04).

## Actionable
- Сторіс → `/dashboard/marketing?mode=free_slots` (постить вільні слоти в сторіс — найпряміший спосіб заповнити). Primary.
- Flash → `/dashboard/revenue?drawer=flash_deals` (флеш-акція). Secondary. Узгоджено з tour-текстом кроку 12 («ідеально для Flash Sale»).
- Клік по герою/пілу рейла → `onDayClick` (Sheet слотів дня) — зберегти, не регресувати.

## Self-grill
- *«openness-поріг 0.7 не забагато логіки для Тір 1?»* → мінім.: хук уже ітерує 14 днів, лише додати 2 лічильники. Без цього фреймінг бреше на порожньому календарі (founder бачить саме його). Це серце low-data-уроку.
- *«win-стан замість null?»* → так, `return null` лишає діру в desktop h-full гріді. Section win-картка латає + преміум. Rare, але делікатний.
- *«heading-serif на даті?»* → НІ (Cormorant oldstyle 5→). День (літери) → serif; дата-число → metric-value/tabular.
- *«4→2 CTA — не втрата для founder?»* → Шаблони/Розсилки досяжні з /marketing. Закон кнопок: одна primary. DS-DASH-04 прецедент схвалено.
- *«onDayClick на герої?»* → так, зберегти клік-у-Sheet-слотів; hero + рейл обидва клікабельні.

## Файли
1. `useNextFreeDays.ts` — +`freeCount`, `workingDays` (лічильники у циклі), +`dayFull` у `FreeDay`.
2. `NextFreeDaysWidget.tsx` — переписати на `Section` (h-full pattern); винести props-only `NextFreeDaysCard` для own-eyes; зберегти `onDayClick` + a11y (aria-label ≥44px).

## Ризики
- Поріг openness 0.7 суб'єктивний — узгодити.
- win-стан завжди рендериться (не null) → мінлива, але латає діру. Підтвердити.

## Гейти
- own-eyes: `ds-preview` + Playwright, стани **win · open (founder) · gaps · loading**; видалити перед commit.
- Контраст скриптом (a11y MCP down): усі тони ≥4.5 на `--surface` L=0.779.
- TSC:0 + build.
- humanizer: «Усе розписано», «Найближчі 2 тижні зайняті», «Багато вільних вікон», «Найближче вільне вікно».
- impeccable audit · founder QA.
