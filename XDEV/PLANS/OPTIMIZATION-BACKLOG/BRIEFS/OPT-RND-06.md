# OPT-RND-06 — Кластер: height:0→auto акордеони (layout-triggering)

**Тип:** MOTION
**Пріоритет:** P2
**Статус:** DRAFT
**Спеціаліст-скіли:** `fixing-motion-performance`

---

## Поточний стан
Акордеони/розкривні блоки анімують `height: 0 → 'auto'` (framer міряє реальну висоту й анімує layout щокадру → reflow):
- `src/components/master/flash/FlashDealPage.tsx:486-488, 691-693` (два на сторінці).
- `src/components/master/pricing/DynamicPricingPage.tsx:443`.
- `src/components/shared/PromoTemplates.tsx:126-128`.
- `src/components/shared/SafetyAlert.tsx:57-59`.
- `src/components/admin/AllianceMap.tsx:285-287` (per-node у дереві — множник).

## Ціль
Пріоритетно там, де кілька коеснують одночасно (FlashDealPage — 2; AllianceMap — per-node). Варіанти: grid-rows `0fr→1fr` трюк (compositor-friendlier), або прийняти поодинокі як прийнятні. Поодинокі рідко-тогльовані — можна лишити.

## Файли, які чіпаю
- Насамперед `FlashDealPage.tsx` (2 акордеони) + `AllianceMap.tsx` (per-node).
- Решта — оцінити, чи варте правки (поодинокі low-impact).

## Ризики / що може зламатись
- `grid-rows 0fr→1fr` не всі браузери анімують плавно — перевірити цільові мобільні.
- Зміна механіки розкриття може зачепити вкладений контент (overflow, тіні) — own-eyes.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Місця з кількома одночасними акордеонами не роблять layout-reflow щокадру.
- [ ] Розкриття візуально плавне (own-eyes).

## Відкриті питання до тебе
1. Правити лише «множинні» місця (FlashDeal, AllianceMap), а поодинокі лишити як прийнятні? Рекомендую так — не роздрібнювати.
