# R2 SEO Audit — 05-seo

Date: 2026-07-07 · Launch: 2026-07-10 (public domain bookit.com.ua + real Monobank)
Scope: root + per-route metadata / generateMetadata, metadataBase, Open Graph + Twitter cards, OG image files, web manifest link, favicons/icons, sitemap.xml, robots.txt, canonical URLs, i18n/hreflang, JSON-LD structured data, AI-crawler/GEO rules, hardcoded dev-domain refs vs the 3-days-out domain switch.
Mode: READ-ONLY. No project files edited. Every finding verified by reading the actual code.

## Headline
SEO fundamentals are in good shape and — critically for a domain switch in 3 days — the indexable surfaces are **env-driven, not hardcoded**: `robots.ts`, `sitemap.ts`, root `metadataBase` and every per-page canonical resolve through `NEXT_PUBLIC_SITE_URL`, so they follow the domain automatically once that env var is set to `https://bookit.com.ua` in Vercel. The master page `[slug]` has a proper SEO engine (specialty+city+brand title, trimmed description, canonical, OG, Twitter, keywords) and rich JSON-LD (`ProfessionalService` with aggregateRating/geo/address). The one genuine launch defect is a **missing default OG image**: root metadata points at `/og-default.png`, which does not exist in `public/`, so every share of the homepage, `/explore`, landing and any page without its own `opengraph-image` renders a broken/blank social card on launch day. The rest are hardening (no AI-crawler rules, one hardcoded JSON-LD URL, a couple of missing canonicals).

---

## Findings

### P0
None.

---

### P1
None. (The domain-switch risk that would normally be P1 is neutralized: all indexable URL surfaces are env-driven — see [OK]. It degrades to an ops dependency, listed at the bottom.)

---

### P2

`[P2] src/app/layout.tsx:47 — default Open Graph image /og-default.png does not exist.` Root metadata declares `openGraph.images: [{ url: '/og-default.png', width: 1200, height: 630, … }]` (and `twitter` inherits it), but `public/og-default.png` is absent (verified: `ls public/` → only file.svg, globe.svg, monobank-logo.svg, next.svg, vercel.svg, window.svg, manifest.json, sw.js). Every page that does NOT provide its own image convention falls back to this 404 → the homepage, `/explore`, `/legal`, landing and login all share as a broken/blank card on launch. Only `/[slug]` is safe because `src/app/[slug]/opengraph-image.tsx` (file convention) generates its own. Fix: add a real 1200×630 `public/og-default.png`, OR convert it to a root `src/app/opengraph-image.tsx` `ImageResponse` (consistent with the existing `[slug]/opengraph-image.tsx` + `apple-icon.tsx` approach — no static asset to maintain).

`[P2] src/app/robots.ts:6-18 — no AI-crawler / GEO rules; a few private-ish routes not disallowed.` `robots()` allows `/` and disallows `/dashboard/`, `/my/`, `/api/`, `/onboarding`, `/login`, `/goto`, but has **no rules for AI crawlers** (GPTBot, OAI-SearchBot, ClaudeBot, CCBot, PerplexityBot) — for a booking marketplace that wants to appear in AI search answers this is a missed GEO opportunity (add explicit `allow` for the crawlers you want, or `disallow` for the ones you don't). Separately, single-use/redirect routes `/r/`, `/invite/`, `/studio/join` and `/dashboard/partners/join` are crawlable — low value + they leak token-shaped URLs into the index. Consider disallowing them. Non-blocking but cheap.

---

### P3

`[P3] src/app/[slug]/page.tsx:446 — JSON-LD url hardcoded to https://bookit.com.ua/${slug}.` Unlike the rest of the SEO surface (env-driven), the `ProfessionalService` `url` field is a string literal. It happens to match the launch domain, so it is correct on 2026-07-10 — but it breaks on preview deploys (points bots at prod) and will silently diverge if the domain ever changes. Fix: use the shared `getBaseUrl()` (`src/lib/utils/url.ts`) like the OG/canonical surfaces do.

`[P3] explore / landing / legal — no canonical.` `src/app/explore/page.tsx:9` ships static metadata (title/description) but no `alternates.canonical`; landing and legal likewise. `[slug]` and `[slug]/shop` do set canonical. With `?ref=` and other query params common on shared links, a self-referential canonical on `/explore` and the homepage avoids duplicate-URL dilution. One line each.

`[P3] No hreflang / i18n alternates.` App is single-locale Ukrainian (`locale: 'uk_UA'` in OG, `lang="uk"` in manifest). If a Russian or English variant is ever added this needs `alternates.languages`; not applicable today — noted so the absence is a known decision, not an oversight.

`[P3] Twitter card is summary_large_image but has no explicit twitter image.` `[slug]` (page.tsx:138) and root both set `twitter.card='summary_large_image'` without a dedicated `twitter.images`; Twitter falls back to the OG image, which is fine for `[slug]` (has one) but compounds the P2 for the homepage (no image at all until og-default is fixed).

---

## [OK] — verified safe

- **Domain-switch-safe URL surfaces (the big one).** `robots.ts:4`, `sitemap.ts:7`, `layout.tsx:42` (`metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua')`) and every per-page canonical/OG url are relative or env-driven. No `bookit-five-psi.vercel.app` appears in any SEO-relevant surface (the dev-domain refs that exist are confined to e2e specs and one-off screenshot scripts, none shipped). The launch dependency is purely setting `NEXT_PUBLIC_SITE_URL=https://bookit.com.ua` in Vercel — already tracked in `docs/LAUNCH_CHECKLIST/01_INFRASTRUCTURE_ENV.md` as a manual check.
- **`[slug]` master page metadata** (page.tsx:102-145) — SEO title `${specialty} у м. ${city} | ${name}`, description from bio (trimmed to 157+…) with a sensible fallback, `alternates.canonical: /${slug}`, OpenGraph (type profile, uk_UA, siteName), Twitter summary_large_image, keyword array. Returns `{ title: 'Майстер не знайдений' }` on 404. This is the money page and it is done well.
- **JSON-LD** (page.tsx:440-465) — `ProfessionalService` with name/description/image, address (PostalAddress), geo (GeoCoordinates when lat/lng), `aggregateRating` (gated on rating>0, with best/worst), priceRange. Strong rich-result eligibility for the marketplace's core pages.
- **`[slug]/shop`** has its own `generateMetadata` (page.tsx:25); **`/explore`** has static metadata (page.tsx:9).
- **Manifest** linked via `metadata.manifest: '/manifest.json'` (layout.tsx:52); manifest is valid (name/short_name/icons/shortcuts/theme). Icons resolve via `src/app/icons/[size]/route.tsx` (the `parseInt` 404 bug on `icon-192.png` was fixed this session — see PWA/backend fixes). `apple-icon.tsx` generates the Apple touch icon.
- **sitemap.ts** — dynamic, lists homepage + `/explore` + all `is_published` masters with `updated_at` lastModified, `revalidate = 3600`. Correct priority/changeFrequency. Uses admin client server-side (fine for a build-time/ISR route).
- **robots.ts** — correct disallow of private areas; sitemap URL env-driven.

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 0 |
| P2 | 2 (missing default OG image → broken homepage share cards; no AI-crawler rules + a few crawlable token routes) |
| P3 | 4 (hardcoded JSON-LD url; missing canonicals on explore/landing/legal; no hreflang [n/a]; no explicit twitter image) |

**Top launch pick: add `public/og-default.png` (or a root `opengraph-image.tsx`) — without it every homepage/explore social share is a broken card on launch day. Everything else is hardening. Domain switch is safe: all indexable URLs are env-driven; the only action is setting `NEXT_PUBLIC_SITE_URL=https://bookit.com.ua` in Vercel (already on the launch checklist).**
