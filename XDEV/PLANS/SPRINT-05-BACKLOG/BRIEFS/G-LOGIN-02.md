# G-LOGIN-02 — Логін мобільний: зазор між інпутом і клавіатурою

**Тип:** BUGFIX · **Tier:** 1 · **Скіл:** `senior-frontend`

## Root Cause

`<main className="flex items-center justify-center">` центрує форму вертикально в доступній висоті.

Коли клавіатура відкривається (autoFocus на phone input):
- `dvh` зменшується → right panel стискається до ~426px
- Форма (phone step) ≈ 468px → **перевищує доступний простір на 42px**
- `flex items-center` позиціонує форму з `-22px` зверху (кліпається!)
- iOS не скролить — бо focused input вже "видимий" (частково)
- Між phone input і клавіатурою: **156px порожнього простору**
- CTA "Отримати код" частково або повністю прихований

## Fix

Два компоненти рішення (аналог RestockDrawer, але для не-fixed елементу):

**1. `AuthKeyboard` client component** — обгортає right panel, застосовує `height: vv.height` через `visualViewport.resize`. Висота панелі = точно видима зона над клавіатурою (з плавним переходом 0.28s).

**2. Layout зміни** — `<main>` з `flex items-center justify-center` → `flex flex-col overflow-y-auto`. Внутрішній `div` отримує `my-auto` (центрування без CSS flex-overflow bug).

## Результат
- Без клавіатури: форма відцентрована вертикально ✓
- З клавіатурою: panel стискається до `vv.height`, форма скролиться, iOS правильно скролить до focused input, зазор ≈ 5-10px ✓
- Не чіпаємо autoFocus ✓

## Файли
- NEW: `bookit/src/app/(auth)/_components/AuthKeyboard.tsx`
- EDIT: `bookit/src/app/(auth)/layout.tsx` (lines 118–159)
