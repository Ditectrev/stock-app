/** Shared surfaces for the home dashboard (Market pulse, AI panels, etc.). */
export const HOME_PAGE_BACKGROUND =
  "bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100";

/** Solid panels — avoid /60 and /90 overlays that wash out contrast. */
export const HOME_INSTRUMENT_PANEL =
  "rounded-xl border border-stone-200 bg-white p-4 sm:p-6 dark:border-stone-700 dark:bg-stone-900";

export const HOME_PANEL_TITLE =
  "text-base font-semibold tracking-tight text-stone-900 dark:text-stone-50";

export const HOME_SECTION_LABEL =
  "text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-stone-600 dark:text-stone-300";

export const HOME_PRIMARY_BUTTON =
  "inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200";

export const HOME_SECONDARY_BUTTON =
  "inline-flex items-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700";

export const HOME_RANGE_BUTTON_ACTIVE =
  "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900";

export const HOME_RANGE_BUTTON_IDLE =
  "bg-stone-100 text-stone-800 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700";

export const HOME_SEGMENTED_NAV =
  "flex overflow-x-auto rounded-xl border border-stone-200 bg-stone-100 p-1 scrollbar-hide dark:border-stone-700 dark:bg-stone-950";

export const HOME_SEGMENTED_TAB =
  "min-h-[44px] whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-stone-400 dark:focus-visible:ring-offset-stone-950";

export const HOME_CHIP =
  "rounded px-3 py-2 text-xs font-medium transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center";

export const HOME_CHIP_SM =
  "rounded px-3 py-1.5 text-xs font-medium transition-colors";

/** Body secondary — meets 4.5:1 on white and stone-900 panels. */
export const HOME_MUTED_TEXT = "text-stone-700 dark:text-stone-200";

/** Captions, legends — still readable on panels. */
export const HOME_SUBTLE_TEXT = "text-stone-600 dark:text-stone-300";

export const HOME_INPUT =
  "w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-500 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-50 dark:placeholder-stone-400";

export const HOME_INPUT_SM =
  "w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder-stone-500 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-50 dark:placeholder-stone-400";

export const HOME_CALLOUT =
  "rounded-lg border border-stone-200 bg-stone-100 px-3 py-3 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const HOME_FACTOR_GROUP =
  "rounded-lg border border-stone-200 bg-stone-100 p-3 dark:border-stone-600 dark:bg-stone-800";

export const HOME_NAV_BAR =
  "border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950";

/** Calendar “today” highlights — stone accent, not blue. */
export const CALENDAR_TODAY_HEADER =
  "border-b border-stone-400 bg-stone-200 text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const CALENDAR_TODAY_BADGE =
  "bg-stone-300 text-stone-900 dark:bg-stone-600 dark:text-stone-100";

export const CALENDAR_TODAY_CELL =
  "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700/80";

export const CALENDAR_DAY_HEADER =
  "border-b border-stone-200 bg-stone-100 text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";

export function homeChipClasses(active: boolean): string {
  return active ? HOME_RANGE_BUTTON_ACTIVE : HOME_RANGE_BUTTON_IDLE;
}

export function homeSegmentedTabClasses(
  active: boolean,
  isDark: boolean
): string {
  if (active) {
    return `${HOME_SEGMENTED_TAB} ${HOME_RANGE_BUTTON_ACTIVE}`;
  }
  return `${HOME_SEGMENTED_TAB} ${
    isDark
      ? "text-stone-200 hover:bg-stone-800 hover:text-stone-50"
      : "text-stone-700 hover:bg-white hover:text-stone-900"
  }`;
}
