/**
 * Product design DNA — single source for typography, spacing, nav, and shells.
 * See docs/design-dna.md for rationale and usage.
 */

/** Locked nav archetype: market terminal bar (accent rule + segmented sections). */
export const DNA_NAV_ARCHETYPE = "terminal" as const;

export const DNA_ACCENT_BAR =
  "inline-block h-8 w-[2px] shrink-0 rounded-full bg-stone-900 dark:bg-stone-100";

/** Eyebrow / section label (one size app-wide). */
export const DNA_EYEBROW =
  "text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-stone-600 dark:text-stone-300";

/** Page hero / marketing headline. */
export const DNA_DISPLAY =
  "text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl";

/** Panel / section title. */
export const DNA_HEADING =
  "text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50";

/** In-panel subtitle or compact title. */
export const DNA_SUBHEADING =
  "text-base font-semibold tracking-tight text-stone-900 dark:text-stone-50";

/** Default body copy. */
export const DNA_BODY =
  "text-sm leading-relaxed text-stone-700 dark:text-stone-200";

/** Captions, legends, meta. */
export const DNA_CAPTION = "text-xs text-stone-600 dark:text-stone-300";

/** Compact uppercase table headers (month grids, dense tables). */
export const DNA_TABLE_HEADER =
  "text-[0.65rem] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300";

/** Pricing numerals on tier cards. */
export const DNA_PRICE =
  "text-4xl font-extrabold tabular-nums tracking-tight text-stone-900 dark:text-stone-50";

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
  "text-[0.65rem] uppercase tracking-[0.16em] text-stone-600 dark:text-stone-300";

export const DNA_NAV_LINK_ACTIVE =
  "bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900";

export const DNA_NAV_LINK_IDLE =
  "text-stone-700 hover:bg-white hover:text-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50";

export const DNA_OVERLAY_SCRIM =
  "fixed inset-0 z-[10000] flex justify-end bg-stone-950/55";

export const DNA_OVERLAY_PANEL =
  "relative flex h-full w-full max-w-md flex-col border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900 sm:m-4 sm:max-h-[calc(100vh-2rem)] sm:rounded-xl sm:border";

export const DNA_GATE_SHELL =
  "flex flex-col gap-4 border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/40";

export const DNA_GATE_INLINE = "rounded-xl border p-4 sm:p-5";

export const DNA_GATE_OVERLAY =
  "absolute inset-0 rounded-xl border border-stone-200/90 bg-white/95 px-5 py-8 backdrop-blur-sm dark:border-stone-600 dark:bg-stone-900/95";
