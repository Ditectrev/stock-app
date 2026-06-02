# Design DNA — The Open Stock

Locked visual system for a **market terminal** product (Hallmark-aligned: restraint, distinct archetypes, one dialect).

## Nav archetype: `terminal`

- Solid stone bar, vertical accent rule on brand, **segmented** section links (not underline tabs).
- Desktop search only when it adds value (hidden on home hero; shown on hubs and symbol).
- Mobile: same active/inactive chip language as desktop.

Constants: `DNA_NAV_*` in `lib/design-dna.ts`, used by `Navigation.tsx`.

## Typography ladder

| Role       | Token            | Use                                                        |
| ---------- | ---------------- | ---------------------------------------------------------- |
| Eyebrow    | `DNA_EYEBROW`    | Section context (`Markets · AI`, `Account`, `Seasonality`) |
| Display    | `DNA_DISPLAY`    | Page heroes                                                |
| Heading    | `DNA_HEADING`    | Panel titles, symbol tabs                                  |
| Subheading | `DNA_SUBHEADING` | Compact panel titles                                       |
| Body       | `DNA_BODY`       | Paragraphs, gate copy                                      |
| Caption    | `DNA_CAPTION`    | Legends, footnotes                                         |

Do not add ad-hoc `text-sm` / `text-lg` on product surfaces—use the ladder.

## Spacing rhythm

| Token               | Use                              |
| ------------------- | -------------------------------- |
| `DNA_PAGE_STACK`    | Between major blocks on a page   |
| `DNA_SECTION_STACK` | Eyebrow → title → panel          |
| `DNA_PANEL_STACK`   | Inside a single instrument panel |

Page background: `DNA_PAGE_BACKGROUND`. Panels: `DNA_INSTRUMENT_PANEL`.

## Overlay & gate archetype

All blocking UI (sign-in, AI paywall, inline errors) uses **`ProductOverlay`** / **`ProductGate`**:

- Left **accent bar** + eyebrow + title + body (asymmetric, not centered SaaS modal).
- Overlays slide from the **right** on desktop; full-height sheet on small screens.
- Primary action: `HOME_PRIMARY_BUTTON`. Secondary: `HOME_SECONDARY_BUTTON`.

## Semantic color

- **Chrome / UI:** stone neutrals only.
- **Data meaning (up/down):** `lib/market-semantics.ts` (emerald / rose).
- Do not use raw `green-*`, `red-*`, or `blue-*` for UI chrome.

## Voice

- User-facing errors: editorial (“We couldn’t…”), via `lib/market-ui-copy.ts` and `lib/auth-ui-copy.ts`.
- Short, specific to markets + AI context.
