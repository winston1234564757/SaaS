# DS-DASH-07 — Здоров'я каналів (ChannelHealthWidget)

> Тір 1 · Opus · Фаза P1 · Файл: `widgets/frost/ChannelHealthWidget.tsx`. Founder-гейт вирішую сам.

## Before

`bento-card` + uppercase-eyebrow «Канали клієнтів» + дві РІВНІ бордер-плитки Telegram/Push з % (маркер #1). `--text-tertiary` (§4-бан) скрізь; `%` у `--success` (≈3.95 на 17.6px bold → провал 4.5). Дані: `{total, tg, push}` = унікальні клієнти за 90 днів + скільки з них досяжні в TG / Push.

## Концепт («наскільки дотягуєшся до клієнтів»)

Один `Section` «Зв'язок з клієнтами». Асиметрія: **Telegram = герой** (первинний канал продукту, поріг 60% > push 40%), Push = тиха підтримка.
- Герой = досяжність у Telegram: домінанта-число + вердикт + «N із M клієнтів». Тап нема (немає drill-Sheet) — статус-віджет.
- Підтримка = Push окремим hairline-рядком зі смугою (тихіший за героя, НЕ рівна плитка).
- Actionable: слабкий канал → тихий CTA-лінк на `/dashboard/clients`.

## Стани (low-data)

1. loading → Section skeleton.
2. empty (`total===0`) → editorial «Ще нема кого сповіщати» + CTA до клієнтів (заміняє «Канали не підключені»).
3. sparse (`total<5`) → герой = чесний «N з M у Telegram» (число, НЕ %-шум); push теж «N з M».
4. dense (`total≥5`) → герой = tgPct% + вердикт Сильний/Помірний/Слабкий + «N із M»; push % + смуга.

## Тони (урок DS-DASH-04)

Вердикт-текст калібрований: good `#0B6B2E`(5.3) · warn `#9A4508`(5.1) · bad `--error`(5.1) — НЕ `--success`/`--warning`. Викорінити `--text-tertiary` → `--text-secondary`.

## Архітектура

- Існуючий `useChannelHealth` (raw `{total,tg,push}`) без змін.
- Props-only `ChannelHealthCard` (export) для own-eyes; `ChannelHealthWidget` = хук→card.

## Self-grill

- «Чому TG герой?» → первинний канал (deep-links, вищий поріг); Push вторинний. Реальна ієрархія, не вигадана.
- «Не втратив дані?» → ні: обидва канали видно, лише переранжовано + чесна дробина на sparse.
- «CTA-мета?» → `/dashboard/clients` (існуюча), копію під humanizer.

## Файли

- `widgets/frost/ChannelHealthWidget.tsx` — Write.

## Гейти

own-eyes ds-preview+Playwright (видалити) · контраст пар · TSC:0+build · humanizer нових рядків · ship-gate.
