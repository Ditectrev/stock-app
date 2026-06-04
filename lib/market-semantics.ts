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

/** Solid performance bars (sector comparison, etc.). */
export const MARKET_UP_BAR = "bg-emerald-600";
export const MARKET_DOWN_BAR = "bg-rose-600";
export const MARKET_UP_BAR_TRACK = "bg-emerald-500/20";
export const MARKET_DOWN_BAR_TRACK = "bg-rose-500/20";

/** Subtle table/list row highlights. */
export const MARKET_UP_ROW_BG = "bg-emerald-50 dark:bg-emerald-950/25";
export const MARKET_DOWN_ROW_BG = "bg-rose-50 dark:bg-rose-950/25";

/** Chart or panel error surfaces (no border). */
export const MARKET_ERROR_SURFACE = "bg-rose-50 dark:bg-rose-950/35";

export const CALENDAR_IMPORTANCE_HIGH =
  "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-300";
export const CALENDAR_IMPORTANCE_MEDIUM =
  "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200";
export const CALENDAR_IMPORTANCE_LOW =
  "bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300";

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

export function marketValuationRowBg(
  context: "overpriced" | "underpriced" | "fair" | string
): string {
  if (context === "overpriced") return MARKET_DOWN_ROW_BG;
  if (context === "underpriced") return MARKET_UP_ROW_BG;
  return "";
}

export function marketPerformanceBarClass(isPositive: boolean): string {
  return isPositive ? MARKET_UP_BAR : MARKET_DOWN_BAR;
}

export function marketPerformanceBarTrackClass(isPositive: boolean): string {
  return isPositive ? MARKET_UP_BAR_TRACK : MARKET_DOWN_BAR_TRACK;
}

export function marketChangeBadgeClass(
  direction: "buy" | "sell" | "hold"
): string {
  if (direction === "buy") return MARKET_UP_BADGE;
  if (direction === "sell") return MARKET_DOWN_BADGE;
  return MARKET_NEUTRAL_BADGE;
}

/** Seasonal month×year grid cells (muted emerald/rose scale). */
export function seasonalHeatmapCellClass(
  value: number | undefined,
  isDark: boolean
): string {
  if (value === undefined) {
    return isDark ? "bg-stone-700" : "bg-stone-100";
  }

  const abs = Math.abs(value);

  if (value > 0) {
    if (abs >= 5) return isDark ? "bg-emerald-600" : "bg-emerald-600";
    if (abs >= 2) return isDark ? "bg-emerald-700" : "bg-emerald-400";
    return isDark ? "bg-emerald-900/70" : "bg-emerald-100";
  }

  if (value < 0) {
    if (abs >= 5) return isDark ? "bg-rose-600" : "bg-rose-600";
    if (abs >= 2) return isDark ? "bg-rose-700" : "bg-rose-400";
    return isDark ? "bg-rose-900/70" : "bg-rose-100";
  }

  return isDark ? "bg-stone-600" : "bg-stone-200";
}

export function seasonalHeatmapTextClass(
  value: number | undefined,
  isDark: boolean
): string {
  if (value === undefined) {
    return isDark ? "text-stone-300" : "text-stone-600";
  }
  const abs = Math.abs(value);
  if (abs >= 2) return "text-white";
  return isDark ? "text-stone-200" : "text-stone-800";
}

export type SeasonalLegendSwatch =
  | "strongUp"
  | "mildUp"
  | "mildDown"
  | "strongDown";

export function seasonalLegendSwatchClass(
  kind: SeasonalLegendSwatch,
  isDark: boolean
): string {
  switch (kind) {
    case "strongUp":
      return isDark ? "bg-emerald-600" : "bg-emerald-600";
    case "mildUp":
      return isDark ? "bg-emerald-900/70" : "bg-emerald-100";
    case "mildDown":
      return isDark ? "bg-rose-900/70" : "bg-rose-100";
    case "strongDown":
      return isDark ? "bg-rose-600" : "bg-rose-600";
  }
}

export function forecastRatingBarClass(index: number, isDark: boolean): string {
  const colors = [
    isDark ? "bg-emerald-500" : "bg-emerald-600",
    isDark ? "bg-emerald-600" : "bg-emerald-500",
    isDark ? "bg-amber-500" : "bg-amber-500",
    isDark ? "bg-rose-500" : "bg-rose-500",
    isDark ? "bg-rose-600" : "bg-rose-600",
  ];
  return colors[index] ?? colors[2];
}

export type TechnicalSignal = "overpriced" | "underpriced" | "fair";

export function technicalSignalStyles(signal: TechnicalSignal): {
  border: string;
  badge: string;
  text: string;
} {
  switch (signal) {
    case "overpriced":
      return {
        border: "border-rose-500/70 dark:border-rose-500/70",
        badge: MARKET_DOWN_BADGE,
        text: MARKET_DOWN_TEXT,
      };
    case "underpriced":
      return {
        border: "border-emerald-600/70 dark:border-emerald-500/70",
        badge: MARKET_UP_BADGE,
        text: MARKET_UP_TEXT,
      };
    default:
      return {
        border: "border-stone-400 dark:border-stone-500",
        badge: MARKET_NEUTRAL_BADGE,
        text: MARKET_NEUTRAL_TEXT,
      };
  }
}
