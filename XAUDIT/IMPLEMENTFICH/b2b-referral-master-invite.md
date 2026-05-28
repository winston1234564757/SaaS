# [IMPLEMENTFICH] B2B Referral — Майстер Запрошує Майстра

## Статус
💎 **ГОТОВО — У Growth Hub, але не в Pricing**

## Що є?

`src/components/master/referral/ReferralPage.tsx` — окремий компонент

### Механіка
- Майстер отримує унікальний referral code
- Поділяється посиланням на реєстрацію
- Коли реферал підключає Pro → майстер отримує **безкоштовний місяць Pro**
- Dashboard показує: кількість запрошень / активних / накопичений дисконт / bountiesPending

### Props ReferralPage
```typescript
masterId, referralCode, referralCount, activeReferralCount,
lifetimeDiscount, referralBountiesPending, discountReserve,
subscriptionTier, subscriptionExpiresAt
```

### Де доступно?
`/dashboard/growth?drawer=referral`

## Різниця від C2C
- **B2B Referral** = Майстер → Майстер (бізнес-зростання платформи)
- **C2C "Запроси подругу"** = Клієнт → Клієнт (вірусність для кожного майстра)

## Маркетингова проблема
В `LandingPricing.tsx` є: "Реферальна програма для клієнтів"
Але **B2B Referral** (майстер → майстер) ніде не описаний!

Це потужний growth hacking механізм для платформи.

## Рекомендація  
Додати окрему секцію або FAQ пункт: "Приведи колегу — отримай місяць Pro безкоштовно"
