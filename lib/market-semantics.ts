/** Muted up/down/neutral styling for UI chrome (not chart candles or heatmap tiles). */

export const MARKET_UP_TEXT = "text-emerald-800 dark:text-emerald-300";
export const MARKET_DOWN_TEXT = "text-rose-800 dark:text-rose-300";
export const MARKET_NEUTRAL_TEXT = "text-stone-600 dark:text-stone-300";

export const MARKET_UP_BG =
  "bg-emerald-50/90 border border-emerald-200/90 dark:bg-emerald-950/35 dark:border-emerald-800/60";
export const MARKET_DOWN_BG =
  "bg-rose-50/90 border border-rose-200/90 dark:bg-rose-950/35 dark:border-rose-800/60";
export const MARKET_NEUTRAL_BG =
  "bg-stone-100 border border-stone-200 dark:bg-stone-800 dark:border-stone-600";

export const MARKET_UP_BADGE =
  "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
export const MARKET_DOWN_BADGE =
  "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
export const MARKET_NEUTRAL_BADGE =
  "bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100";

export function marketChangeTextClass(change: number): string {
  if (change > 0) return MARKET_UP_TEXT;
  if (change < 0) return MARKET_DOWN_TEXT;
  return MARKET_NEUTRAL_TEXT;
}

export function marketChangeBgClass(change: number): string {
  if (change > 0) return MARKET_UP_BG;
  if (change < 0) return MARKET_DOWN_BG;
  return MARKET_NEUTRAL_BG;
}

export function marketChangeBadgeClass(
  direction: "buy" | "sell" | "hold"
): string {
  if (direction === "buy") return MARKET_UP_BADGE;
  if (direction === "sell") return MARKET_DOWN_BADGE;
  return MARKET_NEUTRAL_BADGE;
}
