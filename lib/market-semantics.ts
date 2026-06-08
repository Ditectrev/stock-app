/** Muted up/down/neutral styling and chart hex palette (emerald / rose). */

/** Lightweight Charts hex palette (emerald / rose; matches heatmap fills). */
export const MARKET_CHART_UP_LIGHT = "#059669";
export const MARKET_CHART_DOWN_LIGHT = "#e11d48";
export const MARKET_CHART_UP_DARK = "#10b981";
export const MARKET_CHART_DOWN_DARK = "#f43f5e";
export const MARKET_CHART_SERIES_LIGHT = "#059669";
export const MARKET_CHART_SERIES_DARK = "#34d399";

export type MarketChartColors = {
  up: string;
  down: string;
  wickUp: string;
  wickDown: string;
  series: string;
  areaTop: string;
  areaBottom: string;
};

export function getMarketChartColors(isDark: boolean): MarketChartColors {
  const up = isDark ? MARKET_CHART_UP_DARK : MARKET_CHART_UP_LIGHT;
  const down = isDark ? MARKET_CHART_DOWN_DARK : MARKET_CHART_DOWN_LIGHT;
  const series = isDark ? MARKET_CHART_SERIES_DARK : MARKET_CHART_SERIES_LIGHT;
  return {
    up,
    down,
    wickUp: up,
    wickDown: down,
    series,
    areaTop: series,
    areaBottom: isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(5, 150, 105, 0.22)",
  };
}

export function marketChartSignedColor(
  isPositive: boolean,
  isDark: boolean
): string {
  return isPositive
    ? isDark
      ? MARKET_CHART_UP_DARK
      : MARKET_CHART_UP_LIGHT
    : isDark
      ? MARKET_CHART_DOWN_DARK
      : MARKET_CHART_DOWN_LIGHT;
}

/** Fear & Greed needle / hover — rose → stone → emerald (matches chart palette). */
export function marketSentimentGaugeColor(
  value: number,
  isDark: boolean
): string {
  if (value <= 25) {
    return isDark ? MARKET_CHART_DOWN_DARK : MARKET_CHART_DOWN_LIGHT;
  }
  if (value <= 45) {
    return isDark ? "#fb7185" : "#f43f5e";
  }
  if (value <= 55) {
    return isDark ? "#a8a29e" : "#78716c";
  }
  if (value <= 75) {
    return isDark ? MARKET_CHART_SERIES_DARK : MARKET_CHART_SERIES_LIGHT;
  }
  return isDark ? MARKET_CHART_UP_DARK : MARKET_CHART_UP_LIGHT;
}

export type MarketSentimentLegendItem = {
  label: string;
  color: string;
};

export type MarketSentimentArcSegment = {
  from: number;
  to: number;
  color: string;
};

/** Semi-circle gauge arc segments (radians, left → right). */
export function marketSentimentGaugeArcSegments(
  isDark: boolean
): MarketSentimentArcSegment[] {
  return [
    { from: Math.PI, to: Math.PI * 0.75, color: "#be123c" },
    { from: Math.PI * 0.75, to: Math.PI * 0.55, color: "#f43f5e" },
    {
      from: Math.PI * 0.55,
      to: Math.PI * 0.45,
      color: isDark ? "#a8a29e" : "#78716c",
    },
    {
      from: Math.PI * 0.45,
      to: Math.PI * 0.25,
      color: isDark ? "#34d399" : "#059669",
    },
    {
      from: Math.PI * 0.25,
      to: 0,
      color: isDark ? MARKET_CHART_UP_DARK : MARKET_CHART_UP_LIGHT,
    },
  ];
}

export function marketSentimentGaugeTickColor(isDark: boolean): string {
  return isDark ? "#a8a29e" : "#78716c";
}

export function marketSentimentGaugeChartStroke(isDark: boolean): string {
  return isDark ? "#a8a29e" : "#57534e";
}

/** History chart band fills (viewBox 0–100). */
export const MARKET_SENTIMENT_HISTORY_BANDS = [
  { y: 0, height: 25, fill: "#05966922" },
  { y: 25, height: 20, fill: "#34d39922" },
  { y: 45, height: 10, fill: "#78716c22" },
  { y: 55, height: 20, fill: "#f43f5e22" },
  { y: 75, height: 25, fill: "#be123c22" },
] as const;

/** Distinct overlay line colors (emerald / rose / stone family). */
export const MARKET_CHART_OVERLAY_COLORS_LIGHT = [
  MARKET_CHART_UP_LIGHT,
  MARKET_CHART_DOWN_LIGHT,
  "#57534e",
  MARKET_CHART_SERIES_LIGHT,
  "#f43f5e",
  "#78716c",
] as const;

export const MARKET_CHART_OVERLAY_COLORS_DARK = [
  MARKET_CHART_UP_DARK,
  MARKET_CHART_DOWN_DARK,
  "#a8a29e",
  MARKET_CHART_SERIES_DARK,
  "#fb7185",
  "#78716c",
] as const;

export function marketChartOverlayColor(
  index: number,
  isDark: boolean
): string {
  const palette = isDark
    ? MARKET_CHART_OVERLAY_COLORS_DARK
    : MARKET_CHART_OVERLAY_COLORS_LIGHT;
  return palette[index % palette.length]!;
}

/** Gauge arc legend swatches (aligned with `marketSentimentGaugeColor` bands). */
export function marketSentimentLegendRanges(
  isDark: boolean
): MarketSentimentLegendItem[] {
  return [
    { label: "Extreme Fear", color: "#be123c" },
    { label: "Fear", color: isDark ? "#fb7185" : "#f43f5e" },
    { label: "Neutral", color: isDark ? "#a8a29e" : "#78716c" },
    {
      label: "Greed",
      color: isDark ? MARKET_CHART_SERIES_DARK : MARKET_CHART_SERIES_LIGHT,
    },
    {
      label: "Extreme Greed",
      color: isDark ? MARKET_CHART_UP_DARK : MARKET_CHART_UP_LIGHT,
    },
  ];
}

export const MARKET_UP_TEXT = "text-emerald-800 dark:text-emerald-400";
export const MARKET_DOWN_TEXT = "text-rose-800 dark:text-rose-400";
export const MARKET_NEUTRAL_TEXT = "text-stone-600 dark:text-stone-300";

export const MARKET_UP_BG =
  "bg-emerald-50/90 border border-emerald-200/90 dark:bg-emerald-950/35 dark:border-emerald-800/60";
export const MARKET_DOWN_BG =
  "bg-rose-50/90 border border-rose-200/90 dark:bg-rose-950/35 dark:border-rose-800/60";
export const MARKET_NEUTRAL_BG =
  "bg-stone-100 border border-stone-200 dark:bg-stone-800 dark:border-stone-600";

export const MARKET_UP_BADGE =
  "bg-emerald-100 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-50";
export const MARKET_DOWN_BADGE =
  "bg-rose-100 text-rose-900 dark:bg-rose-800 dark:text-rose-50";
export const MARKET_NEUTRAL_BADGE =
  "bg-stone-200 text-stone-800 dark:bg-stone-600 dark:text-stone-50";

/** Solid performance bars (sector comparison, etc.). */
export const MARKET_UP_BAR = "bg-emerald-600";
export const MARKET_DOWN_BAR = "bg-rose-600";
export const MARKET_UP_BAR_TRACK = "bg-emerald-500/20";
export const MARKET_DOWN_BAR_TRACK = "bg-rose-500/20";

/** Screener/table row highlights — light tints only; dark mode uses accent + stone base. */
export const MARKET_UP_ROW_BG = "bg-emerald-50 dark:bg-stone-950";
export const MARKET_DOWN_ROW_BG = "bg-rose-50 dark:bg-stone-950";

/** Left accent for screener valuation rows (readable in light + dark). */
export function marketValuationRowAccent(
  context: "overpriced" | "underpriced" | "fair" | string
): string {
  if (context === "overpriced") {
    return "border-l-[3px] border-l-rose-500 dark:border-l-rose-400";
  }
  if (context === "underpriced") {
    return "border-l-[3px] border-l-emerald-600 dark:border-l-emerald-400";
  }
  return "border-l-[3px] border-l-transparent";
}

/** Chart or panel error surfaces (no border). */
export const MARKET_ERROR_SURFACE = "bg-rose-50 dark:bg-rose-950/35";

export const CALENDAR_IMPORTANCE_HIGH =
  "bg-rose-100 text-rose-900 dark:bg-rose-800 dark:text-rose-50";
export const CALENDAR_IMPORTANCE_MEDIUM =
  "bg-amber-100 text-amber-950 dark:bg-amber-800 dark:text-amber-50";
export const CALENDAR_IMPORTANCE_LOW =
  "bg-stone-200 text-stone-800 dark:bg-stone-500 dark:text-stone-50";

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
