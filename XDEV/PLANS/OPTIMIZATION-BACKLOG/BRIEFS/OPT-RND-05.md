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
1. Немає — чекаю APPROVE.
