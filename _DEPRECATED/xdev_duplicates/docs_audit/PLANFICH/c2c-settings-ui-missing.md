# ~~[PLANFICH]~~ → [ПЕРЕГЛЯНУТО] C2C UI — Існує у Growth Hub / Loyalty Drawer

## Статус
✅ **ЗНАХІДКА СКАСОВАНА — UI існує, аудит був помилковим**

## Що було написано помилково

Попередній аналіз визначав C2C як "відсутній UI" після grep по `src/components/master/settings/`.
Grep по `settings/` дав `NO RESULTS` — але C2C UI знаходиться **не в Settings, а в Growth Hub**.

## Де реально знаходиться UI

`LoyaltyPage.tsx` — рядки 406–500:
```tsx
{/* C2C Referral Settings */}
<div className="bento-card p-5 flex flex-col gap-4">
  <div className="flex items-center gap-3">
    <p className="text-sm font-semibold">Реферальна програма клієнтів</p>
    <p className="text-xs">Клієнти діляться посиланням — подруга отримує знижку</p>
    <button onClick={() => setC2cEnabled(v => !v)}>  // Toggle
  </div>
  
  {c2cEnabled && (
    <input type="number" min={1} max={50} value={c2cDiscount} />
    // "Подруга отримає −X% на перший візит · Клієнт накопить +X% бонус"
    <button onClick={handleSaveC2C}>Зберегти</button>
  )}
</div>
```

## Доступ
`/dashboard/growth?drawer=loyalty` — секція "Реферальна програма клієнтів" внизу Loyalty drawer.

## Server Action
`saveMasterC2CSettings(c2cEnabled, c2cDiscount)` — з `dashboard/loyalty/actions.ts`

## Реальний статус C2C
- ✅ Toggle для ввімкнення/вимкнення
- ✅ Input знижки (1–50%)  
- ✅ Server Action зберігає в `master_profiles`
- ✅ Backend валідація в `createBooking.ts`
- ✅ UI тізер в `PostBookingAuth.tsx`

**C2C — повністю реалізована фіча, не напівфабрикат.**  
Переносимо в IMPLEMENTFICH як прихований алмаз (не маркетизований).
