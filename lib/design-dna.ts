/**
 * Product design DNA — single source for typography, spacing, nav, and shells.
 * See docs/design-dna.md for rationale and usage.
 */

/** Locked nav archetype: market terminal bar (accent rule + segmented sections). */
export const DNA_NAV_ARCHETYPE = "terminal" as const;

export const DNA_ACCENT_BAR =
  "inline-block h-8 w-[2px] shrink-0 rounded-full bg-stone-900 dark:bg-stone-100";

/** Eyebrow / section label (terminal caps). */
export const DNA_EYEBROW =
  "text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-stone-600 dark:text-stone-300";

/** Suffix beside tier prices (e.g. “/ mo”) — baseline-aligned with `DNA_PRICE`. */
export const DNA_PRICE_SUFFIX =
  "font-sans text-lg font-medium text-stone-600 dark:text-stone-400 sm:text-xl";

/** Page hero / marketing headline (pricing, profile). */
export const DNA_DISPLAY =
  "text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl";

/** Home / marketing page title (dashboard hero). */
export const DNA_HERO =
  "text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl";

/** Lead paragraph under marketing hero. */
export const DNA_HERO_LEAD =
  "text-base leading-relaxed text-stone-600 dark:text-stone-300 sm:text-lg";

/** Featured explore / promo card title on home. */
export const DNA_EXPLORE_CARD_TITLE =
  "text-2xl font-bold tracking-tight sm:text-3xl";

/** Looser vertical rhythm for marketing dashboard sections. */
export const DNA_MARKETING_STACK = "space-y-10 sm:space-y-12 lg:space-y-14";

/** Nav wordmark (desktop). */
export const DNA_NAV_WORDMARK =
  "text-lg font-bold text-stone-900 dark:text-stone-100";

/** Nav wordmark (mobile). */
export const DNA_NAV_WORDMARK_MOBILE =
  "text-base font-bold text-stone-900 dark:text-stone-100";

/** Panel / section title. */
export const DNA_HEADING =
  "text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50";

/** In-panel subtitle or compact title. */
export const DNA_SUBHEADING =
  "text-base font-semibold tracking-tight text-stone-900 dark:text-stone-50";

/** Default body copy. */
export const DNA_BODY =
  "text-base leading-relaxed text-stone-700 dark:text-stone-200";

/** Form labels, nav tabs, and compact row titles. */
export const DNA_LABEL =
  "text-sm font-medium text-stone-700 dark:text-stone-200";

/** Emphasized row title (index name, provider name). */
export const DNA_LABEL_STRONG =
  "text-sm font-medium text-stone-900 dark:text-stone-50";

/** Primary action label on tier cards and similar CTAs. */
export const DNA_BUTTON_LABEL =
  "text-sm font-semibold leading-none tracking-normal";

/** Captions, legends, meta. */
export const DNA_CAPTION = "text-xs text-stone-600 dark:text-stone-300";

/** Compact badge label (pair with semantic bg utilities). */
export const DNA_BADGE = "text-xs font-semibold";

/** “Most popular” tier pill on featured pricing card. */
export const DNA_BADGE_POPULAR =
  "rounded-full px-3 py-1 bg-stone-100 text-stone-900 dark:bg-stone-900 dark:text-stone-100";

/** Round help / info control (e.g. Fear & Greed “?”). */
export const DNA_HELP_BUTTON =
  "flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-500 dark:border-stone-600 dark:text-stone-200 dark:hover:border-stone-400";

/** Inverted tooltip panel (dark fill, light text). */
export const DNA_TOOLTIP_INVERSE =
  "absolute z-10 w-64 rounded-lg border border-stone-200 bg-stone-900 p-3 text-sm text-stone-100 shadow-lg dark:border-stone-600";

/** Secondary body (helper lines, de-emphasized copy). */
export const DNA_BODY_SECONDARY =
  "text-sm leading-relaxed text-stone-600 dark:text-stone-300 sm:text-base";

/** Body on inverted surfaces (dark explore hero card). */
export const DNA_BODY_ON_INVERSE =
  "text-sm leading-relaxed text-stone-300 dark:text-stone-600";

/** Mobile nav drawer links (touch-sized). */
export const DNA_NAV_MOBILE =
  "text-base font-medium text-stone-700 dark:text-stone-200";

/** Primary button shell (stone fill). */
export const DNA_BUTTON_PRIMARY =
  "inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200";

/** Secondary button shell (outline). */
export const DNA_BUTTON_SECONDARY =
  "inline-flex items-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700";

/** Segmented control tab (hub nav, chart ranges). */
export const DNA_SEGMENTED_TAB =
  "min-h-[44px] whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-stone-400 dark:focus-visible:ring-offset-stone-950";

/** Time-range / filter chip. */
export const DNA_CHIP =
  "rounded px-3 py-2 text-xs font-medium transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center";

export const DNA_CHIP_SM =
  "rounded px-3 py-1.5 text-xs font-medium transition-colors";

/** Inline callout panel. */
export const DNA_CALLOUT =
  "rounded-lg border border-stone-200 bg-stone-100 px-3 py-3 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

/** Account / tier warning callout. */
export const DNA_CALLOUT_WARNING =
  "text-sm text-amber-800 dark:text-amber-200 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2";

/** Text field shell. */
export const DNA_INPUT =
  "w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-500 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-50 dark:placeholder-stone-400";

export const DNA_INPUT_SM =
  "w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder-stone-500 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-50 dark:placeholder-stone-400";

/** Company name under symbol ticker. */
export const DNA_SYMBOL_SUBTITLE =
  "text-base sm:text-lg text-stone-700 dark:text-stone-200";

/** Fear & Greed (and similar gauge) score numeral; pair with inline color. */
export const DNA_GAUGE_VALUE = "text-4xl font-bold tabular-nums sm:text-5xl";

/** Heatmap / seasonal grid cell numerals (color from market-semantics). */
export const DNA_HEATMAP_CELL =
  "text-sm font-semibold tabular-nums text-center";

/** Compact heatmap strip cells (month-average row). */
export const DNA_HEATMAP_CELL_STRIP =
  "text-xs font-semibold tabular-nums sm:text-sm";

/** Compact uppercase table headers (month grids, dense tables). */
export const DNA_TABLE_HEADER =
  "text-[0.65rem] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300";

/** Pricing numerals on tier cards. */
export const DNA_PRICE =
  "text-4xl font-extrabold leading-none tabular-nums tracking-tight text-stone-900 dark:text-stone-50";

/** Primary mono data value (metrics, targets). */
export const DNA_METRIC =
  "font-mono text-lg font-semibold tabular-nums text-stone-900 dark:text-stone-50 sm:text-xl";

/** Emphasized mono data value (e.g. average price target). */
export const DNA_METRIC_EMPHASIS =
  "font-mono text-xl font-bold tabular-nums text-stone-900 dark:text-stone-50";

/** Compact mono data value (tables, indicator rows). */
export const DNA_METRIC_COMPACT =
  "font-mono text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-50";

/** Price change line beside symbol quote (pair with marketChangeTextClass). */
export const DNA_CHANGE_LINE =
  "text-base font-semibold tabular-nums sm:text-lg";

/** Vertical rhythm between major page blocks. */
export const DNA_PAGE_STACK = "space-y-6 sm:space-y-8";

/** Rhythm inside a page section (header → panel). */
export const DNA_SECTION_STACK = "space-y-4 sm:space-y-5";

/** Rhythm inside instrument panels. */
export const DNA_PANEL_STACK = "space-y-3";

export const DNA_PAGE_BACKGROUND =
  "bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100";

export const DNA_INSTRUMENT_PANEL =
  "rounded-xl border border-stone-200 bg-white p-4 sm:p-6 dark:border-stone-700 dark:bg-stone-900";

export const DNA_NAV_BAR =
  "border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950";

export const DNA_NAV_BRAND_TAGLINE =
  "font-sans text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-stone-600 dark:text-stone-300";

/** Active tab inside segmented nav — white lift in light mode, inverted in dark. */
export const DNA_NAV_LINK_ACTIVE =
  "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/80 dark:bg-stone-100 dark:text-stone-900 dark:shadow-none dark:ring-0";

export const DNA_NAV_LINK_IDLE =
  "text-stone-700 hover:bg-white hover:text-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50";

/** Centered modal scrim (auth, account flows). */
export const DNA_OVERLAY_SCRIM =
  "fixed inset-0 z-[10002] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm";

export const DNA_OVERLAY_PANEL =
  "relative w-full max-w-md max-h-[min(92dvh,calc(100vh-2rem))] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900";

export const DNA_GATE_SHELL =
  "flex flex-col gap-4 border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/40";

export const DNA_GATE_INLINE = "rounded-xl border p-4 sm:p-5";

export const DNA_GATE_OVERLAY =
  "absolute inset-0 rounded-xl border border-stone-200/90 bg-white/95 px-5 py-8 backdrop-blur-sm dark:border-stone-600 dark:bg-stone-900/95";
