# M-BOOK-01 — Записи: кольорова корекція карток (пастель)

**Тип:** REDESIGN (colorize + distill) · **Пріоритет:** P1 · **Статус:** ✅ DONE
**Спеціаліст-скіл:** `impeccable` (distill + colorize) · **Модель:** Sonnet
**Аналог:** `M-CLI-05` (картки клієнтів) — «зроби так само, по гарячим слідам» (founder).

---

## Поточний стан
- `BookingCard.tsx:142-143` — `hover:shadow-2xl hover:border-primary/20 hover:translate-y-[-4px]` + інлайн `style={{ border: '1px solid ${cfg.color}', background: '${cfg.color}08' }}` → повна кольорова рамка + суцільний тінт + фіолетова hover-рамка.
- Статус-піл (`:208`) `cfg.color/cfg.bg` — аналог клієнтського піла, лишається.
- `BOOKING_STATUS_CONFIG` (lib/constants/bookingStatus.ts): pending `#D4935A`, confirmed `#789A99`, completed `#5C9E7A`, cancelled `#C05B5B`, no_show `#A8928D` (теплі/приглушені, не фіолет). Та сама форма `{label,color,bg}`, що `RETENTION_CONFIG`.
- Екшн-кнопки: «Підтвердити» `bg-primary/12 text-primary` (фіолет), «Завершити» success(зел.), «Не прийшов» muted(сір.), «Скасувати» error(черв.).
- Інші компоненти записів (BookingDetailsModal) юзають конфіг лише для піла — рамки/тінту не дублюють. Обсяг = тільки `BookingCard.tsx`.

## Рішення (перенесено з M-CLI-05, founder пре-апрув «так само»)
1. **Тіло:** прибрати рамку `border 1px solid cfg.color` + тінт `${cfg.color}08` → чиста bento-card + пастельний radial-glow у кольорі статусу (`statusGlow(cfg.color)`).
2. **Distill hover:** прибрати `hover:shadow-2xl hover:border-primary/20 hover:translate-y-[-4px] transition-all duration-300` → bento-card сам робить hover-lift (translateY -2px + тінь), як у клієнтських картках.
3. **Фіолет:** ВІДХИЛЕННЯ від 1:1 — кнопка «Підтвердити» лишається primary, бо це **головний CTA картки запису** (аналог «Записати» у клієнтів; правило «accent лише на головному CTA»). Решта екшнів уже семантичні — не чіпаю. Прибрано лише фіолетову hover-**рамку** картки.
4. **Обсяг:** тільки `BookingCard.tsx`.

## DRY-рефактор
Формулу glow винесено у спільний **`src/lib/utils/statusGlow.ts`** (`statusGlow(color)`), бо founder щойно тюнив силу (8→20%) — дві копії = майбутній біль. `clientsUtils.retentionGlow` тепер делегує до `statusGlow`. Картки клієнтів НЕ зачеплені (re-export через делегат). Майбутній тюнінг сили glow = один файл для обох доменів.

## Файли
- `bookit/src/lib/utils/statusGlow.ts` — НОВИЙ спільний хелпер.
- `bookit/src/components/master/clients/clientsUtils.tsx` — `retentionGlow` → делегат до `statusGlow` (картки клієнтів незмінні).
- `bookit/src/components/master/bookings/BookingCard.tsx` — рамка+тінт+фіолет-hover геть, `backgroundImage: statusGlow(cfg.color)`.

## Acceptance criteria
- [ ] TSC 0 · Build clean · encoding clean
- [ ] Тіло без рамки/фіолету; пастельний glow у кольорі статусу (5 статусів)
- [ ] hover = bento-card lift (без фіолетової рамки/shadow-2xl)
- [ ] Статус-піл + екшн-кнопки без регресій; primary лише на «Підтвердити»
- [ ] compact/hideTime/showDate варіанти картки без зламу

## DONE
**Commit:** [нижче] · **Перевірка:** TSC 0 · Build clean · encoding clean · humanizer N/A (без copy). Потребує візуального QA founder.
**KEY:** spillover-патерн M-CLI-05 → той самий glow на іншому домені; формула в `statusGlow` (одне джерело). У записах головний CTA = «Підтвердити» (primary), не окрема кнопка «Записати».
