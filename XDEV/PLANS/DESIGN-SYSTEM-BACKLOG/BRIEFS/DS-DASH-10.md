# DS-DASH-10 — Адаптивна смуга контексту (AdaptiveContextStrip)

> Тір 1 · Opus · Фаза P1 (ЗАВЕРШУЄ дашборд) · Файл: `widgets/AdaptiveContextStrip.tsx`. Founder-гейт сам.

## Чесна оцінка Before

Найменш-порушливий віджет P1: **вже** редизайнено в M-DASH-01 (24.06) — домінантна MainCard (`flex-[1.4]` tinted) + компактні secondary, spring-stagger + popLayout, `--text-secondary` (НЕ tertiary), нуль §4-банів (без emoji/font-black/gradient/eyebrow/numbered). Логіка станів (busyness empty/quiet/moderate/busy + pending-пріоритет) — робоча, НЕ чіпати.

## Реальні гепи мови (targeted, не rewrite)

1. Кіт-примітиви не адоптовано. Головна CTA = хендрол `<button>` з `var(--accent)` bg → **kit `Button variant="primary"`** (slate `--btn-primary-bg`, «одна домінант-дія на поверхню»). Сильніша домінанта + тактильний whileTap кіту.
2. Нема props-only view для own-eyes. Витягнути `ContextStripView({ main, secondary })` (без хуків) — консистентно з 06–09.
3. Домінанта: main title FitText 15–20 → 16–22 (читається за 3 сек). Secondary лишається `surface`-картками (вже тихіші за tinted main → асиметрія збережена).

## НЕ роблю (свідома межа)

- Section/EditorialCover: роль = смуга-рекомендація з hero-CTA-карткою, НЕ титульний body-блок → Section не пасує; другий dark cover заборонено (єдиний = GreetingWidget).
- Логіку станів, pending-пріоритет, FitText, hideOnDesktop, popLayout — зберегти 1:1.

## Стани

Візуал не змінює логіку; own-eyes покриває empty/quiet/moderate/busy + urgent-main через мок-cards у `ContextStripView`.

## Файли

`widgets/AdaptiveContextStrip.tsx` — Write (рефактор + Button + view-extract).

## Гейти

own-eyes ds-preview (мок-стани) + Playwright (видалити) · TSC:0+build · humanizer (нових рядків нема — copy незмінний) · ship-gate.
