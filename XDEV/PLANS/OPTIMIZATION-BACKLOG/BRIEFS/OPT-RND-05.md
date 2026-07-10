# OPT-RND-05 — Кластер: progress-бари анімують width/height замість transform

**Тип:** MOTION
**Пріоритет:** P2
**Статус:** DRAFT
**Спеціаліст-скіли:** `fixing-motion-performance`

---

## Поточний стан
Progress/meter-бари анімують layout-triggering `width`/`height` замість compositor-only `transform: scaleX/scaleY`:
- `src/components/master/flash/FlashDealPage.tsx:396-397` — `initial={{width:'0%'}} animate={{width:`${pct}%`}}`.
- `src/components/master/pricing/PricingUpgradeGate.tsx:147-148` — `width`.
- `src/components/client/MyLoyaltyPage.tsx:439-440` — `width`.
- `src/components/master/settings/widgets/SmartAdvisor.tsx:158` — `width`.
- `src/components/master/settings/widgets/ScheduleWidget.tsx:194-195` (`height`) + `:225` (`width`) — **ряд** барів, множник layout-костів.

## Ціль
Замінити на `scaleX`/`scaleY` з `transform-origin: left`/`bottom`. Значення відсотка → `scaleX={pct/100}`. Текст/лейбли поверх — компенсувати, щоб не масштабувались (окремий шар).

## Файли, які чіпаю
- 5 файлів вище (ScheduleWidget — найважливіший, там ряд барів).

## Ризики / що може зламатись
- `scaleX` масштабує і вміст бару (градієнт/бордер-радіус кутів спотворяться). Стандартний фікс: бар — окремий порожній шар зі scale, контент/лейбли — окремо.
- Округлені кінці (`rounded-full`) при scale деформуються — перевірити візуально (own-eyes).
- Анімація має лишитись візуально ідентичною (той самий easing/spring).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Жоден бар не анімує `width`/`height`; лише `transform`.
- [ ] Візуально ідентично (кути, лейбли не спотворені) — own-eyes.

## Відкриті питання до тебе
1. Немає.

---

## [Заповнюється після DONE]

**Зроблено — лише 3 бари, де є реальний множник:**
- `ScheduleWidget.tsx:193` — заливка клітинки дня: `height: 0→N%` → `scaleY: 0→N/100` + `h-full origin-bottom`. Це **ряд із 7 днів** — єдиний справжній множник layout-костів.
- `ScheduleWidget.tsx:221` — бари завантаженості («Тиждень» / «30 днів»): `width` → `scaleX` + `w-full origin-left`; прибрано зайвий внутрішній `rounded-full` (зовнішній трек `rounded-full overflow-hidden` і так формує кінці).
- `FlashDealPage.tsx:393` — прогрес-бар акції: те саме перетворення.

**Свідомо НЕ чіпав 3 поодинокі бари** (`PricingUpgradeGate:147`, `MyLoyaltyPage:439`, `SmartAdvisor:158`): це **одноразові** entrance-анімації на крихітних ізольованих поверхнях — `fixing-motion-performance` rule 2 їх прямо дозволяє («paint or layout animation is acceptable only on small, isolated surfaces» + «one-shot effects are acceptable more often»). Виграш ≈0, а сліпа візуальна зміна ×3 — зайвий ризик.

**Безпека за побудовою:** `width:X%` ≡ `scaleX(X/100)` на `w-full` елементі з `origin-left` усередині `overflow-hidden` треку. Спотворення округлих кінців знято прибиранням внутрішнього `rounded-full`.

**Own-eyes:** прогнав dev-сервер на локальному Supabase + playwright-скріншоти. Baseline вийшов на порожніх даних (occupancy 0%, нуль активних акцій → бари не рендеряться). Після зміни сід дозаписав бронювання, і на «after» бари **видно з реальними даними** (дні 17%/8%…, «Тиждень 11%», «30 днів 9%») — заливка притиснута до низу/ліва, пропорційна, у межах треку, кінці не спотворені. **Строгого піксельного A/B немає** (дані між прогонами змінились), але потрібне — якір, пропорція, клипінг — підтверджено візуально.

**Побічно перевірено (A/B):** hydration mismatch на `/dashboard` — **пре-існуючий**, не від ASSET-01. Контрольний прогін із відкоченим `DashboardLayout` дає ті самі 2 console-помилки (eval/CSP + hydration). Третій «issue» у dev-оверлеї — `RefererNotAllowedMapError` Google Maps на localhost, середовищне.

**Файли:** `src/components/master/settings/widgets/ScheduleWidget.tsx`, `src/components/master/flash/FlashDealPage.tsx`.
**Верифікація:** TSC 0 · Build clean · ESLint — 0 нових помилок (15 пре-існуючих у цих файлах: display-name, no-explicit-any, set-state-in-effect, preserve-manual-memoization; жодна не на моїх рядках).
**Commit:** pending.
