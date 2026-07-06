# DESIGN_SYSTEM_ROLLOUT.md — беклог конвергенції на дизайн-мову

> Розкат [DESIGN_LANGUAGE.md](file:///C:/Users/Vitos/SaaS/XDEV/DESIGN_LANGUAGE.md) по поверхнях. Кожен пункт = окрема REDESIGN-задача за WORKFLOW (пре-код ритуал + власні очі + a11y + humanizer). **Фундамент (кіт+токени+доки) зроблено — це список споживачів.**
>
> Порядок = за болем founder («6/10») × охопленням × ризиком. Опортуністична міграція: коли й так чіпаєш екран — переводь на кіт.

## Статус фундаменту (done)
- ✅ Токени `--cover-bg`/`.editorial-cover` (globals.css)
- ✅ `EditorialCover` + `Section` (нові примітиви)
- ✅ `Button`/`Badge` під мову · `BentoCard` видалено (мертвий анти-патерн)
- ✅ `Sheet` `srTitle`
- ✅ Еталон: C-CLI-01 (картка клієнта + запису)
- ✅ `DESIGN_LANGUAGE.md` + impeccable DESIGN.md

## Уже конвергентні (цей спринт, editorial-редизайн)
Analytics 7/7 (M-ANL) · Billing (M-BILL) · Settings (M-SET) · Reviews (M-REVW) · Growth/Loyalty · Marketing story · Explore (C-EXPL) · MyBottomNav (C-NAV) · Messenger (M-CHAT). → опортуністично перевести на `EditorialCover`/`Section`/`Button` коли чіпаємо.

## Фази розкату (не почато)

### P1 — Дашборд-віджети майстра (найбільший 6/10)
`FrostDashboard` + `widgets/frost/*` (WeeklyChart, PeakHours, Cancellation, NextFreeDays, Insights, ChannelHealth, TopServices, EarningsPulse, AdaptiveContextStrip). Хендрольні bento без домінанти → `EditorialCover` герой дня + `Section` тіло. Кожен віджет — власна ієрархія, не рівна сітка.

### P2 — Клієнтська зона (публіка + запис)
`PublicMasterPage` (легасі-персик подекуди) · `BookingWizard` (6 кроків) · `/my/*` (bookings, profile, messages). Перевести на Frost-токени + кіт. Booking-крок = editorial.

### P3 — Модалки та шторки
Усі споживачі `Sheet` → hero через `EditorialCover` + тіло через `Section` (як C-CLI-01). Кандидати: `ManualBookingForm`, `MaterialsReviewSheet`, `ReviewDetailSheet`, `FlashDealDetailSheet`, `BroadcastDetailSheet`, `NewConversationSheet`, `OverviewDetailSheet`.

### P4 — Кнопки/картки-хендроли (опортуністично)
Хендрольні `<button className>` та `bento-card p-5` по проекту → `Button`/`Section`. НЕ big-bang; по-екранно в межах P1–P3.

### P5 — Лендинг узгодження
`landing/*` вже Frost, але власна `--l-*` система. Звірити з мовою (dark-блоки BentoFeatures/FooterCTA вже темні — узгодити токени/рамп).

## Поза розкатом
Теми Blossom/Studio (Frost-only активна) · адмін-зона (низький пріоритет).
