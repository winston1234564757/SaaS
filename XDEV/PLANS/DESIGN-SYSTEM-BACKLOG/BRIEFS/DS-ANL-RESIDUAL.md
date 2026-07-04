# DS-ANL-RESIDUAL — Analytics: дозакрити residual після M-ANL-01..07

> Тір 2 (частинами) · майстер-щоденне. REAUDIT казав «Analytics найгірший §4, 7 порушень» — але
> це було ДО M-ANL-01..07. Сьогодні 7 табів + shell + OverviewBriefing + SmartPricingOptimizer
> уже конформні. Residual = 2 живі віджети + token-стрaглери + мертвий код.

## Чесний стан (live-grep, не стара пам'ять)
- `AnalyticsPage.tsx` shell — **чистий** (старі gradient/glow 946/970 прибрані M-ANL).
- `SmartPricingOptimizer` — **чистий** (M-ANL-01 rebuild: text-sub, btn-primary; faint Zap-watermark 0.07 не banned-категорія).
- 7 табів + OverviewBriefing/OverviewTab/OverviewDetailSheet герої — **конформні**.

## Реальний residual борг
**A. Живі віджети (рендеряться на табі «Огляд», між темним OverviewBriefing-героєм і табами):**
1. `BusinessHealthScoreWidget` (shell:370, LIVE, Pro) — `uppercase tracking-wider` eyebrow · `text-muted-foreground/50/60/70` ×4 · statusColor `var(--success)`/`var(--primary)` як великий bold-текст (контраст-ризик на світлому). SVG-ring + 5 метрик легіт. → Section-мова: sentence-case заголовок, text-sub, калібровані тони, домінанта-score.
2. `MorningBriefing` (shell:373, LIVE) — `uppercase tracking-wider` eyebrow · `text-muted-foreground/60/80` · `font-bold`. Горизонт-скрол карток клієнтів дня + DNA-теги + AI-tip. → token+eyebrow pass (структура ок: featured немає сенсу — це рівний реєстр «сьогодні», як фото-грід).

**B. Token-стрaглери (1-рядкові):**
3. `OverviewBriefing.tsx:62` — `text-text-tertiary` (2.78:1, §4-бан) на flat-delta light-tone → `text-text-sub`.
4. `OverviewDetailSheet.tsx:69,78` — `uppercase tracking-[0.16em]` eyebrow (69 on-dark white/55; 78 on-light text-primary §4) → sentence-case, тінт лишити.
5. `StockTab.tsx:240` — 1× `uppercase tracking-wide` «До закупівлі» → sentence-case.

**C. Мертвий код (рендериться ніде — grep-верифіковано):**
6. `HeroStory.tsx` — компонент не рендериться (замінений OverviewBriefing, comment:77). Лише `type StoryItem` реюзиться (AnalyticsPage + OverviewBriefing). → перенести `StoryItem` у OverviewBriefing.tsx (export), видалити HeroStory.tsx.
7. `GoalProgress.tsx` + `__tests__/GoalProgress.test.tsx` — рендериться лише у власному тесті. → видалити обидва (тест тестує мертвий код).
8. `KpiTicker.tsx` — не імпортиться ніде. → видалити.

## Рішення по scope (чесно, без over-ask)
Роблю ВСЕ (A+B+C) одним проходом — це «вся сторінка» за законом, і purge прибирає banned-token-шум, що інакше вічно тригерить аудит. Мертвий тест тестує мертвий код → видаляється разом. Прецедент: M-ANL видалив 8+ мертвих файлів. Ризик низький (grep підтвердив 0 зовнішніх посилань; StoryItem переноситься, не втрачається).

## Не чіпаю
Логіку/дані/хуки/AI-tip-копірайт (Kerastase-порада = product-рішення, не §4). SmartPricingOptimizer (чистий). Shell tabs-навігацію (конформна). SVG-ring механіку BHS.

## Файли
Редизайн: `BusinessHealthScoreWidget.tsx` · `MorningBriefing.tsx`. Фікс: `OverviewBriefing.tsx` · `OverviewDetailSheet.tsx` · `tabs/StockTab.tsx` · `AnalyticsPage.tsx` (import StoryItem). Видалити: `HeroStory.tsx` · `GoalProgress.tsx` · `GoalProgress.test.tsx` · `KpiTicker.tsx`.

## Гейти
Own-eyes: прев'ю-роут з живим OverviewTab-контекстом (BHS + MorningBriefing на мок-даних, rich+sparse) mobile+desktop Playwright, видалити. Калібр-контраст парами. TSC:0 + build + `npm test` (переконатись що видалення GoalProgress.test не ламає suite). humanizer нових рядків (мінімум). TRACKER/TRANSITION/mempalace.

## Скіли
`design-taste-frontend` → `impeccable` (audit) → a11y → humanizer.
