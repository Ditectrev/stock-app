# Design DNA — The Open Stock

Locked visual system for a **market terminal** product (Hallmark-aligned: restraint, distinct archetypes, one dialect).

## Nav archetype: `terminal`

- Solid stone bar, vertical accent rule on brand, **segmented** section links (not underline tabs).
- Desktop search only when it adds value (hidden on home hero; shown on hubs and symbol).
- Mobile: `DNA_NAV_MOBILE` drawer links (touch-sized); desktop links use `DNA_LABEL`.

Constants: `DNA_NAV_*` in `lib/design-dna.ts`, used by `Navigation.tsx`.

## Typography ladder

| Role            | Token                    | Use                                                  |
| --------------- | ------------------------ | ---------------------------------------------------- |
| Eyebrow         | `DNA_EYEBROW`            | Section context (`Markets · AI`, `Account`)          |
| Display         | `DNA_DISPLAY`            | Page heroes, profile title                           |
| Hero            | `DNA_HERO`               | Home dashboard title                                 |
| Hero lead       | `DNA_HERO_LEAD`          | Tagline under home hero                              |
| Explore card    | `DNA_EXPLORE_CARD_TITLE` | Featured home explore tile                           |
| Nav wordmark    | `DNA_NAV_WORDMARK`       | Desktop/mobile brand in nav bar                      |
| Nav mobile link | `DNA_NAV_MOBILE`         | Mobile drawer section links                          |
| Heading         | `DNA_HEADING`            | Panel titles, symbol tabs                            |
| Subheading      | `DNA_SUBHEADING`         | Filter groups, calendar day headers, in-panel titles |
| Body            | `DNA_BODY`               | Paragraphs, gate copy, AI rationale excerpts         |
| Body secondary  | `DNA_BODY_SECONDARY`     | Helper lines, de-emphasized sm copy                  |
| Body on inverse | `DNA_BODY_ON_INVERSE`    | Copy on dark explore hero cards                      |
| Caption         | `DNA_CAPTION`            | Legends, footnotes, meta                             |
| Table header    | `DNA_TABLE_HEADER`       | Dense uppercase month/year grid headers              |
| Price numeral   | `DNA_PRICE`              | Tier card prices (€ amounts, “Free”)                 |
| Metric          | `DNA_METRIC`             | Mono quote values (key metrics, price targets)       |
| Metric emphasis | `DNA_METRIC_EMPHASIS`    | Highlighted mono value (e.g. average target)         |
| Metric compact  | `DNA_METRIC_COMPACT`     | Table/indicator mono values                          |
| Change line     | `DNA_CHANGE_LINE`        | Symbol % change (pair with `marketChangeTextClass`)  |
| Symbol subtitle | `DNA_SYMBOL_SUBTITLE`    | Company name under ticker                            |
| Gauge value     | `DNA_GAUGE_VALUE`        | Large gauge score (Fear & Greed); add inline color   |
| Heatmap cell    | `DNA_HEATMAP_CELL`       | Heatmap tile symbol numerals                         |
| Heatmap strip   | `DNA_HEATMAP_CELL_STRIP` | Month-average strip cells                            |
| Label           | `DNA_LABEL`              | Form labels, nav tabs, compact titles                |
| Label strong    | `DNA_LABEL_STRONG`       | Index names, provider titles                         |
| Button label    | `DNA_BUTTON_LABEL`       | Tier card CTA typography                             |
| Badge label     | `DNA_BADGE`              | Compact pills (pair with semantic bg)                |
| Badge popular   | `DNA_BADGE_POPULAR`      | “Most popular” chip on featured tier                 |
| Help control    | `DNA_HELP_BUTTON`        | Round “?” info buttons                               |
| Tooltip inverse | `DNA_TOOLTIP_INVERSE`    | Dark tooltip panels                                  |

**Charts:** `getMarketChartColors()` / `marketChartSignedColor()` / `marketChartOverlayColor()` / `marketSentimentGaugeColor()` / `marketSentimentGaugeArcSegments()` / `marketSentimentLegendRanges()` from `lib/market-semantics.ts` (emerald/rose; neutral band is stone).

Do not add ad-hoc `text-sm` / `text-lg` on product surfaces—use the ladder. `lib/home-ui.ts` re-exports layout shells (`HOME_INSTRUMENT_PANEL`, `DNA_BUTTON_*` aliases) only.

## Spacing rhythm

| Token                 | Use                              |
| --------------------- | -------------------------------- |
| `DNA_PAGE_STACK`      | Between major blocks on a page   |
| `DNA_MARKETING_STACK` | Home dashboard section rhythm    |
| `DNA_SECTION_STACK`   | Eyebrow → title → panel          |
| `DNA_PANEL_STACK`     | Inside a single instrument panel |

Page background: `DNA_PAGE_BACKGROUND`. Panels: `DNA_INSTRUMENT_PANEL`.

## Overlay & gate archetype

All blocking UI (sign-in, AI paywall, inline errors) uses **`ProductOverlay`** / **`ProductGate`** / **`SubscriptionGate`**:

- Left **accent bar** + eyebrow + title + body (asymmetric, not centered SaaS modal).
- Overlays slide from the **right** on desktop; full-height sheet on small screens.
- Primary action: `DNA_BUTTON_PRIMARY` (via `HOME_PRIMARY_BUTTON` alias).

## Semantic color

- **Chrome / UI:** stone neutrals only.
- **Data meaning (up/down):** `lib/market-semantics.ts` (emerald / rose).
- **Warnings:** `DNA_CALLOUT_WARNING` (account/tier notices).
- Do not use raw `green-*`, `red-*`, or `blue-*` for UI chrome.

## Voice

- User-facing errors: editorial (“We couldn’t…”), via `lib/market-ui-copy.ts` and `lib/auth-ui-copy.ts`.
- Short, specific to markets + AI context.

## Visual regression

`e2e/visual-hallmark.spec.ts` — 32 Playwright tests, 34 PNG baselines: nav, home hero, pricing (light/dark), symbol header/chart (light/dark), symbol error gate, subscription gate, auth prompt, screener hub, calendar/heatmap/sector hubs (light/dark), calendar tabs (economic, earnings, dividends, IPO), profile signed-out (light/dark) and full signed-in (light/dark), AI prediction panel (light/dark), stock-of-the-day page and panel (light/dark).
