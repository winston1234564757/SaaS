# DS-DASH-08 — Топ послуги (TopServicesWidget)

> Тір 1 · Opus · Фаза P1 · Файл: `widgets/frost/TopServicesWidget.tsx`. Founder-гейт вирішую сам.

## Before

`bento-card` + uppercase-eyebrow «Топ послуги · місяць» + список 3 з **numbered markers `01/02/03`** (§4-бан: numbered scaffold) + `--text-tertiary` (§4-бан). Футер = **3 РІВНІ** нав-лінки (Послуги/Прайс/Промо) — 3-equal бан. Дані: top-3 послуги за к-стю бронювань цього місяця (`useTopServices`, рахує `services[0]`).

## Концепт («хіт місяця»)

Один `Section` «Топ послуги», місяць — тихий `action` праворуч. Асиметрія:
- **Герой = послуга №1**: `heading-serif` назва + `metric-value` count + смуга accent на повну (домінантний бар). «Найчастіше цього місяця».
- **Рейл = №2/№3**: компактні рядки (назва + count + тонша смуга `--border-strong`), тихіші за героя. Без друкованих номерів → прибирає §4-скафолд; ранг несе позиція+розмір бару.
- Футер: 3 рівні лінки → 2 диференційовані (primary «Промо» Zap→/dashboard/flash + secondary «Послуги»→/dashboard/services). Прибирає 3-equal.

## Стани (low-data)

1. loading → Section skeleton.
2. empty (`top=[]`) → editorial «Ще нема замовлень цього місяця» + нота.
3. one (`top.length===1`) → лише герой (founder-реальність), без рейлу.
4. full (2–3) → герой + рейл.

## Тони

Викорінити `--text-tertiary` → `--text-secondary`. Тут статус-кольорів нема (нейтральні числа) → калібровані тони не потрібні; акцент лише на герой-барі (`--accent`).

## Архітектура

Існуючий `useTopServices` без змін. Props-only `TopServicesCard` (export) для own-eyes.

## Self-grill

- «Ранг без номерів зчитується?» → так: позиція згори + розмір бару + serif-герой. Друковані 01/02/03 = заборонений скафолд.
- «Данні не втрачені?» → ті самі 3 послуги, лише переранжовано в герой+рейл; нав-дії скорочено 3→2 диференційовані.

## Файли

`widgets/frost/TopServicesWidget.tsx` — Write.

## Гейти

own-eyes ds-preview+Playwright (видалити) · TSC:0+build · humanizer нових рядків · ship-gate.
