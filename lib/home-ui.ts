import {
  DNA_BUTTON_LABEL,
  DNA_BUTTON_PRIMARY,
  DNA_BUTTON_SECONDARY,
  DNA_CALLOUT,
  DNA_CAPTION,
  DNA_CHIP,
  DNA_CHIP_SM,
  DNA_EXPLORE_CARD_TITLE,
  DNA_EYEBROW,
  DNA_GAUGE_VALUE,
  DNA_HEADING,
  DNA_HERO,
  DNA_HERO_LEAD,
  DNA_INPUT,
  DNA_INPUT_SM,
  DNA_INSTRUMENT_PANEL,
  DNA_LABEL,
  DNA_LABEL_STRONG,
  DNA_MARKETING_STACK,
  DNA_NAV_BAR,
  DNA_PAGE_BACKGROUND,
  DNA_SEGMENTED_TAB,
  DNA_SUBHEADING,
} from "@/lib/design-dna";

/** Shared surfaces for the home dashboard (Market pulse, AI panels, etc.). */
export const HOME_PAGE_BACKGROUND = DNA_PAGE_BACKGROUND;

export const HOME_MARKETING_STACK = DNA_MARKETING_STACK;
export const HOME_HERO = DNA_HERO;
export const HOME_HERO_LEAD = DNA_HERO_LEAD;
export const HOME_EXPLORE_CARD_TITLE = DNA_EXPLORE_CARD_TITLE;
export const HOME_GAUGE_VALUE = DNA_GAUGE_VALUE;
export const HOME_LABEL = DNA_LABEL;
export const HOME_LABEL_STRONG = DNA_LABEL_STRONG;
export const HOME_BUTTON_LABEL = DNA_BUTTON_LABEL;

/** Solid panels — avoid /60 and /90 overlays that wash out contrast. */
export const HOME_INSTRUMENT_PANEL = DNA_INSTRUMENT_PANEL;

export const HOME_PANEL_TITLE = DNA_SUBHEADING;

export const HOME_SECTION_LABEL = DNA_EYEBROW;

export const HOME_PRIMARY_BUTTON = DNA_BUTTON_PRIMARY;

export const HOME_SECONDARY_BUTTON = DNA_BUTTON_SECONDARY;

export const HOME_RANGE_BUTTON_ACTIVE =
  "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900";

export const HOME_RANGE_BUTTON_IDLE =
  "bg-stone-100 text-stone-800 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700";

export const HOME_SEGMENTED_NAV =
  "flex overflow-x-auto rounded-xl border border-stone-200 bg-stone-100 p-1 scrollbar-hide dark:border-stone-700 dark:bg-stone-950";

export const HOME_SEGMENTED_TAB = DNA_SEGMENTED_TAB;

export const HOME_CHIP = DNA_CHIP;

export const HOME_CHIP_SM = DNA_CHIP_SM;

/** Body on panels — readable contrast (Hallmark cd4d762). */
export const HOME_MUTED_TEXT = "text-stone-700 dark:text-stone-200";

/** Captions, legends, de-emphasized lines. */
export const HOME_SUBTLE_TEXT = "text-stone-600 dark:text-stone-300";

export const HOME_INPUT = DNA_INPUT;

export const HOME_INPUT_SM = DNA_INPUT_SM;

export const HOME_CALLOUT = DNA_CALLOUT;

export const HOME_FACTOR_GROUP =
  "rounded-lg border border-stone-200 bg-stone-100 p-3 dark:border-stone-600 dark:bg-stone-800";

export const HOME_NAV_BAR = DNA_NAV_BAR;

/** Calendar “today” highlights — stone accent, not blue. */
export const CALENDAR_TODAY_HEADER =
  "border-b border-stone-400 bg-stone-200 text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const CALENDAR_TODAY_BADGE =
  "bg-stone-300 text-stone-900 dark:bg-stone-600 dark:text-stone-100";

export const CALENDAR_TODAY_CELL =
  "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700/80";

export const CALENDAR_DAY_HEADER =
  "border-b border-stone-200 bg-stone-100 text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";

export const CALENDAR_PAGE_TITLE = `mb-4 ${DNA_HEADING}`;

export const CALENDAR_EMPTY_TEXT = `text-center py-4 ${DNA_CAPTION}`;

export const CALENDAR_EVENT_LIST =
  "divide-y divide-stone-200 dark:divide-stone-700";

export const CALENDAR_EVENT_ROW =
  "flex items-start gap-3 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800";

export const CALENDAR_EVENT_TITLE = `${DNA_LABEL_STRONG} truncate`;

export const CALENDAR_EVENT_META = `flex flex-wrap gap-3 mt-1 ${DNA_CAPTION}`;

export const CALENDAR_TIME_BADGE =
  "text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300";

export const CALENDAR_NEUTRAL_TEXT = DNA_CAPTION;

export const CALENDAR_IMPORTANCE_LOW =
  "bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300";

export const CALENDAR_FILTER_LABEL = DNA_LABEL;

export const CALENDAR_SELECT =
  "rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-stone-600 dark:focus:ring-stone-400 border-stone-300 bg-white text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const CALENDAR_CHIP_IDLE =
  "rounded px-2 py-0.5 text-xs bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300";

export const CALENDAR_SYMBOL_CHIP =
  "inline-block shrink-0 cursor-pointer rounded px-2 py-0.5 text-center text-xs font-semibold transition-colors bg-stone-100 text-stone-800 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700";

export const HOME_TOOLTIP_POPOVER =
  "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-50 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const HOME_ERROR_TITLE = `mt-3 ${DNA_HEADING}`;

export const HOME_ERROR_BODY = `mt-1 ${DNA_CAPTION}`;

export const HOME_LEGEND_DIVIDER =
  "mt-4 pt-3 border-t border-stone-200 dark:border-stone-700";

export const HOME_LEGEND_TEXT = DNA_CAPTION;

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
