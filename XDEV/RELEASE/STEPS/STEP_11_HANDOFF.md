# STEP 11 — Shop + Portfolio: Handoff Note

> **Від:** STEP 10 (Public Master Page `/[slug]`) ✅ Complete — 2026-05-31
> **До:** STEP 11 — Shop + Portfolio (`/[slug]/shop`, `/[slug]/portfolio`)
> **Модель:** 🔴 Opus 4.7 max (race conditions + stock atomic ops)
> **Структура:** 1-2 чати (shop + portfolio можна розбити)

---

## 🎯 Контекст передачі

STEP 10 завершено correctness + visual polish аудитом. Проект на **9/13 кроків (~69%)**.

STEP 11 — публічні сторінки магазину та портфоліо майстра. Opus 4.7 max потрібен через:
- Атомарний декремент stock (`increment_stock_rpc` / UPDATE ... WHERE stock_qty >= qty)
- Nova Poshta API інтеграція (якщо є)
- Consent Flow для покупок без авторизації

---

## 📦 Scope: Files to Audit

```
src/app/[slug]/shop/page.tsx           ← SSR: fetch products, auth check
src/app/[slug]/portfolio/page.tsx      ← SSR: fetch portfolio items list
src/app/[slug]/portfolio/[id]/page.tsx ← SSR: single portfolio item detail

src/components/public/ShopPage.tsx          ← 799 рядків, головний client component
src/components/public/portfolio/
├── PublicPortfolioGallery.tsx              ← 104 рядки (gallery on master page)
└── PortfolioBookingButton.tsx             ← 92 рядки (booking CTA)
```

---

## 🔍 Pre-scan (2026-05-31)

### ShopPage.tsx (799 рядків) — очікувані проблеми:
- Кнопки "Додати в кошик", "Замовити" — перевірити `type="button"`
- Quantity +/- кнопки — перевірити `aria-label` + touch targets ≥ 44px
- Toggle filters/category — `aria-pressed`?
- Inline spring transitions — потрібен `SPRING as const`
- Stock sold-out стани — correctness перевірка

### Portfolio pages — очікуваний стан:
- `PublicPortfolioGallery.tsx` (104 рядки) — швидка перевірка
- `PortfolioBookingButton.tsx` (92 рядки) — type="button", aria-label?
- Route pages — SSR-only, мало інтерактивності

### Security — перевірити обов'язково:
- `createPublicOrder` в `actions.ts` — вже перевірено STEP 10 (CLEAN)
- Stock TOCTOU: `UPDATE products SET stock_qty = stock_qty - qty WHERE id = $1 AND stock_qty >= qty` — вже перевірено (CLEAN)
- Якщо є нові server actions у shop — перевірити auth before try{}

---

## 🗺️ Файлова мапа

```
src/app/[slug]/
├── shop/
│   └── page.tsx       — force-dynamic / revalidate:60, fetch products (Pro/Studio only)
└── portfolio/
    ├── page.tsx       — revalidate:300, fetch portfolio_items list
    └── [id]/
        └── page.tsx   — single portfolio item with photos + reviews

src/components/public/
├── ShopPage.tsx                        — 799 рядків, useState cart + order flow
└── portfolio/
    ├── PublicPortfolioGallery.tsx      — gallery strip on master public page
    └── PortfolioBookingButton.tsx      — booking CTA inside portfolio
```

---

## ⚡ QA-GATE питання для STEP 11

1. **Глибина аудиту:** Correctness-only чи + visual polish?
2. **Scope:** ShopPage + Portfolio разом чи два окремих чати?
3. **Stock race:** Перевіряти createPublicOrder atomic ops чи skip (вже верифіковано STEP 10)?
4. **Nova Poshta:** Перевіряти delivery integration чи тільки UI?
5. **Empty states:** Аудит ShopPage при 0 товарів / Sold Out?

---

## 🧠 MemPalace контекст

```
mempalace_search "shop page products stock order"
mempalace_search "portfolio items public gallery"
mempalace_search "createPublicOrder stock atomic"
```

---

## 🏁 Стан на момент передачі (2026-05-31)

| Параметр | Значення |
|----------|----------|
| TSC | 0 помилок |
| Build | clean (51 pages) |
| MemPalace | 21,229+ drawers |
| Активна гілка | `main` |
| Остання зміна | STEP 10 correctness + visual polish |
| Drawer STEP 10 | `drawer_bookit_audits_6b554b09eed872165f45ba2a` |

---

## 📋 Промт для нового чату (copy-paste)

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitossik\SaaS\bookit

STARTUP SEQUENCE (виконати ПЕРШИМ):
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

ЗАДАЧА: STEP 11 — Shop + Portfolio
Scope: /[slug]/shop + /[slug]/portfolio + ShopPage.tsx (799 рядків)

ПЕРЕД КОДОМ — обов'язковий TASK GATE:
1. mempalace_search "shop page products stock order"
2. Explore агент → scan ShopPage.tsx + portfolio files (medium breadth)
3. Задати 3-5 уточнюючих питань по scope
4. Оголосити SKILL + запустити через Skill tool
5. Отримати OK від користувача

КОНТЕКСТ:
STEP 10 ✅ COMPLETE — Public Master Page correctness + visual polish (2026-05-31)
Drawer STEP 10: drawer_bookit_audits_6b554b09eed872165f45ba2a

Handoff: C:\Users\Vitossik\SaaS\XDEV\RELEASE\STEPS\STEP_11_HANDOFF.md

ЗАЛІЗНІ ПРАВИЛА:
• SPRING = { type: 'spring' as const, stiffness: 280, damping: 24 } as const
• ніколи onClick на div/span → тільки <button type="button"> або <Link>
• aria-pressed на toggle/selector buttons; touch targets ≥ 44px
• весь новий UI-текст → /humanizer
• Post-change: npx tsc --noEmit → npm run build → mempalace_add_drawer

МОДЕЛЬ: 🔴 Opus 4.7 max (race conditions + stock atomic ops)
```

---

*Handoff створено: 2026-05-31 · Автор: Claude Sonnet 4.6 (STEP 10 session)*
