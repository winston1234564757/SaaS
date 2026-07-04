# DS-SET-CONFORM — Settings: контраст + eyebrows sentence-case

> Тір 2 · founder-схвалено (AskUserQuestion «Контраст + eyebrows sentence-case»).
> ~14 віджетів досі на до-дизайн-мова вокабулярі. M-SET-01..05 були reorder/логіка, НЕ конвертація мови.

## Чесний стан
Settings — НЕ малий residual. Майже всі віджети юзають:
- `text-text-mute` (= `--text-tertiary` = **2.78:1**, §4-бан вимитого контрасту) — десятки.
- `uppercase tracking-widest/wider/tight` заголовок на КОЖНОМУ віджеті (скафолд-eyebrow §4).
- `text-muted-foreground(/NN)`, `font-bold`-overload.

## Обсяг (founder-вибір)
1. **Контраст-пас (sed, byte-safe для Cyrillic):** `text-text-mute(/NN)?` + `text-muted-foreground(/NN)?` → `text-text-sub`. Ієрархію нести розміром, не третім вимитим тоном (урок DS-DASH-04).
2. **Eyebrows sentence-case:** зняти `uppercase tracking-XXX` з заголовків → природний регістр (джерельні рядки вже sentence-case: «Локація», «Рейтинг», «Публікація»). Тихі text-sub лейбли.
3. **Калібровані статус-тони** на дрібному світлому: `text-success`/`text-warning` (провал 4.5) → good `#0B6B2E`/warn `#9A4508`; on-dark (ProfileHero) → emerald-200/тінт.
4. **Функціональні градієнти ЛИШАЮ:** ProfileHero photo-overlay (dark hero M-SET-02), NavigationStrip scroll-scrim, LocationPicker map-bg, LocationWidget subtle card-tint — не §4-декор, а функція.

## Не чіпаю
Логіку/дані/хуки/10-col grid layout/reorder (M-SET-01). Структуру віджетів. Це conformance-пас, не re-layout і не Section-міграція (окрема важча сесія якщо founder захоче).

## Файли
sed по всій `master/settings/**`: SettingsPage + widgets/{StatsPulse,Schedule,Location,ProductMix,PublicStatus,Categories,SmartAdvisor,TechnicalIsland,SegmentConfig,ProfileHero,VacationManagerView,NavigationStrip} + VacationManager + LocationPicker. Targeted status-tone Edits де треба.

## Гейти
Own-eyes: seeded /dashboard/settings рендер (потребує MasterContext) АБО props-only прев'ю ключових віджетів; якщо дорого — grep-verify + build (мех. token-пас без layout-змін, як Analytics charts). Контраст парами. TSC:0 + build + `npm test`. humanizer нових рядків (нема — лише регістр існуючих). TRACKER/TRANSITION/mempalace.

## Скіли
`design-taste-frontend` → a11y → (impeccable hook авто).
