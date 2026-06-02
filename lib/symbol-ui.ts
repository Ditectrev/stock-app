import {
  DNA_CAPTION,
  DNA_EYEBROW,
  DNA_HEADING,
  DNA_INSTRUMENT_PANEL,
} from "@/lib/design-dna";

/** Shared surfaces and type for symbol detail tabs. */
export const SYMBOL_INSTRUMENT_PANEL = DNA_INSTRUMENT_PANEL;

export const SYMBOL_SECTION_LABEL = DNA_EYEBROW;

export const SYMBOL_PANEL_TITLE = DNA_HEADING;

export const SYMBOL_DIVIDER = "border-stone-200 dark:border-stone-700";

export const SYMBOL_MUTED_TEXT = "text-stone-700 dark:text-stone-200";

export const SYMBOL_SUBTLE_TEXT = DNA_CAPTION;

export const SYMBOL_SKELETON =
  "animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700";

export const SYMBOL_TOOLTIP_SURFACE =
  "absolute z-10 w-64 rounded-lg border p-3 text-sm shadow-lg border-stone-300 bg-white text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100";

export const SYMBOL_HELP_BUTTON =
  "flex h-5 w-5 flex-shrink-0 cursor-help items-center justify-center rounded-full text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-100 dark:focus-visible:ring-stone-400 dark:focus-visible:ring-offset-stone-900";
