# BRIEFS/M-SHOP-04 — Магазин: модалка поповнення → vaul + собівартість

**Тип:** BUGFIX · **Тір:** 1 · **Статус:** APPROVED (QA відповіді = апрув)

---

## Root cause

`RestockDrawer.tsx` використовує bare framer-motion (`AnimatePresence` + `motion.div`) замість vaul — пряме порушення протоколу "всі modals через vaul". Також відсутнє поле `cost_kopecks` (собівартість), хоча колонка вже є в БД (міграція 139).

## Scope

**Файли:** 2

1. `src/components/master/products/RestockDrawer.tsx` — повна заміна (≥5 змін → Write)
2. `src/app/(master)/dashboard/products/actions.ts` — додати `costKopecks?` параметр

## Рішення

### RestockDrawer.tsx
- Видалити `AnimatePresence`, `motion.div`, framer-motion імпорт
- Підключити `import { Drawer } from 'vaul'`
- Структура: `Drawer.Root` → `Drawer.Portal` → `Drawer.Overlay` + `Drawer.Content` → handle + `Drawer.Title` + контент
- `Drawer.Root: open={open}, onOpenChange={(v) => { if (!v) handleClose(); }}`
- Додати `costStr` стейт: `useState(product.cost_kopecks ? String(product.cost_kopecks / 100) : '')`
- Поле: "Ціна закупки, ₴ (необов'язково)" — опційне, prefill з `product.cost_kopecks`
- `handleSave`: якщо `costStr` непустий → передати `Math.round(parseFloat(costStr) * 100)` в action

### actions.ts → restockProduct
- Додати `costKopecks?: number | null` 4-м параметром
- При `.update`: `...(costKopecks != null && { cost_kopecks: costKopecks })`

## QA відповіді
- cost_kopecks: оновлює `products.cost_kopecks` ✅
- Поле: опційне, prefill з поточного значення ✅

## Acceptance
- [ ] Vaul swipe-to-close працює
- [ ] Поле ціни закупки prefill + зберігається в products.cost_kopecks
- [ ] Якщо поле порожнє — поповнення без зміни cost
- [ ] Зовнішній вигляд = ExpensesTab стиль
- [ ] TSC 0 · Build clean
