"use client";

import type { PriceData } from "@/types";
import {
  CHART_MAGNIFIER_TOOLTIP_WIDTH,
  formatMagnifierDate,
  formatMagnifierPrice,
  magnifierPriceFromPoint,
} from "@/lib/chart-magnifier-tooltip";
import { marketChartSignedColor } from "@/lib/market-semantics";

export interface ChartMagnifierTooltipProps {
  symbol?: string;
  isDark?: boolean;
  isPositive?: boolean;
  left?: number;
  point?: PriceData | null;
}

export function ChartMagnifierTooltip({
  symbol = "—",
  isDark = false,
  isPositive = true,
  left = 0,
  point = null,
}: ChartMagnifierTooltipProps) {
  const visible = point !== null;
  const accentColor = marketChartSignedColor(isPositive, isDark);

  return (
    <div
      aria-live="polite"
      data-testid="chart-magnifier-tooltip"
      className={`chart-magnifier-tooltip pointer-events-none absolute top-0 z-20 transition-opacity duration-100 ${
        isDark ? "chart-magnifier-tooltip--dark" : ""
      } ${visible ? "opacity-100" : "opacity-0"}`}
      style={{
        width: CHART_MAGNIFIER_TOOLTIP_WIDTH,
        left: `${left}px`,
      }}
    >
      <div
        className="chart-magnifier-tooltip__symbol truncate text-xs font-medium"
        style={{ color: accentColor }}
      >
        ● {symbol}
      </div>
      <div className="chart-magnifier-tooltip__price mt-1 text-2xl font-semibold tabular-nums leading-none">
        {point ? formatMagnifierPrice(magnifierPriceFromPoint(point)) : "—"}
      </div>
      <div className="chart-magnifier-tooltip__date mt-1 text-xs tabular-nums">
        {point ? formatMagnifierDate(new Date(point.timestamp)) : "—"}
      </div>
    </div>
  );
}
