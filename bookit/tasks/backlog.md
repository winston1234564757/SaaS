# BookIT — Актуальний Бек-лог задач
**Оновлено:** 2026-04-13 | Версія: 2.2

---

## 🔵 ТЕХНІЧНИЙ БОРГ

*(немає активних задач)*

---

## ✅ ЗАВЕРШЕНО (для reference)

| Задача | Міграція | Коміт |
|--------|----------|-------|
| DEBT-03: BookingWizard 1543 рядки → 8 модулів wizard/ (hooks + step components) | — | ✅ |
| DEBT-04: OnboardingWizard 811 рядків → 6 step компонентів steps/ (283 рядки) | — | ✅ |
| SEC-CRIT-1: Open redirect via //attacker.com | — | ✅ |
| SEC-CRIT-2: Calendar spam (is_published check) | — | ✅ |
| SEC-HIGH-1: Role escalation via ?role= URL param | — | ✅ |
| SEC-HIGH-2: Telegram takeover via slug | 067 | ✅ |
| SEC-HIGH-3: Client calling manual booking | — | ✅ |
| PERF: revalidatePath granular (не bust layout) | — | ✅ |
| PERF: select('*') → explicit columns | — | ✅ |
| PERF: retention query bounded to 2 years | — | ✅ |
| PERF: sendChurnReminder sequential → Promise.all | — | ✅ |
| PERF: toggleClientVip 2-RTT → 1-RTT | — | ✅ |
| PERF: removeTimeOff 2-RTT → 1-RTT | — | ✅ |
| PERF: auth/callback client upsert+profile → Promise.all | — | ✅ |
| TypeScript `any` → typed (hooks) | — | ✅ |
| console.log видалено з PhoneOtpForm/RefCapture | — | ✅ |
| [IRON MACHINE] logs → clean prefixes | — | ✅ |
| Cookies.get замість document.cookie.match | — | ✅ |
| profiles:id → profiles (partners/join) | — | ✅ |
| timezone column + migration 069 | 069 | ✅ |
| BookingWizard stale closure (selectedDateRef) | — | ✅ |
| useClients N+1 → RPC з LEFT JOIN | 068 | ✅ |
| Dynamic Pricing Smart Rule Stacking | 049–050 | ✅ |
| Schedule Exceptions (master_time_off) | 051 | ✅ |
| safeQuery?.→. (non-null cast) | — | ✅ |
| BUG-01: Client booking cancellation | — | ✅ |
| BUG-02: Reviews infinite spinner (isPending guard + RLS) | 070 | ✅ |
| BUG-03: C2C invite page shows client name + handles client ref codes | — | ✅ |
| BUG-04: ImageUploader w-100→w-full (mobile overflow fixed) | — | ✅ |
| BUG-05/FEAT-01: Floating save bar в Settings | — | ✅ |
| BUG-06: Bookings page quick-actions already in BookingCard | — | ✅ |
| BUG-07: Clients grid-cols-2 on mobile (was grid-cols-1) | — | ✅ |
| FEAT-02: Dynamic pricing label badge in BookingCard | — | ✅ |
| FEAT-03: Transparent forecast breakdown in AnalyticsPage | — | ✅ |
| FEAT-04: Pro upsell nudges (StatsStrip + ReviewsPage) | — | ✅ |
| FEAT-05: Studio tier positioning (BillingPage breakeven callout) | — | ✅ |
| FEAT-06: PWA Install Banner (already existed + wired to DashboardLayout) | — | ✅ |
| FEAT-07: In-App Notifications (DB triggers + useNotifications + NotificationsBell) | 071 | ✅ |
| FEAT-08: Review notification all channels (Telegram + In-App) | — | ✅ |
| DEBT-01: applyReferralRewards() extracted to referrals.ts | — | ✅ |
| DEBT-02: generateSecureToken() unified in utils/token.ts | — | ✅ |
| DEBT-05: Studio invite token → sha256 hash in DB | 072 | ✅ |
| DEBT-06: getSafeRedirect → new URL().pathname | — | ✅ |
| UX-01: Desktop sidebar shows all items (no "Ще" grouping) | — | ✅ |
| UX-02: Mobile nav — Послуги promoted to icon-only quick-slot; drawer 9→8 | — | ✅ |
