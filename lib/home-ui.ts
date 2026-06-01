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

export const CALENDAR_PAGE_TITLE =
  "text-lg font-semibold mb-4 text-stone-900 dark:text-stone-50";

export const CALENDAR_EMPTY_TEXT =
  "text-center py-4 text-sm text-stone-600 dark:text-stone-300";

export const CALENDAR_EVENT_LIST =
  "divide-y divide-stone-200 dark:divide-stone-700";

export const CALENDAR_EVENT_ROW =
  "flex items-start gap-3 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800";

export const CALENDAR_EVENT_TITLE =
  "text-sm font-medium truncate text-stone-900 dark:text-stone-100";

export const CALENDAR_EVENT_META =
  "flex flex-wrap gap-3 mt-1 text-xs text-stone-600 dark:text-stone-300";

export const CALENDAR_TIME_BADGE =
  "text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300";

export const CALENDAR_NEUTRAL_TEXT = "text-stone-600 dark:text-stone-300";

export const CALENDAR_IMPORTANCE_LOW =
  "bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300";

export const CALENDAR_FILTER_LABEL =
  "text-sm text-stone-700 dark:text-stone-200";

export const CALENDAR_SELECT =
  "rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-stone-600 dark:focus:ring-stone-400 border-stone-300 bg-white text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const CALENDAR_CHIP_IDLE =
  "rounded px-2 py-0.5 text-xs bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300";

export const CALENDAR_SYMBOL_CHIP =
  "inline-block shrink-0 cursor-pointer rounded px-2 py-0.5 text-center text-xs font-semibold transition-colors bg-stone-100 text-stone-800 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700";

export const HOME_TOOLTIP_POPOVER =
  "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-50 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const HOME_ERROR_TITLE =
  "mt-3 text-lg font-semibold text-stone-900 dark:text-stone-50";

export const HOME_ERROR_BODY =
  "mt-1 text-sm text-stone-600 dark:text-stone-300";

export const HOME_LEGEND_DIVIDER =
  "mt-4 pt-3 border-t border-stone-200 dark:border-stone-700";

export const HOME_LEGEND_TEXT = "text-xs text-stone-600 dark:text-stone-300";

export const HOME_DISABLED_BUTTON =
  "bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500 cursor-default";

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
