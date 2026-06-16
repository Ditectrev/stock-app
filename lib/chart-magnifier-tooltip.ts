import type { PriceData } from "@/types";
import type { ISeriesApi, Time } from "lightweight-charts";

/** Fixed width — keep in sync with `.chart-magnifier-tooltip` in globals.css. */
export const CHART_MAGNIFIER_TOOLTIP_WIDTH = 136;

/** Clamp horizontal position so the magnifier stays over the plot area. */
export function clampMagnifierTooltipLeft(
  crosshairX: number,
  tooltipWidth: number,
  plotWidth: number
): number {
  if (plotWidth <= 0) return 0;
  const half = tooltipWidth / 2;
  const left = crosshairX - half;
  const maxLeft = Math.max(0, plotWidth - tooltipWidth);
  return Math.max(0, Math.min(left, maxLeft));
}

export function formatMagnifierDate(timestamp: Date): string {
  return timestamp.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMagnifierPrice(value: number): string {
  return value.toFixed(2);
}

export function magnifierPriceFromPoint(point: PriceData): number {
  return point.close;
}

function timeToEpochSeconds(time: Time): number | null {
  if (typeof time === "number") return time;
  if (typeof time === "string") {
    const ms = Date.parse(time);
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
  }
  if (time && typeof time === "object" && "year" in time) {
    const ms = Date.UTC(time.year, time.month - 1, time.day);
    return Math.floor(ms / 1000);
  }
  return null;
}

/** Match crosshair time to a row in filtered history (unix-second bars). */
export function findPricePointAtTime(
  data: PriceData[],
  time: Time
): PriceData | undefined {
  const target = timeToEpochSeconds(time);
  if (target === null) return undefined;
  return data.find(
    (d) => Math.floor(new Date(d.timestamp).getTime() / 1000) === target
  );
}

/** Fallback when history lookup misses — use the series value at the crosshair. */
export function pricePointFromCrosshair(
  time: Time,
  seriesPoint: unknown
): PriceData | null {
  const epoch = timeToEpochSeconds(time);
  if (
    epoch === null ||
    seriesPoint == null ||
    typeof seriesPoint !== "object"
  ) {
    return null;
  }

  const row = seriesPoint as {
    value?: number;
    close?: number;
    open?: number;
    high?: number;
    low?: number;
  };

  const close =
    row.value !== undefined && Number.isFinite(row.value)
      ? row.value
      : row.close;
  if (close === undefined || !Number.isFinite(close)) return null;

  return {
    timestamp: new Date(epoch * 1000),
    open: row.open ?? close,
    high: row.high ?? close,
    low: row.low ?? close,
    close,
    volume: 0,
  };
}

export function resolveMagnifierPoint(
  data: PriceData[],
  time: Time,
  mainSeries: ISeriesApi<"Area"> | ISeriesApi<"Candlestick">,
  seriesData: Map<unknown, unknown>
): PriceData | null {
  return (
    findPricePointAtTime(data, time) ??
    pricePointFromCrosshair(time, seriesData.get(mainSeries)) ??
    null
  );
}
