# Велика Глобальна Мапа Візуального Аудиту (Super Master Visual Map)
**Повна E2E синхронізація текстового дизайну-аудиту зі скріншотами Playwright**
**Дата: 2026-06-02 | Lead Agent: Antigravity**

> [!IMPORTANT]
> Цей документ об'єднує результати ретельного дизайну-аудиту з реальними рендерами інтерфейсу BookIT, отриманими в результаті Playwright тестів для трьох тем: **Blossom (Taupe Light)**, **Frost (Ice Lavender)** та **Studio (Teal Dark)**.
> Усі посилання на скріншоти є клікабельними (`file://`) і ведуть безпосередньо на локальні зображення у репозиторії.

---

## 🎨 ТРЕД ТЕМАТИЧНОЇ ВІДПОВІДНОСТІ (THEME SPECTRUM)

У ході Playwright-аудиту кожна сторінка рендерилась у трьох колірних спектрах. Виявлено глобальну проблему — **Blossom-центричність**: система спочатку розроблялась під Blossom, через що у Frost та Studio виникають критичні дрейфи кольорів (Theme Drifts).

| Тема | Основний фон | Акцентний колір | Основний статус у Playwright |
|---|---|---|---|
| **Blossom** | `#DDD5C6` (Тауп) | `#A8896A` | 🟢 **100% сумісність.** Усі елементи виглядають природно, контрастність WCAG відповідає нормі. |
| **Frost** | `#EFF2FF` (Лаванда) | `#0F172A` | 🟡 **Часткова сумісність.** Жорстко прописані Blossom-тіні та бежеві градієнти створюють ефект "брудного інтерфейсу". |
| **Studio** | `#0E1D21` (Темний) | `#D3A376` (Золотий) | 🔴 **Критичні проблеми.** Hardcoded світлі hex-фони в акордеонах, банерах та інпутах роблять текст нечитабельним. |

---

## 📁 СТРУКТУРА СУПЕР-МАПИ (6 ГРУП · 19 ЗОН)

```
IMPECCABLE/
└── SUPER_MASTER_AUDIT/
    └── VISUAL_AUDIT_MAP.md      # Цей файл — Глобальна мапа візуального аудиту
```

---

## 🏛️ ГРУПА 1: LANDING & PUBLIC (Лендинг та публічні сторінки)

### 📍 00-landing (Landing)

* **Аудит відповідності:** Публічний лендинг використовує складні CSS анімації та Framer Motion. На скріншотах видно дрейф кнопок заклику до дії (CTA) — вони мають закругленість `rounded-lg` замість системної `rounded-full` (pill). ROI-калькулятор має жорстко зашиті Blossom кольори, які у темах Frost та Studio виглядають чужорідно. Також перевірено розкриті секції FAQ та індикатор прогресу скролу.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: FAQ Closed Desktop

````carousel
![🌸 Blossom Theme: FAQ Closed Desktop](../screenshots/blossom/00-landing/faq-closed-desktop.png)
<!-- slide -->
![❄️ Frost Theme: FAQ Closed Desktop](../screenshots/frost/00-landing/faq-closed-desktop.png)
<!-- slide -->
![🌲 Studio Theme: FAQ Closed Desktop](../screenshots/studio/00-landing/faq-closed-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/faq-closed-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/faq-closed-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/faq-closed-desktop.png)

#### 🖼️ Екран: FAQ Open Desktop

````carousel
![🌸 Blossom Theme: FAQ Open Desktop](../screenshots/blossom/00-landing/faq-open-desktop.png)
<!-- slide -->
![❄️ Frost Theme: FAQ Open Desktop](../screenshots/frost/00-landing/faq-open-desktop.png)
<!-- slide -->
![🌲 Studio Theme: FAQ Open Desktop](../screenshots/studio/00-landing/faq-open-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/faq-open-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/faq-open-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/faq-open-desktop.png)

#### 🖼️ Екран: Hero CTA Desktop

````carousel
![🌸 Blossom Theme: Hero CTA Desktop](../screenshots/blossom/00-landing/hero-cta-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Hero CTA Desktop](../screenshots/frost/00-landing/hero-cta-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Hero CTA Desktop](../screenshots/studio/00-landing/hero-cta-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/hero-cta-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/hero-cta-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/hero-cta-desktop.png)

#### 🖼️ Екран: Landing Mobile Mobile

````carousel
![🌸 Blossom Theme: Landing Mobile Mobile](../screenshots/blossom/00-landing/landing-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Landing Mobile Mobile](../screenshots/frost/00-landing/landing-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Landing Mobile Mobile](../screenshots/studio/00-landing/landing-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/landing-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/00-landing/landing-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/00-landing/landing-mobile-mobile.png)

#### 🖼️ Екран: Landing Overview Desktop Desktop

````carousel
![🌸 Blossom Theme: Landing Overview Desktop Desktop](../screenshots/blossom/00-landing/landing-overview-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Landing Overview Desktop Desktop](../screenshots/frost/00-landing/landing-overview-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Landing Overview Desktop Desktop](../screenshots/studio/00-landing/landing-overview-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/landing-overview-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/landing-overview-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/landing-overview-desktop-desktop.png)

#### 🖼️ Екран: Landing Overview Mobile Mobile

````carousel
![🌸 Blossom Theme: Landing Overview Mobile Mobile](../screenshots/blossom/00-landing/landing-overview-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Landing Overview Mobile Mobile](../screenshots/frost/00-landing/landing-overview-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Landing Overview Mobile Mobile](../screenshots/studio/00-landing/landing-overview-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/landing-overview-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/00-landing/landing-overview-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/00-landing/landing-overview-mobile-mobile.png)

#### 🖼️ Екран: Pricing Section Desktop

````carousel
![🌸 Blossom Theme: Pricing Section Desktop](../screenshots/blossom/00-landing/pricing-section-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Pricing Section Desktop](../screenshots/frost/00-landing/pricing-section-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Pricing Section Desktop](../screenshots/studio/00-landing/pricing-section-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/pricing-section-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/pricing-section-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/pricing-section-desktop.png)

#### 🖼️ Екран: ROI Calculator Changed Desktop

````carousel
![🌸 Blossom Theme: ROI Calculator Changed Desktop](../screenshots/blossom/00-landing/roi-calculator-changed-desktop.png)
<!-- slide -->
![❄️ Frost Theme: ROI Calculator Changed Desktop](../screenshots/frost/00-landing/roi-calculator-changed-desktop.png)
<!-- slide -->
![🌲 Studio Theme: ROI Calculator Changed Desktop](../screenshots/studio/00-landing/roi-calculator-changed-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/roi-calculator-changed-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/roi-calculator-changed-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/roi-calculator-changed-desktop.png)

#### 🖼️ Екран: Scroll Progress Desktop

````carousel
![🌸 Blossom Theme: Scroll Progress Desktop](../screenshots/blossom/00-landing/scroll-progress-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Scroll Progress Desktop](../screenshots/frost/00-landing/scroll-progress-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Scroll Progress Desktop](../screenshots/studio/00-landing/scroll-progress-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/scroll-progress-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/scroll-progress-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/scroll-progress-desktop.png)


---
### 📍 16-public-profile (Public Profile)

* **Аудит відповідності:** Публічний профіль майстра. `business_name` відображається коректно. Проте картки послуг у каруселі мають `rounded-2xl` замість pill-кнопок, а CTA-кнопки "Записатись" використовують неіснуючу змінну `--btn-primary-bg`, через що на скріншотах деяких тем вони стають прозорими. Доступні вкладки портфоліо та магазину товарів.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Public Portfolio Desktop

````carousel
![🌸 Blossom Theme: Public Portfolio Desktop](../screenshots/blossom/16-public-profile/public-portfolio-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Public Portfolio Desktop](../screenshots/frost/16-public-profile/public-portfolio-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Public Portfolio Desktop](../screenshots/studio/16-public-profile/public-portfolio-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-portfolio-desktop.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-portfolio-desktop.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-portfolio-desktop.png)

#### 🖼️ Екран: Public Profile Desktop Desktop

````carousel
![🌸 Blossom Theme: Public Profile Desktop Desktop](../screenshots/blossom/16-public-profile/public-profile-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Public Profile Desktop Desktop](../screenshots/frost/16-public-profile/public-profile-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Public Profile Desktop Desktop](../screenshots/studio/16-public-profile/public-profile-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-profile-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-profile-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-profile-desktop-desktop.png)

#### 🖼️ Екран: Public Profile Mobile Mobile

````carousel
![🌸 Blossom Theme: Public Profile Mobile Mobile](../screenshots/blossom/16-public-profile/public-profile-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Public Profile Mobile Mobile](../screenshots/frost/16-public-profile/public-profile-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Public Profile Mobile Mobile](../screenshots/studio/16-public-profile/public-profile-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-profile-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-profile-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-profile-mobile-mobile.png)

#### 🖼️ Екран: Public Shop Desktop

````carousel
![🌸 Blossom Theme: Public Shop Desktop](../screenshots/blossom/16-public-profile/public-shop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Public Shop Desktop](../screenshots/frost/16-public-profile/public-shop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Public Shop Desktop](../screenshots/studio/16-public-profile/public-shop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-shop-desktop.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-shop-desktop.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-shop-desktop.png)


---
### 📍 17-explore (Explore)

* **Аудит відповідності:** Пошуковий каталог. Пошуковий інпут порушує правило `rounded-[100px]` (має `rounded-xl`). Каркаси карток майстрів у Bento Grid відображаються асиметрично, але мають hardcoded кольори Blossom в іконках категорій.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Explore Desktop Desktop

````carousel
![🌸 Blossom Theme: Explore Desktop Desktop](../screenshots/blossom/17-explore/explore-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Explore Desktop Desktop](../screenshots/frost/17-explore/explore-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Explore Desktop Desktop](../screenshots/studio/17-explore/explore-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/17-explore/explore-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/17-explore/explore-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/17-explore/explore-desktop-desktop.png)

#### 🖼️ Екран: Explore Master Card Desktop

````carousel
![🌸 Blossom Theme: Explore Master Card Desktop](../screenshots/blossom/17-explore/explore-master-card-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Explore Master Card Desktop](../screenshots/frost/17-explore/explore-master-card-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Explore Master Card Desktop](../screenshots/studio/17-explore/explore-master-card-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/17-explore/explore-master-card-desktop.png) | [❄️ Frost](../screenshots/frost/17-explore/explore-master-card-desktop.png) | [🌲 Studio](../screenshots/studio/17-explore/explore-master-card-desktop.png)

#### 🖼️ Екран: Explore Mobile Mobile

````carousel
![🌸 Blossom Theme: Explore Mobile Mobile](../screenshots/blossom/17-explore/explore-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Explore Mobile Mobile](../screenshots/frost/17-explore/explore-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Explore Mobile Mobile](../screenshots/studio/17-explore/explore-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/17-explore/explore-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/17-explore/explore-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/17-explore/explore-mobile-mobile.png)


---
### 📍 01-auth (Auth)

* **Аудит відповідності:** Форма введення телефону та OTP. PhoneOtpForm використовує `rounded-lg` для інпутів та кнопок. На скріншотах Frost теми видно, що поле введення зливається з фоном через низьку контрастність рамки.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Auth Login Desktop Desktop

````carousel
![🌸 Blossom Theme: Auth Login Desktop Desktop](../screenshots/blossom/01-auth/auth-login-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Login Desktop Desktop](../screenshots/frost/01-auth/auth-login-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Auth Login Desktop Desktop](../screenshots/studio/01-auth/auth-login-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-login-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-login-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-login-desktop-desktop.png)

#### 🖼️ Екран: Auth Login Mobile Mobile

````carousel
![🌸 Blossom Theme: Auth Login Mobile Mobile](../screenshots/blossom/01-auth/auth-login-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Auth Login Mobile Mobile](../screenshots/frost/01-auth/auth-login-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Auth Login Mobile Mobile](../screenshots/studio/01-auth/auth-login-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-login-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-login-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-login-mobile-mobile.png)

#### 🖼️ Екран: Auth Register Desktop Desktop

````carousel
![🌸 Blossom Theme: Auth Register Desktop Desktop](../screenshots/blossom/01-auth/auth-register-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Register Desktop Desktop](../screenshots/frost/01-auth/auth-register-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Auth Register Desktop Desktop](../screenshots/studio/01-auth/auth-register-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-register-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-register-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-register-desktop-desktop.png)

#### 🖼️ Екран: Auth Register Mobile Mobile

````carousel
![🌸 Blossom Theme: Auth Register Mobile Mobile](../screenshots/blossom/01-auth/auth-register-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Auth Register Mobile Mobile](../screenshots/frost/01-auth/auth-register-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Auth Register Mobile Mobile](../screenshots/studio/01-auth/auth-register-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-register-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-register-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-register-mobile-mobile.png)

#### 🖼️ Екран: Auth Role Client Selected Desktop

````carousel
![🌸 Blossom Theme: Auth Role Client Selected Desktop](../screenshots/blossom/01-auth/auth-role-client-selected-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Role Client Selected Desktop](../screenshots/frost/01-auth/auth-role-client-selected-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-role-client-selected-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-role-client-selected-desktop.png)

#### 🖼️ Екран: Auth Role Default Desktop

````carousel
![🌸 Blossom Theme: Auth Role Default Desktop](../screenshots/blossom/01-auth/auth-role-default-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Role Default Desktop](../screenshots/frost/01-auth/auth-role-default-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-role-default-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-role-default-desktop.png)

#### 🖼️ Екран: Auth Role Master Selected Desktop

````carousel
![🌸 Blossom Theme: Auth Role Master Selected Desktop](../screenshots/blossom/01-auth/auth-role-master-selected-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Role Master Selected Desktop](../screenshots/frost/01-auth/auth-role-master-selected-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-role-master-selected-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-role-master-selected-desktop.png)


---
### 📍 02-onboarding (Onboarding)

* **Аудит відповідності:** Виявлено критичне порушення No-Emoji Policy у виборі спеціалізацій. Скріншоти чітко показують використання емодзі `💅`, `💇` у сітці категорій. Кнопки "Далі" мають закругленість `rounded-lg` (має бути `rounded-full`). Також зафіксовано крок прогресу онбордингу.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Onboarding Progress Desktop Desktop

````carousel
![🌸 Blossom Theme: Onboarding Progress Desktop Desktop](../screenshots/blossom/02-onboarding/onboarding-progress-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Onboarding Progress Desktop Desktop](../screenshots/frost/02-onboarding/onboarding-progress-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Onboarding Progress Desktop Desktop](../screenshots/studio/02-onboarding/onboarding-progress-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/02-onboarding/onboarding-progress-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/02-onboarding/onboarding-progress-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/02-onboarding/onboarding-progress-desktop-desktop.png)

#### 🖼️ Екран: Onboarding Progress Mobile Mobile

````carousel
![🌸 Blossom Theme: Onboarding Progress Mobile Mobile](../screenshots/blossom/02-onboarding/onboarding-progress-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Onboarding Progress Mobile Mobile](../screenshots/frost/02-onboarding/onboarding-progress-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Onboarding Progress Mobile Mobile](../screenshots/studio/02-onboarding/onboarding-progress-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/02-onboarding/onboarding-progress-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/02-onboarding/onboarding-progress-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/02-onboarding/onboarding-progress-mobile-mobile.png)

#### 🖼️ Екран: Onboarding Step1 Profile Desktop

````carousel
![🌸 Blossom Theme: Onboarding Step1 Profile Desktop](../screenshots/blossom/02-onboarding/onboarding-step1-profile-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Onboarding Step1 Profile Desktop](../screenshots/frost/02-onboarding/onboarding-step1-profile-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Onboarding Step1 Profile Desktop](../screenshots/studio/02-onboarding/onboarding-step1-profile-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/02-onboarding/onboarding-step1-profile-desktop.png) | [❄️ Frost](../screenshots/frost/02-onboarding/onboarding-step1-profile-desktop.png) | [🌲 Studio](../screenshots/studio/02-onboarding/onboarding-step1-profile-desktop.png)


---
### 📍 03-dashboard (Dashboard)

* **Аудит відповідності:** Асиметричний Bento Grid працює відмінно на десктопі. Але на скріншотах Studio теми видно, що фоновий градієнт ambient-background перекриває картки Bento, роблячи їх занадто прозорими. Кнопка "Швидкий запис" використовує Blossom-колір замість золотого Studio-акценту. Зафіксовано випадаючі списки сповіщень та росту.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Dashboard Overview Desktop Desktop

````carousel
![🌸 Blossom Theme: Dashboard Overview Desktop Desktop](../screenshots/blossom/03-dashboard/dashboard-overview-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Overview Desktop Desktop](../screenshots/frost/03-dashboard/dashboard-overview-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Overview Desktop Desktop](../screenshots/studio/03-dashboard/dashboard-overview-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-overview-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-overview-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-overview-desktop-desktop.png)

#### 🖼️ Екран: Dashboard Overview Mobile Mobile

````carousel
![🌸 Blossom Theme: Dashboard Overview Mobile Mobile](../screenshots/blossom/03-dashboard/dashboard-overview-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Overview Mobile Mobile](../screenshots/frost/03-dashboard/dashboard-overview-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Overview Mobile Mobile](../screenshots/studio/03-dashboard/dashboard-overview-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-overview-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-overview-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-overview-mobile-mobile.png)

#### 🖼️ Екран: Dashboard Widgets Desktop Desktop

````carousel
![🌸 Blossom Theme: Dashboard Widgets Desktop Desktop](../screenshots/blossom/03-dashboard/dashboard-widgets-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Widgets Desktop Desktop](../screenshots/frost/03-dashboard/dashboard-widgets-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Widgets Desktop Desktop](../screenshots/studio/03-dashboard/dashboard-widgets-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-widgets-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-widgets-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-widgets-desktop-desktop.png)

#### 🖼️ Екран: Dashboard Widgets Mobile Mobile

````carousel
![🌸 Blossom Theme: Dashboard Widgets Mobile Mobile](../screenshots/blossom/03-dashboard/dashboard-widgets-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Widgets Mobile Mobile](../screenshots/frost/03-dashboard/dashboard-widgets-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Widgets Mobile Mobile](../screenshots/studio/03-dashboard/dashboard-widgets-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-widgets-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-widgets-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-widgets-mobile-mobile.png)

#### 🖼️ Екран: Topbar Activity Dropdown Desktop

````carousel
![🌸 Blossom Theme: Topbar Activity Dropdown Desktop](../screenshots/blossom/03-dashboard/topbar-activity-dropdown-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Topbar Activity Dropdown Desktop](../screenshots/frost/03-dashboard/topbar-activity-dropdown-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Topbar Activity Dropdown Desktop](../screenshots/studio/03-dashboard/topbar-activity-dropdown-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/topbar-activity-dropdown-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/topbar-activity-dropdown-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/topbar-activity-dropdown-desktop.png)

#### 🖼️ Екран: Topbar Growth Dropdown Desktop

````carousel
![🌲 Studio Theme: Topbar Growth Dropdown Desktop](../screenshots/studio/03-dashboard/topbar-growth-dropdown-desktop.png)
````

*Швидкі посилання на оригінали:* [🌲 Studio](../screenshots/studio/03-dashboard/topbar-growth-dropdown-desktop.png)


---
### 📍 07-analytics (Analytics)

* **Аудит відповідності:** Графіки Recharts відображаються без помилок, але кольори стовпчиків зафіксовані в Blossom-помаранчевому кольорі. У темі Frost вони виглядають брудно на фоні світлої лаванди. Доступні вкладки доходів та записів.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Analytics Desktop Desktop

````carousel
![🌸 Blossom Theme: Analytics Desktop Desktop](../screenshots/blossom/07-analytics/analytics-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Analytics Desktop Desktop](../screenshots/frost/07-analytics/analytics-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Analytics Desktop Desktop](../screenshots/studio/07-analytics/analytics-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/07-analytics/analytics-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/07-analytics/analytics-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/07-analytics/analytics-desktop-desktop.png)

#### 🖼️ Екран: Analytics Mobile Mobile

````carousel
![🌸 Blossom Theme: Analytics Mobile Mobile](../screenshots/blossom/07-analytics/analytics-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Analytics Mobile Mobile](../screenshots/frost/07-analytics/analytics-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Analytics Mobile Mobile](../screenshots/studio/07-analytics/analytics-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/07-analytics/analytics-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/07-analytics/analytics-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/07-analytics/analytics-mobile-mobile.png)

#### 🖼️ Екран: Analytics Tab Виручка Desktop

````carousel
![🌸 Blossom Theme: Analytics Tab Виручка Desktop](../screenshots/blossom/07-analytics/analytics-tab-виручка-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Analytics Tab Виручка Desktop](../screenshots/frost/07-analytics/analytics-tab-виручка-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Analytics Tab Виручка Desktop](../screenshots/studio/07-analytics/analytics-tab-виручка-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/07-analytics/analytics-tab-виручка-desktop.png) | [❄️ Frost](../screenshots/frost/07-analytics/analytics-tab-виручка-desktop.png) | [🌲 Studio](../screenshots/studio/07-analytics/analytics-tab-виручка-desktop.png)


---
### 📍 15-academy (Academy)

* **Аудит відповідності:** Академія майстрів. Найвища оцінка за доступність та чистоту коду. Проте превью-карти уроків мають фіксований колір рамки `border-[#A8896A]`, який вибивається з лавандової теми Frost. Відео-превью рендериться коректно.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Academy Desktop Desktop

````carousel
![🌸 Blossom Theme: Academy Desktop Desktop](../screenshots/blossom/15-academy/academy-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Academy Desktop Desktop](../screenshots/frost/15-academy/academy-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Academy Desktop Desktop](../screenshots/studio/15-academy/academy-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/15-academy/academy-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/15-academy/academy-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/15-academy/academy-desktop-desktop.png)

#### 🖼️ Екран: Academy Mobile Mobile

````carousel
![🌸 Blossom Theme: Academy Mobile Mobile](../screenshots/blossom/15-academy/academy-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Academy Mobile Mobile](../screenshots/frost/15-academy/academy-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Academy Mobile Mobile](../screenshots/studio/15-academy/academy-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/15-academy/academy-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/15-academy/academy-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/15-academy/academy-mobile-mobile.png)


---
### 📍 04-bookings (Bookings)

* **Аудит відповідності:** Календар та список записів. На скріншотах календаря видно, що при переході між місяцями висота календаря різко змінюється (5 рядків замість 6), що викликає стрибки інтерфейсу. Необхідно загорнути календар у `<motion.div layout>`. Також зафіксована відкрита форма створення запису.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Bookings Create Form Open Desktop

````carousel
![🌸 Blossom Theme: Bookings Create Form Open Desktop](../screenshots/blossom/04-bookings/bookings-create-form-open-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Create Form Open Desktop](../screenshots/frost/04-bookings/bookings-create-form-open-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Create Form Open Desktop](../screenshots/studio/04-bookings/bookings-create-form-open-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-create-form-open-desktop.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-create-form-open-desktop.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-create-form-open-desktop.png)

#### 🖼️ Екран: Bookings Day Desktop Desktop

````carousel
![🌸 Blossom Theme: Bookings Day Desktop Desktop](../screenshots/blossom/04-bookings/bookings-day-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Day Desktop Desktop](../screenshots/frost/04-bookings/bookings-day-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Day Desktop Desktop](../screenshots/studio/04-bookings/bookings-day-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-day-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-day-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-day-desktop-desktop.png)

#### 🖼️ Екран: Bookings Day Mobile Mobile

````carousel
![🌸 Blossom Theme: Bookings Day Mobile Mobile](../screenshots/blossom/04-bookings/bookings-day-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Day Mobile Mobile](../screenshots/frost/04-bookings/bookings-day-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Day Mobile Mobile](../screenshots/studio/04-bookings/bookings-day-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-day-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-day-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-day-mobile-mobile.png)


---
### 📍 05-clients (Clients)

* **Аудит відповідності:** База CRM. ClientDetails.tsx використовує `rounded-md` для текстових інпутів, що є дрейфом дизайну. На скріншотах Studio теми VIP-бейджі клієнтів зливають свій жовтий колір із золотим фоном акценту. Доступні сегменти VIP.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Clients List Desktop Desktop

````carousel
![🌸 Blossom Theme: Clients List Desktop Desktop](../screenshots/blossom/05-clients/clients-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Clients List Desktop Desktop](../screenshots/frost/05-clients/clients-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Clients List Desktop Desktop](../screenshots/studio/05-clients/clients-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/05-clients/clients-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/05-clients/clients-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/05-clients/clients-list-desktop-desktop.png)

#### 🖼️ Екран: Clients List Mobile Mobile

````carousel
![🌸 Blossom Theme: Clients List Mobile Mobile](../screenshots/blossom/05-clients/clients-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Clients List Mobile Mobile](../screenshots/frost/05-clients/clients-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Clients List Mobile Mobile](../screenshots/studio/05-clients/clients-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/05-clients/clients-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/05-clients/clients-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/05-clients/clients-list-mobile-mobile.png)

#### 🖼️ Екран: Clients Segment Vip Desktop

````carousel
![🌸 Blossom Theme: Clients Segment Vip Desktop](../screenshots/blossom/05-clients/clients-segment-vip-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Clients Segment Vip Desktop](../screenshots/frost/05-clients/clients-segment-vip-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Clients Segment Vip Desktop](../screenshots/studio/05-clients/clients-segment-vip-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/05-clients/clients-segment-vip-desktop.png) | [❄️ Frost](../screenshots/frost/05-clients/clients-segment-vip-desktop.png) | [🌲 Studio](../screenshots/studio/05-clients/clients-segment-vip-desktop.png)


---
### 📍 11-portfolio (Portfolio)

* **Аудит відповідності:** Завантажувач зображень використовує Blob URL. На скріншотах мобільного перегляду при спробі обрізати фото через ImageCropper межі кропера виходять за межі екрана, що ламає верстку.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Portfolio List Desktop Desktop

````carousel
![🌸 Blossom Theme: Portfolio List Desktop Desktop](../screenshots/blossom/11-portfolio/portfolio-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Portfolio List Desktop Desktop](../screenshots/frost/11-portfolio/portfolio-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Portfolio List Desktop Desktop](../screenshots/studio/11-portfolio/portfolio-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/11-portfolio/portfolio-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/11-portfolio/portfolio-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/11-portfolio/portfolio-list-desktop-desktop.png)

#### 🖼️ Екран: Portfolio List Mobile Mobile

````carousel
![🌸 Blossom Theme: Portfolio List Mobile Mobile](../screenshots/blossom/11-portfolio/portfolio-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Portfolio List Mobile Mobile](../screenshots/frost/11-portfolio/portfolio-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Portfolio List Mobile Mobile](../screenshots/studio/11-portfolio/portfolio-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/11-portfolio/portfolio-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/11-portfolio/portfolio-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/11-portfolio/portfolio-list-mobile-mobile.png)


---
### 📍 18-my (My)

* **Аудит відповідності:** Кабінет клієнта B2C. Посилання скасування запису у MyBookingsPage не мають підтвердження через Radix Dialog, що призводить до випадкових скасувань. Кольори кнопок "Записатись ще" не відповідають темі Frost. Зафіксовано картки лояльності та сповіщення.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: My Bookings Desktop Desktop

````carousel
![🌸 Blossom Theme: My Bookings Desktop Desktop](../screenshots/blossom/18-my/my-bookings-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: My Bookings Desktop Desktop](../screenshots/frost/18-my/my-bookings-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: My Bookings Desktop Desktop](../screenshots/studio/18-my/my-bookings-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-bookings-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/18-my/my-bookings-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/18-my/my-bookings-desktop-desktop.png)

#### 🖼️ Екран: My Bookings Mobile Mobile

````carousel
![🌸 Blossom Theme: My Bookings Mobile Mobile](../screenshots/blossom/18-my/my-bookings-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: My Bookings Mobile Mobile](../screenshots/frost/18-my/my-bookings-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: My Bookings Mobile Mobile](../screenshots/studio/18-my/my-bookings-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-bookings-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/18-my/my-bookings-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/18-my/my-bookings-mobile-mobile.png)

#### 🖼️ Екран: My Loyalty Desktop Desktop

````carousel
![🌸 Blossom Theme: My Loyalty Desktop Desktop](../screenshots/blossom/18-my/my-loyalty-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: My Loyalty Desktop Desktop](../screenshots/frost/18-my/my-loyalty-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: My Loyalty Desktop Desktop](../screenshots/studio/18-my/my-loyalty-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-loyalty-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/18-my/my-loyalty-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/18-my/my-loyalty-desktop-desktop.png)

#### 🖼️ Екран: My Loyalty Mobile Mobile

````carousel
![🌸 Blossom Theme: My Loyalty Mobile Mobile](../screenshots/blossom/18-my/my-loyalty-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: My Loyalty Mobile Mobile](../screenshots/frost/18-my/my-loyalty-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: My Loyalty Mobile Mobile](../screenshots/studio/18-my/my-loyalty-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-loyalty-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/18-my/my-loyalty-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/18-my/my-loyalty-mobile-mobile.png)

#### 🖼️ Екран: My Masters Desktop Desktop

````carousel
![🌸 Blossom Theme: My Masters Desktop Desktop](../screenshots/blossom/18-my/my-masters-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: My Masters Desktop Desktop](../screenshots/frost/18-my/my-masters-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: My Masters Desktop Desktop](../screenshots/studio/18-my/my-masters-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-masters-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/18-my/my-masters-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/18-my/my-masters-desktop-desktop.png)

#### 🖼️ Екран: My Masters Mobile Mobile

````carousel
![🌸 Blossom Theme: My Masters Mobile Mobile](../screenshots/blossom/18-my/my-masters-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: My Masters Mobile Mobile](../screenshots/frost/18-my/my-masters-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: My Masters Mobile Mobile](../screenshots/studio/18-my/my-masters-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-masters-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/18-my/my-masters-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/18-my/my-masters-mobile-mobile.png)

#### 🖼️ Екран: My Notifications Desktop Desktop

````carousel
![🌸 Blossom Theme: My Notifications Desktop Desktop](../screenshots/blossom/18-my/my-notifications-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: My Notifications Desktop Desktop](../screenshots/frost/18-my/my-notifications-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: My Notifications Desktop Desktop](../screenshots/studio/18-my/my-notifications-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-notifications-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/18-my/my-notifications-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/18-my/my-notifications-desktop-desktop.png)

#### 🖼️ Екран: My Notifications Mobile Mobile

````carousel
![🌸 Blossom Theme: My Notifications Mobile Mobile](../screenshots/blossom/18-my/my-notifications-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: My Notifications Mobile Mobile](../screenshots/frost/18-my/my-notifications-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: My Notifications Mobile Mobile](../screenshots/studio/18-my/my-notifications-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-notifications-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/18-my/my-notifications-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/18-my/my-notifications-mobile-mobile.png)

#### 🖼️ Екран: My Profile Desktop Desktop

````carousel
![🌸 Blossom Theme: My Profile Desktop Desktop](../screenshots/blossom/18-my/my-profile-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: My Profile Desktop Desktop](../screenshots/frost/18-my/my-profile-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: My Profile Desktop Desktop](../screenshots/studio/18-my/my-profile-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-profile-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/18-my/my-profile-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/18-my/my-profile-desktop-desktop.png)

#### 🖼️ Екран: My Profile Form Desktop

````carousel
![🌸 Blossom Theme: My Profile Form Desktop](../screenshots/blossom/18-my/my-profile-form-desktop.png)
<!-- slide -->
![❄️ Frost Theme: My Profile Form Desktop](../screenshots/frost/18-my/my-profile-form-desktop.png)
<!-- slide -->
![🌲 Studio Theme: My Profile Form Desktop](../screenshots/studio/18-my/my-profile-form-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-profile-form-desktop.png) | [❄️ Frost](../screenshots/frost/18-my/my-profile-form-desktop.png) | [🌲 Studio](../screenshots/studio/18-my/my-profile-form-desktop.png)

#### 🖼️ Екран: My Profile Mobile Mobile

````carousel
![🌸 Blossom Theme: My Profile Mobile Mobile](../screenshots/blossom/18-my/my-profile-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: My Profile Mobile Mobile](../screenshots/frost/18-my/my-profile-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: My Profile Mobile Mobile](../screenshots/studio/18-my/my-profile-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/18-my/my-profile-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/18-my/my-profile-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/18-my/my-profile-mobile-mobile.png)


---
### 📍 08-marketing (Marketing)

* **Аудит відповідності:** Маркетинговий хаб. BroadcastEditor.tsx містить P0 баг: у темній темі Studio колір тексту у полі редагування повідомлення є темно-коричневим (`#28201A`) на темно-бірюзовому фоні, що робить його абсолютно невидимим (нульовий контраст). Також зафіксовано редагування Stories.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Marketing Broadcasts Tab Desktop

````carousel
![🌸 Blossom Theme: Marketing Broadcasts Tab Desktop](../screenshots/blossom/08-marketing/marketing-broadcasts-tab-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Marketing Broadcasts Tab Desktop](../screenshots/frost/08-marketing/marketing-broadcasts-tab-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Marketing Broadcasts Tab Desktop](../screenshots/studio/08-marketing/marketing-broadcasts-tab-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/08-marketing/marketing-broadcasts-tab-desktop.png) | [❄️ Frost](../screenshots/frost/08-marketing/marketing-broadcasts-tab-desktop.png) | [🌲 Studio](../screenshots/studio/08-marketing/marketing-broadcasts-tab-desktop.png)

#### 🖼️ Екран: Marketing Mobile Mobile

````carousel
![🌸 Blossom Theme: Marketing Mobile Mobile](../screenshots/blossom/08-marketing/marketing-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Marketing Mobile Mobile](../screenshots/frost/08-marketing/marketing-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Marketing Mobile Mobile](../screenshots/studio/08-marketing/marketing-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/08-marketing/marketing-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/08-marketing/marketing-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/08-marketing/marketing-mobile-mobile.png)

#### 🖼️ Екран: Marketing Stories Tab Desktop

````carousel
![🌸 Blossom Theme: Marketing Stories Tab Desktop](../screenshots/blossom/08-marketing/marketing-stories-tab-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Marketing Stories Tab Desktop](../screenshots/frost/08-marketing/marketing-stories-tab-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Marketing Stories Tab Desktop](../screenshots/studio/08-marketing/marketing-stories-tab-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/08-marketing/marketing-stories-tab-desktop.png) | [❄️ Frost](../screenshots/frost/08-marketing/marketing-stories-tab-desktop.png) | [🌲 Studio](../screenshots/studio/08-marketing/marketing-stories-tab-desktop.png)


---
### 📍 09-revenue (Revenue)

* **Аудит відповідності:** Revenue Hub. Слайдинг-таби у RevenueHubClient працюють добре, але скелетон завантаження FlashDealPage використовує сірі заглушки, які на секунду ламають візуальну атмосферу темної теми Studio. Зафіксовано налаштування динамічних цін.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Revenue Dynamic Pricing Desktop

````carousel
![🌸 Blossom Theme: Revenue Dynamic Pricing Desktop](../screenshots/blossom/09-revenue/revenue-dynamic-pricing-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Revenue Dynamic Pricing Desktop](../screenshots/frost/09-revenue/revenue-dynamic-pricing-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Revenue Dynamic Pricing Desktop](../screenshots/studio/09-revenue/revenue-dynamic-pricing-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/09-revenue/revenue-dynamic-pricing-desktop.png) | [❄️ Frost](../screenshots/frost/09-revenue/revenue-dynamic-pricing-desktop.png) | [🌲 Studio](../screenshots/studio/09-revenue/revenue-dynamic-pricing-desktop.png)

#### 🖼️ Екран: Revenue Flash Deals Desktop

````carousel
![🌸 Blossom Theme: Revenue Flash Deals Desktop](../screenshots/blossom/09-revenue/revenue-flash-deals-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Revenue Flash Deals Desktop](../screenshots/frost/09-revenue/revenue-flash-deals-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Revenue Flash Deals Desktop](../screenshots/studio/09-revenue/revenue-flash-deals-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/09-revenue/revenue-flash-deals-desktop.png) | [❄️ Frost](../screenshots/frost/09-revenue/revenue-flash-deals-desktop.png) | [🌲 Studio](../screenshots/studio/09-revenue/revenue-flash-deals-desktop.png)

#### 🖼️ Екран: Revenue Mobile Mobile

````carousel
![🌸 Blossom Theme: Revenue Mobile Mobile](../screenshots/blossom/09-revenue/revenue-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Revenue Mobile Mobile](../screenshots/frost/09-revenue/revenue-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Revenue Mobile Mobile](../screenshots/studio/09-revenue/revenue-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/09-revenue/revenue-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/09-revenue/revenue-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/09-revenue/revenue-mobile-mobile.png)


---
### 📍 10-growth (Growth)

* **Аудит відповідності:** Growth Hub. Перемикання між Лояльністю, Рефералами та Партнерами синхронізовано з URL. Проте на скріншотах Frost теми видно, що фонова плашка табів `bg-surface/40` зливається з білим кольором через відсутність тіні або чіткої межі. Зафіксовано реферальне дерево партнерів.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Growth Loyalty Desktop Desktop

````carousel
![🌸 Blossom Theme: Growth Loyalty Desktop Desktop](../screenshots/blossom/10-growth/growth-loyalty-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Growth Loyalty Desktop Desktop](../screenshots/frost/10-growth/growth-loyalty-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Growth Loyalty Desktop Desktop](../screenshots/studio/10-growth/growth-loyalty-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/10-growth/growth-loyalty-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/10-growth/growth-loyalty-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/10-growth/growth-loyalty-desktop-desktop.png)

#### 🖼️ Екран: Growth Mobile Mobile

````carousel
![🌸 Blossom Theme: Growth Mobile Mobile](../screenshots/blossom/10-growth/growth-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Growth Mobile Mobile](../screenshots/frost/10-growth/growth-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Growth Mobile Mobile](../screenshots/studio/10-growth/growth-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/10-growth/growth-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/10-growth/growth-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/10-growth/growth-mobile-mobile.png)

#### 🖼️ Екран: Growth Partners Desktop Desktop

````carousel
![🌸 Blossom Theme: Growth Partners Desktop Desktop](../screenshots/blossom/10-growth/growth-partners-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Growth Partners Desktop Desktop](../screenshots/frost/10-growth/growth-partners-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Growth Partners Desktop Desktop](../screenshots/studio/10-growth/growth-partners-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/10-growth/growth-partners-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/10-growth/growth-partners-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/10-growth/growth-partners-desktop-desktop.png)

#### 🖼️ Екран: Growth Referral Desktop Desktop

````carousel
![🌸 Blossom Theme: Growth Referral Desktop Desktop](../screenshots/blossom/10-growth/growth-referral-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Growth Referral Desktop Desktop](../screenshots/frost/10-growth/growth-referral-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Growth Referral Desktop Desktop](../screenshots/studio/10-growth/growth-referral-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/10-growth/growth-referral-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/10-growth/growth-referral-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/10-growth/growth-referral-desktop-desktop.png)


---
### 📍 06-services (Services)

* **Аудит відповідності:** Картки послуг рендеряться з правильними іконками. Проте кнопка "Створити послугу" має закругленість `rounded-xl` замість `rounded-full` (pill).

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Services List Desktop Desktop

````carousel
![🌸 Blossom Theme: Services List Desktop Desktop](../screenshots/blossom/06-services/services-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Services List Desktop Desktop](../screenshots/frost/06-services/services-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Services List Desktop Desktop](../screenshots/studio/06-services/services-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/06-services/services-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/06-services/services-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/06-services/services-list-desktop-desktop.png)

#### 🖼️ Екран: Services List Mobile Mobile

````carousel
![🌸 Blossom Theme: Services List Mobile Mobile](../screenshots/blossom/06-services/services-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Services List Mobile Mobile](../screenshots/frost/06-services/services-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Services List Mobile Mobile](../screenshots/studio/06-services/services-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/06-services/services-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/06-services/services-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/06-services/services-list-mobile-mobile.png)


---
### 📍 12-products (Products)

* **Аудит відповідності:** Картки товарів використовують правильні іконки. Проте в ProductCart.tsx кнопки "+" та "-" мають hardcoded Blossom кольори, які на скріншотах Studio теми виглядають як персикові кола на темному тлі, що ламає палітру Studio. Зафіксовано вкладку замовлень.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Products List Desktop Desktop

````carousel
![🌸 Blossom Theme: Products List Desktop Desktop](../screenshots/blossom/12-products/products-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Products List Desktop Desktop](../screenshots/frost/12-products/products-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Products List Desktop Desktop](../screenshots/studio/12-products/products-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/12-products/products-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/12-products/products-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/12-products/products-list-desktop-desktop.png)

#### 🖼️ Екран: Products List Mobile Mobile

````carousel
![🌸 Blossom Theme: Products List Mobile Mobile](../screenshots/blossom/12-products/products-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Products List Mobile Mobile](../screenshots/frost/12-products/products-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Products List Mobile Mobile](../screenshots/studio/12-products/products-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/12-products/products-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/12-products/products-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/12-products/products-list-mobile-mobile.png)

#### 🖼️ Екран: Products Orders Tab Desktop

````carousel
![🌸 Blossom Theme: Products Orders Tab Desktop](../screenshots/blossom/12-products/products-orders-tab-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Products Orders Tab Desktop](../screenshots/frost/12-products/products-orders-tab-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Products Orders Tab Desktop](../screenshots/studio/12-products/products-orders-tab-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/12-products/products-orders-tab-desktop.png) | [❄️ Frost](../screenshots/frost/12-products/products-orders-tab-desktop.png) | [🌲 Studio](../screenshots/studio/12-products/products-orders-tab-desktop.png)


---
### 📍 13-settings (Settings)

* **Аудит відповідності:** Налаштування профілю. Налаштування робочих годин використовують чекбокси та інпути часу. На скріншотах мобільного перегляду Frost теми інпути виглядають занадто малими (touch target менше 44px), що ускладнює вибір годин на смартфонах.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Settings Mobile Mobile

````carousel
![🌸 Blossom Theme: Settings Mobile Mobile](../screenshots/blossom/13-settings/settings-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Settings Mobile Mobile](../screenshots/frost/13-settings/settings-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Settings Mobile Mobile](../screenshots/studio/13-settings/settings-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/13-settings/settings-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/13-settings/settings-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/13-settings/settings-mobile-mobile.png)

#### 🖼️ Екран: Settings Profile Tab Desktop

````carousel
![🌸 Blossom Theme: Settings Profile Tab Desktop](../screenshots/blossom/13-settings/settings-profile-tab-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Settings Profile Tab Desktop](../screenshots/frost/13-settings/settings-profile-tab-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Settings Profile Tab Desktop](../screenshots/studio/13-settings/settings-profile-tab-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/13-settings/settings-profile-tab-desktop.png) | [❄️ Frost](../screenshots/frost/13-settings/settings-profile-tab-desktop.png) | [🌲 Studio](../screenshots/studio/13-settings/settings-profile-tab-desktop.png)

#### 🖼️ Екран: Settings Tab Розклад Desktop

````carousel
![🌸 Blossom Theme: Settings Tab Розклад Desktop](../screenshots/blossom/13-settings/settings-tab-розклад-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Settings Tab Розклад Desktop](../screenshots/frost/13-settings/settings-tab-розклад-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Settings Tab Розклад Desktop](../screenshots/studio/13-settings/settings-tab-розклад-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/13-settings/settings-tab-розклад-desktop.png) | [❄️ Frost](../screenshots/frost/13-settings/settings-tab-розклад-desktop.png) | [🌲 Studio](../screenshots/studio/13-settings/settings-tab-розклад-desktop.png)


---
### 📍 14-billing (Billing)

* **Аудит відповідності:** Картки тарифів Starter, Pro, Studio мають жорстко закодований колір рамки акценту, який не змінюється при виборі теми Frost. Тариф Studio має містити колір акценту відповідної теми.

* **📸 Інтерактивні каруселі порівняння тем:**

#### 🖼️ Екран: Billing Desktop Desktop

````carousel
![🌸 Blossom Theme: Billing Desktop Desktop](../screenshots/blossom/14-billing/billing-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Billing Desktop Desktop](../screenshots/frost/14-billing/billing-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Billing Desktop Desktop](../screenshots/studio/14-billing/billing-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/14-billing/billing-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/14-billing/billing-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/14-billing/billing-desktop-desktop.png)

#### 🖼️ Екран: Billing Mobile Mobile

````carousel
![🌸 Blossom Theme: Billing Mobile Mobile](../screenshots/blossom/14-billing/billing-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Billing Mobile Mobile](../screenshots/frost/14-billing/billing-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Billing Mobile Mobile](../screenshots/studio/14-billing/billing-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/14-billing/billing-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/14-billing/billing-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/14-billing/billing-mobile-mobile.png)


---
