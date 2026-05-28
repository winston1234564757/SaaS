# [PLANFICH → СКАСОВАНО] C2C Settings UI Missing

## ✅ ЗНАХІДКА СКАСОВАНА — C2C UI РЕАЛІЗОВАНИЙ

### Де знаходиться?
`src/components/master/loyalty/LoyaltyPage.tsx` — рядки 406–500

### Що є?
- Toggle ввімкнення/вимкнення реферальної програми
- Input знижки для подруги (1–50%)
- Опис: "Подруга отримає -X% · Клієнт накопить +X% бонус"
- Server Action: `saveMasterC2CSettings(c2cEnabled, c2cDiscount)`

### Де доступно?
`/dashboard/growth?drawer=loyalty` → нижня секція "Реферальна програма клієнтів"

### Помилка аудиту
Grep по `settings/` замість `loyalty/`. C2C не є налаштуванням в Settings, воно в Growth Hub / Loyalty.

**Дивись IMPLEMENTFICH/c2c-referral-friend-invite.md для повного опису.**
