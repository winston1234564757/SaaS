# Повторний аудит + повний редизайн сторінок (post-dashboard)

> Тригер: founder — «домовлялись на редизайн ПОВНИХ сторінок, а не hero-секцій». Публічна сторінка
> в проді — патчворк (сірий графік, вимиті токени, старі bento). Дашборд P1 чистий — борг усюди інде.

## Об'єктивний борг (grep-скан усього застосунку)
- **Banned токени** (`muted-foreground`/`--text-tertiary` — вимитий контраст): аналітика, записи, маркетинг, налаштування, клієнти, товари, онбординг, візард.
- **Uppercase-eyebrow (§4):** settings 11 · bookings 9 · analytics 9 · clients 7 · products 6.
- **§4-декор** (gradient-text/glow/blob): analytics 7 · onboarding · settings · billing.
- **Кіт майже не прийнятий:** 8× EditorialCover, 10× Section, 3× Button на весь застосунок.
- `font-black`/`font-thin`: 0 (вже чисто).

## Принцип (закон, застосовувати скрізь)
Кожна DS-задача = **вся сторінка**, кожен блок до єдиної мови (темний блок-герой + світлі блоки з крафтом),
включно з sub-компонентами що рендеряться на ній. Own-eyes = рендер **живої повної сторінки** з
реалістичними даними (не окремі мок-секції). Нуль banned-токенів / §4-банів. Featured-диференціація + metric-value + hairline.

---

## Крок 0 — Дозакрити DS-CLIENT-01 як ПОВНУ сторінку (негайно — вона в проді й зламана)
Блоки, які я хибно відклав:
- `LoyaltyWidget` — `text-muted-foreground`, `text-warning`/`success` на дрібному (провал), uppercase-eyebrow, без домінанти → Section + прогрес-домінанта + калібровані тони.
- `MasterLocationCard` — `text-muted-foreground/60` (≈1.6:1, вимите «1 поверх · каб.3») → токени + kit.
- `FlashDealCard`/Strip — `muted-foreground/60`, inline-accent, «LIVE» піл → кіт + hairline + metric-value ціни.
- Floating CTA «Записатися» — glassmorphism-піл (45% opacity + inset-glow, §4) → kit Button primary solid.
- Referral-банери (×2) — привести до токенів.
Гейт: **рендер живої `/{slug}` повної сторінки** (прев'ю-роут з мок-майстром) mobile+desktop.

## Крок 1 — Аудит-скан як інструмент + AUDIT.md
Скрипт `scripts/ds-audit.mjs`: по кожній поверхні рахує banned-токени / eyebrow / §4-декор / kit-adoption → таблиця.
`DESIGN-SYSTEM-BACKLOG/AUDIT.md`: per-surface verdict (✅ pass / 🔧 retrofit / 🔴 redesign). Перебудувати TRACKER на full-page задачі.

## Крок 2 — Редизайн повних сторінок, пріоритет = видимість для клієнта → щоденний біль майстра
**Клієнт-зона (зовнішні очі, найвищий пріоритет):**
1. Explore `ExplorePage` (461)
2. Shop `ShopPage` (169)
3. Мої записи `app/my/bookings` — DS-CLIENT-03
4. Мій профіль `app/my/profile` — DS-CLIENT-04
5. ⚠️ BookingWizard (6 кроків) — окрема сесія з founder (revenue-critical)

**Майстер щоденний:**
6. Аналітика `AnalyticsPage` (557) — найгірший §4-борг
7. Налаштування `SettingsPage` (426) — найбільше eyebrow
8. Записи `bookings` list
9. Клієнти `ClientsPage` (709)
10. Маркетинг · Білінг `BillingPage` (666) · Growth/Loyalty

Кожен пункт: живий рендер повної сторінки + усі стани + TSC:0 + build + own-eyes + humanizer нових рядків. По одній сторінці за сесію (важкі — Тір 2).

## Порядок здачі
Крок 0 (зараз) → Крок 1 (аудит-док) → Крок 2 по одній сторінці. Після кожної: TRACKER/HANDOFF/TRANSITION + git + mempalace.
