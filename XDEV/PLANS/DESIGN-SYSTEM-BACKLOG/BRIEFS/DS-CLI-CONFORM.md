# DS-CLI-CONFORM — Clients: контраст + eyebrows sentence-case

> Тір 2 · CRM клієнтів. Продовження conform-серії (Explore/Analytics/Settings/Bookings-list).

## Чесний стан
`master/clients/` = 113 broad occ / 8 файлів. Розбір:
- **ЕТАЛОН C-CLI-01 (founder 10/10, НЕ чіпати):** `ClientDossierHero` (dark hero, `white/55` on-dark = коректно), `ClientDetailSheet` (санкц. `text-text-sub uppercase tracking-[0.16em]` Section-eyebrow — вже fixed), `ClientStatChips`, `ClientIdentityHeader`. Спільні в 6 точках, змішані dark/light. «Не ретрофіть конформне».
- **Легасі status-hex УЖЕ ФІКСНУТО (2026-06-07, memory):** RETENTION_CONFIG у `clientsUtils.tsx` → WCAG-AA (#15803D/#0F766E/#C2410C/#B91C1C). Мій transition-нот був stale.
- **SegmentBuilder color-swatches (#5C9E7A/#789A99/#D4935A/#C05B5B, рядки 117-191):** це USER-SELECTABLE segment-кольори (дані), не текст → лишаю.

## Скоуп (5 light файлів, safe)
`ClientsPage` (18) · `ClientGridCard` (10) · `ClientListRow` (10) · `ClientWidgets` (34) · `SegmentBuilder` (26). Усі light context.

## Зроблено (sed light-safe)
1. `text-muted-foreground(/NN)?` → `text-text-sub`; `bg-muted-foreground(/NN)?` → `bg-secondary`.
2. Eyebrows: знято `uppercase tracking-widest/wider/wide/tighter/tight` → sentence-case.
3. `text-sage` (= `var(--accent)` легасі-alias) → `text-accent` (канонічно, той самий колір).
4. Калібр статус-тонів на дрібному тексті ClientWidgets (delta/VIP-чек/one-timer `text-success`/`text-warning`) → `#0B6B2E`/`#9A4508` де це ТЕКСТ (не іконки).

## Не чіпаю
Еталон (Dossier/DetailSheet/StatChips/IdentityHeader), RETENTION_CONFIG (вже AA), segment color-picker дані, логіку/virtualizer/actions, empty-state step-icon accent-hex (декор-тайли, не текст).

## Гейти
Own-eyes: ClientGridCard/ListRow важкі (context/actions) → grep+tsc+build (мех. пас). Контраст парами. TSC:0 + build. TRACKER/TRANSITION/mempalace.

## Скіли
`design-taste-frontend` → a11y → (impeccable hook авто).
